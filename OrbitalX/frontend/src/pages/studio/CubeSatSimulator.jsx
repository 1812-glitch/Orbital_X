import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Camera, 
  DownloadCloud, 
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import CubeSatSimulationCanvas from './CubeSatSimulationCanvas';
import CubeSatGlobeView from './CubeSatGlobeView';
import cubesatSimService from '../../services/cubesatSimService';
import { groundStationService } from '../../services/groundStationService';
import { CUBESAT_FLEET } from './utils/cubesatFleetData';
import SimToolbar from './components/SimToolbar';
import SimTelemetryDrawer from './components/SimTelemetryDrawer';
import SimCommandConsole from './components/SimCommandConsole';
import SimBottomBar from './components/SimBottomBar';

export { CUBESAT_FLEET };

export default function CubeSatSimulator() {
  const [selectedSatId, setSelectedSatId] = useState('CUBESAT-ION');
  const [simState, setSimState] = useState(null);
  const [, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [cliInput, setCliInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [viewportMode, setViewportMode] = useState('EARTH_ORBIT'); // 'EARTH_ORBIT' | 'CLOSEUP'
  const [groundStations, setGroundStations] = useState([]);
  const [warpSpeed, setWarpSpeed] = useState(15);
  
  // Cold-gas thrust burst cycle: 'READY' | 'FIRING' | 'COOLDOWN'
  const [burstCycle, setBurstCycle] = useState('READY');
  const [burstCountdown, setBurstCountdown] = useState(0);

  // Solar panels deployment cycle: null | 'DEPLOYING' | 'STOWING'
  const [panelTransit, setPanelTransit] = useState(null);
  const [panelCountdown, setPanelCountdown] = useState(0);
  const panelIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (panelIntervalRef.current) clearInterval(panelIntervalRef.current);
    };
  }, []);

  // Collapsible overlay sidebars
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

  // Handle Cold-Gas Cloud Burst Cycle: fires for 2.8s, cools down for 1.4s
  const triggerColdGasBurst = () => {
    if (burstCycle !== 'READY') return;

    setBurstCycle('FIRING');
    setBurstCountdown(2.8);

    setSimState((prev) => prev ? {
      ...prev,
      speed: parseFloat((prev.speed + 0.08).toFixed(3)),
      altitude: parseFloat((prev.altitude + 3.8).toFixed(1)),
      propellant: Math.max(0, parseFloat((prev.propellant - 2.4).toFixed(1))),
      status: 'THRUSTER_BURN'
    } : prev);

    const burstStart = Date.now();
    const burstTimer = setInterval(() => {
      const elapsedSec = (Date.now() - burstStart) / 1000;
      const remaining = Math.max(0, 2.8 - elapsedSec);
      setBurstCountdown(parseFloat(remaining.toFixed(1)));

      if (elapsedSec >= 2.8) {
        clearInterval(burstTimer);
        setBurstCycle('COOLDOWN');
        setSimState((prev) => prev ? { ...prev, status: 'NOMINAL' } : prev);

        setTimeout(() => {
          setBurstCycle('READY');
          setBurstCountdown(0);
        }, 1400);
      }
    }, 100);
  };

  const handleSendCommand = async (commandName, params = {}) => {
    const cmdUpper = commandName.toUpperCase();

    // 1. Cold-Gas Thruster Cloud Burst
    if (['COLD_GAS_THRUST', 'ORBITAL_BOOST', 'THRUST', 'BURST', 'CLOUD_BURST'].includes(cmdUpper)) {
      if (burstCycle !== 'READY') return;
      triggerColdGasBurst();
    } 
    // 2. Solar Panels Deploy & Stow
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

  const defaultSat = CUBESAT_FLEET.find(f => f.satelliteId === selectedSatId) || CUBESAT_FLEET[1];
  const sat = simState || defaultSat;
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
      
      {/* 1. FULL-BLEED 3D SIMULATION VIEWPORT CANVAS */}
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
      <SimToolbar
        viewportMode={viewportMode}
        setViewportMode={setViewportMode}
        selectedSatId={selectedSatId}
        setSelectedSatId={setSelectedSatId}
        metricsOpen={metricsOpen}
        setMetricsOpen={setMetricsOpen}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        autoRotate={autoRotate}
        setAutoRotate={setAutoRotate}
        getStatusBadge={getStatusBadge}
        sat={sat}
      />

      {/* 3. CLOSABLE FLOATING METRICS & SUBSYSTEMS HUD */}
      <SimTelemetryDrawer
        metricsOpen={metricsOpen}
        setMetricsOpen={setMetricsOpen}
        sat={sat}
        panelTransit={panelTransit}
        panelCountdown={panelCountdown}
      />

      {/* 4. CLOSABLE FLOATING TELECOMMAND DECK */}
      <SimCommandConsole
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarTab={sidebarTab}
        setSidebarTab={setSidebarTab}
        sat={sat}
        panelTransit={panelTransit}
        panelCountdown={panelCountdown}
        burstCycle={burstCycle}
        burstCountdown={burstCountdown}
        handleSendCommand={handleSendCommand}
        isExecuting={isExecuting}
        cliInput={cliInput}
        setCliInput={setCliInput}
        handleCliSubmit={handleCliSubmit}
        terminalEndRef={terminalEndRef}
      />

      {/* 5. FLOATING BOTTOM FLIGHT TELEMETRY HUD */}
      <SimBottomBar sat={sat} />

    </div>
  );
}
