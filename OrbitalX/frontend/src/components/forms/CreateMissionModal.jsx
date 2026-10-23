import React, { useState, useEffect } from 'react';
import missionService from '../../services/missionService';
import satelliteService from '../../services/satelliteService';
import { X, Plus, Target, Box, Sparkles, Globe, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import MissionCubeSatViewer from '../3d/MissionCubeSatViewer';

const CUBESAT_FORM_FACTORS = [
  { id: '1U', label: '1U Nano', desc: '10×10×10 cm • 1.33 kg' },
  { id: '2U', label: '2U Tech Demo', desc: '10×10×20 cm • 2.66 kg' },
  { id: '3U', label: '3U Standard', desc: '10×10×34 cm • 4.0 kg' },
  { id: '6U', label: '6U Aero', desc: '20×10×34 cm • 12.0 kg' },
  { id: '12U', label: '12U Terra', desc: '20×20×34 cm • 24.0 kg' },
  { id: '16U', label: '16U Titan', desc: '20×20×44 cm • 32.0 kg' },
];

const ORBIT_OPTIONS = [
  { id: 'LEO', label: 'LEO', name: 'Low Earth Orbit', alt: '160 – 2,000 km' },
  { id: 'SSO', label: 'SSO', name: 'Sun-Synchronous Orbit', alt: '600 – 800 km' },
  { id: 'MEO', label: 'MEO', name: 'Medium Earth Orbit', alt: '2,000 – 35,786 km' },
  { id: 'GEO', label: 'GEO', name: 'Geostationary Orbit', alt: '35,786 km Fixed' },
  { id: 'POLAR', label: 'POLAR', name: 'Polar Orbit', alt: '90° High Inclination' },
  { id: 'HEO', label: 'HEO', name: 'Highly Elliptical', alt: 'Deep-Space Apogee' },
];

const LAUNCH_SITES = [
  { id: 'Cape Canaveral SFS, USA', name: 'Cape Canaveral Space Force Station (SLC-40 / LC-39A)', region: 'USA' },
  { id: 'Kennedy Space Center, USA', name: 'NASA Kennedy Space Center (LC-39B)', region: 'USA' },
  { id: 'Vandenberg SFB, USA', name: 'Vandenberg Space Force Base (SLC-4E)', region: 'USA' },
  { id: 'Guiana Space Centre, ESA', name: 'Guiana Space Centre (Kourou ELA-4)', region: 'French Guiana / ESA' },
  { id: 'Satish Dhawan Space Centre, ISRO', name: 'Satish Dhawan Space Centre (SDSC SHAR)', region: 'India / ISRO' },
  { id: 'Tanegashima Space Center, JAXA', name: 'Tanegashima Space Center (Yoshinobu)', region: 'Japan / JAXA' },
  { id: 'Mahia Launch Complex 1, NZ', name: 'Rocket Lab Launch Complex 1 (Mahia)', region: 'New Zealand' },
  { id: 'Baikonur Cosmodrome, KAZ', name: 'Baikonur Cosmodrome (Site 31/6)', region: 'Kazakhstan' },
  { id: 'Kodiak Pacific Spaceport, USA', name: 'Pacific Spaceport Complex (Kodiak LP-3C)', region: 'USA' },
];

export default function CreateMissionModal({ isOpen, onClose, onMissionCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    missionId: '',
    formFactor: '3U',
    orbitType: 'LEO',
    launchSite: LAUNCH_SITES[0].id,
    status: 'PLANNED',
    launchDate: '',
    objective: '',
    assignedSatellites: []
  });

  const [availableSatellites, setAvailableSatellites] = useState([]);
  const [hasSavedStudioDesign, setHasSavedStudioDesign] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    satelliteService.getAll().then((res) => {
      if (res?.data) {
        setAvailableSatellites(res.data);
      }
    }).catch(console.error);

    const saved = localStorage.getItem('orbitalx_cubesat_design');
    if (saved) {
      setHasSavedStudioDesign(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val) => {
    const autoCode = 'MSN-' + (val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'CUBESAT');
    setFormData((prev) => ({
      ...prev,
      name: val,
      missionId: prev.missionId && prev.missionId !== 'MSN-CUBESAT' && !prev.missionId.startsWith('MSN-') ? prev.missionId : autoCode
    }));
  };

  const handleAttachSavedDesign = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('orbitalx_cubesat_design') || '{}');
      if (saved.formFactor) {
        setFormData((prev) => ({
          ...prev,
          name: prev.name || saved.missionName || 'CubeSat Exploration Mission',
          formFactor: saved.formFactor,
          cubesatDesign: saved
        }));
      }
    } catch (e) {
      console.error('Failed to parse saved design', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        missionId: formData.missionId || `MSN-${Date.now().toString().slice(-6)}`,
        objective: formData.objective || `${formData.formFactor} CubeSat deployed into ${formData.orbitType} from ${formData.launchSite}.`
      };

      await missionService.create(payload);
      onMissionCreated();
      onClose();
      setFormData({
        name: '',
        missionId: '',
        formFactor: '3U',
        orbitType: 'LEO',
        launchSite: LAUNCH_SITES[0].id,
        status: 'PLANNED',
        launchDate: '',
        objective: '',
        assignedSatellites: []
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create mission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto font-mono">
      <div className="bg-[#0A0F1F] border border-gray-800 rounded-lg w-full max-w-2xl shadow-2xl relative overflow-hidden my-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#00F0FF]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-800 relative z-10">
          <div className="flex items-center space-x-3">
            <Target className="text-[#00F0FF]" size={20} />
            <div>
              <h2 className="text-lg font-bold tracking-widest text-white uppercase">Initialize CubeSat Mission</h2>
              <p className="text-[11px] text-gray-400">Configure spacecraft size, launch orbit, and spaceport</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 relative z-10 text-xs">
          {error && (
            <div className="bg-[#FF2A2A]/10 border border-[#FF2A2A]/50 text-[#FF2A2A] p-3 rounded">
              {error}
            </div>
          )}

          {/* Mission Name & Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-gray-400 uppercase tracking-widest mb-1.5 font-bold">Mission Name</label>
              <input
                type="text"
                required
                className="w-full bg-[#12192b] border border-gray-800 text-white px-3 py-2 rounded focus:outline-none focus:border-[#00F0FF]/50"
                placeholder="e.g. Starlink Hunter-1"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 uppercase tracking-widest mb-1.5 font-bold">Mission Code / ID</label>
              <input
                type="text"
                required
                className="w-full bg-[#12192b] border border-gray-800 text-white px-3 py-2 rounded focus:outline-none focus:border-[#00F0FF]/50"
                placeholder="e.g. MSN-STARLINK"
                value={formData.missionId}
                onChange={(e) => setFormData({ ...formData, missionId: e.target.value })}
              />
            </div>
          </div>

          {/* 1. CubeSat Size / Form Factor Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] text-gray-400 uppercase tracking-widest font-bold flex items-center space-x-1.5">
                <Box size={13} className="text-[#00F0FF]" />
                <span>1. Select CubeSat Size</span>
              </label>
              {hasSavedStudioDesign && (
                <button
                  type="button"
                  onClick={handleAttachSavedDesign}
                  className="text-[10px] text-[#00FF66] hover:text-white flex items-center space-x-1 bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/30 transition-all"
                >
                  <Sparkles size={11} />
                  <span>Attach Studio CAD Design</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {CUBESAT_FORM_FACTORS.map((ff) => (
                <button
                  key={ff.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, formFactor: ff.id })}
                  className={`p-2.5 rounded border text-left transition-all ${
                    formData.formFactor === ff.id
                      ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-white shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'bg-[#12192b]/60 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-xs">{ff.label}</span>
                    <span className="text-[10px] text-[#00F0FF] font-bold">{ff.id}</span>
                  </div>
                  <div className="text-[9px] text-gray-500 leading-tight">{ff.desc}</div>
                </button>
              ))}
            </div>

            {/* Interactive 3D Model Preview */}
            <div className="pt-1">
              <MissionCubeSatViewer
                formFactor={formData.formFactor}
                interactive={true}
                autoRotate={true}
                className="w-full h-40"
              />
            </div>
          </div>

          {/* 2. Target Orbit Selection */}
          <div className="space-y-2">
            <label className="block text-[11px] text-gray-400 uppercase tracking-widest font-bold flex items-center space-x-1.5">
              <Globe size={13} className="text-[#00F0FF]" />
              <span>2. Select Launch Orbit</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ORBIT_OPTIONS.map((orb) => (
                <button
                  key={orb.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, orbitType: orb.id })}
                  className={`p-2.5 rounded border text-left transition-all ${
                    formData.orbitType === orb.id
                      ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-white shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'bg-[#12192b]/60 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-xs text-white">{orb.label}</span>
                    <span className="text-[9px] text-[#00F0FF] font-bold">{orb.alt}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">{orb.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Designated Launch Site Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-[11px] text-gray-400 uppercase tracking-widest font-bold flex items-center space-x-1.5">
              <MapPin size={13} className="text-[#00F0FF]" />
              <span>3. Select Launch Site (Spaceport)</span>
            </label>
            <select
              value={formData.launchSite}
              onChange={(e) => setFormData({ ...formData, launchSite: e.target.value })}
              className="w-full bg-[#12192b] border border-gray-800 text-white px-3 py-2.5 rounded text-xs focus:outline-none focus:border-[#00F0FF]/60 cursor-pointer"
            >
              {LAUNCH_SITES.map((site) => (
                <option key={site.id} value={site.id} className="bg-[#0A0F1F] text-white py-1">
                  {site.name} — [{site.region}]
                </option>
              ))}
            </select>
          </div>

          {/* Optional Advanced Settings Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] text-gray-500 hover:text-[#00F0FF] flex items-center space-x-1 transition-colors"
            >
              <span>Additional Carrier & Target Parameters (Optional)</span>
              {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3 bg-[#12192b]/40 rounded border border-gray-800/80 space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Target Launch Date</label>
                    <input
                      type="date"
                      className="w-full bg-[#12192b] border border-gray-800 text-white px-2.5 py-1.5 rounded text-xs focus:outline-none focus:border-[#00F0FF]/50"
                      value={formData.launchDate}
                      onChange={(e) => setFormData({ ...formData, launchDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Carrier Satellite Link</label>
                    <select
                      value={formData.assignedSatellites[0] || ''}
                      onChange={(e) => setFormData({ ...formData, assignedSatellites: e.target.value ? [e.target.value] : [] })}
                      className="w-full bg-[#12192b] border border-gray-800 text-white px-2.5 py-1.5 rounded text-xs focus:outline-none focus:border-[#00F0FF]/50"
                    >
                      <option value="">Autonomous CubeSat (No Carrier)</option>
                      {availableSatellites.map((sat) => (
                        <option key={sat._id} value={sat._id}>
                          {sat.name} ({sat.satelliteId})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded text-[11px] tracking-widest uppercase text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#00F0FF] hover:bg-white text-black font-bold px-6 py-2 rounded text-[11px] tracking-widest uppercase flex items-center space-x-2 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50"
            >
              <Plus size={14} />
              <span>{loading ? 'Deploying...' : `Deploy ${formData.formFactor} to ${formData.orbitType}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
