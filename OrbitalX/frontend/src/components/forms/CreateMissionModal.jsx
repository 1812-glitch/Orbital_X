import React, { useState } from 'react';
import missionService from '../../services/missionService';
import { X, Plus, Target } from 'lucide-react';

export default function CreateMissionModal({ isOpen, onClose, onMissionCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    missionId: '',
    status: 'PLANNED',
    launchDate: '',
    launchSite: '',
    objective: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await missionService.create(formData);
      onMissionCreated();
      onClose();
      setFormData({ name: '', missionId: '', status: 'PLANNED', launchDate: '', launchSite: '', objective: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create mission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0A0F1F] border border-gray-800 rounded-lg w-full max-w-lg shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F0FF]/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="flex justify-between items-center p-6 border-b border-gray-800 relative z-10">
          <div className="flex items-center space-x-3">
            <Target className="text-[#00F0FF]" size={20} />
            <h2 className="text-xl font-bold tracking-widest text-white uppercase">Initialize Mission</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 relative z-10">
          {error && (
            <div className="bg-[#FF2A2A]/10 border border-[#FF2A2A]/50 text-[#FF2A2A] text-xs font-mono p-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Mission Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#12192b] border border-gray-800 text-white px-4 py-2.5 rounded font-mono text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                  placeholder="e.g. Operation Artemis"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Internal ID</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#12192b] border border-gray-800 text-white px-4 py-2.5 rounded font-mono text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                  placeholder="e.g. M-88"
                  value={formData.missionId}
                  onChange={(e) => setFormData({...formData, missionId: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Launch Date</label>
                <input
                  type="date"
                  className="w-full bg-[#12192b] border border-gray-800 text-white px-4 py-2.5 rounded font-mono text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                  value={formData.launchDate}
                  onChange={(e) => setFormData({...formData, launchDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Launch Site</label>
                <input
                  type="text"
                  className="w-full bg-[#12192b] border border-gray-800 text-white px-4 py-2.5 rounded font-mono text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                  placeholder="e.g. KSC, Pad 39A"
                  value={formData.launchSite}
                  onChange={(e) => setFormData({...formData, launchSite: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">Primary Objective</label>
              <textarea
                rows="3"
                className="w-full bg-[#12192b] border border-gray-800 text-white px-4 py-2.5 rounded font-mono text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                placeholder="Describe mission objectives..."
                value={formData.objective}
                onChange={(e) => setFormData({...formData, objective: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded text-[11px] font-mono tracking-widest uppercase text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#82E6E6] hover:bg-white text-[#0A0F1F] font-bold px-6 py-2.5 rounded text-[11px] font-mono tracking-widest uppercase flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Plus size={14} />
              <span>{loading ? 'Processing...' : 'Submit Mission'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
