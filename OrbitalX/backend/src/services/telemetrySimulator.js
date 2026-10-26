const mongoose = require('mongoose');
const Telemetry = require('../models/Telemetry');
const Satellite = require('../models/Satellite');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const User = require('../models/User');

const generateMockTelemetry = async () => {
  try {
    const satellites = await Satellite.find({ status: { $ne: 'OFFLINE' } });
    
    if (!satellites.length) return;

    const telemetryRecords = satellites.map(sat => {
      // Base values accurately depending on orbit type
      const isLEO = sat.orbitType === 'LEO';
      const isMEO = sat.orbitType === 'MEO';
      const isGEO = sat.orbitType === 'GEO';
      const baseAlt = isLEO ? 550 : isMEO ? 20200 : 35786;
      const baseSpeed = isLEO ? 7.6 : isMEO ? 3.88 : 3.07;

      let temperature = parseFloat((Math.random() * 40 - 10).toFixed(2)); // Normal: -10 to 30 C
      let battery = Math.floor(Math.random() * 20 + 80); // Normal: 80 - 100%
      let connectivity = Math.random() > 0.05 ? 'CONNECTED' : 'INTERMITTENT';

      // 5% chance of anomalies
      const anomalyRoll = Math.random();
      if (anomalyRoll < 0.05) {
        temperature = parseFloat((Math.random() * 30 + 85).toFixed(2)); // 85 to 115 C (Thermal Anomaly)
      } else if (anomalyRoll > 0.95) {
        battery = Math.floor(Math.random() * 10 + 5); // 5 to 15% (Low Power)
      }

      // Continuous Keplerian orbital motion along fixed orbital plane
      const nowSec = Date.now() / 1000;
      const incRad = (sat.inclination || 51.6) * (Math.PI / 180);
      const satSeed = sat.satelliteId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const nodeLng = ((satSeed * 73) % 360) * (Math.PI / 180); // Fixed Right Ascension of Ascending Node
      const periodSec = isLEO ? 5700 : isMEO ? 43200 : 86400; // 95 min for LEO, 12 hr for MEO, 24 hr for GEO
      const meanMotion = (2 * Math.PI) / periodSec;
      const phaseOffset = (satSeed * 1.5) % (2 * Math.PI);
      const u = (nowSec * meanMotion + phaseOffset) % (2 * Math.PI); // Angle along orbital plane

      const sinLat = Math.sin(incRad) * Math.sin(u);
      const simLat = parseFloat((Math.asin(Math.max(-1, Math.min(1, sinLat))) * (180 / Math.PI)).toFixed(4));
      
      const earthRot = (nowSec * (2 * Math.PI / 86400)) % (2 * Math.PI);
      const lngInPlane = Math.atan2(Math.cos(incRad) * Math.sin(u), Math.cos(u));
      let simLng = (nodeLng + lngInPlane - earthRot) * (180 / Math.PI);
      simLng = parseFloat((((((simLng + 180) % 360) + 360) % 360) - 180).toFixed(4));

      return {
        satelliteId: sat._id,
        satelliteName: sat.name,
        satelliteIdStr: sat.satelliteId,
        timestamp: new Date(),
        temperature,
        speed: parseFloat((baseSpeed + (Math.random() * 0.1 - 0.05)).toFixed(2)),
        altitude: parseFloat((baseAlt + (Math.random() * 2 - 1)).toFixed(2)),
        distanceFromEarth: parseFloat((baseAlt + 6371).toFixed(2)), // Alt + Earth radius
        battery,
        signal: Math.floor(Math.random() * 15 - 80), // -80 to -65 dBm
        connectivity,
        latitude: simLat,
        longitude: simLng,
        health: Math.floor(Math.random() * 5 + 95), // 95-100%
        cpu: Math.floor(Math.random() * 20 + 25), // 25-45%
        memory: Math.floor(Math.random() * 15 + 45) // 45-60%
      };
    });

    await Telemetry.insertMany(telemetryRecords);

    // Retention policy: cap at latest 300 records per satellite to prevent unbounded memory growth
    for (const sat of satellites) {
      const count = await Telemetry.countDocuments({ satelliteId: sat._id });
      if (count > 300) {
        const excess = count - 300;
        const oldestRecords = await Telemetry.find({ satelliteId: sat._id })
          .sort({ timestamp: 1 })
          .limit(excess)
          .select('_id');
        if (oldestRecords.length > 0) {
          await Telemetry.deleteMany({ _id: { $in: oldestRecords.map(r => r._id) } });
        }
      }
    }

    // Threshold checking logic
    for (const record of telemetryRecords) {
      let alertData = null;

      if (record.temperature > 90) {
        alertData = {
          type: 'THERMAL ANOMALY DETECTED',
          message: 'Core temperature exceeding operational limits.',
          metric: 'Temperature',
          value: record.temperature,
          threshold: 90,
          severity: 'CRITICAL'
        };
      } else if (record.battery < 15) {
        alertData = {
          type: 'LOW POWER RESERVE',
          message: 'Battery levels dropped below 15%.',
          metric: 'Battery',
          value: record.battery,
          threshold: 15,
          severity: 'WARNING'
        };
      } else if (record.connectivity === 'INTERMITTENT') {
        alertData = {
          type: 'SIGNAL LOST',
          message: 'Lost contact over unknown sector.',
          metric: 'Connectivity',
          value: 0,
          threshold: 1,
          severity: 'CRITICAL'
        };
      }

      if (alertData) {
        // Check if active alert already exists for this satellite and metric
        const existingAlert = await Alert.findOne({
          satelliteId: record.satelliteId,
          metric: alertData.metric,
          severity: { $ne: 'RESOLVED' }
        });

        if (!existingAlert) {
          const newAlert = await Alert.create({
            satelliteId: record.satelliteId,
            ...alertData
          });

          // Create notification for operators/admins
          const adminsAndOperators = await User.find({ role: { $in: ['ADMIN', 'OPERATOR'] } });
          const notifications = adminsAndOperators.map(user => ({
            userId: user._id,
            type: 'ALERT',
            title: alertData.type,
            message: `${record.satelliteIdStr} - ${alertData.message}`,
            read: false
          }));

          if (notifications.length > 0) {
            await Notification.insertMany(notifications);
          }

          // In a real scenario, we'd emit via socket here, but since this runs via interval
          // without req context, we let clients poll or we use a global io instance.
        }
      }
    }
    // console.log(`Generated telemetry for ${satellites.length} satellites.`);
  } catch (error) {
    console.error('Error generating mock telemetry:', error);
  }
};

let intervalId = null;
let currentIntervalMs = 15000;
let isRunning = false;

const startSimulation = (intervalMs = 15000) => {
  if (isRunning) return intervalId;
  currentIntervalMs = intervalMs;
  isRunning = true;
  console.log(`Starting telemetry simulation every ${intervalMs}ms...`);
  // Generate initial batch asynchronously in background without blocking response
  setImmediate(() => {
    generateMockTelemetry().catch(err => console.error('Initial telemetry error:', err));
  });
  intervalId = setInterval(generateMockTelemetry, intervalMs);
  return intervalId;
};

const stopSimulation = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning = false;
  console.log('Telemetry simulation stopped.');
};

const updateSimulationSpeed = (speedMultiplier) => {
  const baseInterval = 15000;
  const newInterval = baseInterval / speedMultiplier;
  
  if (isRunning) {
    stopSimulation();
    startSimulation(newInterval);
  } else {
    currentIntervalMs = newInterval;
  }
};

const getSimulationStatus = () => {
  return {
    isRunning,
    intervalMs: currentIntervalMs,
    speedMultiplier: 15000 / currentIntervalMs
  };
};

// Graceful shutdown
process.on('SIGTERM', stopSimulation);
process.on('SIGINT', stopSimulation);

module.exports = {
  generateMockTelemetry,
  startSimulation,
  stopSimulation,
  updateSimulationSpeed,
  getSimulationStatus
};
