const mongoose = require('mongoose');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}
require('dotenv').config();

const User = require('../models/User');
const Mission = require('../models/Mission');
const Satellite = require('../models/Satellite');

async function seedUserMissions() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[Error] MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  try {
    console.log('[SeedMissions] Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`[SeedMissions] Connected to: ${mongoose.connection.host} / ${mongoose.connection.name}`);

    // Fetch both users
    const adminUser = await User.findOne({ email: 'admin@orbitalx.com' });
    const normalUser = await User.findOne({ email: 'user@orbitalx.com' });

    if (!adminUser || !normalUser) {
      console.error('[Error] Required users (admin@orbitalx.com or user@orbitalx.com) not found.');
      process.exit(1);
    }

    // Clean up any previous test missions with these IDs
    await Mission.deleteMany({ missionId: { $in: ['MSN-ARTEMIS', 'MSN-AURORA'] } });
    await Satellite.deleteMany({ satelliteId: { $in: ['SAT-ARTEMIS-1', 'SAT-AURORA-3U'] } });

    // 1. Mission 1 for ADMIN USER
    const adminSat = await Satellite.create({
      name: 'Artemis Relay One',
      satelliteId: 'SAT-ARTEMIS-1',
      noradId: '59201',
      formFactor: '12U',
      type: 'CUBESAT_12U',
      orbitType: 'GEO',
      status: 'ACTIVE',
      inclination: 0.1,
      orbitRadius: 42164,
      orbitSpeed: 3.07,
      createdBy: adminUser._id
    });

    const adminMission = await Mission.create({
      name: 'Project Artemis Gateway',
      missionId: 'MSN-ARTEMIS',
      description: 'Strategic deep-space communication gateway and high-orbit solar dynamics surveillance program.',
      objective: 'Establish continuous GEO telemetry relay and monitor magnetospheric radiation fluctuations.',
      status: 'ACTIVE',
      formFactor: '12U',
      orbitType: 'GEO',
      launchDate: new Date('2026-04-12T08:30:00Z'),
      launchSite: 'Kennedy Space Center, USA',
      duration: '5 Years',
      assignedSatellites: [adminSat._id],
      createdBy: adminUser._id
    });
    console.log(`[SeedMissions] Admin Mission created: "${adminMission.name}" (${adminMission.missionId}) assigned to ${adminUser.email}`);

    // 2. Mission 2 for NORMAL USER (Operator)
    const normalSat = await Satellite.create({
      name: 'Aurora Ion Observer',
      satelliteId: 'SAT-AURORA-3U',
      noradId: '58410',
      formFactor: '3U',
      type: 'CUBESAT_3U',
      orbitType: 'LEO',
      status: 'ACTIVE',
      inclination: 97.6,
      orbitRadius: 6920,
      orbitSpeed: 7.55,
      createdBy: normalUser._id
    });

    const normalMission = await Mission.create({
      name: 'Aurora Climate Sentinel',
      missionId: 'MSN-AURORA',
      description: 'Polar orbital observation initiative capturing ionospheric anomalies and climate telemetry.',
      objective: 'Deploy 3U standard CubeSat for high-latitude thermospheric atmospheric measurements.',
      status: 'PLANNED',
      formFactor: '3U',
      orbitType: 'LEO',
      launchDate: new Date('2026-11-20T14:15:00Z'),
      launchSite: 'Vandenberg SFB, USA',
      duration: '18 Months',
      assignedSatellites: [normalSat._id],
      createdBy: normalUser._id
    });
    console.log(`[SeedMissions] Normal User Mission created: "${normalMission.name}" (${normalMission.missionId}) assigned to ${normalUser.email}`);

    console.log('[SeedMissions] SUCCESS: 1 mission created for each user in MongoDB Atlas!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[SeedMissions Error]', err);
    process.exit(1);
  }
}

seedUserMissions();
