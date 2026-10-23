const Satellite = require('../models/Satellite');
const Mission = require('../models/Mission');
const Telemetry = require('../models/Telemetry');
const Communication = require('../models/Communication');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Get all satellites
// @route   GET /api/satellites
// @access  Private
exports.getSatellites = asyncHandler(async (req, res) => {
  const satellites = await Satellite.find().sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, satellites, 'Satellites retrieved successfully'));
});

// @desc    Get single satellite
// @route   GET /api/satellites/:id
// @access  Private
exports.getSatelliteById = asyncHandler(async (req, res) => {
  const satellite = await Satellite.findById(req.params.id);
  
  if (!satellite) {
    throw new ApiError(404, 'Satellite not found');
  }
  
  res.status(200).json(new ApiResponse(200, satellite, 'Satellite retrieved successfully'));
});

// @desc    Create satellite / cubesat
// @route   POST /api/satellites
// @access  Private/Admin/Operator
exports.createSatellite = asyncHandler(async (req, res) => {
  const { 
    name, 
    satelliteId, 
    noradId, 
    orbitType, 
    type, 
    formFactor, 
    cubesatDesign, 
    status, 
    inclination, 
    orbitRadius, 
    orbitSpeed 
  } = req.body;

  const resolvedSatId = (satelliteId && satelliteId.trim()) 
    ? satelliteId.trim() 
    : `SAT-${(name ? name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() : 'CUBE')}-${Date.now().toString().slice(-4)}`;

  const existingSatellite = await Satellite.findOne({ satelliteId: resolvedSatId });
  if (existingSatellite) {
    throw new ApiError(400, 'Satellite ID already exists');
  }

  const satellite = await Satellite.create({
    name: name || 'Unnamed Satellite',
    satelliteId: resolvedSatId,
    noradId: noradId || '',
    orbitType: orbitType || 'LEO',
    type: type || (formFactor ? `CUBESAT_${formFactor}` : 'CUBESAT_3U'),
    formFactor: formFactor || '3U',
    cubesatDesign: cubesatDesign || null,
    status: status || 'ACTIVE',
    inclination: inclination || 51.6,
    orbitRadius: orbitRadius || (orbitType === 'GEO' ? 42164 : orbitType === 'MEO' ? 26560 : 6871),
    orbitSpeed: orbitSpeed || (orbitType === 'GEO' ? 3.07 : orbitType === 'MEO' ? 3.87 : 7.6)
  });

  res.status(201).json(new ApiResponse(201, satellite, 'Satellite created successfully in MongoDB'));
});

// @desc    Update satellite
// @route   PUT /api/satellites/:id
// @access  Private/Admin/Operator
exports.updateSatellite = asyncHandler(async (req, res) => {
  let satellite = await Satellite.findById(req.params.id);

  if (!satellite) {
    throw new ApiError(404, 'Satellite not found');
  }

  satellite = await Satellite.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json(new ApiResponse(200, satellite, 'Satellite updated successfully'));
});

// @desc    Delete satellite (completely removed from MongoDB)
// @route   DELETE /api/satellites/:id
// @access  Private/Admin/Operator
exports.deleteSatellite = asyncHandler(async (req, res) => {
  const satellite = await Satellite.findById(req.params.id);

  if (!satellite) {
    throw new ApiError(404, 'Satellite not found');
  }

  // Remove satellite reference from any missions
  await Mission.updateMany(
    { assignedSatellites: satellite._id },
    { $pull: { assignedSatellites: satellite._id } }
  );

  // Clean up associated telemetry records if any
  try {
    await Telemetry.deleteMany({ satelliteId: satellite._id });
    await Communication.deleteMany({ satelliteId: satellite._id });
  } catch (cleanErr) {
    console.warn('[Satellite Delete] Non-critical cleanup warning:', cleanErr.message);
  }

  // Completely delete document from MongoDB
  await satellite.deleteOne();

  res.status(200).json(new ApiResponse(200, null, 'Satellite and CubeSat completely deleted from MongoDB'));
});

