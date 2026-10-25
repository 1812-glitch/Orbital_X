import React, { useState, useEffect } from 'react';
import missionService from '../../services/missionService';
import satelliteService from '../../services/satelliteService';
import { 
  X, 
  Trash2, 
  AlertTriangle, 
  Target, 
  Satellite, 
  Layers, 
  Radio, 
  CheckCircle2, 
  Calendar,
  Compass,
  AlertCircle
} from 'lucide-react';

export default function DeleteAssetModal({ isOpen, onClose, onAssetDeleted }) {
  // 'MISSION' or 'SATELLITE'
  const [deleteType, setDeleteType] = useState('MISSION');
  const [missions, setMissions] = useState([]);
  const [satellites, setSatellites] = useState([]);
  const [selectedId, setSelectedId] = useState('');

  const [loadingList, setLoadingList] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmStep, setConfirmStep] = useState(false);

  // Load both missions and satellites whenever modal is open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingList(true);
    setError(null);
    setConfirmStep(false);

    Promise.all([
      missionService.getAll().catch(() => ({ data: [] })),
      satelliteService.getAll().catch(() => ({ data: [] }))
    ])
      .then(([mRes, sRes]) => {
        if (!isMounted) return;
        const mList = mRes?.data || [];
        const sList = sRes?.data || [];
        setMissions(mList);
        setSatellites(sList);

        if (deleteType === 'MISSION' && mList.length > 0) {
          setSelectedId(mList[0]._id);
        } else if (deleteType === 'SATELLITE' && sList.length > 0) {
          setSelectedId(sList[0]._id);
        } else {
          setSelectedId('');
        }
      })
      .catch((err) => {
        console.error('Failed to load assets for deletion:', err);
        setError('Failed to load fleet assets from database.');
      })
      .finally(() => {
        if (isMounted) setLoadingList(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, deleteType]);

  const handleTypeSwitch = (type) => {
    setDeleteType(type);
    setError(null);
    setConfirmStep(false);
    if (type === 'MISSION') {
      setSelectedId(missions.length > 0 ? missions[0]._id : '');
    } else {
      setSelectedId(satellites.length > 0 ? satellites[0]._id : '');
    }
  };

  if (!isOpen) return null;

  const selectedMission = missions.find((m) => m._id === selectedId);
  const selectedSatellite = satellites.find((s) => s._id === selectedId);

  const handleDelete = async () => {
    if (!selectedId) {
      setError(`Please select a ${deleteType === 'MISSION' ? 'mission' : 'satellite'} to delete.`);
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      if (deleteType === 'MISSION') {
        const deletedMission = selectedMission;
        await missionService.delete(selectedId);
        setMissions((prev) => prev.filter((m) => m._id !== selectedId));
        if (onAssetDeleted) {
          onAssetDeleted({
            type: 'MISSION',
            id: selectedId,
            name: deletedMission?.name || 'Mission',
            code: deletedMission?.missionId
          });
        }
      } else {
        const deletedSat = selectedSatellite;
        await satelliteService.delete(selectedId);
        setSatellites((prev) => prev.filter((s) => s._id !== selectedId));
        if (onAssetDeleted) {
          onAssetDeleted({
            type: 'SATELLITE',
            id: selectedId,
            name: deletedSat?.name || 'Satellite',
            code: deletedSat?.satelliteId
          });
        }
      }

      onClose();
    } catch (err) {
      console.error(`Failed to delete ${deleteType.toLowerCase()}:`, err);
      setError(err.response?.data?.message || `Failed to delete ${deleteType.toLowerCase()} from MongoDB Atlas.`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto font-mono">
      <div className="bg-[#0A0F1F] border border-[#FF2A2A]/40 rounded-xl w-full max-w-xl shadow-[0_0_50px_rgba(255,42,42,0.15)] relative overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Danger Glow Header Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF2A2A]/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-800 relative z-10 bg-[#120a12]/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#FF2A2A]/15 border border-[#FF2A2A]/30 text-[#FF4D4D]">
              <Trash2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-widest text-white uppercase flex items-center gap-2">
                Decommission / Delete Asset
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#FF2A2A]/20 border border-[#FF2A2A]/40 text-[#FF4D4D] font-normal tracking-wider">
                  DANGER ZONE
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-mono">Permanently remove mission directive or satellite asset</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-gray-800/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 relative z-10">
          {error && (
            <div className="bg-[#FF2A2A]/10 border border-[#FF2A2A]/50 text-[#FF2A2A] text-xs font-mono p-3.5 rounded-lg flex items-center space-x-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* QUESTION: WHAT TO DELETE? (MISSION OR SATELLITE) */}
          <div className="space-y-3">
            <label className="block text-xs font-mono uppercase tracking-widest text-gray-300 font-semibold flex items-center gap-2">
              <AlertTriangle size={14} className="text-[#FF4D4D]" />
              Which asset would you like to delete?
            </label>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Option 1: Delete Mission */}
              <button
                type="button"
                onClick={() => handleTypeSwitch('MISSION')}
                className={`p-4 rounded-lg border text-left transition-all relative overflow-hidden group ${
                  deleteType === 'MISSION'
                    ? 'bg-[#FF2A2A]/10 border-[#FF2A2A] shadow-[0_0_15px_rgba(255,42,42,0.15)]'
                    : 'bg-[#0A0F1F] border-gray-800 hover:border-gray-700 text-gray-400'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded ${deleteType === 'MISSION' ? 'bg-[#FF2A2A] text-white' : 'bg-gray-800 text-gray-400'}`}>
                    <Target size={18} />
                  </div>
                  {deleteType === 'MISSION' && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF2A2A] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF2A2A]"></span>
                    </span>
                  )}
                </div>
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 ${deleteType === 'MISSION' ? 'text-white' : 'text-gray-300'}`}>
                  Mission
                </h3>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                  Remove a mission profile and its operational directives.
                </p>
                <div className="mt-3">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    deleteType === 'MISSION' ? 'bg-[#FF2A2A]/20 text-[#FF4D4D]' : 'bg-gray-800/80 text-gray-500'
                  }`}>
                    {missions.length} MISSIONS LOGGED
                  </span>
                </div>
              </button>

              {/* Option 2: Delete Satellite */}
              <button
                type="button"
                onClick={() => handleTypeSwitch('SATELLITE')}
                className={`p-4 rounded-lg border text-left transition-all relative overflow-hidden group ${
                  deleteType === 'SATELLITE'
                    ? 'bg-[#FF2A2A]/10 border-[#FF2A2A] shadow-[0_0_15px_rgba(255,42,42,0.15)]'
                    : 'bg-[#0A0F1F] border-gray-800 hover:border-gray-700 text-gray-400'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded ${deleteType === 'SATELLITE' ? 'bg-[#FF2A2A] text-white' : 'bg-gray-800 text-gray-400'}`}>
                    <Satellite size={18} />
                  </div>
                  {deleteType === 'SATELLITE' && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF2A2A] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF2A2A]"></span>
                    </span>
                  )}
                </div>
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 ${deleteType === 'SATELLITE' ? 'text-white' : 'text-gray-300'}`}>
                  CubeSat / Satellite
                </h3>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                  Decommission asset and terminate its live telemetry feed.
                </p>
                <div className="mt-3">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    deleteType === 'SATELLITE' ? 'bg-[#FF2A2A]/20 text-[#FF4D4D]' : 'bg-gray-800/80 text-gray-500'
                  }`}>
                    {satellites.length} SATELLITES ACTIVE
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* ITEM SELECTION & PREVIEW */}
          <div className="space-y-4 pt-2 border-t border-gray-800">
            {loadingList ? (
              <div className="text-center py-8 text-xs text-gray-400">
                Fetching fleet records from MongoDB...
              </div>
            ) : deleteType === 'MISSION' ? (
              /* MISSION SELECTION */
              missions.length === 0 ? (
                <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg text-center text-xs text-gray-400">
                  No missions currently exist in database to delete.
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest">
                    Select Mission to Delete
                  </label>
                  <select
                    value={selectedId}
                    onChange={(e) => {
                      setSelectedId(e.target.value);
                      setConfirmStep(false);
                    }}
                    className="w-full bg-[#12192b] border border-gray-800 text-white px-3.5 py-2.5 rounded font-mono text-xs focus:outline-none focus:border-[#FF2A2A] transition-colors"
                  >
                    {missions.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.missionId}) — [{m.status}] — {m.assignedSatellites?.length || 0} Sats
                      </option>
                    ))}
                  </select>

                  {/* Selected Mission Summary Preview */}
                  {selectedMission && (
                    <div className="p-4 bg-[#140b12] border border-[#FF2A2A]/30 rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono text-[#FF4D4D] tracking-widest uppercase">TARGET FOR REMOVAL</span>
                          <h4 className="text-sm font-bold text-white font-mono">{selectedMission.name}</h4>
                          <span className="text-xs font-mono text-gray-400">{selectedMission.missionId}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
                          {selectedMission.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
                        <div className="bg-[#0A0F1F] p-2 rounded border border-gray-800">
                          <span className="text-gray-500 block text-[9px]">TARGET ORBIT</span>
                          <span className="text-white font-bold">{selectedMission.orbitType || 'LEO'}</span>
                        </div>
                        <div className="bg-[#0A0F1F] p-2 rounded border border-gray-800">
                          <span className="text-gray-500 block text-[9px]">FORM FACTOR</span>
                          <span className="text-white font-bold">{selectedMission.formFactor || '3U'}</span>
                        </div>
                        <div className="bg-[#0A0F1F] p-2 rounded border border-gray-800">
                          <span className="text-gray-500 block text-[9px]">ASSIGNED SATS</span>
                          <span className="text-cyan-400 font-bold">{selectedMission.assignedSatellites?.length || 0} Units</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                        ⚠️ Deleting this mission will erase its directives from MongoDB. Any assigned satellites will be unlinked and remain in the global fleet.
                      </p>
                    </div>
                  )}
                </div>
              )
            ) : (
              /* SATELLITE SELECTION */
              satellites.length === 0 ? (
                <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg text-center text-xs text-gray-400">
                  No satellites currently exist in database to delete.
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest">
                    Select CubeSat / Satellite to Delete
                  </label>
                  <select
                    value={selectedId}
                    onChange={(e) => {
                      setSelectedId(e.target.value);
                      setConfirmStep(false);
                    }}
                    className="w-full bg-[#12192b] border border-gray-800 text-white px-3.5 py-2.5 rounded font-mono text-xs focus:outline-none focus:border-[#FF2A2A] transition-colors"
                  >
                    {satellites.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.satelliteId}) — [{s.status}] — {s.formFactor || s.type}
                      </option>
                    ))}
                  </select>

                  {/* Selected Satellite Summary Preview */}
                  {selectedSatellite && (
                    <div className="p-4 bg-[#140b12] border border-[#FF2A2A]/30 rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono text-[#FF4D4D] tracking-widest uppercase">ASSET FOR DECOMMISSION</span>
                          <h4 className="text-sm font-bold text-white font-mono">{selectedSatellite.name}</h4>
                          <span className="text-xs font-mono text-gray-400">{selectedSatellite.satelliteId}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
                          {selectedSatellite.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
                        <div className="bg-[#0A0F1F] p-2 rounded border border-gray-800">
                          <span className="text-gray-500 block text-[9px]">ORBIT</span>
                          <span className="text-white font-bold">{selectedSatellite.orbitType || 'LEO'}</span>
                        </div>
                        <div className="bg-[#0A0F1F] p-2 rounded border border-gray-800">
                          <span className="text-gray-500 block text-[9px]">FORM FACTOR</span>
                          <span className="text-white font-bold">{selectedSatellite.formFactor || selectedSatellite.type}</span>
                        </div>
                        <div className="bg-[#0A0F1F] p-2 rounded border border-gray-800">
                          <span className="text-gray-500 block text-[9px]">NORAD ID</span>
                          <span className="text-white font-bold">{selectedSatellite.noradId || 'NONE'}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                        ⚠️ Deleting this satellite will permanently terminate its live telemetry feed and unbind it from all associated missions.
                      </p>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* Double confirmation checkbox */}
          {selectedId && (
            <div className="p-3 bg-[#050810] border border-gray-800 rounded-lg flex items-center space-x-3">
              <input
                type="checkbox"
                id="confirm-delete-checkbox"
                checked={confirmStep}
                onChange={(e) => setConfirmStep(e.target.checked)}
                className="w-4 h-4 rounded bg-[#12192b] border-gray-700 text-[#FF2A2A] focus:ring-[#FF2A2A] focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="confirm-delete-checkbox" className="text-xs text-gray-300 font-sans cursor-pointer select-none">
                I understand this operation is irreversible and will permanently delete this record from MongoDB Atlas.
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-xs font-mono tracking-widest uppercase text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || !selectedId || !confirmStep}
              className="bg-[#FF2A2A] hover:bg-[#ff4d4d] text-white font-bold px-6 py-2.5 rounded-lg text-xs font-mono tracking-widest uppercase flex items-center space-x-2 transition-all shadow-[0_0_20px_rgba(255,42,42,0.3)] hover:shadow-[0_0_25px_rgba(255,42,42,0.5)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 size={15} />
              <span>
                {isDeleting 
                  ? 'DELETING FROM ATLAS...' 
                  : `DELETE ${deleteType === 'MISSION' ? 'MISSION' : 'CUBESAT'}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
