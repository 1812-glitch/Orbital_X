const Satellite = require('../models/Satellite');
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

// @desc    Create satellite
// @route   POST /api/satellites
// @access  Private/Admin
exports.createSatellite = asyncHandler(async (req, res) => {
  const { name, satelliteId, noradId, orbitType } = req.body;

  const existingSatellite = await Satellite.findOne({ satelliteId });
  if (existingSatellite) {
    throw new ApiError(400, 'Satellite ID already exists');
  }

  const satellite = await Satellite.create({
    name,
    satelliteId,
    noradId,
    orbitType
  });

  res.status(201).json(new ApiResponse(201, satellite, 'Satellite created successfully'));
});

// @desc    Update satellite
// @route   PUT /api/satellites/:id
// @access  Private/Admin
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

// @desc    Delete satellite
// @route   DELETE /api/satellites/:id
// @access  Private/Admin
exports.deleteSatellite = asyncHandler(async (req, res) => {
  const satellite = await Satellite.findById(req.params.id);

  if (!satellite) {
    throw new ApiError(404, 'Satellite not found');
  }

  await satellite.deleteOne();

  res.status(200).json(new ApiResponse(200, null, 'Satellite deleted successfully'));
});
