const mongoose = require('mongoose');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}
require('dotenv').config();
const bcrypt = require('bcrypt');
const User = require('../models/User');

async function seedUsers() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[Error] MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  try {
    console.log('[SeedUsers] Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`[SeedUsers] Connected to: ${mongoose.connection.host} / ${mongoose.connection.name}`);

    // Clean existing users first to ensure fresh setup
    await User.deleteMany({ email: { $in: ['admin@orbitalx.com', 'user@orbitalx.com', 'operator@orbitalx.com'] } });

    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);
    const userPasswordHash = await bcrypt.hash('user123', salt);

    // 1. Admin User - Full authority across entire system
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@orbitalx.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
    });
    console.log(`[SeedUsers] Admin user created: ${adminUser.email} (Role: ${adminUser.role})`);

    // 2. Normal User - Operator authority (can build CubeSats, manage missions, telemetry, commands)
    const normalUser = await User.create({
      name: 'Normal User',
      email: 'user@orbitalx.com',
      passwordHash: userPasswordHash,
      role: 'OPERATOR',
      isActive: true,
    });
    console.log(`[SeedUsers] Normal user created: ${normalUser.email} (Role: ${normalUser.role})`);

    console.log('[SeedUsers] SUCCESS: 2 users successfully registered in MongoDB Atlas!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[SeedUsers Error]', err);
    process.exit(1);
  }
}

seedUsers();
