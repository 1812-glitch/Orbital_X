const Mission = require('../models/Mission');
const User = require('../models/User');
const Satellite = require('../models/Satellite');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Get all missions
// @route   GET /api/missions
// @access  Private
exports.getMissions = asyncHandler(async (req, res) => {
  const missions = await Mission.find()
    .populate('assignedSatellites')
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, missions, 'Missions retrieved successfully'));
});

// @desc    Get single mission
// @route   GET /api/missions/:id
// @access  Private
exports.getMissionById = asyncHandler(async (req, res) => {
  const mission = await Mission.findById(req.params.id)
    .populate('assignedSatellites')
    .populate('createdBy', 'name email role');
  
  if (!mission) {
    throw new ApiError(404, 'Mission not found');
  }
  
  res.status(200).json(new ApiResponse(200, mission, 'Mission retrieved successfully'));
});

// @desc    Create mission
// @route   POST /api/missions
// @access  Private/Admin
exports.createMission = asyncHandler(async (req, res) => {
  const { name, missionId, description, status, launchDate, launchSite, objective, assignedSatellites, formFactor, orbitType, cubesatDesign, createdBy } = req.body;

  const existingMission = await Mission.findOne({ missionId });
  if (existingMission) {
    throw new ApiError(400, 'Mission ID already exists');
  }

  const mission = await Mission.create({
    name,
    missionId,
    description,
    status,
    launchDate,
    launchSite,
    objective,
    assignedSatellites,
    formFactor: formFactor || '3U',
    orbitType: orbitType || 'LEO',
    cubesatDesign,
    createdBy: req.user?._id || createdBy
  });

  res.status(201).json(new ApiResponse(201, mission, 'Mission created successfully'));
});

// @desc    Update mission
// @route   PUT /api/missions/:id
// @access  Private/Admin
exports.updateMission = asyncHandler(async (req, res) => {
  let mission = await Mission.findById(req.params.id);

  if (!mission) {
    throw new ApiError(404, 'Mission not found');
  }

  mission = await Mission.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('assignedSatellites');

  res.status(200).json(new ApiResponse(200, mission, 'Mission updated successfully'));
});

// @desc    Delete mission (completely removed from MongoDB)
// @route   DELETE /api/missions/:id
// @access  Private/Admin/Operator
exports.deleteMission = asyncHandler(async (req, res) => {
  const mission = await Mission.findById(req.params.id);

  if (!mission) {
    throw new ApiError(404, 'Mission not found');
  }

  // Completely delete document from MongoDB
  await mission.deleteOne();

  res.status(200).json(new ApiResponse(200, null, `Mission ${mission.missionId} (${mission.name}) completely deleted from MongoDB`));
});
