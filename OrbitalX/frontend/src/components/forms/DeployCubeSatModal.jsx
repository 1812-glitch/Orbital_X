import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import satelliteService from '../../services/satelliteService';
import missionService from '../../services/missionService';
import { 
  X, 
  Plus, 
  Satellite, 
  Globe2, 
  Target, 
  Box, 
  CheckCircle2, 
  Layers, 
  Radio, 
  AlertCircle,
  Sparkles,
  Wrench,
  Zap,
  Rocket,
  ArrowRight,
  Cpu,
  ShieldCheck,
  Check
} from 'lucide-react';
import MissionCubeSatViewer from '../3d/MissionCubeSatViewer';

export const FORM_FACTORS = [
  { id: '1U', label: '1U Nano', desc: '10×10×10 cm • 1.33 kg' },
  { id: '2U', label: '2U Tech Demo', desc: '10×10×20 cm • 2.66 kg' },
  { id: '3U', label: '3U Standard', desc: '10×10×34 cm • 4.0 kg' },
  { id: '6U', label: '6U Aero', desc: '20×10×34 cm • 12.0 kg' },
  { id: '12U', label: '12U Terra', desc: '20×20×34 cm • 24.0 kg' },
  { id: '16U', label: '16U Titan', desc: '20×20×44 cm • 32.0 kg' },
];

export const ORBIT_OPTIONS = [
  { id: 'LEO', label: 'LEO', name: 'Low Earth Orbit (~550 km)' },
  { id: 'SSO', label: 'SSO', name: 'Sun-Synchronous (~700 km)' },
  { id: 'MEO', label: 'MEO', name: 'Medium Earth Orbit (~20,200 km)' },
  { id: 'GEO', label: 'GEO', name: 'Geostationary Orbit (~35,786 km)' },
  { id: 'POLAR', label: 'POLAR', name: 'Polar Orbit (90° Inclination)' },
  { id: 'HEO', label: 'HEO', name: 'Highly Elliptical (~40,000 km)' },
];

export const SATELLITE_PRESETS = [
  {
    id: 'PRESET-1U',
    formFactor: '1U',
    name: '1U Nano-Beacon',
    tagline: 'IoT Communications & Telemetry Beacon',
    desc: 'Compact standard bus with UHF transceiver, GPS beacon, thermal monitors, and dual body solar arrays.',
    orbitType: 'LEO',
    specs: { mass: '1.2 kg', power: '4.5 W', components: 9 },
    componentPills: ['OBC Core', '1U Battery', '2x Solar Panels', 'Deployable Antenna', 'UHF Radio', 'GPS Receiver'],
    components: {
      obc_core: 1,
      battery_pack: 1,
      solar_panel_1u: 2,
      antenna_deployable: 1,
      uhf_radio: 1,
      gps_receiver: 1,
      temp_sensor: 1,
      chassis_rails: 1,
      separation_springs: 1
    }
  },
  {
    id: 'PRESET-2U',
    formFactor: '2U',
    name: '2U Tech Demo',
    tagline: 'Reaction Wheels & High-Res Micro Imager',
    desc: 'Twin-cube avionics architecture with dual batteries, visible Earth sensor, 2-axis reaction wheels, and 4x solar arrays.',
    orbitType: 'LEO',
    specs: { mass: '2.4 kg', power: '9.2 W', components: 11 },
    componentPills: ['OBC Core', '2x Batteries', '4x Solar Panels', 'Visible Camera', '2x Reaction Wheels', 'UHF Radio'],
    components: {
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
    }
  },
  {
    id: 'PRESET-3U',
    formFactor: '3U',
    name: '3U Earth Observation',
    tagline: 'Remote Sensing Standard & 3-Axis ADCS',
    desc: 'The industry workhorse: 3-axis reaction wheels, deployable solar wings, visible multispectral optics, and UHF link.',
    orbitType: 'SSO',
    specs: { mass: '3.8 kg', power: '18.5 W', components: 13 },
    componentPills: ['OBC Core', '2x Batteries', 'Deployable Solar Wings', '3x Reaction Wheels', 'Visible Camera', 'UHF Radio'],
    components: {
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
    }
  },
  {
    id: 'PRESET-6U',
    formFactor: '6U',
    name: '6U Aero Advanced',
    tagline: 'Miniaturized Ion Drive & S-Band Downlink',
    desc: 'Heavyweight payload bus equipped with ion propulsion, 80Wh battery bus, folding solar wings, and high-throughput S-Band.',
    orbitType: 'LEO',
    specs: { mass: '11.5 kg', power: '48.0 W', components: 15 },
    componentPills: ['Ion Propulsion', '80Wh Battery', 'Heavy Solar Wings', 'Reaction Wheel Cluster', 'S-Band Transmitter', 'OBC Core'],
    components: {
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
    }
  },
  {
    id: 'PRESET-12U',
    formFactor: '12U',
    name: '12U Terra Earth Observation',
    tagline: 'Hyperspectral Imager & X-Band High-Gain Dish',
    desc: 'Deep multispectral mapping with dual redundant OBCs, 160Wh power bus, cold-gas thrusters, and Gigabit X-band dish.',
    orbitType: 'SSO',
    specs: { mass: '22.8 kg', power: '95.0 W', components: 18 },
    componentPills: ['Hyperspectral Imager', 'X-Band Dish', 'Cold-Gas Thruster', '2x 80Wh Batteries', 'Dual OBCs', 'Heavy Wings'],
    components: {
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
    }
  },
  {
    id: 'PRESET-16U',
    formFactor: '16U',
    name: '16U Titan Deep-Space Science',
    tagline: 'Autonomous Deep-Space Explorer & Star Tracker',
    desc: 'Deep space explorer with dual ion thrusters, star tracker celestial positioning, 240Wh battery system, and lunar relay comms.',
    orbitType: 'HEO',
    specs: { mass: '31.4 kg', power: '140.0 W', components: 24 },
    componentPills: ['Dual Ion Thrusters', 'Star Tracker', 'Hyperspectral Sensor', 'X-Band Dish', '3x 80Wh Batteries', 'Dual OBCs'],
    components: {
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
    }
  }
];

export default function DeployCubeSatModal({ 
  isOpen, 
  onClose, 
  onCubeSatCreated,
  initialMissionId = '',
  initialMissionObj = null,
  initialTarget = 'GLOBAL',
  lockTarget = false
}) {
  const navigate = useNavigate();

  // Workflow Choice: 'ASSEMBLE' (Assemble Themselves in 3D Studio) | 'PRESET' (Use Pre-Configured Presets)
  const [buildWorkflow, setBuildWorkflow] = useState('PRESET');
  const [selectedPresetId, setSelectedPresetId] = useState('PRESET-3U');

  // Deployment Destination: 'GLOBAL' or 'MISSION'
  const [deploymentTarget, setDeploymentTarget] = useState(initialMissionId ? 'MISSION' : initialTarget);
  const [missions, setMissions] = useState(initialMissionObj ? [initialMissionObj] : []);
  const [selectedMissionId, setSelectedMissionId] = useState(initialMissionId || '');
  const [loadingMissions, setLoadingMissions] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    satelliteId: '',
    formFactor: '3U',
    orbitType: 'LEO',
    noradId: '',
    status: 'ACTIVE'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync initial mission props when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (initialMissionId) {
      setDeploymentTarget('MISSION');
      setSelectedMissionId(initialMissionId);
    } else {
      setDeploymentTarget(initialTarget);
    }

    let isMounted = true;
    setLoadingMissions(true);
    setError(null);

    missionService.getAll()
      .then((res) => {
        if (!isMounted) return;
        const list = res?.data || [];
        setMissions(list);
        if (initialMissionId) {
          setSelectedMissionId(initialMissionId);
          const currentM = list.find(m => m._id === initialMissionId) || initialMissionObj;
          if (currentM) {
            setFormData(prev => ({
              ...prev,
              orbitType: currentM.orbitType || prev.orbitType,
              formFactor: currentM.formFactor || prev.formFactor
            }));
          }
        } else if (list.length > 0 && !selectedMissionId) {
          setSelectedMissionId(list[0]._id);
        }
      })
      .catch((err) => {
        console.error('Failed to load missions for satellite deployment:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingMissions(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialMissionId, initialTarget]);

  // When preset changes, automatically sync form factor and suggested naming
  useEffect(() => {
    if (buildWorkflow !== 'PRESET') return;
    const preset = SATELLITE_PRESETS.find(p => p.id === selectedPresetId);
    if (preset) {
      const codeSuffix = preset.formFactor;
      const cleanPrefix = (formData.name && !formData.name.startsWith('CubeSat')) 
        ? formData.name 
        : `CubeSat ${preset.name}`;
      
      setFormData(prev => ({
        ...prev,
        formFactor: preset.formFactor,
        orbitType: preset.orbitType || prev.orbitType,
        name: prev.name ? prev.name : `CubeSat ${preset.name}`,
        satelliteId: prev.satelliteId ? prev.satelliteId : `SAT-${codeSuffix}-${Date.now().toString().slice(-4)}`
      }));
    }
  }, [selectedPresetId, buildWorkflow]);

  if (!isOpen) return null;

  const handleMissionSelect = (missionId) => {
    setSelectedMissionId(missionId);
    const mission = missions.find((m) => m._id === missionId);
    if (mission) {
      setFormData((prev) => ({
        ...prev,
        orbitType: mission.orbitType || prev.orbitType,
        formFactor: mission.formFactor || prev.formFactor
      }));
    }
  };

  const handleNameChange = (val) => {
    const autoCode = 'SAT-' + (val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'CUBE') + '-' + (formData.formFactor || '3U');
    setFormData((prev) => ({
      ...prev,
      name: val,
      satelliteId: prev.satelliteId && !prev.satelliteId.startsWith('SAT-') ? prev.satelliteId : autoCode
    }));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!formData.name.trim()) {
      setError('Please provide a designation name for the satellite.');
      return;
    }

    if (deploymentTarget === 'MISSION' && !selectedMissionId) {
      setError('Please select an existing mission to assign this satellite.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedPreset = SATELLITE_PRESETS.find(p => p.id === selectedPresetId) || SATELLITE_PRESETS[2];
      const targetFormFactor = buildWorkflow === 'PRESET' ? selectedPreset.formFactor : formData.formFactor;
      const satId = formData.satelliteId.trim() || `SAT-${Date.now().toString().slice(-6)}`;
      const satName = formData.name.trim();

      // Components payload based on whether user assembled themselves or used a preset
      const cubesatDesignPayload = buildWorkflow === 'PRESET' ? {
        missionName: satName,
        formFactor: targetFormFactor,
        targetOrbit: formData.orbitType || selectedPreset.orbitType,
        presetId: selectedPreset.id,
        presetName: selectedPreset.name,
        mountedComponents: selectedPreset.components,
        savedAt: new Date().toISOString()
      } : {
        missionName: satName,
        formFactor: targetFormFactor,
        targetOrbit: formData.orbitType,
        mountedComponents: {
          obc_core: 1,
          battery_pack: 1,
          chassis_rails: 1
        },
        savedAt: new Date().toISOString()
      };

      const payload = {
        name: satName,
        satelliteId: satId,
        formFactor: targetFormFactor,
        type: `CUBESAT_${targetFormFactor}`,
        orbitType: formData.orbitType,
        noradId: formData.noradId.trim(),
        status: formData.status,
        cubesatDesign: cubesatDesignPayload
      };

      // 1. Create Satellite in MongoDB Atlas
      const satRes = await satelliteService.create(payload);
      const createdSat = satRes?.data;

      let assignedMissionObj = null;

      // 2. If assigned to an existing mission, update that mission
      if (deploymentTarget === 'MISSION' && selectedMissionId && createdSat?._id) {
        const targetMission = missions.find((m) => m._id === selectedMissionId) || initialMissionObj;
        if (targetMission) {
          assignedMissionObj = targetMission;
          const currentSatIds = (targetMission.assignedSatellites || []).map((s) => (s._id ? s._id : s));
          const updatedSatIds = Array.from(new Set([...currentSatIds, createdSat._id]));

          await missionService.update(selectedMissionId, {
            assignedSatellites: updatedSatIds
          });
        }
      }

      if (onCubeSatCreated) {
        onCubeSatCreated({
          satellite: createdSat,
          deploymentTarget,
          missionName: assignedMissionObj?.name || null,
          buildWorkflow
        });
      }

      onClose();

      // 3. IF ASSEMBLE YOURSELF WAS CHOSEN: Navigate directly into 3D CAD Studio!
      if (buildWorkflow === 'ASSEMBLE') {
        const mCode = assignedMissionObj?.missionId || '';
        const mDbId = assignedMissionObj?._id || '';
        navigate(`/studio?satId=${encodeURIComponent(satId)}&satName=${encodeURIComponent(satName)}&formFactor=${targetFormFactor}&missionId=${encodeURIComponent(mCode)}&missionDbId=${encodeURIComponent(mDbId)}`);
      }

      // Reset form state
      setFormData({
        name: '',
        satelliteId: '',
        formFactor: '3U',
        orbitType: 'LEO',
        noradId: '',
        status: 'ACTIVE'
      });
      setDeploymentTarget('GLOBAL');
    } catch (err) {
      console.error('Failed to deploy satellite:', err);
      setError(err.response?.data?.message || 'Failed to deploy satellite into MongoDB Atlas.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPresetObj = SATELLITE_PRESETS.find(p => p.id === selectedPresetId) || SATELLITE_PRESETS[2];
  const selectedMissionObj = missions.find((m) => m._id === selectedMissionId) || initialMissionObj;
  const currentPreviewFormFactor = buildWorkflow === 'PRESET' ? selectedPresetObj.formFactor : formData.formFactor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto font-mono">
      <div className="bg-[#0A0F1F] border border-gray-800 rounded-2xl w-full max-w-3xl shadow-[0_0_60px_rgba(0,0,0,0.9)] relative overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00F0FF]/10 rounded-full blur-3xl -mr-28 -mt-28 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#00FF66]/10 rounded-full blur-3xl -ml-28 -mb-28 pointer-events-none" />

        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800/80 relative z-10 bg-[#0B1221]/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#00F0FF]/20 to-[#00FF66]/15 border border-[#00F0FF]/40 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.25)]">
              <Rocket size={20} className="text-[#00F0FF]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-widest text-white uppercase flex items-center gap-2">
                Launch & Deploy Satellite
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] font-mono tracking-wider font-bold">
                  ORBITAL FLEET
                </span>
              </h2>
              <p className="text-[11px] text-gray-400 font-sans">
                {lockTarget && selectedMissionObj 
                  ? `Configuring new satellite deployment for mission "${selectedMissionObj.name}"`
                  : 'Choose satellite assembly workflow, payload configuration, and target orbit'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800/60 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 relative z-10 max-h-[82vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="bg-[#FF2A2A]/10 border border-[#FF2A2A]/50 text-[#FF4D4D] text-xs font-mono p-3.5 rounded-lg flex items-center space-x-2 animate-in fade-in duration-200">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* QUESTION: ASSEMBLE THEMSELVES OR USE PRESETS? */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-widest text-[#00F0FF] font-bold flex items-center gap-2">
                <Wrench size={14} className="text-[#00F0FF]" />
                How would you like to build this satellite?
              </label>
              <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">
                SELECT ASSEMBLY METHOD
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Choice 1: Assemble Themselves */}
              <button
                type="button"
                id="workflow-assemble-yourself-btn"
                onClick={() => setBuildWorkflow('ASSEMBLE')}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                  buildWorkflow === 'ASSEMBLE'
                    ? 'bg-gradient-to-br from-[#00F0FF]/15 via-[#00F0FF]/5 to-transparent border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.25)]'
                    : 'bg-[#0A0F1F] border-gray-800 hover:border-gray-700 text-gray-400'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2.5 rounded-lg transition-colors ${
                    buildWorkflow === 'ASSEMBLE' ? 'bg-[#00F0FF] text-[#0A0F1F]' : 'bg-gray-800 text-gray-400'
                  }`}>
                    <Wrench size={18} />
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    buildWorkflow === 'ASSEMBLE' 
                      ? 'bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/50 shadow-[0_0_10px_rgba(0,240,255,0.3)]' 
                      : 'bg-gray-800 text-gray-500'
                  }`}>
                    3D CAD STUDIO
                  </span>
                </div>
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${
                  buildWorkflow === 'ASSEMBLE' ? 'text-white' : 'text-gray-300'
                }`}>
                  Assemble Myself
                  {buildWorkflow === 'ASSEMBLE' && <Check size={14} className="text-[#00F0FF]" />}
                </h3>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                  Enter the 3D Design Studio to mount avionics, reaction wheels, cameras, thrusters, and deployable solar wings manually component-by-component.
                </p>
                <div className="mt-3 flex items-center space-x-1.5 text-[10px] font-mono text-[#00F0FF]">
                  <span>Custom CAD Assembly</span>
                  <ArrowRight size={11} />
                </div>
              </button>

              {/* Choice 2: Use Presets */}
              <button
                type="button"
                id="workflow-use-presets-btn"
                onClick={() => setBuildWorkflow('PRESET')}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                  buildWorkflow === 'PRESET'
                    ? 'bg-gradient-to-br from-[#00FF66]/15 via-[#00FF66]/5 to-transparent border-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.25)]'
                    : 'bg-[#0A0F1F] border-gray-800 hover:border-gray-700 text-gray-400'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2.5 rounded-lg transition-colors ${
                    buildWorkflow === 'PRESET' ? 'bg-[#00FF66] text-[#0A0F1F]' : 'bg-gray-800 text-gray-400'
                  }`}>
                    <Sparkles size={18} />
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    buildWorkflow === 'PRESET' 
                      ? 'bg-[#00FF66]/25 text-[#00FF66] border border-[#00FF66]/50 shadow-[0_0_10px_rgba(0,255,102,0.3)]' 
                      : 'bg-gray-800 text-gray-500'
                  }`}>
                    FLIGHT-READY PRESETS
                  </span>
                </div>
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${
                  buildWorkflow === 'PRESET' ? 'text-white' : 'text-gray-300'
                }`}>
                  Use Presets
                  {buildWorkflow === 'PRESET' && <Check size={14} className="text-[#00FF66]" />}
                </h3>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                  Choose from battle-tested, flight-ready aerospace configurations (1U Nano-Beacon, 3U Earth Observation, 6U Aero, or 16U Titan Deep-Space) and launch instantly.
                </p>
                <div className="mt-3 flex items-center space-x-1.5 text-[10px] font-mono text-[#00FF66]">
                  <span>Instant 1-Click Launch</span>
                  <Zap size={11} />
                </div>
              </button>
            </div>
          </div>

          {/* VIEW A: IF USE PRESETS IS CHOSEN */}
          {buildWorkflow === 'PRESET' && (
            <div className="space-y-4 pt-1 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-widest text-gray-300 font-semibold flex items-center gap-2">
                  <Sparkles size={14} className="text-[#00FF66]" />
                  Select Flight-Certified Preset Loadout
                </label>
                <span className="text-[10px] text-[#00FF66] font-mono">
                  {SATELLITE_PRESETS.length} Configured Models
                </span>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SATELLITE_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#00FF66]/10 border-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.2)]'
                          : 'bg-[#0A0F1F] border-gray-800 hover:border-gray-700 hover:bg-[#10172b]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            isSelected 
                              ? 'bg-[#00FF66]/20 border-[#00FF66]/60 text-[#00FF66]' 
                              : 'bg-gray-800 border-gray-700 text-gray-400'
                          }`}>
                            {preset.formFactor}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            {preset.orbitType}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white mb-0.5 tracking-tight group-hover:text-[#00FF66] transition-colors">
                          {preset.name}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-sans line-clamp-2 mb-2 leading-relaxed">
                          {preset.tagline}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px] font-mono text-gray-400">
                        <span>Mass: <strong className="text-white">{preset.specs.mass}</strong></span>
                        <span>Power: <strong className="text-[#00F0FF]">{preset.specs.power}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Preset Hardware Breakdown */}
              <div className="p-4 rounded-xl bg-[#0B1221] border border-[#00FF66]/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-[#00FF66]/20 border border-[#00FF66]/40 text-[#00FF66] font-mono font-bold text-xs">
                      {selectedPresetObj.formFactor} LOADOUT
                    </span>
                    <strong className="text-white text-xs font-mono">{selectedPresetObj.name}</strong>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">
                    {selectedPresetObj.specs.components} Avionics & Sensor Modules Pre-Mounted
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selectedPresetObj.componentPills.map((pill, idx) => (
                    <span 
                      key={idx} 
                      className="px-2 py-1 rounded bg-[#050810] border border-gray-800 text-[10.5px] font-mono text-gray-300 flex items-center space-x-1"
                    >
                      <CheckCircle2 size={11} className="text-[#00FF66]" />
                      <span>{pill}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW B: IF ASSEMBLE THEMSELVES IS CHOSEN (FORM FACTOR CHASSIS SELECTION) */}
          {buildWorkflow === 'ASSEMBLE' && (
            <div className="space-y-4 pt-1 animate-in fade-in duration-300">
              <label className="block text-xs font-mono uppercase tracking-widest text-gray-300 font-semibold flex items-center gap-2">
                <Layers size={14} className="text-[#00F0FF]" />
                Select CubeSat Chassis Architecture
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {FORM_FACTORS.map((f) => {
                  const isSelected = formData.formFactor === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, formFactor: f.id })}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#00F0FF]/15 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                          : 'bg-[#0A0F1F] border-gray-800 hover:border-gray-700 text-gray-400'
                      }`}
                    >
                      <span className={`block font-mono font-bold text-sm mb-0.5 ${isSelected ? 'text-[#00F0FF]' : 'text-white'}`}>
                        {f.id}
                      </span>
                      <span className="text-[10px] text-gray-400 font-sans block truncate">
                        {f.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SATELLITE TELEMETRY DETAILS & DESTINATION */}
          <div className="space-y-4 pt-2 border-t border-gray-800">
            <h4 className="text-xs font-mono uppercase tracking-widest text-gray-300 font-semibold flex items-center gap-2">
              <Cpu size={14} className="text-[#00F0FF]" />
              Satellite Flight Configuration
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                  Designation Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CubeSat Orion-1"
                  className="w-full bg-[#12192b] border border-gray-800 text-white px-3.5 py-2.5 rounded-xl font-mono text-xs focus:outline-none focus:border-[#00F0FF] transition-colors"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                  Asset Identifier *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SAT-ORION-3U"
                  className="w-full bg-[#12192b] border border-gray-800 text-white px-3.5 py-2.5 rounded-xl font-mono text-xs focus:outline-none focus:border-[#00F0FF] transition-colors"
                  value={formData.satelliteId}
                  onChange={(e) => setFormData({ ...formData, satelliteId: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                  Target Trajectory Orbit
                </label>
                <select
                  value={formData.orbitType}
                  onChange={(e) => setFormData({ ...formData, orbitType: e.target.value })}
                  className="w-full bg-[#12192b] border border-gray-800 text-white px-3.5 py-2.5 rounded-xl font-mono text-xs focus:outline-none focus:border-[#00F0FF] transition-colors cursor-pointer"
                >
                  {ORBIT_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label} — {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                  NORAD Catalog ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 58241"
                  className="w-full bg-[#12192b] border border-gray-800 text-white px-3.5 py-2.5 rounded-xl font-mono text-xs focus:outline-none focus:border-[#00F0FF] transition-colors"
                  value={formData.noradId}
                  onChange={(e) => setFormData({ ...formData, noradId: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* DEPLOYMENT DESTINATION: GLOBAL FLEET VS EXISTING MISSION */}
          <div className="space-y-3 pt-2 border-t border-gray-800">
            <label className="block text-xs font-mono uppercase tracking-widest text-gray-300 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Radio size={14} className="text-[#00F0FF]" />
                Deployment Destination
              </span>
              {lockTarget && (
                <span className="text-[10px] text-[#00FF66] font-mono font-bold">
                  ASSIGNED TO {selectedMissionObj?.name || 'MISSION'}
                </span>
              )}
            </label>

            {!lockTarget && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeploymentTarget('GLOBAL')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    deploymentTarget === 'GLOBAL'
                      ? 'bg-[#00F0FF]/10 border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                      : 'bg-[#0A0F1F] border-gray-800 hover:border-gray-700 text-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 mb-1">
                    <Globe2 size={16} className={deploymentTarget === 'GLOBAL' ? 'text-[#00F0FF]' : 'text-gray-400'} />
                    <span className="font-bold text-xs uppercase text-white">Global Standalone Fleet</span>
                  </div>
                  <p className="text-[10.5px] text-gray-400 font-sans">
                    Deploy as an independent satellite into the global tracking fleet.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeploymentTarget('MISSION')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    deploymentTarget === 'MISSION'
                      ? 'bg-[#00F0FF]/10 border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                      : 'bg-[#0A0F1F] border-gray-800 hover:border-gray-700 text-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 mb-1">
                    <Target size={16} className={deploymentTarget === 'MISSION' ? 'text-[#00F0FF]' : 'text-gray-400'} />
                    <span className="font-bold text-xs uppercase text-white">Assign to Existing Mission</span>
                  </div>
                  <p className="text-[10.5px] text-gray-400 font-sans">
                    Integrate directly into an active mission program directive.
                  </p>
                </button>
              </div>
            )}

            {deploymentTarget === 'MISSION' && !lockTarget && (
              <div className="p-3.5 bg-[#12192b]/70 border border-[#00F0FF]/30 rounded-xl space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#00F0FF] font-bold">Select Target Mission Program</span>
                  <span className="text-gray-400 text-[10px]">{missions.length} Missions in MongoDB</span>
                </div>
                {missions.length === 0 ? (
                  <p className="text-xs text-amber-400">No missions found. Please initialize a mission first or deploy to Global Fleet.</p>
                ) : (
                  <select
                    value={selectedMissionId}
                    onChange={(e) => handleMissionSelect(e.target.value)}
                    className="w-full bg-[#0A0F1F] border border-gray-700 text-white px-3 py-2 rounded-lg font-mono text-xs focus:outline-none focus:border-[#00F0FF] transition-colors cursor-pointer"
                  >
                    {missions.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.missionId}) — [{m.status}] — Target: {m.orbitType || 'LEO'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* 3D VISUALIZER PREVIEW BANNER */}
          <div className="bg-[#050810] border border-gray-800/80 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-16 h-14 bg-[#0A0F1F] rounded-lg overflow-hidden border border-gray-800 relative shadow-inner">
                <MissionCubeSatViewer 
                  formFactor={currentPreviewFormFactor} 
                  className="w-full h-full"
                  autoRotate={true}
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white font-mono">
                    {currentPreviewFormFactor} Standard Spacecraft Bus
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                    buildWorkflow === 'PRESET' 
                      ? 'bg-[#00FF66]/15 border-[#00FF66]/40 text-[#00FF66]' 
                      : 'bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF]'
                  }`}>
                    {buildWorkflow === 'PRESET' ? 'PRESET LOADOUT' : 'CUSTOM CAD ASSEMBLY'}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  Orbit: <strong className="text-gray-300">{formData.orbitType}</strong> • Target:{' '}
                  <strong className="text-gray-300">
                    {deploymentTarget === 'MISSION' ? (selectedMissionObj?.name || 'Assigned Mission') : 'Global Fleet'}
                  </strong>
                </span>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center space-x-1.5 text-[10px] font-mono text-gray-400 bg-gray-900/60 px-2.5 py-1 rounded-lg border border-gray-800">
              <ShieldCheck size={12} className="text-[#00FF66]" />
              <span>FLIGHT RULES CERTIFIED</span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-mono tracking-widest uppercase text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              {buildWorkflow === 'ASSEMBLE' ? (
                <button
                  type="submit"
                  disabled={loading || (deploymentTarget === 'MISSION' && missions.length === 0)}
                  className="w-full sm:w-auto bg-[#00F0FF] hover:bg-[#82E6E6] text-[#0A0F1F] font-bold px-6 py-2.5 rounded-xl text-xs font-mono tracking-widest uppercase flex items-center justify-center space-x-2 transition-all shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_25px_rgba(0,240,255,0.55)] disabled:opacity-50 cursor-pointer"
                >
                  <Wrench size={15} />
                  <span>{loading ? 'INITIALIZING STUDIO...' : 'OPEN 3D STUDIO & ASSEMBLE →'}</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || (deploymentTarget === 'MISSION' && missions.length === 0)}
                  className="w-full sm:w-auto bg-[#00FF66] hover:bg-[#82FFB0] text-[#0A0F1F] font-bold px-6 py-2.5 rounded-xl text-xs font-mono tracking-widest uppercase flex items-center justify-center space-x-2 transition-all shadow-[0_0_20px_rgba(0,255,102,0.35)] hover:shadow-[0_0_25px_rgba(0,255,102,0.55)] disabled:opacity-50 cursor-pointer"
                >
                  <Rocket size={15} />
                  <span>{loading ? 'DEPLOYING PRESET...' : 'DEPLOY PRESET INTO ORBIT 🚀'}</span>
                </button>
              )}
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
