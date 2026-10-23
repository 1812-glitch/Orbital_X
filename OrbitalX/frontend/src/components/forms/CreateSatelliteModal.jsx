import React, { useState } from 'react';
import satelliteService from '../../services/satelliteService';
import { X, Plus, Satellite } from 'lucide-react';

export default function CreateSatelliteModal({ isOpen, onClose, onSatelliteCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    satelliteId: '',
    noradId: '',
    formFactor: '3U',
    type: 'CUBESAT_3U',
    orbitType: 'LEO'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleNameChange = (val) => {
    const autoCode = 'SAT-' + (val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'CUBE');
    setFormData((prev) => ({
      ...prev,
      name: val,
      satelliteId: prev.satelliteId && !prev.satelliteId.startsWith('SAT-') ? prev.satelliteId : autoCode
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        satelliteId: formData.satelliteId || `SAT-${Date.now().toString().slice(-6)}`,
        type: formData.formFactor === 'CUSTOM' ? formData.type : `CUBESAT_${formData.formFactor}`
      };
      await satelliteService.create(payload);
      onSatelliteCreated();
      onClose();
      setFormData({ name: '', satelliteId: '', noradId: '', formFactor: '3U', type: 'CUBESAT_3U', orbitType: 'LEO' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save satellite to MongoDB');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0A0F1F] border border-gray-800 rounded-lg w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F0FF]/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="flex justify-between items-center p-6 border-b border-gray-800 relative z-10">
          <div className="flex items-center space-x-3">
            <Satellite className="text-[#00F0FF]" size={20} />
            <div>
              <h2 className="text-xl font-bold tracking-widest text-white uppercase">Add Satellite / CubeSat</h2>
              <p className="text-[10px] text-gray-400 font-mono">Saves directly into MongoDB Atlas</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 relative z-10">
          {error && (
            <div className="bg-[#FF2A2A]/10 border border-[#FF2A2A]/50 text-[#FF2A2A] text-xs font-mono p-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">Designation Name</label>
              <input
                type="text"
                required
                className="w-full bg-[#12192b] border border-gray-800 text-white px-3 py-2 rounded font-mono text-xs focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                placeholder="e.g. CubeSat Orion-3"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">Satellite / CubeSat ID</label>
              <input
                type="text"
                required
                className="w-full bg-[#12192b] border border-gray-800 text-white px-3 py-2 rounded font-mono text-xs focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                placeholder="e.g. SAT-ORION"
                value={formData.satelliteId}
                onChange={(e) => setFormData({...formData, satelliteId: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">CubeSat Form Factor</label>
                <select
                  className="w-full bg-[#12192b] border border-gray-800 text-white px-3 py-2 rounded font-mono text-xs focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                  value={formData.formFactor}
                  onChange={(e) => setFormData({...formData, formFactor: e.target.value})}
                >
                  <option value="1U">1U Nano (10cm³)</option>
                  <option value="2U">2U Tech Demo</option>
                  <option value="3U">3U Standard</option>
                  <option value="6U">6U Aero Heavy</option>
                  <option value="12U">12U Terra</option>
                  <option value="16U">16U Titan Deep Space</option>
                  <option value="CUSTOM">Custom Satellite</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">Target Orbit</label>
                <select
                  className="w-full bg-[#12192b] border border-gray-800 text-white px-3 py-2 rounded font-mono text-xs focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                  value={formData.orbitType}
                  onChange={(e) => setFormData({...formData, orbitType: e.target.value})}
                >
                  <option value="LEO">LEO (Low Earth)</option>
                  <option value="SSO">SSO (Sun-Synch)</option>
                  <option value="MEO">MEO (Medium Earth)</option>
                  <option value="GEO">GEO (Geosynchronous)</option>
                  <option value="POLAR">POLAR (Polar Orbit)</option>
                  <option value="HEO">HEO (Highly Elliptical)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">NORAD Catalog ID (Optional)</label>
              <input
                type="text"
                className="w-full bg-[#12192b] border border-gray-800 text-white px-3 py-2 rounded font-mono text-xs focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                placeholder="e.g. 58241"
                value={formData.noradId}
                onChange={(e) => setFormData({...formData, noradId: e.target.value})}
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
              <span>{loading ? 'Initializing...' : 'Deploy Satellite'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
