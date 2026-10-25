import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Flame, 
  Camera, 
  DownloadCloud, 
  RefreshCw, 
  ShieldAlert,
  Box
} from 'lucide-react';
import CubeSatSimulationCanvas from './CubeSatSimulationCanvas';
import cubesatSimService from '../../services/cubesatSimService';
import satelliteService from '../../services/satelliteService';
import { synthesizeCubeSatSim, CUBESAT_FLEET } from './utils/cubesatFleetData';
import SimToolbar from './components/SimToolbar';
import SimTelemetryDrawer from './components/SimTelemetryDrawer';
import SimCommandConsole from './components/SimCommandConsole';
import SimBottomBar from './components/SimBottomBar';
import MissionFleetSelectorModal from '../../components/common/MissionFleetSelectorModal';
import { useSatellite } from '../../context/SatelliteContext';

export { CUBESAT_FLEET };

export default function CubeSatSimulator() {
  const navigate = useNavigate();
  const { satellites: ctxSatellites = [], selectedSatellite, selectSatellite, loading: satLoading } = useSatellite() || {};
  const [localSatellites, setLocalSatellites] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSat = searchParams.get('sat') || searchParams.get('satelliteId');

  // Fallback direct load if context is empty
  useEffect(() => {
    let isMounted = true;
    if (!ctxSatellites || ctxSatellites.length === 0) {
      satelliteService.getAll()
        .then(res => {
          if (isMounted && res.data && res.data.length > 0) {
            setLocalSatellites(res.data);
          }
        })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [ctxSatellites]);

  const satellites = (ctxSatellites && ctxSatellites.length > 0) ? ctxSatellites : localSatellites;

  // Determine initial satellite ID from existing satellites in DB
  const initialSat = useMemo(() => {
    if (urlSat) {
      const match = satellites.find(s => s.satelliteId === urlSat || s._id === urlSat || s.name === urlSat);
      if (match) return match;
    }
    if (selectedSatellite) return selectedSatellite;
    return satellites[0] || null;
  }, [urlSat, satellites, selectedSatellite]);

  const [selectedSatId, setSelectedSatId] = useState(() => initialSat?.satelliteId || initialSat?._id || '');
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [simState, setSimState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [cliInput, setCliInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  
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

  // Sync selectedSatId with existing satellites in database
  useEffect(() => {
    if (satellites.length > 0) {
      const exists = satellites.some(s => s.satelliteId === selectedSatId || s._id === selectedSatId);
      if (!selectedSatId || !exists) {
        const fallback = (urlSat && satellites.find(s => s.satelliteId === urlSat || s._id === urlSat)) 
          || selectedSatellite 
          || satellites[0];
        if (fallback) {
          const targetId = fallback.satelliteId || fallback._id;
          setSelectedSatId(targetId);
          if (fallback !== selectedSatellite) {
            selectSatellite(fallback);
          }
        }
      }
    }
  }, [satellites, selectedSatellite, selectedSatId, urlSat, selectSatellite]);

  // Sync with URL query parameter
  useEffect(() => {
    const param = searchParams.get('sat') || searchParams.get('satelliteId');
    if (param && param !== selectedSatId) {
      const exists = satellites.some(s => s.satelliteId === param || s._id === param);
      if (exists) {
        setSelectedSatId(param);
      }
    }
  }, [searchParams, satellites, selectedSatId]);

  // Initial fetch and polling every 4 seconds for active satellite
  useEffect(() => {
    if (!selectedSatId) return;
    fetchCubeSatState();
    const interval = setInterval(fetchCubeSatState, 4000);
    return () => clearInterval(interval);
  }, [selectedSatId]);

  const fetchCubeSatState = async () => {
    if (!selectedSatId) return;
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

    if (isExecuting || !selectedSatId) return;
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

  // Find the matching real satellite from database
  const currentDbSat = useMemo(() => {
    return satellites.find(s => s.satelliteId === selectedSatId || s._id === selectedSatId) 
      || selectedSatellite 
      || satellites[0] 
      || null;
  }, [satellites, selectedSatId, selectedSatellite]);

  const defaultSat = useMemo(() => {
    return currentDbSat ? synthesizeCubeSatSim(currentDbSat) : null;
  }, [currentDbSat]);

  const sat = simState || defaultSat;
  const isThrustActive = burstCycle === 'FIRING';

  // Handle loading state
  if ((satLoading || loading) && !sat && satellites.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#050810] text-white p-6 select-none animate-in fade-in duration-300">
        <div className="max-w-md w-full bg-[#0A0F1F] border border-cyan-500/20 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center mx-auto text-[#00F0FF] animate-spin">
            <RefreshCw size={28} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider font-mono text-white uppercase">CONNECTING TO ACTIVE CUBESAT TELEMETRY</h2>
            <p className="text-xs text-gray-400 font-sans mt-2 leading-relaxed">
              Synchronizing active constellation state and telemetry downlinks...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where no satellites exist in fleet
  if (!satLoading && !loading && satellites.length === 0 && !sat) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#050810] text-white p-6 select-none animate-in fade-in duration-300">
        <div className="max-w-md w-full bg-[#0A0F1F] border border-gray-800 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center mx-auto text-[#00F0FF]">
            <Box size={32} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-wider font-mono text-white">NO ACTIVE CUBESATS</h2>
            <p className="text-xs text-gray-400 font-sans mt-2 leading-relaxed">
              No registered satellites or CubeSats were found in the database. Deploy a satellite to begin real-time 3D simulation.
            </p>
          </div>
          <button
            onClick={() => navigate('/satellites')}
            className="w-full py-2.5 px-4 rounded-lg bg-[#00F0FF] text-[#0A0F1F] font-mono font-bold text-xs tracking-wider hover:bg-[#00D0DF] transition-colors cursor-pointer"
          >
            VIEW SATELLITE FLEET
          </button>
        </div>
      </div>
    );
  }

  if (!sat) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#050810] text-gray-400 font-mono text-xs">
        <RefreshCw size={16} className="animate-spin text-[#00F0FF] mr-2" />
        LOADING SATELLITE TELEMETRY...
      </div>
    );
  }

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
      </div>

      {/* 2. FLOATING TOP TOOLBAR OVER THE CANVAS */}
      <SimToolbar
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
        onOpenFleetModal={() => setIsFleetModalOpen(true)}
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

      {/* 6. HIERARCHICAL MISSION & CUBESAT FLEET SELECTOR MODAL */}
      <MissionFleetSelectorModal
        isOpen={isFleetModalOpen}
        onClose={() => setIsFleetModalOpen(false)}
        selectedSatId={selectedSatId}
        onSelectSatellite={(satObj) => {
          const satId = satObj.satelliteId || satObj._id;
          setSelectedSatId(satId);
          setSimState(satObj);
          selectSatellite(satObj);
        }}
        title="CubeSat Simulator Asset Selector"
        subtitle="Select any existing spacecraft from your fleet to simulate in 3D"
        actionLabel="SIMULATE SPACECRAFT"
      />

    </div>
  );
}
