import React, { useState, useEffect, useRef } from 'react';
import { 
  Gauge, 
  Thermometer, 
  Cpu, 
  BatteryCharging, 
  Compass, 
  Radio, 
  Send, 
  RotateCcw, 
  Zap, 
  ShieldAlert, 
  ShieldCheck, 
  Flame, 
  Camera, 
  DownloadCloud, 
  Play, 
  Pause, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Activity,
  HardDrive
} from 'lucide-react';
import CubeSatSimulationCanvas from './CubeSatSimulationCanvas';
import cubesatSimService from '../../services/cubesatSimService';

export default function CubeSatSimulator() {
  const [selectedSatId, setSelectedSatId] = useState('CUBESAT-ION');
  const [simState, setSimState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [cliInput, setCliInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeThrustAnimation, setActiveThrustAnimation] = useState(false);
  const terminalEndRef = useRef(null);

  // Initial fetch and polling every 4 seconds
  useEffect(() => {
    fetchCubeSatState();
    const interval = setInterval(fetchCubeSatState, 4000);
    return () => clearInterval(interval);
  }, [selectedSatId]);

  const fetchCubeSatState = async () => {
    try {
      const res = await cubesatSimService.getState(selectedSatId);
      if (res && res.data) {
        setSimState(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch CubeSat simulation state', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll terminal log
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simState?.commandHistory]);

  const handleSendCommand = async (commandName, params = {}) => {
    if (isExecuting) return;
    setIsExecuting(true);

    if (['COLD_GAS_THRUST', 'ORBITAL_BOOST', 'THRUST'].includes(commandName.toUpperCase())) {
      setActiveThrustAnimation(true);
      setTimeout(() => setActiveThrustAnimation(false), 2500);
    }

    try {
      const res = await cubesatSimService.sendCommand(selectedSatId, commandName, params);
      if (res && res.data && res.data.satellite) {
        setSimState(res.data.satellite);
      }
    } catch (err) {
      console.error(`Failed to execute command ${commandName}`, err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCliSubmit = (e) => {
    e.preventDefault();
    if (!cliInput.trim()) return;
    const cmd = cliInput.trim().toUpperCase();
    setCliInput('');
    handleSendCommand(cmd);
  };

  // Fallback state if server is loading
  const sat = simState || {
    satelliteId: selectedSatId,
    name: selectedSatId === 'CUBESAT-ION' ? 'CubeSat Ion-X' : 'CubeSat Aero-6',
    formFactor: selectedSatId === 'CUBESAT-ION' ? '3U' : '6U',
    orbitType: 'LEO',
    status: 'NOMINAL',
    speed: 7.56,
    altitude: 512.4,
    distanceFromEarth: 6883.4,
    temperature: { bus: 21.8, solar: 44.5, battery: 19.4, radio: 32.1 },
    load: { cpu: 24, memory: 36, busPower: 16.8 },
    battery: 89.2,
    propellant: 94.5,
    solarPanelsDeployed: true,
    attitude: { roll: 0.5, pitch: -1.1, yaw: 14.2, spinRate: 0.03, mode: 'NADIR' },
    groundStation: 'Toulouse Center (GS-003)',
    signalStrength: -78,
    snr: 15.4,
    packetsDownlinked: 5410,
    commandHistory: []
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'NOMINAL':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/40">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] mr-2 animate-ping" />
            NOMINAL OPS
          </span>
        );
      case 'SAFE_MODE':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#FF2A2A]/20 text-[#FF2A2A] border border-[#FF2A2A]/50">
            <ShieldAlert size={12} className="mr-1.5" />
            SAFE MODE ACTIVE
          </span>
        );
      case 'SCIENCE_ACQUISITION':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50 animate-pulse">
            <Camera size={12} className="mr-1.5" />
            SCIENCE ACQUISITION (HIGH LOAD)
          </span>
        );
      case 'DOWNLINKING':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50">
            <DownloadCloud size={12} className="mr-1.5" />
            DOWNLINKING TELEMETRY
          </span>
        );
      case 'THRUSTER_BURN':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#FFB000]/20 text-[#FFB000] border border-[#FFB000]/50 animate-pulse">
            <Flame size={12} className="mr-1.5" />
            THRUSTER PULSE FIRING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-bold bg-gray-800 text-gray-300">
            {st}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-300">
      
      {/* --- 1. TOP HEADER & CUBESAT SWITCHER --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-gray-800 pb-5 gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              CubeSat Flight Simulation & Command Center
            </h1>
            {getStatusBadge(sat.status)}
          </div>
          <p className="text-gray-400 font-mono text-xs tracking-widest mt-1">
            REALTIME ON-ORBIT SUBSYSTEM TELEMETRY • TELECOMMAND UPLINK DECK
          </p>
        </div>

        {/* CubeSat Selector & 3D Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-[#0B1221] border border-gray-800 rounded p-1">
            <span className="text-xs font-mono text-gray-500 px-2 uppercase">TARGET:</span>
            <button
              onClick={() => setSelectedSatId('CUBESAT-ION')}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                selectedSatId === 'CUBESAT-ION'
                  ? 'bg-[#00F0FF] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              CubeSat Ion-X (3U)
            </button>
            <button
              onClick={() => setSelectedSatId('CUBESAT-AERO')}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                selectedSatId === 'CUBESAT-AERO'
                  ? 'bg-[#00F0FF] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              CubeSat Aero-6 (6U)
            </button>
          </div>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#0B1221] border border-gray-800 hover:border-gray-700 rounded text-xs font-mono text-gray-300 hover:text-white transition-colors"
            title="Toggle 3D Viewport Auto-Rotation"
          >
            {autoRotate ? <Play size={14} className="text-[#00F0FF]" /> : <Pause size={14} />}
            <span>{autoRotate ? '3D Spin' : '3D Static'}</span>
          </button>
        </div>
      </div>

      {/* --- 2. REALTIME TELEMETRY METRIC CARDS (SPEED, TEMP, LOAD, BATTERY) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Orbital Speed */}
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-4 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono tracking-widest uppercase flex items-center">
              <Gauge size={15} className="mr-1.5 text-[#00F0FF]" /> ORBITAL SPEED
            </span>
            <span className="text-[10px] font-mono text-[#00FF66] bg-[#00FF66]/10 px-1.5 py-0.5 rounded">
              LEO REGIME
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-mono text-white tracking-tight">
              {sat.speed}
            </span>
            <span className="text-xs font-mono text-gray-400">km/s</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-gray-400 border-t border-gray-800/80 pt-2">
            <span>Altitude: <strong className="text-white">{sat.altitude} km</strong></span>
            <span>Period: <strong className="text-[#00F0FF]">94.8 min</strong></span>
          </div>
        </div>

        {/* Metric 2: Multi-Zone Temperature */}
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-4 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono tracking-widest uppercase flex items-center">
              <Thermometer size={15} className="mr-1.5 text-[#FFB000]" /> CORE TEMPERATURE
            </span>
            <span className="text-[10px] font-mono text-gray-400">NOMINAL</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-mono text-white tracking-tight">
              {sat.temperature?.bus >= 0 ? `+${sat.temperature?.bus}` : sat.temperature?.bus}°C
            </span>
            <span className="text-xs font-mono text-gray-500">BUS CORE</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1 text-[10px] font-mono text-gray-400 border-t border-gray-800/80 pt-2">
            <div>SOL: <span className="text-[#FFB000] font-bold">+{sat.temperature?.solar}°C</span></div>
            <div>BAT: <span className="text-white font-bold">+{sat.temperature?.battery}°C</span></div>
            <div>RF: <span className="text-[#00F0FF] font-bold">+{sat.temperature?.radio}°C</span></div>
          </div>
        </div>

        {/* Metric 3: System Processing & Bus Load */}
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-4 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono tracking-widest uppercase flex items-center">
              <Cpu size={15} className="mr-1.5 text-[#00FF66]" /> PROCESSING & LOAD
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              POWER: <strong className="text-white">{sat.load?.busPower}W</strong>
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-bold font-mono tracking-tight ${
              sat.load?.cpu > 80 ? 'text-[#FF2A2A]' : sat.load?.cpu > 50 ? 'text-[#FFB000]' : 'text-white'
            }`}>
              {sat.load?.cpu}%
            </span>
            <span className="text-xs font-mono text-gray-500">CPU LOAD</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-gray-400 border-t border-gray-800/80 pt-2">
            <span>RAM Buff: <strong className="text-white">{sat.load?.memory}%</strong></span>
            <span>Bus Load: <strong className="text-[#00FF66]">{sat.load?.busPower} W</strong></span>
          </div>
        </div>

        {/* Metric 4: Battery & Power Flow */}
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-4 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-mono tracking-widest uppercase flex items-center">
              <BatteryCharging size={15} className="mr-1.5 text-[#00F0FF]" /> BATTERY & POWER
            </span>
            <span className="text-[10px] font-mono text-[#00FF66]">
              {sat.solarPanelsDeployed ? 'WINGS DEPLOYED' : 'WINGS STOWED'}
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-mono text-white tracking-tight">
              {sat.battery}%
            </span>
            <span className="text-xs font-mono text-[#00FF66]">+32W CHARGING</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-gray-400 border-t border-gray-800/80 pt-2">
            <span>Propellant: <strong className="text-white">{sat.propellant}%</strong></span>
            <span>Link: <strong className="text-[#00F0FF]">{sat.snr} dB</strong></span>
          </div>
        </div>

      </div>

      {/* --- 3. MAIN SIMULATION INTERFACE: 3D VIEWPORT & COMMAND DECK --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT/CENTER: 3D Viewport & Spacecraft Status (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* 3D Model Simulation Container */}
          <div className="bg-[#050810] border border-gray-800 rounded-lg h-[460px] relative overflow-hidden shadow-2xl">
            <CubeSatSimulationCanvas 
              formFactor={sat.formFactor}
              solarPanelsDeployed={sat.solarPanelsDeployed}
              isThrusting={activeThrustAnimation}
              status={sat.status}
              attitude={sat.attitude}
              autoRotate={autoRotate}
            />

            {/* In-Viewport Flight HUD Overlay Bar */}
            <div className="absolute bottom-3 left-3 right-3 bg-[#0A0F1F]/90 backdrop-blur-md border border-gray-800 rounded p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center space-x-4">
                <div>
                  <span className="text-gray-500">ATTITUDE: </span>
                  <span className="text-white font-semibold">
                    R:{sat.attitude?.roll}° P:{sat.attitude?.pitch}° Y:{sat.attitude?.yaw}°
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">POINTING: </span>
                  <span className="text-[#00F0FF] font-semibold">{sat.attitude?.mode}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
                  <span className="text-gray-400">GS: </span>
                  <span className="text-white">{sat.groundStation}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Subsystem Status Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-[#0B1221] border border-gray-800 rounded p-2.5">
              <span className="text-gray-500 text-[10px] block">ADCS MAGNETORQUERS</span>
              <span className="text-white font-bold flex items-center mt-1">
                <Compass size={13} className="mr-1.5 text-[#00F0FF]" />
                {sat.attitude?.spinRate < 0.05 ? 'LOCKED (<0.05°/s)' : 'TUMBLING'}
              </span>
            </div>

            <div className="bg-[#0B1221] border border-gray-800 rounded p-2.5">
              <span className="text-gray-500 text-[10px] block">PAYLOAD BUFFER</span>
              <span className="text-white font-bold flex items-center mt-1">
                <HardDrive size={13} className="mr-1.5 text-[#FFB000]" />
                {sat.load?.memory}% Buffer Full
              </span>
            </div>

            <div className="bg-[#0B1221] border border-gray-800 rounded p-2.5">
              <span className="text-gray-500 text-[10px] block">DOWNLINKED PACKETS</span>
              <span className="text-white font-bold flex items-center mt-1">
                <DownloadCloud size={13} className="mr-1.5 text-[#00FF66]" />
                {sat.packetsDownlinked.toLocaleString()} Pkts
              </span>
            </div>

            <div className="bg-[#0B1221] border border-gray-800 rounded p-2.5">
              <span className="text-gray-500 text-[10px] block">PROPELLANT RESERVE</span>
              <span className="text-white font-bold flex items-center mt-1">
                <Flame size={13} className="mr-1.5 text-[#FF2A2A]" />
                {sat.propellant}% Tank Level
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TELECOMMAND DECK & INTERACTIVE CLI TERMINAL (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* Telecommand Button Matrix */}
          <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-4">
            <h3 className="font-mono text-xs tracking-widest text-[#00F0FF] uppercase mb-3 flex items-center">
              <Send size={13} className="mr-2" /> DISPATCH TELECOMMANDS
            </h3>

            <div className="space-y-3">
              
              {/* Power & Panels */}
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1.5">
                  1. POWER & SOLAR
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSendCommand('DEPLOY_SOLAR_PANELS')}
                    disabled={isExecuting}
                    className="flex items-center justify-center space-x-1.5 bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] py-2 px-2.5 rounded text-xs font-mono tracking-wider transition-colors disabled:opacity-50"
                  >
                    <Zap size={13} />
                    <span>DEPLOY PANELS</span>
                  </button>
                  <button
                    onClick={() => handleSendCommand('STOW_SOLAR_PANELS')}
                    disabled={isExecuting}
                    className="flex items-center justify-center space-x-1.5 bg-gray-800/80 hover:bg-gray-800 border border-gray-700 text-gray-300 py-2 px-2.5 rounded text-xs font-mono tracking-wider transition-colors disabled:opacity-50"
                  >
                    <RotateCcw size={13} />
                    <span>STOW PANELS</span>
                  </button>
                </div>
              </div>

              {/* Propulsion & Orbit */}
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1.5">
                  2. PROPULSION & ORBIT DELTA-V
                </span>
                <button
                  onClick={() => handleSendCommand('COLD_GAS_THRUST')}
                  disabled={isExecuting}
                  className="w-full flex items-center justify-center space-x-2 bg-[#FFB000]/15 hover:bg-[#FFB000]/25 border border-[#FFB000]/40 text-[#FFB000] py-2 px-3 rounded text-xs font-mono font-bold tracking-wider transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(255,176,0,0.1)]"
                >
                  <Flame size={14} />
                  <span>FIRE COLD-GAS THRUST (+0.08 km/s)</span>
                </button>
              </div>

              {/* Guidance & ADCS */}
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1.5">
                  3. ADCS & ATTITUDE
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSendCommand('ADCS_DETUMBLE')}
                    disabled={isExecuting}
                    className="flex items-center justify-center space-x-1 bg-[#00FF66]/15 hover:bg-[#00FF66]/25 border border-[#00FF66]/40 text-[#00FF66] py-2 px-1 rounded text-[11px] font-mono tracking-wider transition-colors disabled:opacity-50"
                  >
                    <Compass size={12} />
                    <span>DETUMBLE</span>
                  </button>
                  <button
                    onClick={() => handleSendCommand('POINT_NADIR')}
                    disabled={isExecuting}
                    className="flex items-center justify-center space-x-1 bg-gray-800/80 hover:bg-gray-800 border border-gray-700 text-gray-300 py-2 px-1 rounded text-[11px] font-mono tracking-wider transition-colors disabled:opacity-50"
                  >
                    <span>PT NADIR</span>
                  </button>
                  <button
                    onClick={() => handleSendCommand('POINT_SUN')}
                    disabled={isExecuting}
                    className="flex items-center justify-center space-x-1 bg-gray-800/80 hover:bg-gray-800 border border-gray-700 text-gray-300 py-2 px-1 rounded text-[11px] font-mono tracking-wider transition-colors disabled:opacity-50"
                  >
                    <span>PT SUN</span>
                  </button>
                </div>
              </div>

              {/* Science & Comms */}
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1.5">
                  4. PAYLOAD & COMMUNICATIONS
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSendCommand('EXECUTE_PAYLOAD_CAPTURE')}
                    disabled={isExecuting}
                    className="flex items-center justify-center space-x-1.5 bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] py-2 px-2 rounded text-xs font-mono tracking-wider transition-colors disabled:opacity-50"
                  >
                    <Camera size={13} />
                    <span>CAPTURE DATA</span>
                  </button>
                  <button
                    onClick={() => handleSendCommand('START_DATA_DOWNLINK')}
                    disabled={isExecuting}
                    className="flex items-center justify-center space-x-1.5 bg-[#00FF66]/15 hover:bg-[#00FF66]/25 border border-[#00FF66]/40 text-[#00FF66] py-2 px-2 rounded text-xs font-mono tracking-wider transition-colors disabled:opacity-50"
                  >
                    <DownloadCloud size={13} />
                    <span>DOWNLINK</span>
                  </button>
                </div>
              </div>

              {/* Safe Mode & Thermal */}
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1.5">
                  5. EMERGENCY & THERMAL
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSendCommand(sat.status === 'SAFE_MODE' ? 'RESUME_NORMAL_OPS' : 'ENTER_SAFE_MODE')}
                    disabled={isExecuting}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded text-xs font-mono font-bold tracking-wider transition-colors disabled:opacity-50 border ${
                      sat.status === 'SAFE_MODE'
                        ? 'bg-[#00FF66]/20 border-[#00FF66]/50 text-[#00FF66]'
                        : 'bg-[#FF2A2A]/15 border-[#FF2A2A]/40 text-[#FF2A2A] hover:bg-[#FF2A2A]/25'
                    }`}
                  >
                    {sat.status === 'SAFE_MODE' ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                    <span>{sat.status === 'SAFE_MODE' ? 'RESUME OPS' : 'SAFE MODE'}</span>
                  </button>
                  <button
                    onClick={() => handleSendCommand('CYCLE_HEATERS')}
                    disabled={isExecuting}
                    className="flex items-center justify-center space-x-1.5 bg-gray-800/80 hover:bg-gray-800 border border-gray-700 text-gray-300 py-2 px-2 rounded text-xs font-mono tracking-wider transition-colors disabled:opacity-50"
                  >
                    <Thermometer size={13} />
                    <span>HEATERS ON</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Interactive Uplink Terminal & Command History Log */}
          <div className="bg-[#050810] border border-gray-800 rounded-lg p-3 flex flex-col h-[280px]">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2 text-xs font-mono">
              <span className="text-gray-400 flex items-center">
                <Terminal size={14} className="mr-1.5 text-[#00F0FF]" /> CUBESAT TELECOMMAND UPLINK STREAM
              </span>
              <span className="text-[10px] text-[#00FF66] bg-[#00FF66]/10 px-1.5 py-0.2 rounded font-bold">
                ONLINE (14.2ms)
              </span>
            </div>

            {/* Scrollable Command Stream */}
            <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-2 pr-1 custom-scrollbar">
              {(!sat.commandHistory || sat.commandHistory.length === 0) ? (
                <div className="text-gray-600 text-center py-8">
                  AWAITING TELECOMMAND DISPATCH...
                </div>
              ) : (
                sat.commandHistory.map((item, idx) => (
                  <div key={idx} className="bg-[#0A0F1F] border border-gray-800/80 rounded p-2 text-gray-300">
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
                      <span className="text-[#00F0FF] font-bold">SEQ#{item.seq} [{item.command}]</span>
                      <span>{new Date(item.timestamp).toLocaleTimeString()} UTC</span>
                    </div>
                    <div className="text-gray-400 text-[10.5px] leading-relaxed">
                      {item.response}
                    </div>
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>

            {/* Interactive CLI Input */}
            <form onSubmit={handleCliSubmit} className="mt-2 pt-2 border-t border-gray-800 flex items-center space-x-2">
              <span className="text-[#00F0FF] font-mono text-xs font-bold shrink-0">CMD&gt;</span>
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                placeholder="Type command (e.g. THRUST, DETUMBLE, PING)..."
                className="flex-1 bg-[#0A0F1F] border border-gray-800 rounded px-2.5 py-1 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]"
              />
              <button
                type="submit"
                disabled={isExecuting || !cliInput.trim()}
                className="bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 border border-[#00F0FF]/50 text-[#00F0FF] px-3 py-1 rounded text-xs font-mono tracking-wider transition-colors disabled:opacity-40"
              >
                UPLINK
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
