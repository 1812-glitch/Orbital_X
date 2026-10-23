const mongoose = require('mongoose');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}
require('dotenv').config();

const Mission = require('../models/Mission');
const Satellite = require('../models/Satellite');
const Telemetry = require('../models/Telemetry');
const Communication = require('../models/Communication');
const Alert = require('../models/Alert');

async function clearData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[Error] MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  try {
    console.log('[ClearDB] Connecting to database...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[ClearDB] Connected to: ${mongoose.connection.host} / ${mongoose.connection.name}`);

    // Delete all missions
    const missionRes = await Mission.deleteMany({});
    console.log(`[ClearDB] Cleared missions: ${missionRes.deletedCount} removed`);

    // Delete all satellites & cubesats
    const satRes = await Satellite.deleteMany({});
    console.log(`[ClearDB] Cleared satellites & cubesats: ${satRes.deletedCount} removed`);

    // Delete telemetry records
    const telemRes = await Telemetry.deleteMany({});
    console.log(`[ClearDB] Cleared telemetry: ${telemRes.deletedCount} removed`);

    // Delete communications
    const commRes = await Communication.deleteMany({});
    console.log(`[ClearDB] Cleared communications: ${commRes.deletedCount} removed`);

    // Delete alerts
    const alertRes = await Alert.deleteMany({});
    console.log(`[ClearDB] Cleared alerts: ${alertRes.deletedCount} removed`);

    console.log('[ClearDB] SUCCESS: All mission, cubesat, and telemetry data completely cleared from database!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[ClearDB Error]', err);
    process.exit(1);
  }
}

clearData();
