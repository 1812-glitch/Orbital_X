import React, { useState, useMemo, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  RotateCcw, 
  Save, 
  Plus, 
  Search, 
  Play, 
  Pause, 
  X,
  Settings,
  Wrench,
  CheckCircle,
  Activity,
  ArrowLeft,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import CubeSatCanvas from './CubeSatCanvas';
import CubeSatSimulator from './CubeSatSimulator';
import { CUBESAT_COMPONENTS, COMPONENT_CATEGORIES, FORM_FACTORS } from './cubesatComponents';

export default function CubeSatStudio() {
  // Mission Configuration State
  const [missionName, setMissionName] = useState('Untitled Mission');
  const [isEditingName, setIsEditingName] = useState(false);
  const [formFactor, setFormFactor] = useState('1U');
  const [targetOrbit, setTargetOrbit] = useState('LEO (400km)');

  // Component Selection State: { [componentId]: count }
  const [mountedComponents, setMountedComponents] = useState({});
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('3D'); // '3D' | 'SIMULATE'
  
  // Animation & Diagnostics State
  const [autoRotate, setAutoRotate] = useState(false);
  const [isAssembling, setIsAssembling] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [notification, setNotification] = useState(null);

  // Closable floating overlay sidebars (Matching OrbitalViewer & CubeSatSimulator)
  const [componentsOpen, setComponentsOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [diagnosticsTab, setDiagnosticsTab] = useState('SPECS'); // 'SPECS' | 'BOM'

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('orbitalx_cubesat_design');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.missionName) setMissionName(parsed.missionName);
        if (parsed.formFactor) setFormFactor(parsed.formFactor);
        if (parsed.targetOrbit) setTargetOrbit(parsed.targetOrbit);
        if (parsed.mountedComponents) setMountedComponents(parsed.mountedComponents);
      } catch (e) {
        console.error('Failed to load saved design', e);
      }
    }
  }, []);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSave = () => {
    const design = {
      missionName,
      formFactor,
      targetOrbit,
      mountedComponents,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('orbitalx_cubesat_design', JSON.stringify(design));
    showToast(`Design "${missionName}" successfully saved to local telemetry cache!`);
  };

  const handleClear = () => {
    if (Object.values(mountedComponents).some(v => v > 0)) {
      if (window.confirm('Reset current CubeSat assembly and clear all mounted components?')) {
        setMountedComponents({});
        showToast('All components cleared from assembly.', 'info');
      }
    }
  };

  const handleNewMission = () => {
    if (window.confirm('Start a new CubeSat mission design? Any unsaved changes will be reset.')) {
      setMissionName('New Orbital Mission');
      setFormFactor('1U');
      setTargetOrbit('LEO (400km)');
      setMountedComponents({});
      showToast('Initialized new mission workspace.');
    }
  };

  // Add / Remove Component
  const handleAddComponent = (comp) => {
    const current = mountedComponents[comp.id] || 0;
    if (current >= comp.maxCount) {
      showToast(`Maximum limit of ${comp.maxCount} reached for ${comp.name}.`, 'warning');
      return;
    }
    setMountedComponents(prev => ({
      ...prev,
      [comp.id]: current + 1
    }));
  };

  const handleRemoveComponent = (comp) => {
    const current = mountedComponents[comp.id] || 0;
    if (current <= 0) return;
    setMountedComponents(prev => {
      const next = { ...prev };
      if (current === 1) delete next[comp.id];
      else next[comp.id] = current - 1;
      return next;
    });
  };

  // Calculations
  const currentConfig = FORM_FACTORS[formFactor];

  const { totalMass, totalVolume, totalPowerCons, totalPowerGen, totalCost, totalParts, totalBatteryWh } = useMemo(() => {
    let mass = 0;
    let volume = 0;
    let powerCons = 0;
    let powerGen = 0;
    let cost = 0;
    let parts = 0;
    let batteryWh = 0;

    Object.entries(mountedComponents).forEach(([id, count]) => {
      const item = CUBESAT_COMPONENTS.find(c => c.id === id);
      if (item && count > 0) {
        mass += item.mass * count;
        volume += item.volume * count;
        powerCons += item.powerCons * count;
        powerGen += item.powerGen * count;
        cost += item.cost * count;
        parts += count;
        if (item.capacityWh) batteryWh += item.capacityWh * count;
      }
    });

    return {
      totalMass: mass,
      totalVolume: parseFloat(volume.toFixed(2)),
      totalPowerCons: parseFloat(powerCons.toFixed(1)),
      totalPowerGen: parseFloat(powerGen.toFixed(1)),
      totalCost: cost,
      totalParts: parts,
      totalBatteryWh: batteryWh
    };
  }, [mountedComponents]);

  // Battery runtime in eclipse (minutes)
  const batteryRuntime = useMemo(() => {
    if (totalBatteryWh === 0 || totalPowerCons === 0) return '–';
    const hours = totalBatteryWh / totalPowerCons;
    const mins = Math.round(hours * 60);
    return `${mins} min in shadow`;
  }, [totalBatteryWh, totalPowerCons]);

  // Subsystem Status
  const subsystems = useMemo(() => {
    const hasOBC = !!mountedComponents['obc_core'];
    const hasComms = !!mountedComponents['antenna_deployable'] || !!mountedComponents['sband_transmitter'] || !!mountedComponents['uhf_radio'];
    const hasBattery = !!mountedComponents['battery_pack'];
    const hasSolar = !!mountedComponents['solar_panel_1u'];
    const hasADCS = !!mountedComponents['reaction_wheel'];

    let epsStatus = 'WARN';
    if (hasBattery && hasSolar && totalPowerGen >= totalPowerCons) epsStatus = 'OK';

    return {
      obc: hasOBC ? 'OK' : 'MISSING',
      comms: hasComms ? 'OK' : 'MISSING',
      adcs: hasADCS ? 'OK' : 'WARN',
      eps: epsStatus
    };
  }, [mountedComponents, totalPowerGen, totalPowerCons]);

  // Diagnostics & Warnings Engine
  const warnings = useMemo(() => {
    const list = [];
    if (totalParts === 0) {
      return ['No issues — design is empty.'];
    }

    if (!mountedComponents['obc_core']) {
      list.push('CRITICAL: Missing On-Board Computer (OBC). Satellite cannot execute flight software.');
    }
    if (!mountedComponents['battery_pack']) {
      list.push('WARNING: No battery pack installed. Systems will shut down during eclipse.');
    }
    if (!mountedComponents['solar_panel_1u']) {
      list.push('WARNING: No solar generation cells. Mission lifespan strictly limited by battery.');
    }
    if (totalPowerGen < totalPowerCons && totalPowerCons > 0) {
      list.push(`DEFICIT: Power consumption (${totalPowerCons}W) exceeds generation (${totalPowerGen}W).`);
    }
    if (totalMass > currentConfig.maxMass) {
      list.push(`OVERWEIGHT: Total mass (${totalMass}g) exceeds ${formFactor} limit (${currentConfig.maxMass}g).`);
    }
    if (totalVolume > currentConfig.maxVolume) {
      list.push(`OVERSIZED: Volume (${totalVolume}U) exceeds chassis envelope (${currentConfig.maxVolume}U).`);
    }
    if (!mountedComponents['antenna_deployable'] && !mountedComponents['uhf_radio'] && !mountedComponents['sband_transmitter']) {
      list.push('COMMUNICATION LOSS: No antenna or radio. No telemetry uplink available.');
    }

    if (list.length === 0) {
      list.push('ALL SYSTEMS NOMINAL: Ready for environmental thermal-vacuum testing.');
    }

    return list;
  }, [mountedComponents, totalParts, totalPowerGen, totalPowerCons, totalMass, totalVolume, currentConfig, formFactor]);

  // Filtered components library
  const filteredComponents = useMemo(() => {
    return CUBESAT_COMPONENTS.filter(comp => {
      const matchesCat = activeCategory === 'ALL' || comp.category === activeCategory;
      const matchesSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            comp.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            comp.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Assembly trigger
  const triggerAssemble = () => {
    setIsAssembling(true);
    setTimeout(() => {
      setIsAssembling(false);
      showToast('Assembly locked into primary chassis rails.', 'success');
    }, 1800);
  };

  // Validation trigger
  const triggerValidate = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      const isNominal = warnings.length === 1 && warnings[0].startsWith('ALL SYSTEMS');
      if (isNominal) {
        showToast('Telemetry scan passed: Flight specs nominal!', 'success');
      } else {
        showToast(`Telemetry validation complete: ${warnings.length} warning(s) flagged.`, 'warning');
      }
    }, 2000);
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#050810] text-gray-200 font-sans select-none animate-in fade-in duration-300">
      
      {/* 1. FULL-BLEED 3D VIEWPORT CANVAS (Occupies 100% of the screen) */}
      <div className="absolute inset-0 w-full h-full">
        {viewMode === 'SIMULATE' ? (
          <CubeSatSimulator />
        ) : (
          <CubeSatCanvas 
            formFactor={formFactor}
            mountedComponents={mountedComponents}
            isAssembling={isAssembling}
            isValidating={isValidating}
            autoRotate={autoRotate}
          />
        )}
      </div>

      {/* 2. FLOATING TOP TOOLBAR OVER CANVAS (Matching OrbitalViewer & CubeSatSimulator HUD) */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20 gap-3">
        {/* Left: Quick Nav, Mission Name, Mode, Form Factor, Orbit */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2.5 bg-[#0A0F1F]/92 backdrop-blur-md border border-gray-800 rounded-xl px-3.5 py-1.5 shadow-2xl">
          <NavLink
            to="/dashboard"
            className="flex items-center space-x-1 text-xs font-mono text-gray-400 hover:text-[#00F0FF] transition-colors pr-2 border-r border-gray-800"
            title="Exit 3D Studio"
          >
            <ArrowLeft size={13} className="text-[#00F0FF]" />
            <span className="font-bold hidden sm:inline">EXIT</span>
          </NavLink>

          {/* Editable Mission Name */}
          <div className="flex items-center space-x-2 pr-1 border-r border-gray-800">
            <Settings size={14} className="text-[#00F0FF] animate-spin-slow" />
            {isEditingName ? (
              <input 
                type="text"
                value={missionName}
                onChange={(e) => setMissionName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                autoFocus
                className="bg-[#12192b] border border-[#00F0FF] text-white px-2 py-0.5 rounded font-mono text-xs focus:outline-none"
              />
            ) : (
              <div 
                onClick={() => setIsEditingName(true)}
                className="group flex items-center space-x-1.5 cursor-pointer"
              >
                <h1 className="text-xs sm:text-sm font-bold tracking-wider text-white uppercase font-mono group-hover:text-[#00F0FF] transition-colors">
                  {missionName}
                </h1>
                <span className="text-gray-600 text-[10px] font-mono group-hover:text-gray-400">✎</span>
              </div>
            )}
          </div>

          {/* Mode Switcher: CAD Assembly vs Live Simulation */}
          <div className="flex items-center bg-[#050810] border border-gray-800 rounded p-0.5 font-mono text-xs font-bold">
            <button
              onClick={() => setViewMode('3D')}
              className={`px-2.5 py-1 rounded transition-all ${
                viewMode !== 'SIMULATE'
                  ? 'bg-[#00F0FF] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              CAD ASSEMBLY
            </button>
            <button
              id="cubesat-studio-sim-tab-btn"
              onClick={() => setViewMode('SIMULATE')}
              className={`px-2.5 py-1 rounded transition-all flex items-center space-x-1 ${
                viewMode === 'SIMULATE'
                  ? 'bg-[#00F0FF] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'text-[#00F0FF] hover:bg-[#00F0FF]/15'
              }`}
            >
              <Activity size={12} />
              <span className="hidden md:inline">LIVE SIMULATION</span>
            </button>
          </div>

          {/* Form Factor Switcher (1U, 2U, 3U) */}
          <div className="flex items-center bg-[#050810] border border-gray-800 rounded p-0.5 space-x-1 font-mono text-xs font-bold">
            {['1U', '2U', '3U'].map((ff) => (
              <button
                key={ff}
                onClick={() => setFormFactor(ff)}
                className={`px-2.5 py-1 rounded transition-all ${
                  formFactor === ff 
                    ? 'bg-[#00F0FF]/25 text-[#00F0FF] font-bold border border-[#00F0FF]/40' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {ff}
              </button>
            ))}
          </div>

          {/* Target Orbit Dropdown */}
          <div className="hidden lg:flex items-center">
            <select
              value={targetOrbit}
              onChange={(e) => setTargetOrbit(e.target.value)}
              className="bg-[#050810] border border-gray-800 text-gray-300 font-mono text-xs rounded px-2.5 py-1 focus:outline-none focus:border-[#00F0FF]/50 cursor-pointer"
            >
              <option value="LEO (400km)">LEO (400km)</option>
              <option value="MEO (20,000km)">MEO (20,000km)</option>
              <option value="GEO (35,786km)">GEO (35,786km)</option>
              <option value="SSO (Sun-Synchronous)">SSO (Sun-Sync)</option>
            </select>
          </div>

          {/* Quick Metrics Indicators */}
          <div className="hidden xl:flex items-center space-x-2 text-xs font-mono text-gray-400 pl-1 border-l border-gray-800">
            <span>Parts: <strong className="text-[#00F0FF]">{totalParts}</strong></span>
            <span>•</span>
            <span>Mass: <strong className={totalMass > currentConfig.maxMass ? 'text-red-400' : 'text-white'}>{totalMass}g</strong></span>
          </div>
        </div>

        {/* Right: Floating Controls Sidebar Toggle Buttons */}
        <div className="pointer-events-auto flex items-center space-x-2">
          {/* Toggle Components Library (Left Overlay) */}
          <button
            id="toggle-components-sidebar-btn"
            onClick={() => setComponentsOpen(!componentsOpen)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all border shadow-xl backdrop-blur-md ${
              componentsOpen
                ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                : 'bg-[#0A0F1F]/90 hover:bg-[#121C36] border-gray-700 hover:border-[#00F0FF]/50 text-gray-200'
            }`}
            title={componentsOpen ? "Hide Components Library" : "Open Hardware Components Library"}
          >
            <Plus size={14} className={componentsOpen ? 'text-[#00F0FF]' : 'text-[#00FF66]'} />
            <span>{componentsOpen ? 'HIDE COMPONENTS' : 'COMPONENTS'}</span>
            <span className="w-4 h-4 rounded-full bg-[#00F0FF] text-black text-[10px] flex items-center justify-center font-bold ml-1">
              {totalParts}
            </span>
          </button>

          {/* Toggle Diagnostics & Specs (Right Overlay) */}
          <button
            id="toggle-diagnostics-sidebar-btn"
            onClick={() => setDiagnosticsOpen(!diagnosticsOpen)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all border shadow-xl backdrop-blur-md ${
              diagnosticsOpen
                ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                : 'bg-[#0A0F1F]/90 hover:bg-[#121C36] border-gray-700 hover:border-[#00F0FF]/50 text-gray-200'
            }`}
            title={diagnosticsOpen ? "Hide Diagnostics & Specs" : "Open Diagnostics, Budget & Specs"}
          >
            <SlidersHorizontal size={14} className={diagnosticsOpen ? 'text-[#00F0FF]' : 'text-gray-400'} />
            <span>{diagnosticsOpen ? 'HIDE SPECS' : 'SPECS & BUDGET'}</span>
            {warnings.length > 0 && !warnings[0].startsWith('ALL SYSTEMS') && !warnings[0].startsWith('No issues') && (
              <span className="w-4 h-4 rounded-full bg-[#FFB000] text-black text-[10px] flex items-center justify-center font-bold ml-1">
                {warnings.length}
              </span>
            )}
          </button>

          {/* 3D Spin Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#0A0F1F]/90 hover:bg-[#121C36] border border-gray-700 hover:border-gray-600 rounded-xl text-xs font-mono text-gray-300 hover:text-white transition-all shadow-xl backdrop-blur-md hidden md:flex"
            title="Toggle 3D Model Auto-Rotation"
          >
            {autoRotate ? <Play size={13} className="text-[#00F0FF]" /> : <Pause size={13} />}
            <span>{autoRotate ? 'Spin' : 'Static'}</span>
          </button>
        </div>
      </div>

      {/* 3. CLOSABLE FLOATING LEFT SIDEBAR: HARDWARE COMPONENTS LIBRARY */}
      {componentsOpen && (
        <div className="absolute top-16 left-3 bottom-14 sm:bottom-16 w-80 sm:w-92 z-30 bg-[#0A0F1F]/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-in slide-in-from-left duration-250">
          {/* Sidebar Header & Close Button */}
          <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-[#0A0F1F]">
            <div className="flex items-center space-x-2">
              <Plus size={15} className="text-[#00FF66]" />
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                COMPONENTS ({filteredComponents.length})
              </span>
            </div>
            <button
              id="close-components-sidebar-btn"
              onClick={() => setComponentsOpen(false)}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
              title="Close Components Library"
            >
              <ChevronLeft size={17} />
            </button>
          </div>

          {/* Search & Filter Pills */}
          <div className="p-3 border-b border-gray-800/80 space-y-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2 text-gray-500" />
              <input 
                type="text"
                placeholder="Search hardware..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#050810] border border-gray-800 rounded pl-8 pr-7 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 font-mono transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-gray-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              {COMPONENT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider transition-colors ${
                    activeCategory === cat.id 
                      ? 'bg-[#00F0FF] text-[#0A0F1F] font-bold' 
                      : 'bg-[#12192b] text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Component List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {filteredComponents.length === 0 ? (
              <div className="text-center py-8 text-gray-500 font-mono text-xs">
                No matching hardware found.
              </div>
            ) : (
              filteredComponents.map(comp => {
                const count = mountedComponents[comp.id] || 0;
                const isMax = count >= comp.maxCount;

                return (
                  <div 
                    key={comp.id}
                    className={`bg-[#0B1221] border rounded-lg p-2.5 transition-all ${
                      count > 0 ? 'border-[#00F0FF]/40 shadow-sm shadow-[#00F0FF]/5' : 'border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: comp.color }}></span>
                          <h4 className="text-white text-xs font-bold font-mono tracking-tight">{comp.name}</h4>
                        </div>
                        <span className="text-gray-500 text-[9px] font-mono block mt-0.5">{comp.category}</span>
                      </div>

                      {/* Count / Limit Badge */}
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isMax ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                        count > 0 ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20' : 
                        'text-gray-500'
                      }`}>
                        {isMax ? `Max (${count}/${comp.maxCount})` : `${count}/${comp.maxCount}`}
                      </span>
                    </div>

                    {/* Specs Row */}
                    <div className="grid grid-cols-4 gap-1 font-mono text-[10px] text-gray-400 mt-2 pt-1.5 border-t border-gray-800/80">
                      <div>
                        <span className="text-gray-600 block text-[8.5px]">MASS</span>
                        <span>{comp.mass}g</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block text-[8.5px]">VOL</span>
                        <span>{comp.volume}U</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block text-[8.5px]">PWR</span>
                        <span className={comp.powerGen > 0 ? 'text-[#00FF66]' : ''}>
                          {comp.powerGen > 0 ? `+${comp.powerGen}W` : `${comp.powerCons}W`}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-600 block text-[8.5px]">COST</span>
                        <span className="text-white">${comp.cost}</span>
                      </div>
                    </div>

                    {/* Add / Remove Buttons */}
                    <div className="flex items-center space-x-1.5 mt-2">
                      <button
                        onClick={() => handleAddComponent(comp)}
                        disabled={isMax}
                        className={`flex-1 py-1 rounded font-mono text-[10px] font-bold tracking-wider uppercase transition-colors ${
                          isMax 
                            ? 'bg-gray-800/40 text-gray-600 cursor-not-allowed' 
                            : 'bg-[#12192b] hover:bg-[#00F0FF] text-gray-300 hover:text-[#0A0F1F] border border-gray-700 hover:border-[#00F0FF]'
                        }`}
                      >
                        + Add Component
                      </button>

                      {count > 0 && (
                        <button
                          onClick={() => handleRemoveComponent(comp)}
                          className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono transition-colors"
                          title="Remove one unit"
                        >
                          -
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. CLOSABLE FLOATING RIGHT SIDEBAR: MISSION BUDGET, FLIGHT SPECS & BOM */}
      {diagnosticsOpen && (
        <div className="absolute top-16 right-3 bottom-14 sm:bottom-16 w-80 sm:w-96 z-30 bg-[#0A0F1F]/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-250">
          
          {/* Header with Title, Tabs and Close Button */}
          <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-[#0A0F1F]">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal size={14} className="text-[#00F0FF]" />
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                SPECS & BUDGET
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <div className="flex items-center bg-[#050810] border border-gray-800 rounded p-0.5 text-[10px] font-mono">
                {['SPECS', 'PARTS BOM'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDiagnosticsTab(tab === 'PARTS BOM' ? 'BOM' : 'SPECS')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      (diagnosticsTab === 'BOM' && tab === 'PARTS BOM') || (diagnosticsTab === 'SPECS' && tab === 'SPECS')
                        ? 'bg-[#00F0FF]/25 text-[#00F0FF] font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <button
                id="close-diagnostics-sidebar-btn"
                onClick={() => setDiagnosticsOpen(false)}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors ml-1"
                title="Close sidebar"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {diagnosticsTab === 'SPECS' ? (
              <>
                {/* Budget Progress Bars */}
                <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-3 space-y-2.5">
                  {/* Mass */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-gray-300 font-bold">Mass</span>
                      <span className="text-white">{totalMass}g / {currentConfig.maxMass}g</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          totalMass > currentConfig.maxMass ? 'bg-red-500' :
                          totalMass > currentConfig.maxMass * 0.85 ? 'bg-[#FFB000]' : 'bg-[#00F0FF]'
                        }`}
                        style={{ width: `${Math.min(100, (totalMass / currentConfig.maxMass) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Volume */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-gray-300 font-bold">Volume</span>
                      <span className="text-white">{totalVolume.toFixed(2)}U / {currentConfig.maxVolume.toFixed(1)}U</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          totalVolume > currentConfig.maxVolume ? 'bg-red-500' :
                          totalVolume > currentConfig.maxVolume * 0.85 ? 'bg-[#FFB000]' : 'bg-[#00F0FF]'
                        }`}
                        style={{ width: `${Math.min(100, (totalVolume / currentConfig.maxVolume) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Power */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-gray-300 font-bold">Power</span>
                      <span className="text-white">{totalPowerCons}W / {Math.max(totalPowerGen, 4)}W</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          totalPowerCons > totalPowerGen && totalPowerCons > 0 ? 'bg-red-500' : 'bg-[#00FF66]'
                        }`}
                        style={{ width: `${Math.min(100, (totalPowerCons / Math.max(totalPowerGen, 4)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Thermal */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-gray-300 font-bold">Thermal</span>
                      <span className="text-white">{totalPowerCons}W / {currentConfig.maxThermal}W</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#00F0FF] h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (totalPowerCons / currentConfig.maxThermal) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Stats Block */}
                <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-3 space-y-2 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Cost</span>
                    <span className="text-white font-bold">${totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Battery Runtime</span>
                    <span className="text-white font-bold">{batteryRuntime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Mounted Parts</span>
                    <span className="text-[#00F0FF] font-bold">{totalParts} units</span>
                  </div>
                </div>

                {/* Subsystem Health Status */}
                <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-3">
                  <h3 className="text-gray-400 font-mono text-[10px] tracking-widest uppercase mb-2">
                    SUBSYSTEM READINESS
                  </h3>
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
                    <div className="bg-[#050810] p-1.5 rounded border border-gray-800">
                      <span className="text-gray-400 text-[10px] block">COMMS</span>
                      <span className={`text-[10px] font-bold ${
                        subsystems.comms === 'OK' ? 'text-[#00FF66]' : 'text-red-400'
                      }`}>
                        {subsystems.comms}
                      </span>
                    </div>
                    <div className="bg-[#050810] p-1.5 rounded border border-gray-800">
                      <span className="text-gray-400 text-[10px] block">ADCS</span>
                      <span className={`text-[10px] font-bold ${
                        subsystems.adcs === 'OK' ? 'text-[#00FF66]' : 'text-[#FFB000]'
                      }`}>
                        {subsystems.adcs}
                      </span>
                    </div>
                    <div className="bg-[#050810] p-1.5 rounded border border-gray-800">
                      <span className="text-gray-400 text-[10px] block">EPS</span>
                      <span className={`text-[10px] font-bold ${
                        subsystems.eps === 'OK' ? 'text-[#00FF66]' : 'text-[#FFB000]'
                      }`}>
                        {subsystems.eps}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Warnings & Diagnostics Feed */}
                <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-3">
                  <h3 className="text-gray-400 font-mono text-[10px] tracking-widest uppercase mb-2 flex items-center justify-between">
                    <span>FLIGHT DIAGNOSTICS</span>
                    <span className="text-[10px] text-gray-500">
                      {totalParts === 0 || warnings[0].startsWith('ALL SYSTEMS') ? 'NOMINAL' : `${warnings.length} FLAGGED`}
                    </span>
                  </h3>
                  <div className="space-y-1.5">
                    {warnings.map((warn, i) => {
                      const isCrit = warn.startsWith('CRITICAL') || warn.startsWith('DEFICIT');
                      const isNominal = warn.startsWith('ALL SYSTEMS') || warn.startsWith('No issues');

                      return (
                        <div 
                          key={i}
                          className={`p-2 rounded text-xs font-mono flex items-start space-x-1.5 border ${
                            isCrit 
                              ? 'bg-red-500/10 text-red-300 border-red-500/30' 
                              : isNominal 
                              ? 'bg-[#00FF66]/5 text-[#00FF66] border-[#00FF66]/20'
                              : 'bg-[#FFB000]/10 text-yellow-300 border-[#FFB000]/30'
                          }`}
                        >
                          <span className="shrink-0">{isCrit ? '⚠' : isNominal ? '✓' : '•'}</span>
                          <span className="leading-tight text-[10.5px]">{warn}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              /* PARTS BOM VIEW */
              <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-3">
                <h3 className="font-mono text-xs tracking-widest text-white uppercase mb-3 pb-1 border-b border-gray-800 flex justify-between items-center">
                  <span>BILL OF MATERIALS</span>
                  <span className="text-[#00F0FF]">{totalParts} items</span>
                </h3>

                {totalParts === 0 ? (
                  <div className="text-center py-8 text-gray-500 font-mono text-xs">
                    No components mounted.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(mountedComponents).map(([id, qty]) => {
                      const item = CUBESAT_COMPONENTS.find(c => c.id === id);
                      if (!item) return null;

                      return (
                        <div key={id} className="bg-[#050810] border border-gray-800/80 rounded p-2 text-xs font-mono flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                              <strong className="text-white">{item.name}</strong>
                              <span className="text-[#00F0FF] font-bold">x{qty}</span>
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {item.mass * qty}g • {item.powerGen > 0 ? `+${item.powerGen * qty}W` : `${item.powerCons * qty}W`} • ${item.cost * qty}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveComponent(item)}
                            className="text-red-400 hover:text-red-300 text-[10px] uppercase border border-red-500/30 px-2 py-0.5 rounded hover:bg-red-500/10 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. FLOATING BOTTOM ACTION DOCK (ASSEMBLE, VALIDATE, SAVE, CLEAR, NEW MISSION) */}
      <div className="absolute bottom-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto z-20 pointer-events-auto bg-[#0A0F1F]/92 backdrop-blur-md border border-gray-800 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between sm:justify-center gap-3 text-xs font-mono shadow-2xl">
        <button
          onClick={triggerAssemble}
          disabled={isAssembling || totalParts === 0}
          className="bg-[#00F0FF] hover:bg-[#82E6E6] text-[#0A0F1F] font-bold px-4 py-1.5 rounded text-xs font-mono tracking-wider uppercase flex items-center space-x-1.5 transition-colors disabled:opacity-40 shadow-lg shadow-[#00F0FF]/10"
        >
          <Wrench size={13} />
          <span>{isAssembling ? 'ASSEMBLING...' : 'ASSEMBLE'}</span>
        </button>

        <button
          onClick={triggerValidate}
          disabled={isValidating || totalParts === 0}
          className="bg-[#12192b] hover:bg-white/10 text-white border border-gray-700 hover:border-[#00F0FF] font-bold px-4 py-1.5 rounded text-xs font-mono tracking-wider uppercase flex items-center space-x-1.5 transition-colors disabled:opacity-40"
        >
          <CheckCircle size={13} className="text-[#00FF66]" />
          <span>{isValidating ? 'VALIDATING...' : 'VALIDATE'}</span>
        </button>

        <div className="hidden sm:block text-gray-700">|</div>

        <button
          onClick={handleSave}
          className="bg-[#00FF66]/20 hover:bg-[#00FF66]/30 border border-[#00FF66]/50 text-[#00FF66] px-3 py-1.5 rounded font-bold flex items-center space-x-1.5 transition-colors"
          title="Save design to local telemetry storage"
        >
          <Save size={13} />
          <span>SAVE</span>
        </button>

        <button
          onClick={handleClear}
          className="text-gray-400 hover:text-white px-2.5 py-1.5 rounded flex items-center space-x-1 transition-colors hover:bg-gray-800/60"
          title="Clear all components"
        >
          <RotateCcw size={13} />
          <span>CLEAR</span>
        </button>

        <button
          onClick={handleNewMission}
          className="text-gray-400 hover:text-[#00F0FF] px-2.5 py-1.5 rounded flex items-center space-x-1 transition-colors hover:bg-gray-800/60 hidden sm:flex"
          title="Initialize new mission workspace"
        >
          <Plus size={13} />
          <span>NEW</span>
        </button>

        <div className="hidden md:block text-gray-700">|</div>
        <div className="hidden md:flex items-center space-x-1 text-gray-500 text-[11px]">
          <span>Chassis:</span>
          <span className="text-gray-300 font-semibold">{currentConfig.dimensions}</span>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {notification && (
        <div className={`fixed bottom-16 right-6 z-50 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl font-mono text-xs flex items-center space-x-3 animate-in slide-in-from-bottom-2 ${
          notification.type === 'warning' ? 'bg-[#FFB000]/10 border-[#FFB000] text-yellow-300' :
          notification.type === 'info' ? 'bg-[#00F0FF]/10 border-[#00F0FF] text-[#00F0FF]' :
          'bg-[#00FF66]/10 border-[#00FF66] text-[#00FF66]'
        }`}>
          <span>{notification.type === 'warning' ? '⚠' : '✓'}</span>
          <span>{notification.msg}</span>
        </div>
      )}

    </div>
  );
}
