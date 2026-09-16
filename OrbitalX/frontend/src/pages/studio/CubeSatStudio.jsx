import React, { useState, useMemo, useEffect } from 'react';
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
  Activity
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
  const [viewMode, setViewMode] = useState('3D'); // '3D' | 'LIST' | 'SIMULATE'
  
  // Animation & Diagnostics State
  const [autoRotate, setAutoRotate] = useState(false);
  const [isAssembling, setIsAssembling] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [notification, setNotification] = useState(null);

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
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-[#050810] text-gray-200 font-sans select-none overflow-hidden animate-in fade-in duration-300">
      
      {/* 1. TOP HEADER TOOLBAR (Matching 3D DESIGN STUDIO.png) */}
      <header className="h-14 bg-[#0A0F1F] border-b border-gray-800 px-6 flex items-center justify-between shrink-0 z-30">
        
        {/* Left: Editable Mission Name */}
        <div className="flex items-center space-x-3">
          <Settings size={18} className="text-[#00F0FF] animate-spin-slow" />
          {isEditingName ? (
            <input 
              type="text"
              value={missionName}
              onChange={(e) => setMissionName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              autoFocus
              className="bg-[#12192b] border border-[#00F0FF] text-white px-2.5 py-1 rounded font-mono text-base focus:outline-none"
            />
          ) : (
            <div 
              onClick={() => setIsEditingName(true)}
              className="group flex items-center space-x-2 cursor-pointer"
            >
              <h1 className="text-white font-mono text-lg font-bold tracking-wider uppercase group-hover:text-[#00F0FF] transition-colors">
                {missionName}
              </h1>
              <span className="text-gray-600 text-xs font-mono group-hover:text-gray-400">✎</span>
            </div>
          )}
        </div>

        {/* Center: Mode Switcher Tab */}
        <div className="flex items-center bg-[#12192b] border border-gray-800 rounded p-0.5 font-mono text-xs font-bold">
          <button
            onClick={() => setViewMode('3D')}
            className={`px-3 py-1 rounded transition-all ${
              viewMode !== 'SIMULATE'
                ? 'bg-[#00F0FF] text-[#0A0F1F] shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            CAD Assembly
          </button>
          <button
            id="cubesat-studio-sim-tab-btn"
            onClick={() => setViewMode('SIMULATE')}
            className={`px-3.5 py-1 rounded transition-all flex items-center space-x-1.5 ${
              viewMode === 'SIMULATE'
                ? 'bg-[#00F0FF] text-[#0A0F1F] shadow-[0_0_12px_rgba(0,240,255,0.35)]'
                : 'text-[#00F0FF] hover:bg-[#00F0FF]/15'
            }`}
          >
            <Activity size={13} />
            <span>LIVE SIMULATION & COMMAND</span>
          </button>
        </div>

        {/* Center & Right Controls */}
        <div className="flex items-center space-x-6">
          
          {/* Form Factor Pills (1U, 2U, 3U) */}
          <div className="flex items-center bg-[#12192b] border border-gray-800 rounded p-0.5 space-x-1 font-mono text-xs font-bold">
            {['1U', '2U', '3U'].map((ff) => (
              <button
                key={ff}
                onClick={() => setFormFactor(ff)}
                className={`px-3 py-1 rounded transition-all ${
                  formFactor === ff 
                    ? 'bg-[#00F0FF] text-[#0A0F1F] shadow-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {ff}
              </button>
            ))}
          </div>

          {/* Target Orbit Dropdown */}
          <div className="flex items-center">
            <select
              value={targetOrbit}
              onChange={(e) => setTargetOrbit(e.target.value)}
              className="bg-[#12192b] border border-gray-800 text-gray-300 font-mono text-xs rounded px-3 py-1.5 focus:outline-none focus:border-[#00F0FF]/50 cursor-pointer"
            >
              <option value="LEO (400km)">LEO (400km)</option>
              <option value="MEO (20,000km)">MEO (20,000km)</option>
              <option value="GEO (35,786km)">GEO (35,786km)</option>
              <option value="SSO (Sun-Synchronous)">SSO (Sun-Synchronous)</option>
            </select>
          </div>

          {/* Action Buttons: Clear, Save, New Mission */}
          <div className="flex items-center space-x-2 font-mono text-xs">
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-white px-3 py-1.5 rounded flex items-center space-x-1.5 transition-colors hover:bg-gray-800/40"
              title="Clear all components"
            >
              <RotateCcw size={14} />
              <span>Clear</span>
            </button>

            <button
              onClick={handleSave}
              className="bg-[#00F0FF] hover:bg-[#82E6E6] text-[#0A0F1F] font-bold px-4 py-1.5 rounded flex items-center space-x-1.5 transition-colors shadow-lg shadow-[#00F0FF]/10"
            >
              <Save size={14} />
              <span>Save</span>
            </button>

            <button
              onClick={handleNewMission}
              className="border border-gray-700 hover:border-[#00F0FF] text-gray-300 hover:text-[#00F0FF] px-3.5 py-1.5 rounded flex items-center space-x-1.5 transition-colors"
            >
              <Plus size={14} />
              <span>New Mission</span>
            </button>
          </div>

        </div>

      </header>

      {/* 2. MAIN CONTENT: SIMULATION VIEW OR 3-COLUMN CAD WORKSPACE */}
      {viewMode === 'SIMULATE' ? (
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#050810]">
          <CubeSatSimulator />
        </div>
      ) : (
        <div className="flex-1 flex min-h-0 overflow-hidden relative">

        {/* --- LEFT COLUMN: COMPONENT LIBRARY --- */}
        <aside className="w-80 bg-[#0A0F1F] border-r border-gray-800 flex flex-col shrink-0 z-20">
          
          {/* Header & Search */}
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-white font-mono text-xs font-bold tracking-widest uppercase mb-3 flex items-center justify-between">
              <span>COMPONENTS</span>
              <span className="text-[#00F0FF] text-[10px]">{filteredComponents.length} items</span>
            </h2>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
              <input 
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#12192b] border border-gray-800 rounded pl-9 pr-8 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 font-mono transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-gray-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {COMPONENT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono tracking-wider transition-colors ${
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
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
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
                    className={`bg-[#0B1221] border rounded-lg p-3 transition-all ${
                      count > 0 ? 'border-[#00F0FF]/40 shadow-sm shadow-[#00F0FF]/5' : 'border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: comp.color }}></span>
                          <h4 className="text-white text-xs font-bold font-mono tracking-tight">{comp.name}</h4>
                        </div>
                        <span className="text-gray-500 text-[10px] font-mono block mt-0.5">{comp.category}</span>
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
                    <div className="grid grid-cols-4 gap-1 font-mono text-[10px] text-gray-400 mt-2.5 pt-2 border-t border-gray-800/80">
                      <div>
                        <span className="text-gray-600 block text-[9px]">MASS</span>
                        <span>{comp.mass}g</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block text-[9px]">VOL</span>
                        <span>{comp.volume}U</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block text-[9px]">PWR</span>
                        <span className={comp.powerGen > 0 ? 'text-[#00FF66]' : ''}>
                          {comp.powerGen > 0 ? `+${comp.powerGen}W` : `${comp.powerCons}W`}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-600 block text-[9px]">COST</span>
                        <span className="text-white">${comp.cost}</span>
                      </div>
                    </div>

                    {/* Add / Remove Buttons */}
                    <div className="flex items-center space-x-2 mt-2.5">
                      <button
                        onClick={() => handleAddComponent(comp)}
                        disabled={isMax}
                        className={`flex-1 py-1 rounded font-mono text-[10px] font-bold tracking-wider uppercase transition-colors ${
                          isMax 
                            ? 'bg-gray-800/40 text-gray-600 cursor-not-allowed' 
                            : 'bg-[#12192b] hover:bg-[#00F0FF] text-gray-300 hover:text-[#0A0F1F] border border-gray-700 hover:border-[#00F0FF]'
                        }`}
                      >
                        + Add To Chassis
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
        </aside>

        {/* --- CENTER COLUMN: 3D VIEWPORT & ACTIONS --- */}
        <main className="flex-1 flex flex-col bg-[#050810] relative min-w-0">
          
          {/* Viewport Top Header Info */}
          <div className="h-10 bg-[#0A0F1F]/60 border-b border-gray-800/80 px-6 flex items-center justify-between shrink-0 text-xs font-mono">
            <div className="text-gray-400 flex items-center space-x-3">
              <span className="text-white font-bold tracking-wider uppercase">CUBESAT DESIGN ({formFactor})</span>
              <span className="text-gray-600">•</span>
              <span className="text-[#00F0FF]">{totalParts} components mounted</span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Auto rotate toggle */}
              <button 
                onClick={() => setAutoRotate(!autoRotate)}
                className="flex items-center space-x-1.5 text-gray-400 hover:text-white transition-colors"
              >
                {autoRotate ? <Play size={12} className="text-[#00F0FF]" /> : <Pause size={12} />}
                <span>{autoRotate ? 'Rotating' : 'Paused'}</span>
              </button>

              {/* View Toggle */}
              <div className="flex items-center bg-[#12192b] border border-gray-800 rounded p-0.5">
                <button
                  onClick={() => setViewMode('3D')}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    viewMode === '3D' ? 'bg-[#00F0FF] text-[#0A0F1F]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  3D Viewport
                </button>
                <button
                  onClick={() => setViewMode('LIST')}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    viewMode === 'LIST' ? 'bg-[#00F0FF] text-[#0A0F1F]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('SIMULATE')}
                  className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all text-[#00F0FF] hover:bg-[#00F0FF]/15"
                >
                  ⚡ Live Sim
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Content Area */}
          <div className="flex-1 relative overflow-hidden">
            {viewMode === '3D' ? (
              <CubeSatCanvas 
                formFactor={formFactor}
                mountedComponents={mountedComponents}
                isAssembling={isAssembling}
                isValidating={isValidating}
                autoRotate={autoRotate}
              />
            ) : (
              /* Parts List / Bill of Materials View */
              <div className="p-6 h-full overflow-y-auto max-w-4xl mx-auto custom-scrollbar">
                <div className="bg-[#0A0F1F] border border-gray-800 rounded-lg p-5">
                  <h3 className="font-mono text-sm tracking-widest text-white uppercase mb-4 border-b border-gray-800 pb-2 flex justify-between items-center">
                    <span>BILL OF MATERIALS (BOM)</span>
                    <span className="text-[#00F0FF] font-bold">{totalParts} Total Items</span>
                  </h3>

                  {totalParts === 0 ? (
                    <div className="text-center py-12 text-gray-500 font-mono text-xs">
                      No components mounted in this assembly.
                    </div>
                  ) : (
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-500 uppercase text-[10px]">
                          <th className="pb-2">Component</th>
                          <th className="pb-2">Subsystem</th>
                          <th className="pb-2">Qty</th>
                          <th className="pb-2">Unit Mass</th>
                          <th className="pb-2">Unit Power</th>
                          <th className="pb-2">Unit Cost</th>
                          <th className="pb-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60 text-gray-300">
                        {Object.entries(mountedComponents).map(([id, qty]) => {
                          const item = CUBESAT_COMPONENTS.find(c => c.id === id);
                          if (!item) return null;

                          return (
                            <tr key={id} className="hover:bg-gray-800/20">
                              <td className="py-2.5 font-bold text-white flex items-center space-x-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                                <span>{item.name}</span>
                              </td>
                              <td className="py-2.5 text-gray-400">{item.category}</td>
                              <td className="py-2.5 text-[#00F0FF] font-bold">{qty}x</td>
                              <td className="py-2.5">{item.mass * qty}g</td>
                              <td className="py-2.5">
                                {item.powerGen > 0 ? `+${item.powerGen * qty}W` : `${item.powerCons * qty}W`}
                              </td>
                              <td className="py-2.5 text-white">${item.cost * qty}</td>
                              <td className="py-2.5 text-right">
                                <button
                                  onClick={() => handleRemoveComponent(item)}
                                  className="text-red-400 hover:text-red-300 font-mono text-[10px] uppercase border border-red-500/30 px-2 py-0.5 rounded hover:bg-red-500/10 transition-colors"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Viewport Action Buttons (Matching 3D Studio.png) */}
          <div className="h-16 bg-[#0A0F1F]/90 border-t border-gray-800/80 px-6 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center space-x-3">
              <button
                onClick={triggerAssemble}
                disabled={isAssembling || totalParts === 0}
                className="bg-[#00F0FF] hover:bg-[#82E6E6] text-[#0A0F1F] font-bold px-6 py-2 rounded text-xs font-mono tracking-widest uppercase flex items-center space-x-2 transition-colors disabled:opacity-40 shadow-lg shadow-[#00F0FF]/10"
              >
                <Wrench size={14} />
                <span>ASSEMBLE</span>
              </button>

              <button
                onClick={triggerValidate}
                disabled={isValidating || totalParts === 0}
                className="bg-[#12192b] hover:bg-white/10 text-white border border-gray-700 hover:border-[#00F0FF] font-bold px-6 py-2 rounded text-xs font-mono tracking-widest uppercase flex items-center space-x-2 transition-colors disabled:opacity-40"
              >
                <CheckCircle size={14} className="text-[#00FF66]" />
                <span>VALIDATE</span>
              </button>
            </div>

            <div className="font-mono text-xs text-gray-500 flex items-center space-x-4">
              <span>Chassis: <span className="text-gray-300">{currentConfig.dimensions}</span></span>
              <span>•</span>
              <span>Target: <span className="text-[#00F0FF]">{targetOrbit}</span></span>
            </div>
          </div>

        </main>

        {/* --- RIGHT COLUMN: MISSION BUDGET & SPECS (Matching 3D DESIGN STUDIO.png) --- */}
        <aside className="w-80 bg-[#0A0F1F] border-l border-gray-800 flex flex-col shrink-0 z-20 overflow-y-auto custom-scrollbar">
          
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-white font-mono text-xs font-bold tracking-widest uppercase mb-4 flex items-center justify-between">
              <span>MISSION BUDGET</span>
              <span className="text-gray-500 text-[10px]">{formFactor} ENVELOPE</span>
            </h2>

            {/* Mass Progress Bar */}
            <div className="mb-4">
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
              <div className="text-right text-[10px] font-mono text-gray-500 mt-1">
                {Math.round((totalMass / currentConfig.maxMass) * 100)}%
              </div>
            </div>

            {/* Volume Progress Bar */}
            <div className="mb-4">
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
              <div className="text-right text-[10px] font-mono text-gray-500 mt-1">
                {Math.round((totalVolume / currentConfig.maxVolume) * 100)}%
              </div>
            </div>

            {/* Power Progress Bar */}
            <div className="mb-4">
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
              <div className="text-right text-[10px] font-mono text-gray-500 mt-1">
                {totalPowerGen > 0 ? `Generation: +${totalPowerGen}W` : '0%'}
              </div>
            </div>

            {/* Thermal Progress Bar */}
            <div className="mb-1">
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
              <div className="text-right text-[10px] font-mono text-gray-500 mt-1">
                {Math.round((totalPowerCons / currentConfig.maxThermal) * 100)}%
              </div>
            </div>

          </div>

          {/* Quick Stats Block (Matching 3D DESIGN STUDIO.png) */}
          <div className="p-5 border-b border-gray-800 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 text-gray-400">
                <span className="w-2 h-2 rounded-full bg-[#FFB000]"></span>
                <span>Total Cost</span>
              </div>
              <span className="text-white font-bold">${totalCost.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 text-gray-400">
                <span className="w-2 h-2 rounded-full bg-[#00FF66]"></span>
                <span>Battery Runtime</span>
              </div>
              <span className="text-white font-bold">{batteryRuntime}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 text-gray-400">
                <span className="w-2 h-2 rounded-full bg-[#00F0FF]"></span>
                <span>Components</span>
              </div>
              <span className="text-white font-bold">{totalParts} parts</span>
            </div>
          </div>

          {/* Subsystem Health Status (Matching 3D Studio.png) */}
          <div className="p-5 border-b border-gray-800">
            <h3 className="text-gray-400 font-mono text-xs tracking-widest uppercase mb-3">
              Subsystem Status
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center bg-[#12192b]/50 p-2 rounded border border-gray-800/80">
                <span className="text-gray-300">COMMS</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  subsystems.comms === 'OK' ? 'text-[#00FF66] bg-[#00FF66]/10' : 'text-red-400 bg-red-500/10'
                }`}>
                  {subsystems.comms} •
                </span>
              </div>

              <div className="flex justify-between items-center bg-[#12192b]/50 p-2 rounded border border-gray-800/80">
                <span className="text-gray-300">ADCS</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  subsystems.adcs === 'OK' ? 'text-[#00FF66] bg-[#00FF66]/10' : 'text-[#FFB000] bg-[#FFB000]/10'
                }`}>
                  {subsystems.adcs} •
                </span>
              </div>

              <div className="flex justify-between items-center bg-[#12192b]/50 p-2 rounded border border-gray-800/80">
                <span className="text-gray-300">EPS</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  subsystems.eps === 'OK' ? 'text-[#00FF66] bg-[#00FF66]/10' : 'text-[#FFB000] bg-[#FFB000]/10'
                }`}>
                  {subsystems.eps} •
                </span>
              </div>
            </div>
          </div>

          {/* Warnings & Diagnostics Feed (Matching 3D DESIGN STUDIO.png) */}
          <div className="p-5 flex-1">
            <h3 className="text-gray-400 font-mono text-xs tracking-widest uppercase mb-3 flex items-center justify-between">
              <span>WARNINGS ({totalParts === 0 || warnings[0].startsWith('ALL SYSTEMS') ? 0 : warnings.length})</span>
            </h3>

            <div className="space-y-2">
              {warnings.map((warn, i) => {
                const isCrit = warn.startsWith('CRITICAL') || warn.startsWith('DEFICIT');
                const isNominal = warn.startsWith('ALL SYSTEMS') || warn.startsWith('No issues');

                return (
                  <div 
                    key={i}
                    className={`p-2.5 rounded text-xs font-mono flex items-start space-x-2 border ${
                      isCrit 
                        ? 'bg-red-500/10 text-red-300 border-red-500/30' 
                        : isNominal 
                        ? 'bg-[#00FF66]/5 text-[#00FF66] border-[#00FF66]/20'
                        : 'bg-[#FFB000]/10 text-yellow-300 border-[#FFB000]/30'
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {isCrit ? '⚠' : isNominal ? '✓' : '•'}
                    </span>
                    <span className="leading-relaxed text-[11px]">{warn}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </aside>

      </div>
      )}

      {/* Floating Notification Toast */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg border backdrop-blur-md shadow-2xl font-mono text-xs flex items-center space-x-3 animate-in slide-in-from-bottom-2 ${
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
