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
  HardDrive,
  Globe2,
  Box,
  PanelRightClose,
  PanelRightOpen,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  RefreshCw,
  LayoutDashboard,
  ArrowLeft
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import CubeSatSimulationCanvas from './CubeSatSimulationCanvas';
import CubeSatGlobeView from './CubeSatGlobeView';
import cubesatSimService from '../../services/cubesatSimService';
import { groundStationService } from '../../services/groundStationService';

export default function CubeSatSimulator() {
  const [selectedSatId, setSelectedSatId] = useState('CUBESAT-ION');
  const [simState, setSimState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [cliInput, setCliInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [viewportMode, setViewportMode] = useState('EARTH_ORBIT'); // 'EARTH_ORBIT' | 'CLOSEUP'
  const [groundStations, setGroundStations] = useState([]);
  const [warpSpeed, setWarpSpeed] = useState(15);
  
  // Cold-gas thrust burst cycle: 'READY' | 'FIRING' | 'COOLDOWN'
  const [burstCycle, setBurstCycle] = useState('READY');
  const [burstCountdown, setBurstCountdown] = useState(0);

  // Solar panels deployment cycle: null | 'DEPLOYING' | 'STOWING' (8-10 seconds realistic actuation duration)
  const [panelTransit, setPanelTransit] = useState(null);
  const [panelCountdown, setPanelCountdown] = useState(0);
  const panelIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (panelIntervalRef.current) clearInterval(panelIntervalRef.current);
    };
  }, []);

  // Collapsible overlay sidebars (User Request: make all windows closable sidebars over full-bleed canvas)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('ALL'); // 'ALL' | 'CMDS' | 'CLI'
  const [metricsOpen, setMetricsOpen] = useState(false);

  const terminalEndRef = useRef(null);

  // Load ground stations once on mount
  useEffect(() => {
    const fetchGroundStations = async () => {
      try {
        const res = await groundStationService.getAllGroundStations();
        setGroundStations(res.data || []);
      } catch (err) {
        console.error('Failed to load ground stations in simulator', err);
      }
    };
    fetchGroundStations();
  }, []);

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

  // Auto-scroll terminal log without scrolling parent windows
  useEffect(() => {
    if (terminalEndRef.current && terminalEndRef.current.parentElement) {
      terminalEndRef.current.parentElement.scrollTop = terminalEndRef.current.parentElement.scrollHeight;
    }
  }, [simState?.commandHistory]);

  // Handle Cold-Gas Cloud Burst Cycle: fires for 2.8s, stops, cools down for 1.4s, then ready to use again!
  const triggerColdGasBurst = () => {
    if (burstCycle !== 'READY') return;

    setBurstCycle('FIRING');
    setBurstCountdown(2.8);

    // Optimistic speed boost and propellant consumption
    setSimState((prev) => prev ? {
      ...prev,
      speed: parseFloat((prev.speed + 0.08).toFixed(3)),
      altitude: parseFloat((prev.altitude + 3.8).toFixed(1)),
      propellant: Math.max(0, parseFloat((prev.propellant - 2.4).toFixed(1))),
      status: 'THRUSTER_BURN'
    } : prev);

    // Countdown interval for burst duration
    const burstStart = Date.now();
    const burstTimer = setInterval(() => {
      const elapsedSec = (Date.now() - burstStart) / 1000;
      const remaining = Math.max(0, 2.8 - elapsedSec);
      setBurstCountdown(parseFloat(remaining.toFixed(1)));

      if (elapsedSec >= 2.8) {
        clearInterval(burstTimer);
        // Cut off burst: orange clouds stop billowing!
        setBurstCycle('COOLDOWN');
        setSimState((prev) => prev ? { ...prev, status: 'NOMINAL' } : prev);

        // Cooldown timer (1.4 seconds) before thruster is fully ready to use again
        setTimeout(() => {
          setBurstCycle('READY');
          setBurstCountdown(0);
        }, 1400);
      }
    }, 100);
  };

  const handleSendCommand = async (commandName, params = {}) => {
    const cmdUpper = commandName.toUpperCase();

    // 1. Special handling for Cold-Gas Thruster Cloud Burst
    if (['COLD_GAS_THRUST', 'ORBITAL_BOOST', 'THRUST', 'BURST', 'CLOUD_BURST'].includes(cmdUpper)) {
      if (burstCycle !== 'READY') return;
      triggerColdGasBurst();
    } 
    // 2. Solar Panels Deploy & Stow (8-10s realistic actuation time)
    else if (['DEPLOY_SOLAR_PANELS', 'DEPLOY_PANELS', 'DEPLOY'].includes(cmdUpper)) {
      if (panelTransit) return;
      setSimState((prev) => prev ? { ...prev, solarPanelsDeployed: true } : prev);
      setPanelTransit('DEPLOYING');
      setPanelCountdown(9);
      if (panelIntervalRef.current) clearInterval(panelIntervalRef.current);
      let count = 9;
      panelIntervalRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(panelIntervalRef.current);
          panelIntervalRef.current = null;
          setPanelTransit(null);
          setPanelCountdown(0);
        } else {
          setPanelCountdown(count);
        }
      }, 1000);
    } else if (['STOW_SOLAR_PANELS', 'STOW_PANELS', 'RETRACT_SOLAR_PANELS', 'STOW'].includes(cmdUpper)) {
      if (panelTransit) return;
      setSimState((prev) => prev ? { ...prev, solarPanelsDeployed: false } : prev);
      setPanelTransit('STOWING');
      setPanelCountdown(9);
      if (panelIntervalRef.current) clearInterval(panelIntervalRef.current);
      let count = 9;
      panelIntervalRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(panelIntervalRef.current);
          panelIntervalRef.current = null;
          setPanelTransit(null);
          setPanelCountdown(0);
        } else {
          setPanelCountdown(count);
        }
      }, 1000);
    } 
    // 3. Thermal Heaters Toggle
    else if (['CYCLE_HEATERS', 'HEATERS_ON', 'TOGGLE_HEATERS', 'HEATERS', 'HEATER'].includes(cmdUpper)) {
      setSimState((prev) => {
        if (!prev) return prev;
        const nextHeater = !prev.heaterActive;
        return {
          ...prev,
          heaterActive: nextHeater,
          temperature: {
            ...prev.temperature,
            bus: parseFloat((prev.temperature.bus + (nextHeater ? 5.8 : -4.1)).toFixed(1)),
            battery: parseFloat((prev.temperature.battery + (nextHeater ? 4.2 : -3.2)).toFixed(1))
          }
        };
      });
    }

    if (isExecuting) return;
    setIsExecuting(true);

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
    heaterActive: false,
    attitude: { roll: 0.5, pitch: -1.1, yaw: 14.2, spinRate: 0.03, mode: 'NADIR' },
    groundStation: 'Toulouse Center (GS-003)',
    signalStrength: -78,
    snr: 15.4,
    packetsDownlinked: 5410,
    commandHistory: []
  };

  const isThrustActive = burstCycle === 'FIRING';

  const getStatusBadge = (st) => {
    if (burstCycle === 'FIRING') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#FF6600]/25 text-[#FF8800] border border-[#FF6600]/70 animate-pulse shadow-[0_0_12px_rgba(255,102,0,0.3)]">
          <Flame size={13} className="mr-1.5 text-[#FF6600]" />
          COLD-GAS CLOUD BURST FIRING ({burstCountdown}s)
        </span>
      );
    }
    if (burstCycle === 'COOLDOWN') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/50">
          <RefreshCw size={12} className="mr-1.5 animate-spin" />
          THRUSTER RECHARGING...
        </span>
      );
    }

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
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#FF6600]/25 text-[#FF8800] border border-[#FF6600]/60 animate-pulse">
            <Flame size={12} className="mr-1.5 text-[#FF6600]" />
            COLD-GAS THRUST FIRING
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
    <div className="w-full h-full relative overflow-hidden bg-[#050810] select-none animate-in fade-in duration-300">
      
      {/* 1. FULL-BLEED 3D SIMULATION VIEWPORT CANVAS (Fills 100% of the screen) */}
      <div className="absolute inset-0 w-full h-full">
        {viewportMode === 'EARTH_ORBIT' ? (
          <CubeSatGlobeView
            satellite={sat}
            status={sat.status}
            solarPanelsDeployed={sat.solarPanelsDeployed}
            isThrusting={isThrustActive}
            groundStations={groundStations}
            warpSpeed={warpSpeed}
            setWarpSpeed={setWarpSpeed}
          />
        ) : (
          <CubeSatSimulationCanvas 
            formFactor={sat.formFactor}
            solarPanelsDeployed={sat.solarPanelsDeployed}
            isThrusting={isThrustActive}
            heaterActive={Boolean(sat.heaterActive)}
            speed={sat.speed}
            altitude={sat.altitude}
            status={sat.status}
            attitude={sat.attitude}
            autoRotate={autoRotate}
            showEmbeddedHud={false}
          />
        )}
      </div>

      {/* 2. FLOATING TOP TOOLBAR OVER THE CANVAS */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20 gap-3">
        {/* Left: Quick Nav, Viewport Switcher & CubeSat Target */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 bg-[#0A0F1F]/92 backdrop-blur-md border border-gray-800 rounded-xl px-3 py-1.5 shadow-2xl">
          <NavLink
            to="/dashboard"
            className="flex items-center space-x-1 text-xs font-mono text-gray-400 hover:text-[#00F0FF] transition-colors pr-2 border-r border-gray-800"
            title="Exit Simulator"
          >
            <ArrowLeft size={13} className="text-[#00F0FF]" />
            <span className="font-bold hidden sm:inline">EXIT</span>
          </NavLink>

          {/* Viewport Mode Switcher: Earth Orbit vs Close-Up */}
          <div className="flex items-center bg-[#050810] border border-gray-800 rounded p-0.5">
            <button
              id="cubesat-viewmode-earth-btn"
              onClick={() => setViewportMode('EARTH_ORBIT')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all ${
                viewportMode === 'EARTH_ORBIT'
                  ? 'bg-[#00F0FF] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe2 size={13} />
              <span className="hidden sm:inline">EARTH ORBIT</span>
            </button>
            <button
              id="cubesat-viewmode-closeup-btn"
              onClick={() => setViewportMode('CLOSEUP')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all ${
                viewportMode === 'CLOSEUP'
                  ? 'bg-[#00F0FF] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Box size={13} />
              <span className="hidden sm:inline">SPACECRAFT</span>
            </button>
          </div>

          {/* Target Switcher: 3U vs 6U */}
          <div className="flex items-center bg-[#050810] border border-gray-800 rounded p-0.5">
            <button
              onClick={() => setSelectedSatId('CUBESAT-ION')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                selectedSatId === 'CUBESAT-ION'
                  ? 'bg-[#00F0FF]/25 text-[#00F0FF] font-bold border border-[#00F0FF]/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Ion-X (3U)
            </button>
            <button
              onClick={() => setSelectedSatId('CUBESAT-AERO')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                selectedSatId === 'CUBESAT-AERO'
                  ? 'bg-[#00F0FF]/25 text-[#00F0FF] font-bold border border-[#00F0FF]/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Aero-6 (6U)
            </button>
          </div>

          {/* Status Badge */}
          <div className="hidden md:block">
            {getStatusBadge(sat.status)}
          </div>

          {/* Heater Indicator */}
          {sat.heaterActive && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FFD700]/25 text-[#FFEA00] border border-[#FFD700] shadow-[0_0_12px_rgba(255,234,0,0.3)] animate-pulse hidden lg:inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFEA00] mr-1.5 shadow-[0_0_6px_#ffea00]" />
              HEATER ON
            </span>
          )}
        </div>

        {/* Right: Floating Controls Sidebar Toggle Buttons */}
        <div className="pointer-events-auto flex items-center space-x-2">
          {/* Toggle Metrics HUD (Left Overlay) */}
          <button
            id="toggle-telemetry-metrics-btn"
            onClick={() => setMetricsOpen(!metricsOpen)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all border shadow-xl backdrop-blur-md ${
              metricsOpen
                ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                : 'bg-[#0A0F1F]/90 hover:bg-[#121C36] border-gray-700 hover:border-[#00F0FF]/50 text-gray-200'
            }`}
            title={metricsOpen ? "Hide Telemetry HUD" : "Open Telemetry & Subsystems HUD"}
          >
            <Activity size={14} className={metricsOpen ? 'text-[#00F0FF]' : 'text-[#00FF66]'} />
            <span>{metricsOpen ? 'HIDE METRICS' : 'TELEMETRY HUD'}</span>
          </button>

          {/* Toggle Command Deck Sidebar (Right Overlay) */}
          <button
            id="toggle-command-sidebar-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all border shadow-xl backdrop-blur-md ${
              sidebarOpen
                ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                : 'bg-[#0A0F1F]/90 hover:bg-[#121C36] border-gray-700 hover:border-[#00F0FF]/50 text-gray-200'
            }`}
            title={sidebarOpen ? "Hide Command Deck" : "Open Telecommands & CLI Deck"}
          >
            <SlidersHorizontal size={14} className={sidebarOpen ? 'text-[#00F0FF]' : 'text-gray-400'} />
            <span>{sidebarOpen ? 'HIDE COMMANDS' : 'COMMAND DECK'}</span>
          </button>

          {/* 3D Spin Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#0A0F1F]/90 hover:bg-[#121C36] border border-gray-700 hover:border-gray-600 rounded-xl text-xs font-mono text-gray-300 hover:text-white transition-all shadow-xl backdrop-blur-md hidden xl:flex"
            title="Toggle 3D Viewport Auto-Rotation"
          >
            {autoRotate ? <Play size={13} className="text-[#00F0FF]" /> : <Pause size={13} />}
            <span>{autoRotate ? 'Spin' : 'Static'}</span>
          </button>
        </div>
      </div>

      {/* 3. CLOSABLE FLOATING METRICS & SUBSYSTEMS HUD (LEFT SIDEBAR OVERLAY) */}
      {metricsOpen && (
        <div className="absolute top-16 left-3 bottom-14 sm:bottom-16 w-80 sm:w-92 z-30 bg-[#0A0F1F]/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-in slide-in-from-left duration-250">
          {/* Header with Title and Close Button */}
          <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-[#0A0F1F]">
            <div className="flex items-center space-x-2">
              <Activity size={15} className="text-[#00FF66]" />
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                TELEMETRY & SUBSYSTEMS
              </span>
            </div>
            <button
              id="close-metrics-panel-btn"
              onClick={() => setMetricsOpen(false)}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
              title="Close Telemetry HUD"
            >
              <ChevronLeft size={17} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {/* Metric 1: Orbital Speed */}
            <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-3 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between text-gray-400 mb-1.5">
                <span className="text-xs font-mono tracking-widest uppercase flex items-center">
                  <Gauge size={14} className="mr-1.5 text-[#00F0FF]" /> ORBITAL SPEED
                </span>
                <span className="text-[10px] font-mono text-[#00FF66] bg-[#00FF66]/10 px-1.5 py-0.5 rounded">
                  LEO REGIME
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold font-mono text-white tracking-tight">
                  {sat.speed}
                </span>
                <span className="text-xs font-mono text-gray-400">km/s</span>
                <span className="text-[10px] font-mono text-gray-500 ml-1">({(sat.speed * 3600).toFixed(0)} km/h)</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-gray-400 border-t border-gray-800/80 pt-1.5">
                <span>Altitude: <strong className="text-white">{sat.altitude} km</strong></span>
                <span>Period: <strong className="text-[#00F0FF]">94.8 min</strong></span>
              </div>
            </div>

            {/* Metric 2: Core Temperature */}
            <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-3 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between text-gray-400 mb-1.5">
                <span className="text-xs font-mono tracking-widest uppercase flex items-center">
                  <Thermometer size={14} className="mr-1.5 text-[#FFB000]" /> CORE TEMPERATURE
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  sat.heaterActive ? 'text-[#FFEA00] bg-[#FFD700]/20 border border-[#FFD700]/50' : 'text-gray-400 bg-gray-800/60'
                }`}>
                  {sat.heaterActive ? 'HEATER ACTIVE' : 'NOMINAL'}
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className={`text-2xl font-bold font-mono tracking-tight ${sat.heaterActive ? 'text-[#FFEA00]' : 'text-white'}`}>
                  {sat.temperature?.bus >= 0 ? `+${sat.temperature?.bus}` : sat.temperature?.bus}°C
                </span>
                <span className="text-xs font-mono text-gray-500">BUS CORE</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] font-mono text-gray-400 border-t border-gray-800/80 pt-1.5">
                <div>SOL: <span className="text-[#FFB000] font-bold">+{sat.temperature?.solar}°C</span></div>
                <div>BAT: <span className="text-white font-bold">+{sat.temperature?.battery}°C</span></div>
                <div>RF: <span className="text-[#00F0FF] font-bold">+{sat.temperature?.radio}°C</span></div>
              </div>
            </div>

            {/* Metric 3: Processing & Load */}
            <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-3 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between text-gray-400 mb-1.5">
                <span className="text-xs font-mono tracking-widest uppercase flex items-center">
                  <Cpu size={14} className="mr-1.5 text-[#00FF66]" /> PROCESSING & LOAD
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  POWER: <strong className="text-white">{sat.load?.busPower}W</strong>
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className={`text-2xl font-bold font-mono tracking-tight ${
                  sat.load?.cpu > 80 ? 'text-[#FF2A2A]' : sat.load?.cpu > 50 ? 'text-[#FFB000]' : 'text-white'
                }`}>
                  {sat.load?.cpu}%
                </span>
                <span className="text-xs font-mono text-gray-500">CPU LOAD</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-gray-400 border-t border-gray-800/80 pt-1.5">
                <span>RAM: <strong className="text-white">{sat.load?.memory}%</strong></span>
                <span>Bus: <strong className="text-[#00FF66]">{sat.load?.busPower} W</strong></span>
              </div>
            </div>

            {/* Metric 4: Battery & Power Flow */}
            <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-3 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between text-gray-400 mb-1.5">
                <span className="text-xs font-mono tracking-widest uppercase flex items-center">
                  <BatteryCharging size={14} className="mr-1.5 text-[#00F0FF]" /> BATTERY & POWER
                </span>
                <span className={`text-[10px] font-mono font-bold ${
                  panelTransit === 'DEPLOYING' ? 'text-[#00F0FF] animate-pulse' :
                  panelTransit === 'STOWING' ? 'text-[#FFB000] animate-pulse' :
                  sat.solarPanelsDeployed ? 'text-[#00FF66]' : 'text-[#FFB000]'
                }`}>
                  {panelTransit === 'DEPLOYING' ? `DEPLOYING (${panelCountdown}s)` :
                   panelTransit === 'STOWING' ? `STOWING (${panelCountdown}s)` :
                   sat.solarPanelsDeployed ? 'WINGS DEPLOYED' : 'WINGS STOWED'}
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold font-mono text-white tracking-tight">
                  {sat.battery}%
                </span>
                <span className="text-xs font-mono text-[#00FF66]">+32W CHARGING</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-gray-400 border-t border-gray-800/80 pt-1.5">
                <span>Propellant: <strong className="text-white">{sat.propellant}%</strong></span>
                <span>Link: <strong className="text-[#00F0FF]">{sat.snr} dB</strong></span>
              </div>
            </div>

            {/* Quick Subsystems Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="bg-[#0B1221] border border-gray-800 rounded p-2">
                <span className="text-gray-500 text-[9px] block">ADCS STATUS</span>
                <span className="text-white font-bold flex items-center mt-0.5 text-[11px]">
                  <Compass size={12} className="mr-1 text-[#00F0FF]" />
                  {sat.attitude?.spinRate < 0.05 ? 'LOCKED' : 'TUMBLING'}
                </span>
              </div>

              <div className="bg-[#0B1221] border border-gray-800 rounded p-2">
                <span className="text-gray-500 text-[9px] block">PAYLOAD BUFF</span>
                <span className="text-white font-bold flex items-center mt-0.5 text-[11px]">
                  <HardDrive size={12} className="mr-1 text-[#FFB000]" />
                  {sat.load?.memory}% Full
                </span>
              </div>

              <div className="bg-[#0B1221] border border-gray-800 rounded p-2">
                <span className="text-gray-500 text-[9px] block">DOWNLINKED</span>
                <span className="text-white font-bold flex items-center mt-0.5 text-[11px]">
                  <DownloadCloud size={12} className="mr-1 text-[#00FF66]" />
                  {sat.packetsDownlinked.toLocaleString()} Pkts
                </span>
              </div>

              <div className="bg-[#0B1221] border border-gray-800 rounded p-2">
                <span className="text-gray-500 text-[9px] block">PROPELLANT</span>
                <span className="text-white font-bold flex items-center mt-0.5 text-[11px]">
                  <Flame size={12} className="mr-1 text-[#FF2A2A]" />
                  {sat.propellant}% Tank
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. CLOSABLE FLOATING TELECOMMAND DECK (RIGHT SIDEBAR OVERLAY) */}
      {sidebarOpen && (
        <div className="absolute top-16 right-3 bottom-14 sm:bottom-16 w-80 sm:w-96 z-30 bg-[#0A0F1F]/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-250">
          
          {/* Sidebar Header & Tab Filter */}
          <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-[#0A0F1F]">
            <div className="flex items-center space-x-2">
              <Send size={14} className="text-[#00F0FF]" />
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                TELECOMMAND DECK
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <div className="flex items-center bg-[#050810] border border-gray-800 rounded p-0.5 text-[10px] font-mono">
                {['ALL', 'CMDS', 'CLI'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSidebarTab(tab)}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      sidebarTab === tab
                        ? 'bg-[#00F0FF]/25 text-[#00F0FF] font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <button
                id="close-command-sidebar-btn"
                onClick={() => setSidebarOpen(false)}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors ml-1"
                title="Close sidebar (expand view to full width)"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>

          {/* Scrollable Command Deck & Stream Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar flex flex-col">
            
            {/* BOX 1: DISPATCH TELECOMMANDS */}
            {(sidebarTab === 'ALL' || sidebarTab === 'CMDS') && (
              <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-3 shadow-lg">
                <h3 className="font-mono text-xs tracking-widest text-[#00F0FF] uppercase mb-2.5 flex items-center justify-between">
                  <span className="flex items-center">
                    <Send size={13} className="mr-1.5" /> DISPATCH COMMANDS
                  </span>
                  <span className="text-[10px] text-gray-500">UPLINK READY</span>
                </h3>

                <div className="space-y-3">
                  
                  {/* 1. Solar Wing Arrays */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                      <span>1. SOLAR WING ARRAYS</span>
                      <span className={
                        panelTransit === 'DEPLOYING' ? 'text-[#00F0FF] font-bold animate-pulse' :
                        panelTransit === 'STOWING' ? 'text-[#FFB000] font-bold animate-pulse' :
                        sat.solarPanelsDeployed ? 'text-[#00FF66] font-bold' : 'text-[#FFB000] font-bold'
                      }>
                        {panelTransit === 'DEPLOYING' ? `DEPLOYING (${panelCountdown}s)` :
                         panelTransit === 'STOWING' ? `STOWING (${panelCountdown}s)` :
                         sat.solarPanelsDeployed ? 'DEPLOYED' : 'STOWED'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSendCommand('DEPLOY_SOLAR_PANELS')}
                        disabled={sat.solarPanelsDeployed || panelTransit !== null}
                        className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded text-xs font-mono tracking-wider transition-all border ${
                          sat.solarPanelsDeployed
                            ? 'bg-[#00FF66]/10 border-[#00FF66]/30 text-[#00FF66] opacity-60 cursor-not-allowed'
                            : panelTransit === 'DEPLOYING'
                            ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-[#00F0FF] animate-pulse shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                            : 'bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border-[#00F0FF]/50 text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                        }`}
                        title="Unfold 3-panel origami solar array wings outward symmetrically"
                      >
                        <Zap size={13} className={panelTransit === 'DEPLOYING' ? 'animate-bounce' : ''} />
                        <span>{panelTransit === 'DEPLOYING' ? `DEPLOYING...` : sat.solarPanelsDeployed ? 'DEPLOYED' : 'DEPLOY PANELS'}</span>
                      </button>
                      <button
                        onClick={() => handleSendCommand('STOW_SOLAR_PANELS')}
                        disabled={!sat.solarPanelsDeployed || panelTransit !== null}
                        className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded text-xs font-mono tracking-wider transition-all border ${
                          !sat.solarPanelsDeployed
                            ? 'bg-[#FFB000]/10 border-[#FFB000]/30 text-[#FFB000] opacity-60 cursor-not-allowed'
                            : panelTransit === 'STOWING'
                            ? 'bg-[#FFB000]/25 border-[#FFB000] text-[#FFB000] animate-pulse shadow-[0_0_15px_rgba(255,176,0,0.4)]'
                            : 'bg-gray-800/90 hover:bg-gray-700 border-gray-700 text-gray-200'
                        }`}
                        title="Fold solar wings into parallel origami zigzag stack flush with chassis side"
                      >
                        <RotateCcw size={13} className={panelTransit === 'STOWING' ? 'animate-spin' : ''} />
                        <span>{panelTransit === 'STOWING' ? `STOWING...` : !sat.solarPanelsDeployed ? 'STOWED' : 'STOW PANELS'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Cold-Gas Thruster Cloud Burst */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                      <span>2. COLD-GAS CLOUD BURST</span>
                      <span className={burstCycle === 'FIRING' ? 'text-[#FF6600] font-bold animate-pulse' : burstCycle === 'COOLDOWN' ? 'text-amber-400' : 'text-gray-500'}>
                        {burstCycle === 'FIRING' ? `BURST (${burstCountdown}s)` : burstCycle === 'COOLDOWN' ? 'RECHARGING...' : 'READY'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleSendCommand('COLD_GAS_THRUST')}
                      disabled={burstCycle !== 'READY'}
                      className={`w-full flex items-center justify-center space-x-2 py-2 px-3 rounded text-xs font-mono font-bold tracking-wider transition-all border shadow-lg ${
                        burstCycle === 'FIRING'
                          ? 'bg-[#FF6600]/30 border-[#FF6600] text-[#FFAA00] shadow-[0_0_20px_rgba(255,102,0,0.4)] animate-pulse'
                          : burstCycle === 'COOLDOWN'
                          ? 'bg-amber-900/30 border-amber-600/50 text-amber-300 opacity-80 cursor-wait'
                          : 'bg-[#FF6600]/15 hover:bg-[#FF6600]/30 border-[#FF6600]/50 text-[#FF8800] hover:text-white shadow-[0_0_15px_rgba(255,102,0,0.15)] active:scale-[0.98]'
                      }`}
                    >
                      <Flame size={14} className={burstCycle === 'FIRING' ? 'text-[#FF6600] animate-bounce' : 'text-[#FF6600]'} />
                      <span>
                        {burstCycle === 'FIRING'
                          ? `FIRING CLOUD BURST (${burstCountdown}s)...`
                          : burstCycle === 'COOLDOWN'
                          ? 'RECHARGING NOZZLE (1.4s)...'
                          : 'FIRE COLD-GAS THRUST (+0.08 km/s)'}
                      </span>
                    </button>
                  </div>

                  {/* 3. Thermal Management & Heater */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                      <span>3. THERMAL & SAFETY</span>
                      <span className={sat.heaterActive ? 'text-[#FFEA00] font-bold' : 'text-gray-500'}>
                        {sat.heaterActive ? 'HEATER: ON (BEACON LIT)' : 'HEATER: OFF'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSendCommand('CYCLE_HEATERS')}
                        disabled={isExecuting}
                        className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded text-xs font-mono font-bold tracking-wider transition-all border ${
                          sat.heaterActive
                            ? 'bg-[#FFD700]/25 border-[#FFD700] text-[#FFEA00] shadow-[0_0_15px_rgba(255,234,0,0.35)]'
                            : 'bg-gray-800/80 hover:bg-gray-800 border-gray-700 text-gray-300 hover:text-white'
                        }`}
                      >
                        <Thermometer size={13} className={sat.heaterActive ? 'text-[#FFEA00] animate-pulse' : ''} />
                        <span>{sat.heaterActive ? 'HEATER: ON' : 'TOGGLE HEATER'}</span>
                      </button>

                      <button
                        onClick={() => handleSendCommand(sat.status === 'SAFE_MODE' ? 'RESUME_NORMAL_OPS' : 'ENTER_SAFE_MODE')}
                        disabled={isExecuting}
                        className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded text-xs font-mono font-bold tracking-wider transition-all border ${
                          sat.status === 'SAFE_MODE'
                            ? 'bg-[#00FF66]/20 border-[#00FF66]/50 text-[#00FF66]'
                            : 'bg-[#FF2A2A]/15 border-[#FF2A2A]/40 text-[#FF2A2A] hover:bg-[#FF2A2A]/25'
                        }`}
                      >
                        {sat.status === 'SAFE_MODE' ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                        <span>{sat.status === 'SAFE_MODE' ? 'RESUME OPS' : 'SAFE MODE'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. ADCS Pointing */}
                  <div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1.5">
                      4. ADCS ATTITUDE POINTING
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => handleSendCommand('ADCS_DETUMBLE')}
                        disabled={isExecuting}
                        className="flex items-center justify-center space-x-1 bg-[#00FF66]/15 hover:bg-[#00FF66]/25 border border-[#00FF66]/40 text-[#00FF66] py-1.5 px-1 rounded text-[11px] font-mono tracking-wider transition-colors disabled:opacity-50"
                      >
                        <Compass size={11} />
                        <span>DETUMBLE</span>
                      </button>
                      <button
                        onClick={() => handleSendCommand('POINT_NADIR')}
                        disabled={isExecuting}
                        className="flex items-center justify-center space-x-1 bg-gray-800/80 hover:bg-gray-800 border border-gray-700 text-gray-300 py-1.5 px-1 rounded text-[11px] font-mono tracking-wider transition-colors disabled:opacity-50"
                      >
                        <span>NADIR</span>
                      </button>
                      <button
                        onClick={() => handleSendCommand('POINT_SUN')}
                        disabled={isExecuting}
                        className="flex items-center justify-center space-x-1 bg-gray-800/80 hover:bg-gray-800 border border-gray-700 text-gray-300 py-1.5 px-1 rounded text-[11px] font-mono tracking-wider transition-colors disabled:opacity-50"
                      >
                        <span>SUN</span>
                      </button>
                    </div>
                  </div>

                  {/* 5. Payload & Comms */}
                  <div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1.5">
                      5. SCIENCE PAYLOAD & RF
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSendCommand('EXECUTE_PAYLOAD_CAPTURE')}
                        disabled={isExecuting}
                        className="flex items-center justify-center space-x-1.5 bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] py-1.5 px-2 rounded text-xs font-mono tracking-wider transition-colors disabled:opacity-50"
                      >
                        <Camera size={12} />
                        <span>CAPTURE DATA</span>
                      </button>
                      <button
                        onClick={() => handleSendCommand('START_DATA_DOWNLINK')}
                        disabled={isExecuting}
                        className="flex items-center justify-center space-x-1.5 bg-[#00FF66]/15 hover:bg-[#00FF66]/25 border border-[#00FF66]/40 text-[#00FF66] py-1.5 px-2 rounded text-xs font-mono tracking-wider transition-colors disabled:opacity-50"
                      >
                        <DownloadCloud size={12} />
                        <span>DOWNLINK</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* BOX 2: CUBESAT TELECOMMAND UPLINK STREAM & INTERACTIVE CLI */}
            {(sidebarTab === 'ALL' || sidebarTab === 'CLI') && (
              <div className="bg-[#050810] border border-gray-800 rounded-lg p-3 flex flex-col flex-1 min-h-[220px] shadow-lg">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2 text-xs font-mono">
                  <span className="text-gray-400 flex items-center">
                    <Terminal size={13} className="mr-1.5 text-[#00F0FF]" /> TELECOMMAND STREAM
                  </span>
                  <span className="text-[10px] text-[#00FF66] bg-[#00FF66]/10 px-1.5 py-0.2 rounded font-bold">
                    ONLINE
                  </span>
                </div>

                {/* Scrollable Command Stream */}
                <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-2 pr-1 custom-scrollbar min-h-[120px]">
                  {(!sat.commandHistory || sat.commandHistory.length === 0) ? (
                    <div className="text-gray-600 text-center py-6 text-xs">
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
                    placeholder="Type THRUST, HEATERS, STOW..."
                    className="flex-1 bg-[#0A0F1F] border border-gray-800 rounded px-2.5 py-1 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]"
                  />
                  <button
                    type="submit"
                    disabled={isExecuting || !cliInput.trim()}
                    className="bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 border border-[#00F0FF]/50 text-[#00F0FF] px-2.5 py-1 rounded text-xs font-mono tracking-wider transition-colors disabled:opacity-40 font-bold"
                  >
                    UPLINK
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 5. FLOATING BOTTOM FLIGHT TELEMETRY HUD */}
      <div className="absolute bottom-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto z-20 pointer-events-auto bg-[#0A0F1F]/92 backdrop-blur-md border border-gray-800 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between sm:justify-center gap-4 text-xs font-mono shadow-2xl">
        <div className="flex items-center space-x-1.5 text-[#00F0FF]">
          <Gauge size={14} />
          <span className="text-gray-400">SPEED:</span>
          <strong className="text-white text-sm">{sat.speed} km/s</strong>
        </div>
        <div className="hidden sm:block text-gray-700">|</div>
        <div>
          <span className="text-gray-500">ATTITUDE: </span>
          <span className="text-white font-semibold">
            R:{sat.attitude?.roll}° P:{sat.attitude?.pitch}° Y:{sat.attitude?.yaw}°
          </span>
        </div>
        <div className="hidden sm:block text-gray-700">|</div>
        <div>
          <span className="text-gray-500">POINTING: </span>
          <span className="text-[#00F0FF] font-semibold">{sat.attitude?.mode}</span>
        </div>
        <div className="hidden sm:block text-gray-700">|</div>
        <div>
          <span className="text-gray-500">HEATER: </span>
          <span className={sat.heaterActive ? 'text-[#FFEA00] font-bold' : 'text-gray-400'}>
            {sat.heaterActive ? 'ON (BEACON ACTIVE)' : 'OFF'}
          </span>
        </div>
        <div className="hidden sm:block text-gray-700">|</div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
          <span className="text-gray-400">GS: </span>
          <span className="text-white">{sat.groundStation}</span>
        </div>
      </div>

    </div>
  );
}
