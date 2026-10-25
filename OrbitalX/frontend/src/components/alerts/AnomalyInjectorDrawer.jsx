import React, { useState, useEffect } from 'react';
import { X, Zap, Check, Search, PlusCircle, AlertCircle } from 'lucide-react';
import alertService from '../../services/alertService';
import { SATELLITE_ANOMALIES, SUBSYSTEM_CATEGORIES } from '../../data/satelliteAnomalyCatalog';
import AnomalyPresetCard from './AnomalyPresetCard';
import CustomFaultForm from './CustomFaultForm';

export default function AnomalyInjectorDrawer({ 
  isOpen, 
  onClose, 
  satellites = [], 
  activeSat = null, 
  onAnomalyInjected 
}) {
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedSatId, setSelectedSatId] = useState(() => {
    return activeSat?._id || activeSat?.satelliteId || (satellites[0]?._id || satellites[0]?.satelliteId || '');
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [injectingId, setInjectingId] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [errorToast, setErrorToast] = useState(null);

  // Sync selectedSatId whenever activeSat, satellites or open state updates
  useEffect(() => {
    if (activeSat?._id || activeSat?.satelliteId) {
      setSelectedSatId(activeSat._id || activeSat.satelliteId);
    } else if (satellites && satellites.length > 0) {
      setSelectedSatId((prev) => {
        if (prev && satellites.some(s => s._id === prev || s.satelliteId === prev)) {
          return prev;
        }
        return satellites[0]._id || satellites[0].satelliteId || '';
      });
    }
  }, [activeSat, satellites, isOpen]);

  // Custom Fault Form State
  const [customFault, setCustomFault] = useState({
    title: '',
    subsystem: 'EPS',
    severity: 'CRITICAL',
    metric: '',
    value: '',
    threshold: '',
    message: ''
  });
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  if (!isOpen) return null;

  // Resolve target satellite object safely
  const resolveTargetSat = () => {
    if (selectedSatId) {
      const found = satellites.find((s) => s._id === selectedSatId || s.satelliteId === selectedSatId || s.name === selectedSatId);
      if (found) return found;
    }
    if (activeSat) return activeSat;
    if (satellites && satellites.length > 0) return satellites[0];
    return null;
  };

  const targetSatObj = resolveTargetSat();

  // Filter presets
  const filteredPresets = SATELLITE_ANOMALIES.filter((preset) => {
    if (activeTab !== 'ALL' && activeTab !== 'CUSTOM' && preset.subsystem !== activeTab) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      preset.title.toLowerCase().includes(q) ||
      preset.subsystem.toLowerCase().includes(q) ||
      preset.metric.toLowerCase().includes(q) ||
      preset.message.toLowerCase().includes(q)
    );
  });

  const handleInjectPreset = async (preset) => {
    const targetSat = resolveTargetSat();
    const targetId = targetSat?._id || targetSat?.satelliteId || selectedSatId;
    if (!targetId) {
      alert('Please select a target CubeSat before injecting anomaly.');
      return;
    }

    setInjectingId(preset.id);
    setErrorToast(null);

    try {
      await alertService.create({
        satelliteId: targetId,
        type: preset.title,
        severity: preset.severity,
        metric: preset.metric,
        value: typeof preset.faultValue === 'number' ? preset.faultValue : parseFloat(preset.faultValue) || 100,
        threshold: typeof preset.threshold === 'number' ? preset.threshold : parseFloat(preset.threshold) || 80,
        message: preset.message
      });

      const satLabel = targetSat ? (targetSat.name || targetSat.satelliteId) : 'Satellite';
      setSuccessToast(`Injected [${preset.title}] into ${satLabel}!`);

      if (onAnomalyInjected) {
        onAnomalyInjected();
      }
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error('Failed to inject anomaly:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Server error occurred during fault injection.';
      setErrorToast(`Fault injection failed: ${errMsg}`);
      setTimeout(() => setErrorToast(null), 5000);
    } finally {
      setInjectingId(null);
    }
  };

  const handleInjectCustom = async (e) => {
    e.preventDefault();
    const targetSat = resolveTargetSat();
    const targetId = targetSat?._id || targetSat?.satelliteId || selectedSatId;

    if (!targetId) {
      alert('Please select a target CubeSat.');
      return;
    }
    if (!customFault.title || !customFault.message) {
      alert('Please provide an anomaly title and description narrative.');
      return;
    }

    setIsSubmittingCustom(true);
    setErrorToast(null);

    try {
      await alertService.create({
        satelliteId: targetId,
        type: customFault.title,
        severity: customFault.severity,
        metric: customFault.metric || customFault.subsystem,
        value: parseFloat(customFault.value) || 99,
        threshold: parseFloat(customFault.threshold) || 75,
        message: customFault.message
      });

      const satLabel = targetSat ? (targetSat.name || targetSat.satelliteId) : 'Satellite';
      setSuccessToast(`Custom anomaly [${customFault.title}] dispatched to ${satLabel}!`);

      setCustomFault({
        title: '',
        subsystem: 'EPS',
        severity: 'CRITICAL',
        metric: '',
        value: '',
        threshold: '',
        message: ''
      });

      if (onAnomalyInjected) {
        onAnomalyInjected();
      }
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error('Failed to inject custom anomaly:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Server error creating custom anomaly.';
      setErrorToast(`Custom fault failed: ${errMsg}`);
      setTimeout(() => setErrorToast(null), 5000);
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl h-full bg-[#070C18] border-l border-[#00F0FF]/40 shadow-[-10px_0_40px_rgba(0,0,0,0.8)] flex flex-col font-mono text-xs overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header with CANCEL button */}
        <div className="p-4 bg-[#0A1022] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-[#FF2A2A]/20 border border-[#FF2A2A]/50 flex items-center justify-center text-[#FF2A2A]">
              <Zap size={16} />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm tracking-wide">
                ORBITAL FAULT & ANOMALY INJECTOR
              </h2>
              <p className="text-[11px] text-gray-400">
                Simulate space hardware malfunctions, telemetry trips & AI recovery
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-bold text-xs flex items-center space-x-1.5 border border-gray-700 hover:border-gray-500 transition-colors"
              title="Cancel and close drawer without injecting a fault"
            >
              <X size={14} />
              <span>CANCEL</span>
            </button>
          </div>
        </div>

        {/* Success Toast Banner */}
        {successToast && (
          <div className="bg-[#00FF66]/15 border-b border-[#00FF66]/40 p-3 text-[#00FF66] font-bold text-xs flex items-center space-x-2 animate-in slide-in-from-top duration-200">
            <Check size={14} />
            <span>{successToast}</span>
          </div>
        )}

        {/* Error Toast Banner */}
        {errorToast && (
          <div className="bg-[#FF2A2A]/15 border-b border-[#FF2A2A]/40 p-3 text-[#FF2A2A] font-bold text-xs flex items-center space-x-2 animate-in slide-in-from-top duration-200">
            <AlertCircle size={14} />
            <span>{errorToast}</span>
          </div>
        )}

        {/* Target CubeSat Selector Bar */}
        <div className="p-4 bg-[#050810] border-b border-gray-800 space-y-2">
          <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">
            TARGET CUBESAT RECIPIENT:
          </label>
          <div className="flex items-center space-x-2">
            <select
              value={selectedSatId}
              onChange={(e) => setSelectedSatId(e.target.value)}
              className="flex-1 bg-[#0A1022] border border-gray-700 hover:border-[#00F0FF] rounded px-3 py-2 text-white text-xs font-mono font-bold focus:outline-none focus:border-[#00F0FF] cursor-pointer"
            >
              {satellites && satellites.length > 0 ? (
                satellites.map((sat) => (
                  <option key={sat._id || sat.satelliteId} value={sat._id || sat.satelliteId}>
                    {sat.name || sat.satelliteId} — {sat.orbitType || 'LEO'} ({sat.type || 'CubeSat'})
                  </option>
                ))
              ) : (
                <option value="">No CubeSats available</option>
              )}
            </select>
          </div>
        </div>

        {/* Subsystem Category Pills */}
        <div className="px-4 py-2.5 bg-[#080D1D] border-b border-gray-800 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          {SUBSYSTEM_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-2.5 py-1.5 rounded text-[11px] font-mono tracking-wider uppercase transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === cat.id
                  ? 'bg-[#00F0FF] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'bg-[#050810] hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          ))}
          <button
            onClick={() => setActiveTab('CUSTOM')}
            className={`px-2.5 py-1.5 rounded text-[11px] font-mono tracking-wider uppercase transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'CUSTOM'
                ? 'bg-[#FFB000] text-black font-bold shadow-[0_0_10px_rgba(255,176,0,0.3)]'
                : 'bg-[#050810] hover:bg-gray-800 text-[#FFB000] hover:text-white border border-[#FFB000]/40'
            }`}
          >
            <PlusCircle size={12} />
            <span>CUSTOM FAULT</span>
          </button>
        </div>

        {/* Search bar (when not on custom tab) */}
        {activeTab !== 'CUSTOM' && (
          <div className="p-3 bg-[#050810] border-b border-gray-800/80">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-500" size={13} />
              <input
                type="text"
                placeholder="Filter preset anomalies by keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0A1022] border border-gray-800 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 font-mono"
              />
            </div>
          </div>
        )}

        {/* Content Body: Presets List or Custom Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab !== 'CUSTOM' ? (
            <>
              <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-widest px-1">
                <span>PRESET ANOMALIES ({filteredPresets.length})</span>
                <span className="text-[#00F0FF]">CLICK TO INJECT IMMEDIATELY</span>
              </div>

              {filteredPresets.map((preset) => (
                <AnomalyPresetCard
                  key={preset.id}
                  preset={preset}
                  isInjecting={injectingId === preset.id}
                  onInject={handleInjectPreset}
                />
              ))}
            </>
          ) : (
            <CustomFaultForm
              customFault={customFault}
              setCustomFault={setCustomFault}
              onSubmit={handleInjectCustom}
              isSubmitting={isSubmittingCustom}
              onCancel={onClose}
            />
          )}
        </div>

        {/* Sticky Drawer Footer with CANCEL / CLOSE Button */}
        <div className="p-3 bg-[#0A1022] border-t border-gray-800 flex items-center justify-between text-xs">
          <div className="text-[11px] text-gray-400 flex items-center space-x-1.5">
            <span>Target:</span>
            <span className="text-[#00F0FF] font-bold">
              {targetSatObj?.name || targetSatObj?.satelliteId || 'Selected CubeSat'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 font-bold uppercase tracking-wider text-[11px] transition-all flex items-center space-x-1.5 shadow-sm"
          >
            <X size={13} />
            <span>CANCEL & CLOSE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
