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

      // Create satellites (including CubeSats)
      const satellites = [
        { name: 'Alpha One', satelliteId: 'SAT-ALPHA-1', type: 'COMMUNICATION', orbitType: 'LEO', status: 'ACTIVE', inclination: 51.6, orbitRadius: 6871, orbitSpeed: 7.6 },
        { name: 'Beta Two', satelliteId: 'SAT-BETA-2', type: 'OBSERVATION', orbitType: 'MEO', status: 'ACTIVE', inclination: 55.0, orbitRadius: 26560, orbitSpeed: 3.8 },
        { name: 'Gamma Three', satelliteId: 'SAT-GAMMA-3', type: 'WEATHER', orbitType: 'GEO', status: 'ACTIVE', inclination: 0.1, orbitRadius: 42164, orbitSpeed: 3.1 },
        { name: 'CubeSat Ion-X', satelliteId: 'CUBESAT-ION', type: 'CUBESAT_3U', orbitType: 'LEO', status: 'ACTIVE', inclination: 97.4, orbitRadius: 6920, orbitSpeed: 7.5 },
        { name: 'CubeSat Aero-6', satelliteId: 'CUBESAT-AERO', type: 'CUBESAT_6U', orbitType: 'LEO', status: 'ACTIVE', inclination: 45.0, orbitRadius: 6890, orbitSpeed: 7.6 }
      ];
      const insertedSatellites = await Satellite.insertMany(satellites);
      console.log('Satellites and CubeSats seeded.');

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

      // Create ground stations matching Ground Stations
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

    // Seed notifications if collection is empty
    const notifCount = await Notification.countDocuments();
    if (notifCount === 0) {
      const targetUser = (await User.findOne({ email: 'admin@orbitalx.com' })) || (await User.findOne());
      if (targetUser) {
        const seedNotifications = [
          {
            userId: targetUser._id,
            type: 'ALERT',
            title: 'SOLAR RADIATION STORM DETECTED',
            message: 'Class M2.4 solar flare observed. Magnetosphere absorption index elevated for SAT-ALPHA-1.',
            read: false,
            createdAt: new Date(Date.now() - 10 * 60000)
          },
          {
            userId: targetUser._id,
            type: 'COMMS',
            title: 'GROUND LINK ACQUIRED',
            message: 'Toulouse Center (GS-003) established high-throughput X-Band downlink with CubeSat Ion-X.',
            read: false,
            createdAt: new Date(Date.now() - 35 * 60000)
          },
          {
            userId: targetUser._id,
            type: 'SYSTEM',
            title: 'ORBITAL MANEUVER EXECUTED',
            message: 'Beta Two station-keeping thruster burn completed successfully. Delta-V: +1.42 m/s.',
            read: false,
            createdAt: new Date(Date.now() - 75 * 60000)
          },
          {
            userId: targetUser._id,
            type: 'ALERT',
            title: 'THERMAL THRESHOLD EXCEEDED',
            message: 'SAT-BETA-2 battery bay temperature reached 41.2°C during direct solar exposure.',
            read: true,
            createdAt: new Date(Date.now() - 180 * 60000)
          },
          {
            userId: targetUser._id,
            type: 'COMMS',
            title: 'TELEMETRY STREAM SYNCHRONIZED',
            message: 'Canberra Complex (GS-004) telemetry lock confirmed at 99.8% packet reception.',
            read: true,
            createdAt: new Date(Date.now() - 360 * 60000)
          },
          {
            userId: targetUser._id,
            type: 'SYSTEM',
            title: 'FIRMWARE INTEGRITY VERIFIED',
            message: 'Autonomous ADCS guidance subsystem self-test passed with zero checksum faults.',
            read: true,
            createdAt: new Date(Date.now() - 720 * 60000)
          }
        ];
        await Notification.insertMany(seedNotifications);
        console.log('Seed notifications created successfully.');
      }
    }
  } catch (err) {
    console.error('Error seeding data:', err);
  }
};

module.exports = seedData;
