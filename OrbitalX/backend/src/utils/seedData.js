const mongoose = require('mongoose');
const User = require('../models/User');
const Satellite = require('../models/Satellite');
const GroundStation = require('../models/GroundStation');
const Mission = require('../models/Mission');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const bcrypt = require('bcrypt');

const seedData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Database is empty. Seeding initial admin...');
      
      // Create admin user so the user can immediately log in
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);

      const createdUser = await User.create({
        name: 'Admin User',
        email: 'admin@orbitalx.com',
        passwordHash,
        role: 'ADMIN',
      });
      console.log('Admin user seeded (admin@orbitalx.com).');

      // Only seed dummy satellites/missions if SEED_DUMMY_DATA environment variable is explicitly 'true'
      if (process.env.SEED_DUMMY_DATA === 'true') {
        const satellites = [
          { name: 'Alpha One', satelliteId: 'SAT-ALPHA-1', type: 'COMMUNICATION', formFactor: '3U', orbitType: 'LEO', status: 'ACTIVE', inclination: 51.6, orbitRadius: 6871, orbitSpeed: 7.6 },
          { name: 'Beta Two', satelliteId: 'SAT-BETA-2', type: 'OBSERVATION', formFactor: '6U', orbitType: 'MEO', status: 'ACTIVE', inclination: 55.0, orbitRadius: 26560, orbitSpeed: 3.8 },
          { name: 'Gamma Three', satelliteId: 'SAT-GAMMA-3', type: 'WEATHER', formFactor: '12U', orbitType: 'GEO', status: 'ACTIVE', inclination: 0.1, orbitRadius: 42164, orbitSpeed: 3.1 },
          { name: 'CubeSat Nano-1', satelliteId: 'CUBESAT-NANO', type: 'CUBESAT_1U', formFactor: '1U', orbitType: 'LEO', status: 'ACTIVE', inclination: 53.0, orbitRadius: 6810, orbitSpeed: 7.64 },
          { name: 'CubeSat Ion-X', satelliteId: 'CUBESAT-ION', type: 'CUBESAT_3U', formFactor: '3U', orbitType: 'LEO', status: 'ACTIVE', inclination: 97.4, orbitRadius: 6920, orbitSpeed: 7.5 },
          { name: 'CubeSat Aero-6', satelliteId: 'CUBESAT-AERO', type: 'CUBESAT_6U', formFactor: '6U', orbitType: 'LEO', status: 'ACTIVE', inclination: 45.0, orbitRadius: 6890, orbitSpeed: 7.6 },
          { name: 'CubeSat Terra-12', satelliteId: 'CUBESAT-TERRA', type: 'CUBESAT_12U', formFactor: '12U', orbitType: 'SSO', status: 'ACTIVE', inclination: 98.2, orbitRadius: 6940, orbitSpeed: 7.51 },
          { name: 'CubeSat Titan-16', satelliteId: 'CUBESAT-TITAN', type: 'CUBESAT_16U', formFactor: '16U', orbitType: 'HEO', status: 'ACTIVE', inclination: 63.4, orbitRadius: 7620, orbitSpeed: 6.84 }
        ];
        const insertedSatellites = await Satellite.insertMany(satellites);
        console.log('Satellites and CubeSats seeded.');

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

        const groundStations = [
          { 
            name: 'Ground Station Alpha', 
            stationId: 'GS-001', 
            country: 'India', 
            latitude: 12.9716, 
            longitude: 77.5946, 
            status: 'ACTIVE',
            signalQuality: 98,
            connectedSatellites: [insertedSatellites[0]._id, insertedSatellites[3]._id],
            lastContact: new Date(Date.now() - 5 * 60000),
            nextContact: new Date(Date.now() + 83 * 60000)
          },
          { 
            name: 'Houston Command', 
            stationId: 'GS-002', 
            country: 'USA', 
            latitude: 29.5502, 
            longitude: -95.097, 
            status: 'ACTIVE',
            signalQuality: 88,
            connectedSatellites: [insertedSatellites[1]._id, insertedSatellites[4]._id],
            lastContact: new Date(Date.now() - 25 * 60000),
            nextContact: new Date(Date.now() + 60 * 60000)
          },
          { 
            name: 'Toulouse Center', 
            stationId: 'GS-003', 
            country: 'France', 
            latitude: 43.6047, 
            longitude: 1.4442, 
            status: 'ACTIVE',
            signalQuality: 94,
            connectedSatellites: [insertedSatellites[0]._id, insertedSatellites[2]._id, insertedSatellites[3]._id],
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
            signalQuality: 91,
            connectedSatellites: [insertedSatellites[1]._id, insertedSatellites[4]._id],
            lastContact: new Date(Date.now() - 18 * 60000),
            nextContact: new Date(Date.now() + 50 * 60000)
          },
        ];
        await GroundStation.insertMany(groundStations);
        console.log('Ground stations seeded.');

        const auditLogs = [
          { userId: createdUser._id, action: 'LOGIN', ipAddress: '192.168.1.1', details: { os: 'Windows', browser: 'Chrome' } },
          { userId: createdUser._id, action: 'SYSTEM_BOOT', resource: 'Core Server', details: { status: 'Success' } },
          { userId: createdUser._id, action: 'MISSION_CREATED', resource: 'Lunar Gateway Alpha', details: { type: 'CREWED' } },
          { userId: createdUser._id, action: 'COMMUNICATION_TX', resource: 'Vanguard-1', details: { message: 'PING' } },
        ];
        await AuditLog.insertMany(auditLogs);
        console.log('Audit logs seeded.');
      } else {
        console.log('Clean database mode: Initial admin user created. Zero dummy missions, satellites, or CubeSats seeded.');
      }
    }
  } catch (err) {
    console.error('Error seeding data:', err);
  }
};

module.exports = seedData;
