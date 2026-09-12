const mongoose = require('mongoose');
const User = require('../models/User');
const Satellite = require('../models/Satellite');
const GroundStation = require('../models/GroundStation');
const Mission = require('../models/Mission');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcrypt');

const seedData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Database is empty. Seeding data...');
      
      // Create admin
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);

      const createdUser = await User.create({
        name: 'Admin User',
        email: 'admin@orbitalx.com',
        passwordHash,
        role: 'ADMIN',
      });
      console.log('Admin user seeded.');

      // Create satellites
      const satellites = [
        { name: 'Alpha One', satelliteId: 'SAT-ALPHA-1', type: 'COMMUNICATION', orbitType: 'LEO', status: 'ACTIVE' },
        { name: 'Beta Two', satelliteId: 'SAT-BETA-2', type: 'OBSERVATION', orbitType: 'MEO', status: 'WARNING' },
        { name: 'Gamma Three', satelliteId: 'SAT-GAMMA-3', type: 'WEATHER', orbitType: 'GEO', status: 'OFFLINE' },
      ];
      const insertedSatellites = await Satellite.insertMany(satellites);
      console.log('Satellites seeded.');

      // Create a mission and assign satellites
      await Mission.create({
        missionId: 'MSN-APOLLO',
        name: 'Apollo Operations',
        objective: 'Monitor global climate anomalies and establish deep space comm relays.',
        status: 'ACTIVE',
        launchDate: new Date(),
        launchSite: 'Cape Canaveral',
        assignedSatellites: insertedSatellites.map(sat => sat._id)
      });
      console.log('Mission seeded.');

      // Create ground stations matching Ground Stations.png
      const groundStations = [
        { 
          name: 'Ground Station Alpha', 
          stationId: 'GS-001', 
          country: 'India', 
          latitude: 12.9716, 
          longitude: 77.5946, 
          status: 'ACTIVE',
          signalQuality: 98,
          connectedSatellites: insertedSatellites.slice(0, 2).map(s => s._id),
          lastContact: new Date(Date.now() - 5 * 60000),
          nextContact: new Date(Date.now() + 83 * 60000)
        },
        { 
          name: 'Houston Command', 
          stationId: 'GS-002', 
          country: 'USA', 
          latitude: 29.5502, 
          longitude: -95.097, 
          status: 'DEGRADED',
          signalQuality: 64,
          connectedSatellites: insertedSatellites.slice(2, 3).map(s => s._id),
          lastContact: new Date(Date.now() - 72 * 60000),
          nextContact: new Date(Date.now() + 110 * 60000)
        },
        { 
          name: 'Toulouse Center', 
          stationId: 'GS-003', 
          country: 'France', 
          latitude: 43.6047, 
          longitude: 1.4442, 
          status: 'ACTIVE',
          signalQuality: 92,
          connectedSatellites: insertedSatellites.slice(0, 3).map(s => s._id),
          lastContact: new Date(Date.now() - 12 * 60000),
          nextContact: new Date(Date.now() + 45 * 60000)
        },
        { 
          name: 'Canberra Complex', 
          stationId: 'GS-004', 
          country: 'Australia', 
          latitude: -35.4014, 
          longitude: 148.9817, 
          status: 'ACTIVE',
          signalQuality: 88,
          connectedSatellites: [],
          lastContact: new Date(Date.now() - 95 * 60000),
          nextContact: new Date(Date.now() + 160 * 60000)
        },
      ];
      await GroundStation.insertMany(groundStations);
      console.log('Ground stations seeded.');

      // Seed some mock Audit logs
      const auditLogs = [
        { userId: createdUser._id, action: 'LOGIN', ipAddress: '192.168.1.1', details: { os: 'Windows', browser: 'Chrome' } },
        { userId: createdUser._id, action: 'SYSTEM_BOOT', resource: 'Core Server', details: { status: 'Success' } },
        { userId: createdUser._id, action: 'MISSION_CREATED', resource: 'Lunar Gateway Alpha', details: { type: 'CREWED' } },
        { userId: createdUser._id, action: 'COMMUNICATION_TX', resource: 'Vanguard-1', details: { message: 'PING' } },
      ];
      await AuditLog.insertMany(auditLogs);
      console.log('Audit logs seeded.');
    }
  } catch (err) {
    console.error('Error seeding data:', err);
  }
};

module.exports = seedData;
