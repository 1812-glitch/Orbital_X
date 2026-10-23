const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/token');
const auditService = require('../services/auditService');

// @route   POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  const hashedPassword = await hashPassword(password);
  
  // Default first user to ADMIN if no users exist, otherwise VIEWER
  const userCount = await User.countDocuments({});
  const role = userCount === 0 ? 'ADMIN' : 'VIEWER';

  const user = await User.create({
    name,
    email,
    passwordHash: hashedPassword,
    role,
  });

  const token = generateToken(user._id, user.role);

  await auditService.logAction({
    userId: user._id,
    source: 'SYS_AUTH',
    action: 'USER_REGISTER',
    resource: 'User',
    resourceId: user._id.toString(),
    details: 'New user registration',
    severity: 'INFO',
    ipAddress: req.ip
  });

  res.status(201).json(new ApiResponse(201, {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token
  }, 'User registered successfully'));
});

// @route   POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email });
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid credentials or inactive account');
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    await auditService.logAction({
      source: 'SYS_AUTH',
      action: 'LOGIN_FAILED',
      resource: 'User',
      details: `Failed login attempt for email: ${email}`,
      severity: 'WARNING',
      ipAddress: req.ip
    });
    throw new ApiError(401, 'Invalid credentials');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user._id, user.role);

  await auditService.logAction({
    userId: user._id,
    source: 'SYS_AUTH',
    action: 'USER_LOGIN',
    resource: 'User',
    resourceId: user._id.toString(),
    details: `User authenticated via ${req.body.method || 'standard'} login.`,
    severity: 'INFO',
    ipAddress: req.ip
  });

  res.json(new ApiResponse(200, {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token
  }, 'Logged in successfully'));
});

// @route   GET /api/auth/me
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  res.json(new ApiResponse(200, user, 'Profile fetched successfully'));
});

// @route   PUT /api/auth/password
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Please provide both current and new passwords');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    await auditService.logAction({
      userId: user._id,
      source: 'SYS_AUTH',
      action: 'PASSWORD_UPDATE_FAILED',
      resource: 'User',
      resourceId: user._id.toString(),
      details: 'Failed password update attempt due to incorrect current password.',
      severity: 'WARNING',
      ipAddress: req.ip
    });
    throw new ApiError(401, 'Invalid current password');
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  await auditService.logAction({
    userId: user._id,
    source: 'SYS_AUTH',
    action: 'PASSWORD_UPDATED',
    resource: 'User',
    resourceId: user._id.toString(),
    details: 'User successfully updated their access key.',
    severity: 'INFO',
    ipAddress: req.ip
  });

  res.json(new ApiResponse(200, {}, 'Password updated successfully'));
});

module.exports = {
  register,
  login,
  getProfile,
  updatePassword
};
