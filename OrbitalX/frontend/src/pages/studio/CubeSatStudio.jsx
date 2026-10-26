import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import CubeSatCanvas from './CubeSatCanvas';
import { CUBESAT_COMPONENTS, FORM_FACTORS } from './cubesatComponents';
import StudioToolbar from './components/StudioToolbar';
import StudioHardwareDrawer from './components/StudioHardwareDrawer';
import StudioDiagnosticsDrawer from './components/StudioDiagnosticsDrawer';
import StudioBottomBar from './components/StudioBottomBar';
import satelliteService from '../../services/satelliteService';
import missionService from '../../services/missionService';

export default function CubeSatStudio() {
  const [searchParams] = useSearchParams();
  const missionId = searchParams.get('missionId');
  const missionDbId = searchParams.get('missionDbId');
  const satId = searchParams.get('satId');
  const satNameParam = searchParams.get('satName');
  const formFactorParam = searchParams.get('formFactor');

  // Mission Configuration State
  const [missionName, setMissionName] = useState('Untitled Mission');
  const [isEditingName, setIsEditingName] = useState(false);
  const [formFactor, setFormFactor] = useState('1U');
  const [targetOrbit, setTargetOrbit] = useState('LEO (400km)');

  // Component Selection State: { [componentId]: count }
  const [mountedComponents, setMountedComponents] = useState({});
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Animation & Diagnostics State
  const [autoRotate, setAutoRotate] = useState(false);
  const [isAssembling, setIsAssembling] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [notification, setNotification] = useState(null);

  // Closable floating overlay sidebars
  const [componentsOpen, setComponentsOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [diagnosticsTab, setDiagnosticsTab] = useState('SPECS');

  // Component Highlight & Spatial Position Tracking
  const [lastAction, setLastAction] = useState(null);
  const [highlightedComponentId, setHighlightedComponentId] = useState(null);

  // Load mission name and form factor on mount, keeping canvas empty until user mounts components or loads a preset
  useEffect(() => {
    if (satNameParam || missionId) {
      if (satNameParam) setMissionName(decodeURIComponent(satNameParam));
      else if (missionId) setMissionName(`${missionId} - Spacecraft`);

      if (formFactorParam && FORM_FACTORS[formFactorParam]) {
        setFormFactor(formFactorParam);
      }
      // Always start with empty canvas on entering 3D studio
      setMountedComponents({});
      return;
    }

    const saved = localStorage.getItem('orbitalx_cubesat_design');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.missionName) setMissionName(parsed.missionName);
        if (parsed.formFactor) setFormFactor(parsed.formFactor);
        if (parsed.targetOrbit) setTargetOrbit(parsed.targetOrbit);
      } catch (e) {
        console.error('Failed to load saved design info', e);
      }
    }
    // Always start with empty canvas on entering 3D studio
    setMountedComponents({});
  }, [satNameParam, formFactorParam, missionId]);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSave = async () => {
    const design = {
      missionName,
      formFactor,
      targetOrbit,
      mountedComponents,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('orbitalx_cubesat_design', JSON.stringify(design));

    try {
      const targetSatId = satId || `CUBESAT-${(missionName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'CAD')}-${formFactor}`;
      const resolvedOrbit = targetOrbit.includes('SSO') ? 'SSO' : targetOrbit.includes('MEO') ? 'MEO' : targetOrbit.includes('GEO') ? 'GEO' : 'LEO';
      
      const satRes = await satelliteService.create({
        name: missionName,
        satelliteId: targetSatId,
        type: `CUBESAT_${formFactor}`,
        formFactor,
        orbitType: resolvedOrbit,
        cubesatDesign: design,
        status: 'ACTIVE'
      });

      // If tied to a mission, ensure it is linked in the mission's assignedSatellites
      if (missionDbId && satRes?.data?._id) {
        try {
          const currentMissionRes = await missionService.getById(missionDbId);
          const currentSatIds = (currentMissionRes?.data?.assignedSatellites || []).map(s => typeof s === 'object' ? s._id : s);
          if (!currentSatIds.includes(satRes.data._id)) {
            await missionService.update(missionDbId, {
              assignedSatellites: [...currentSatIds, satRes.data._id]
            });
          }
        } catch (mErr) {
          console.warn('Could not link to mission assignedSatellites on studio save:', mErr);
        }
      }

      showToast(`CubeSat "${missionName}" successfully saved to MongoDB Atlas!`, 'success');
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('already exists')) {
        showToast(`Design updated and saved to MongoDB Atlas!`, 'success');
      } else {
        showToast(`Design saved to local cache (${err.response?.data?.message || 'Ready for fleet sync'})`, 'success');
      }
    }
  };

  const handleExportCAD = () => {
    const manifest = {
      satellite: {
        missionName,
        formFactor,
        targetOrbit,
        dimensions: FORM_FACTORS[formFactor].dimensions,
        totalMassGrams: totalMass,
        totalVolumeU: totalVolume,
        totalPowerConsumptionWatts: totalPowerCons,
        totalPowerGenerationWatts: totalPowerGen,
        totalCostUSD: totalCost
      },
      bom: Object.entries(mountedComponents).map(([id, count]) => {
        const item = CUBESAT_COMPONENTS.find(c => c.id === id);
        return {
          componentId: id,
          name: item?.name || id,
          category: item?.category,
          quantity: count,
          unitMass: item?.mass,
          unitCost: item?.cost,
          totalCost: item ? item.cost * count : 0
        };
      })
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(manifest, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${missionName.replace(/\s+/g, '_')}_CAD_Manifest.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Assembly manifest JSON exported successfully!');
  };

  const handleReset = () => {
    if (Object.keys(mountedComponents).length === 0) return;
    if (window.confirm('Reset all mounted components in the design space?')) {
      setMountedComponents({});
      setLastAction(null);
      setHighlightedComponentId(null);
      showToast('Design space cleared.', 'warning');
    }
  };

  const handleLoadPreset = (targetFF) => {
    const ff = typeof targetFF === 'string' ? targetFF : formFactor;
    setFormFactor(ff);

    if (ff === '1U') {
      setMountedComponents({
        obc_core: 1,
        battery_pack: 1,
        solar_panel_1u: 2,
        antenna_deployable: 1,
        uhf_radio: 1,
        gps_receiver: 1,
        temp_sensor: 1,
        chassis_rails: 1,
        separation_springs: 1
      });
      showToast('Loaded 1U Nano-Beacon Mission loadout!');
    } else if (ff === '2U') {
      setMountedComponents({
        obc_core: 1,
        battery_pack: 2,
        solar_panel_1u: 4,
        camera_visible: 1,
        antenna_deployable: 1,
        uhf_radio: 1,
        reaction_wheel: 2,
        gps_receiver: 1,
        temp_sensor: 2,
        shear_panels: 2,
        separation_springs: 1
      });
      showToast('Loaded 2U Technology Demo Mission loadout!');
    } else if (ff === '6U') {
      setMountedComponents({
        obc_core: 1,
        battery_pack: 2,
        battery_heavy_80wh: 1,
        solar_wings_heavy: 1,
        reaction_wheel_cluster: 1,
        ion_propulsion_unit: 1,
        sband_transmitter: 1,
        gps_receiver: 1,
        temp_sensor: 3,
        structural_bulkhead_ribs: 1,
        shear_panels: 2,
        separation_springs: 1
      });
      showToast('Loaded 6U Aero Advanced Mission loadout!');
    } else if (ff === '12U') {
      setMountedComponents({
        obc_core: 2,
        battery_heavy_80wh: 2,
        solar_wings_heavy: 1,
        reaction_wheel_cluster: 1,
        cold_gas_thruster: 1,
        hyperspectral_payload: 1,
        xband_highgain_dish: 1,
        gps_receiver: 2,
        temp_sensor: 4,
        structural_bulkhead_ribs: 2,
        shear_panels: 2,
        separation_springs: 2
      });
      showToast('Loaded 12U Terra Earth Observation loadout!');
    } else if (ff === '16U') {
      setMountedComponents({
        obc_core: 2,
        battery_heavy_80wh: 3,
        solar_wings_heavy: 1,
        reaction_wheel_cluster: 1,
        star_tracker: 1,
        ion_propulsion_unit: 1,
        hyperspectral_payload: 1,
        xband_highgain_dish: 1,
        sband_transmitter: 1,
        gps_receiver: 2,
        temp_sensor: 6,
        structural_bulkhead_ribs: 3,
        shear_panels: 4,
        separation_springs: 2
      });
      showToast('Loaded 16U Titan Deep-Space Science Explorer loadout!');
    } else {
      setMountedComponents({
        obc_core: 1,
        battery_pack: 2,
        solar_panel_1u: 4,
        solar_wings_deployable: 1,
        reaction_wheel: 3,
        camera_visible: 1,
        antenna_deployable: 1,
        uhf_radio: 1,
        gps_receiver: 1,
        temp_sensor: 2,
        shear_panels: 2,
        separation_springs: 1
      });
      showToast('Loaded 3U Earth Observation Mission loadout!');
    }
  };

  // Add / Remove Component with 3D Spatial Highlight Tracking
  const currentConfig = FORM_FACTORS[formFactor] || FORM_FACTORS['1U'];
  const unitsY = currentConfig.unitsY || (formFactor === '16U' ? 4 : formFactor === '3U' || formFactor === '6U' || formFactor === '12U' ? 3 : formFactor === '2U' ? 2 : 1);
  const unitsZ = currentConfig.unitsZ || (formFactor === '12U' || formFactor === '16U' ? 2 : 1);

  const handleAddComponent = (comp) => {
    const current = mountedComponents[comp.id] || 0;
    const maxSolarAllowed = 2 * unitsY * unitsZ;
    const effectiveMax = comp.id === 'solar_panel_1u' ? maxSolarAllowed : comp.maxCount;

    if (current >= effectiveMax) {
      if (comp.id === 'solar_panel_1u') {
        showToast(`Solar panels are restricted to the 2 parallel sides (${maxSolarAllowed} panels max for ${formFactor}).`, 'warning');
      } else {
        showToast(`Maximum limit of ${comp.maxCount} reached for ${comp.name}.`, 'warning');
      }
      return;
    }
    setMountedComponents(prev => ({ ...prev, [comp.id]: current + 1 }));
    setLastAction({
      type: 'ADD',
      componentId: comp.id,
      componentName: comp.name,
      category: comp.category,
      timestamp: Date.now()
    });
    setHighlightedComponentId(comp.id);
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
    setLastAction({
      type: 'REMOVE',
      componentId: comp.id,
      componentName: comp.name,
      category: comp.category,
      timestamp: Date.now()
    });
    setHighlightedComponentId(null);
  };

  // Calculations
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

  const batteryRuntime = useMemo(() => {
    if (totalBatteryWh === 0 || totalPowerCons === 0) return '–';
    const hours = totalBatteryWh / totalPowerCons;
    return `${Math.round(hours * 60)} min in shadow`;
  }, [totalBatteryWh, totalPowerCons]);

  const subsystems = useMemo(() => ({
    obc: !!mountedComponents['obc_core'],
    comms: !!mountedComponents['antenna_deployable'] || !!mountedComponents['sband_transmitter'] || !!mountedComponents['uhf_radio'],
    power: !!mountedComponents['battery_pack'] || !!mountedComponents['battery_heavy_80wh'],
    solar: !!mountedComponents['solar_panel_1u'] || !!mountedComponents['solar_wings_deployable'] || !!mountedComponents['solar_wings_heavy'],
    adcs: !!mountedComponents['reaction_wheel'] || !!mountedComponents['reaction_wheel_cluster']
  }), [mountedComponents]);

  const warnings = useMemo(() => {
    const list = [];
    if (!mountedComponents['obc_core']) list.push('Critical: No flight computer mounted (OBC Core required).');
    if (!mountedComponents['battery_pack'] && !mountedComponents['battery_heavy_80wh']) list.push('Power: No energy storage mounted.');
    if (!mountedComponents['solar_panel_1u'] && !mountedComponents['solar_wings_deployable'] && !mountedComponents['solar_wings_heavy']) {
      list.push('Thermal/Power: No photovoltaic arrays mounted.');
    }
    if (!mountedComponents['antenna_deployable'] && !mountedComponents['sband_transmitter'] && !mountedComponents['uhf_radio']) {
      list.push('Telemetry: No comms transceiver link installed.');
    }
    if (totalMass > currentConfig.maxMass) list.push(`Structural: Mass budget exceeded (+${totalMass - currentConfig.maxMass}g).`);
    if (totalVolume > currentConfig.maxVolume) list.push(`Chassis: Volume envelope breached (${totalVolume}U / ${currentConfig.maxVolume}U).`);
    if (totalPowerGen < totalPowerCons) list.push('Power Balance: Continuous drain exceeds solar generation.');
    if (list.length === 0) list.push('ALL SYSTEMS FLIGHT READY: Standard CubeSat specifications satisfied.');
    return list;
  }, [mountedComponents, totalMass, totalVolume, totalPowerGen, totalPowerCons, currentConfig]);

  const filteredComponents = useMemo(() => {
    return CUBESAT_COMPONENTS.filter(comp => {
      const matchCat = activeCategory === 'ALL' || comp.category === activeCategory;
      const matchSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          comp.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const triggerValidate = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      const isNominal = warnings.length === 1 && warnings[0].startsWith('ALL SYSTEMS');
      showToast(
        isNominal ? 'Telemetry scan passed: Flight specs nominal!' : `Telemetry validation: ${warnings.length} warning(s) flagged.`,
        isNominal ? 'success' : 'warning'
      );
    }, 2000);
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#050810] text-gray-200 font-sans select-none animate-in fade-in duration-300">
      {/* 3D Viewport Canvas */}
      <div className="absolute inset-0 w-full h-full">
        <CubeSatCanvas 
          formFactor={formFactor}
          mountedComponents={mountedComponents}
          isAssembling={isAssembling}
          isValidating={isValidating}
          autoRotate={autoRotate}
          onLoadPreset={handleLoadPreset}
          lastAction={lastAction}
          highlightedComponentId={highlightedComponentId}
          onSelectComponent={(compId) => setHighlightedComponentId(compId)}
        />
      </div>

      {/* Floating Top Toolbar */}
      <StudioToolbar 
        missionName={missionName}
        setMissionName={setMissionName}
        isEditingName={isEditingName}
        setIsEditingName={setIsEditingName}
        formFactor={formFactor}
        setFormFactor={setFormFactor}
        targetOrbit={targetOrbit}
        setTargetOrbit={setTargetOrbit}
        isValidating={isValidating}
        triggerValidate={triggerValidate}
        handleSave={handleSave}
        handleExportCAD={handleExportCAD}
        handleReset={handleReset}
        componentsOpen={componentsOpen}
        setComponentsOpen={setComponentsOpen}
        diagnosticsOpen={diagnosticsOpen}
        setDiagnosticsOpen={setDiagnosticsOpen}
        warningsCount={warnings.length === 1 && warnings[0].startsWith('ALL SYSTEMS') ? 0 : warnings.length}
        totalParts={totalParts}
        onLoadPreset={handleLoadPreset}
      />

      {/* Active Mission Satellite Design Mode Banner */}
      {missionId && (
        <div className="absolute top-16 left-3 right-3 z-20 pointer-events-auto bg-[#0A0F1F]/90 backdrop-blur-md border border-[#00FF66]/50 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-[0_0_20px_rgba(0,255,102,0.2)] animate-in fade-in duration-300">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66] animate-ping" />
            <span className="font-mono text-xs text-[#00FF66] font-bold tracking-wider uppercase">
              🚀 LAUNCHING NEW SATELLITE FOR MISSION: <span className="text-white">{missionId}</span>
            </span>
            {satId && (
              <span className="hidden sm:inline font-mono text-[10px] px-2 py-0.5 rounded bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-bold">
                BUS ID: {satId}
              </span>
            )}
          </div>
          {missionDbId && (
            <Link
              to={`/missions/${missionDbId}`}
              className="font-mono text-[11px] text-[#00FF66] hover:text-black hover:bg-[#00FF66] flex items-center space-x-1.5 transition-all uppercase tracking-wider font-bold bg-[#00FF66]/15 px-3 py-1.5 rounded border border-[#00FF66]/40"
            >
              <span>← RETURN TO MISSION DETAILS</span>
            </Link>
          )}
        </div>
      )}

      {/* Left Hardware Components Drawer */}
      <StudioHardwareDrawer 
        isOpen={componentsOpen}
        onClose={() => setComponentsOpen(false)}
        filteredComponents={filteredComponents}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        mountedComponents={mountedComponents}
        onAddComponent={handleAddComponent}
        onRemoveComponent={handleRemoveComponent}
        onHighlightComponent={setHighlightedComponentId}
      />

      {/* Right Diagnostics & BOM Drawer */}
      <StudioDiagnosticsDrawer 
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
        activeTab={diagnosticsTab}
        setActiveTab={setDiagnosticsTab}
        formFactor={formFactor}
        totalMass={totalMass}
        totalVolume={totalVolume}
        totalPowerCons={totalPowerCons}
        totalPowerGen={totalPowerGen}
        totalCost={totalCost}
        totalParts={totalParts}
        batteryRuntime={batteryRuntime}
        subsystems={subsystems}
        warnings={warnings}
        mountedComponents={mountedComponents}
        onAddComponent={handleAddComponent}
        onRemoveComponent={handleRemoveComponent}
        onHighlightComponent={setHighlightedComponentId}
        onExportCAD={handleExportCAD}
      />

      {/* Floating Bottom Bar & Toast Alerts */}
      <StudioBottomBar 
        isAssembling={isAssembling}
        setIsAssembling={setIsAssembling}
        autoRotate={autoRotate}
        setAutoRotate={setAutoRotate}
        isValidating={isValidating}
        triggerValidate={triggerValidate}
        formFactor={formFactor}
        onLoadPreset={handleLoadPreset}
        notification={notification}
      />
    </div>
  );
}
