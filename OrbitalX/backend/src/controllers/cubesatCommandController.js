const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const Satellite = require('../models/Satellite');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

// In-memory persistent simulation store for CubeSats (1U up to 16U)
const cubeSatStates = require('../utils/cubeSatInitialStates');

let commandSequenceCounter = 102;

// @desc    Get CubeSat simulation state
// @route   GET /api/telemetry/cubesat/state
// @access  Private
const getCubeSatState = asyncHandler(async (req, res) => {
  let { id } = req.query;

  // Find the requested satellite or fallback to the first active satellite in the database
  let dbSat = null;
  if (id) {
    try {
      dbSat = await Satellite.findOne({
        $or: [
          { satelliteId: id },
          { name: id },
          ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
        ]
      });
    } catch (e) {
      // Ignore DB query errors
    }
  }

  // If specific ID was not found or not provided, pick the first existing satellite from DB
  if (!dbSat) {
    try {
      dbSat = await Satellite.findOne({ status: { $ne: 'DECOMMISSIONED' } }) || await Satellite.findOne();
    } catch (e) {
      // Ignore
    }
  }

  // If there are literally no satellites in the database at all:
  if (!dbSat) {
    return res.status(200).json(new ApiResponse(200, null, 'No active satellites found in database'));
  }

  const satId = dbSat.satelliteId || dbSat._id.toString();

  // Initialize or return in-memory simulation state for this real satellite
  if (!cubeSatStates[satId]) {
    const rawType = (dbSat.type || '').toUpperCase();
    let formFactor = dbSat.formFactor || '3U';
    if (!dbSat.formFactor) {
      if (rawType.includes('16U') || rawType === '16U') formFactor = '16U';
      else if (rawType.includes('12U') || rawType === '12U') formFactor = '12U';
      else if (rawType.includes('6U') || rawType === '6U') formFactor = '6U';
      else if (rawType.includes('1U') || rawType === '1U') formFactor = '1U';
      else if (rawType.includes('2U') || rawType === '2U') formFactor = '2U';
    }

    const orbitType = dbSat.orbitType || 'LEO';

    cubeSatStates[satId] = {
      satelliteId: satId,
      name: dbSat.name || satId,
      formFactor,
      orbitType,
      status: dbSat.status || 'NOMINAL',
      speed: dbSat.orbitSpeed || 7.58,
      altitude: dbSat.orbitRadius ? Math.max(300, Math.round(dbSat.orbitRadius - 6371)) : 510.0,
      distanceFromEarth: dbSat.orbitRadius || 6881.0,
      temperature: { bus: 22.0, solar: 42.0, battery: 20.0, radio: 30.0 },
      load: { cpu: 20, memory: 30, busPower: 15.0 },
      battery: 88.0,
      propellant: 92.0,
      solarPanelsDeployed: true,
      heaterActive: false,
      attitude: { roll: 0.1, pitch: -0.2, yaw: 1.5, spinRate: 0.04, mode: 'NADIR' },
      groundStation: 'Toulouse Center (GS-003)',
      signalStrength: -79,
      snr: 15.0,
      packetsDownlinked: 2400,
      commandHistory: []
    };
  }

  return res.status(200).json(new ApiResponse(200, cubeSatStates[satId], 'CubeSat simulation state retrieved'));
});

// @desc    Execute CubeSat telecommand
// @route   POST /api/telemetry/cubesat/command
// @access  Private
const executeCubeSatCommand = asyncHandler(async (req, res) => {
  let { satelliteId, command, params = {} } = req.body;

  if (!command) {
    return res.status(400).json(new ApiResponse(400, null, 'Command is required'));
  }

  // Ensure satellite exists in database
  let dbSat = null;
  if (satelliteId) {
    try {
      dbSat = await Satellite.findOne({
        $or: [
          { satelliteId },
          { name: satelliteId },
          ...(satelliteId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: satelliteId }] : [])
        ]
      });
    } catch (e) {}
  }

  if (!dbSat) {
    try {
      dbSat = await Satellite.findOne({ status: { $ne: 'DECOMMISSIONED' } }) || await Satellite.findOne();
    } catch (e) {}
  }

  if (!dbSat) {
    return res.status(404).json(new ApiResponse(404, null, 'No active satellites found in database'));
  }

  const activeSatId = dbSat.satelliteId || dbSat._id.toString();

  // Ensure state exists for this real satellite
  if (!cubeSatStates[activeSatId]) {
    const rawType = (dbSat.type || '').toUpperCase();
    let formFactor = dbSat.formFactor || '3U';
    if (!dbSat.formFactor) {
      if (rawType.includes('16U') || rawType === '16U') formFactor = '16U';
      else if (rawType.includes('12U') || rawType === '12U') formFactor = '12U';
      else if (rawType.includes('6U') || rawType === '6U') formFactor = '6U';
      else if (rawType.includes('1U') || rawType === '1U') formFactor = '1U';
      else if (rawType.includes('2U') || rawType === '2U') formFactor = '2U';
    }

    cubeSatStates[activeSatId] = {
      satelliteId: activeSatId,
      name: dbSat.name || activeSatId,
      formFactor,
      orbitType: dbSat.orbitType || 'LEO',
      status: dbSat.status || 'NOMINAL',
      speed: dbSat.orbitSpeed || 7.58,
      altitude: dbSat.orbitRadius ? Math.max(300, Math.round(dbSat.orbitRadius - 6371)) : 505.0,
      distanceFromEarth: dbSat.orbitRadius || 6876.0,
      temperature: { bus: 22.0, solar: 42.0, battery: 20.0, radio: 30.0 },
      load: { cpu: 20, memory: 30, busPower: 15.0 },
      battery: 85.0,
      propellant: 90.0,
      solarPanelsDeployed: true,
      heaterActive: false,
      attitude: { roll: 0, pitch: 0, yaw: 0, spinRate: 0.05, mode: 'NADIR' },
      groundStation: 'Ground Station Alpha (GS-001)',
      signalStrength: -80,
      snr: 14.0,
      packetsDownlinked: 1200,
      commandHistory: []
    };
  }

  const sat = cubeSatStates[activeSatId];
  const cmdUpper = command.toUpperCase();
  const seq = commandSequenceCounter++;
  let responseText = '';
  let statusResult = 'EXECUTED';

  // Apply Command Effects on CubeSat Physics & Telemetry
  switch (cmdUpper) {
    case 'PWR:SOLAR:DEPLOY':
    case 'DEPLOY_SOLAR_PANELS':
    case 'DEPLOY_PANELS':
    case 'DEPLOY':
      sat.solarPanelsDeployed = true;
      sat.temperature.solar = parseFloat((sat.temperature.solar + 3.2).toFixed(1));
      sat.battery = Math.min(100, parseFloat((sat.battery + 2.5).toFixed(1)));
      responseText = `Solar array deployed. Power generation nominal (+35W). Battery charging rate optimized.`;
      break;

    case 'PWR:SOLAR:STOW':
    case 'RETRACT_SOLAR_PANELS':
    case 'STOW_SOLAR_PANELS':
    case 'STOW_PANELS':
    case 'STOW':
      sat.solarPanelsDeployed = false;
      sat.load.busPower = parseFloat((sat.load.busPower * 0.85).toFixed(1));
      responseText = `Solar arrays stowed in protective configuration. Power input reduced.`;
      break;

    case 'PROP:COLD_GAS:FIRE_500MS':
    case 'COLD_GAS_THRUST':
    case 'ORBITAL_BOOST':
    case 'THRUST':
    case 'BURST':
    case 'CLOUD_BURST':
    case 'THRUSTER':
      const deltaV = params.deltaV || 0.08;
      sat.speed = parseFloat((sat.speed + deltaV).toFixed(3));
      sat.altitude = parseFloat((sat.altitude + 3.8).toFixed(1));
      sat.distanceFromEarth = parseFloat((sat.distanceFromEarth + 3.8).toFixed(1));
      sat.propellant = Math.max(0, parseFloat((sat.propellant - 2.4).toFixed(1)));
      sat.temperature.bus = parseFloat((sat.temperature.bus + 2.1).toFixed(1));
      sat.load.cpu = Math.min(100, sat.load.cpu + 18);
      sat.status = 'THRUSTER_BURN';
      responseText = `Cold-gas thruster burst fired (+0.08 km/s). Speed boosted to ${sat.speed} km/s. Propellant: ${sat.propellant}%. Burst duration: 3s.`;
      
      // Auto-cutoff after 3s burst so the system returns to NOMINAL
      setTimeout(() => {
        if (sat && sat.status === 'THRUSTER_BURN') {
          sat.status = 'NOMINAL';
        }
      }, 3000);
      break;

    case 'PROP:ION:START_CONTINUOUS':
      sat.speed = parseFloat((sat.speed + 0.15).toFixed(3));
      sat.propellant = Math.max(0, parseFloat((sat.propellant - 1.2).toFixed(1)));
      sat.status = 'THRUSTER_BURN';
      responseText = `Continuous ion thruster ignition confirmed. Electric propulsion providing steady low-thrust delta-V.`;
      break;

    case 'PROP:ION:SHUTDOWN':
      sat.status = 'NOMINAL';
      responseText = `Ion thruster safely deactivated. Thruster discharge chamber purged.`;
      break;

    case 'PROP:VALVES:PURGE':
      sat.propellant = Math.max(0, parseFloat((sat.propellant - 0.5).toFixed(1)));
      responseText = `Propulsion feedline valves cycled and purged. Plenum pressure normalized to 4.2 bar.`;
      break;

    case 'ADCS:MODE:DETUMBLE':
    case 'ADCS_DETUMBLE':
    case 'DETUMBLE':
      sat.attitude.spinRate = 0.01;
      sat.attitude.mode = 'DETUMBLED';
      sat.status = 'DETUMBLING';
      sat.load.cpu = Math.min(100, sat.load.cpu + 22);
      sat.load.busPower = parseFloat((sat.load.busPower + 5.2).toFixed(1));
      responseText = `ADCS B-dot magnetic coils active. Spacecraft rotation stabilized. Angular rate reduced to 0.01 deg/s.`;
      break;

    case 'ADCS:MODE:NADIR':
    case 'POINT_NADIR':
    case 'NADIR':
      sat.attitude.mode = 'NADIR';
      sat.attitude.roll = 0.1;
      sat.attitude.pitch = 0.0;
      sat.attitude.yaw = 0.0;
      responseText = `Attitude oriented to Earth Nadir vector. Earth observation instruments aligned.`;
      break;

    case 'ADCS:MODE:SUN':
    case 'POINT_SUN':
    case 'SUN':
      sat.attitude.mode = 'SUN_TRACKING';
      sat.attitude.pitch = 18.4;
      sat.temperature.solar = parseFloat((sat.temperature.solar + 4.8).toFixed(1));
      responseText = `Attitude oriented to Sun-vector. Solar array solar flux maximized.`;
      break;

    case 'ADCS:RW:DESATURATE':
      sat.load.busPower = parseFloat((sat.load.busPower + 3.0).toFixed(1));
      responseText = `Magnetorquer firing initiated. Reaction wheel momentum desaturated to < 10% nominal.`;
      break;

    case 'ADCS:STARTRACKER:CAL':
      responseText = `Star tracker calibration cycle completed. Attitude quaternion covariance: 0.002 deg RMS.`;
      break;

    case 'PAYLOAD:CAM:CAPTURE_HIGHRES':
    case 'EXECUTE_PAYLOAD_CAPTURE':
    case 'CAPTURE_IMAGE':
    case 'CAPTURE':
    case 'SCIENCE_PASS':
      sat.status = 'SCIENCE_ACQUISITION';
      sat.load.cpu = Math.min(96, sat.load.cpu + 58); // Heavy CPU Load Spike
      sat.load.memory = Math.min(95, sat.load.memory + 26);
      sat.load.busPower = parseFloat((sat.load.busPower + 14.5).toFixed(1));
      sat.temperature.bus = parseFloat((sat.temperature.bus + 3.4).toFixed(1));
      responseText = `Multispectral payload capture completed. 240 MB telemetry frames recorded to flash buffer. CPU Load spiked to ${sat.load.cpu}%.`;
      break;

    case 'PAYLOAD:SAR:SWATH_ACTIVATE':
      sat.load.busPower = parseFloat((sat.load.busPower + 18.0).toFixed(1));
      responseText = `Synthetic Aperture Radar (SAR) swath scan completed. 480 MB radar aperture dataset buffered.`;
      break;

    case 'PAYLOAD:SPEC:INTEGRATE':
      sat.load.memory = Math.min(95, sat.load.memory + 15);
      responseText = `Hyperspectral spectrometer integration complete. 128 spectral bands recorded.`;
      break;

    case 'PAYLOAD:POWER:CYCLE':
      sat.load.busPower = parseFloat((sat.load.busPower - 6.0).toFixed(1));
      setTimeout(() => { if (sat) sat.load.busPower = parseFloat((sat.load.busPower + 6.0).toFixed(1)); }, 2000);
      responseText = `Payload power bus cycled. Sensor hardware initialized cleanly.`;
      break;

    case 'COMMS:DOWNLINK:START_BURST':
    case 'START_DATA_DOWNLINK':
    case 'DOWNLINK':
    case 'TLM:DUMP':
      sat.status = 'DOWNLINKING';
      sat.load.memory = Math.max(12, sat.load.memory - 28);
      sat.temperature.radio = parseFloat((sat.temperature.radio + 5.2).toFixed(1));
      sat.packetsDownlinked += 450;
      sat.load.busPower = parseFloat((sat.load.busPower + 9.0).toFixed(1));
      responseText = `High-speed downlink carrier active with ground link. Flushed 450 telemetry packets. Memory load reduced to ${sat.load.memory}%.`;
      break;

    case 'COMMS:TX:HIGH_POWER':
      sat.load.busPower = parseFloat((sat.load.busPower + 6.5).toFixed(1));
      responseText = `Transmitter power amplified to 5.0W high-gain broadcast. Link margin elevated by +6.2 dB.`;
      break;

    case 'COMMS:TX:LOW_POWER':
      sat.load.busPower = parseFloat(Math.max(8, sat.load.busPower - 4.0).toFixed(1));
      responseText = `Transmitter throttled to 1.0W low-power beacon mode.`;
      break;

    case 'SAFE:ENTER_SAFE_MODE':
    case 'ENTER_SAFE_MODE':
    case 'SAFE_MODE':
    case 'SAFE':
      sat.status = 'SAFE_MODE';
      sat.load.cpu = 8;
      sat.load.memory = 15;
      sat.load.busPower = 6.4;
      sat.temperature.bus = 15.2;
      await Satellite.findByIdAndUpdate(dbSat._id, { status: 'SAFE_MODE' }).catch(() => {});
      responseText = `SAFE MODE engaged. Non-critical payloads powered down. CPU load throttled to 8% to conserve battery reserve. Database status set to SAFE_MODE.`;
      break;

    case 'SAFE:RESUME_NORMAL_OPS':
    case 'RESUME_NORMAL_OPS':
    case 'NORMAL_OPS':
    case 'RESUME':
      sat.status = 'NOMINAL';
      sat.load.cpu = 24;
      sat.load.busPower = 16.5;
      await Satellite.findByIdAndUpdate(dbSat._id, { status: 'ACTIVE' }).catch(() => {});
      responseText = `Normal operations resumed. All primary bus subsystems reporting nominal status. Database status set to ACTIVE.`;
      break;

    case 'SAFE:BEACON:TRANSMIT':
      responseText = `UHF emergency distress beacon transmitted on 437.525 MHz. Ground network notified.`;
      break;

    case 'PWR:BAT:HEATERS_ON':
    case 'CYCLE_HEATERS':
    case 'HEATERS_ON':
    case 'TOGGLE_HEATERS':
    case 'HEATERS':
    case 'HEATER':
      sat.heaterActive = !sat.heaterActive;
      if (sat.heaterActive) {
        sat.temperature.bus = parseFloat((sat.temperature.bus + 5.8).toFixed(1));
        sat.temperature.battery = parseFloat((sat.temperature.battery + 4.2).toFixed(1));
        sat.load.busPower = parseFloat((sat.load.busPower + 8.5).toFixed(1));
        responseText = `Thermal management heating loops ENERGIZED. Internal bus temperature elevated to ${sat.temperature.bus}°C. Yellow heater indicator ON.`;
      } else {
        sat.temperature.bus = parseFloat((sat.temperature.bus - 4.1).toFixed(1));
        sat.temperature.battery = parseFloat((sat.temperature.battery - 3.2).toFixed(1));
        sat.load.busPower = parseFloat(Math.max(12, sat.load.busPower - 8.5).toFixed(1));
        responseText = `Thermal management heaters DE-ENERGIZED. Subsystems cooling toward thermal balance. Yellow heater indicator OFF.`;
      }
      break;

    case 'PWR:BAT:HEATERS_OFF':
    case 'HEATERS_OFF':
    case 'HEATER_OFF':
      sat.heaterActive = false;
      sat.temperature.bus = parseFloat((sat.temperature.bus - 4.1).toFixed(1));
      sat.temperature.battery = parseFloat((sat.temperature.battery - 3.2).toFixed(1));
      sat.load.busPower = parseFloat(Math.max(12, sat.load.busPower - 8.5).toFixed(1));
      responseText = `Thermal management heaters powered OFF. Yellow heater indicator OFF.`;
      break;

    case 'PWR:BUS:SHED_LOADS':
    case 'SHED_LOADS':
      sat.load.busPower = parseFloat(Math.max(8, sat.load.busPower - 10.0).toFixed(1));
      responseText = `Non-essential payload and secondary buses isolated. Power draw reduced by 10W.`;
      break;

    case 'PWR:STATUS:GET':
      responseText = `EPS TELEMETRY: Battery SOC: ${sat.battery}% | Voltage: 8.2V | Bus: ${sat.load.busPower}W | Solar Gen: ${sat.solarPanelsDeployed ? '+35W' : '0W'}.`;
      break;

    case 'SYS:PING':
    case 'PING_DIAGNOSTICS':
    case 'PING':
      responseText = `DIAGNOSTIC PING OK. EPS: 100% | CDH: 100% | ADCS: 98% | COMM: 99% | Round-Trip Latency: 14.2ms.`;
      break;

    case 'SYS:REBOOT:OBC':
    case 'REBOOT_OBC':
      sat.load.cpu = 95;
      setTimeout(() => {
        if (sat) sat.load.cpu = 22;
      }, 3000);
      responseText = `Onboard computer (OBC) warm reboot sequence completed. Firmware checksum: 0x8F4A verified.`;
      break;

    case 'SYS:MEM:FLUSH':
    case 'MEM_FLUSH':
      sat.load.memory = 12;
      responseText = `Volatile flash buffer purged. 0 bad blocks flagged. Available storage: 3.8 GB.`;
      break;

    case 'SYS:CLOCK:SYNC':
    case 'CLOCK_SYNC':
      responseText = `Spacecraft Real-Time Clock (RTC) synchronized with Ground UTC. Drift offset: +0.0012s corrected.`;
      break;

    case 'SYS:SELFTEST:FULL':
    case 'SELFTEST':
      sat.load.cpu = 88;
      setTimeout(() => { if (sat) sat.load.cpu = 25; }, 2500);
      responseText = `Full subsystem BIST passed: EPS [OK] · OBC [OK] · ADCS Gyros [OK] · S-Band Radio [OK] · Flash Storage [OK].`;
      break;

    default:
      // Handle generic or custom command parameter
      responseText = `Telecommand [${cmdUpper}] accepted and executed by onboard flight executive.`;
      sat.load.cpu = Math.min(95, sat.load.cpu + 8);
      break;
  }

  // Append to command history
  const commandRecord = {
    seq,
    command: cmdUpper,
    timestamp: new Date(),
    status: statusResult,
    response: responseText
  };

  sat.commandHistory.unshift(commandRecord);
  if (sat.commandHistory.length > 25) {
    sat.commandHistory.pop();
  }

  // Audit log entry
  if (req.user) {
    await AuditLog.create({
      userId: req.user._id,
      action: 'CUBESAT_COMMAND',
      resource: sat.name,
      details: {
        command: cmdUpper,
        seq,
        satelliteId,
        status: sat.status,
        speed: sat.speed,
        temp: sat.temperature.bus,
        load: sat.load.cpu
      }
    }).catch(() => {});
  }

  // If major command, also create a system notification
  if (['COLD_GAS_THRUST', 'ENTER_SAFE_MODE', 'DEPLOY_SOLAR_PANELS'].includes(cmdUpper) && req.user) {
    await Notification.create({
      userId: req.user._id,
      type: cmdUpper === 'ENTER_SAFE_MODE' ? 'ALERT' : 'SYSTEM',
      title: `COMMAND EXECUTED: ${cmdUpper}`,
      message: `${sat.name} - ${responseText}`,
      read: false
    }).catch(() => {});
  }

  res.status(200).json(new ApiResponse(200, {
    satellite: sat,
    execution: commandRecord
  }, `Command [${cmdUpper}] executed successfully`));
});

module.exports = {
  getCubeSatState,
  executeCubeSatCommand
};
