import React, { useState, useEffect } from 'react';
import telemetryService from '../services/telemetryService';
import Scene from '../components/3d/Scene';
import { groundStationService } from '../services/groundStationService';
import { Layers, Activity, Search, RadioTower } from 'lucide-react';

export default function OrbitalViewer() {
  const [fleetData, setFleetData] = useState([]);
  const [groundStations, setGroundStations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Display Controls State
  const [showRings, setShowRings] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showUplinks, setShowUplinks] = useState(true);
  const [nightMode, setNightMode] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);

  const fetchFleetData = async () => {
    try {
      const [telemetryRes, gsRes] = await Promise.all([
        telemetryService.getLatestTelemetry(),
        groundStationService.getAllGroundStations()
      ]);
      setFleetData(telemetryRes.data);
      setGroundStations(gsRes.data);
    } catch (err) {
      console.error('Failed to fetch fleet telemetry for 3D viewer', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetData();
    const interval = setInterval(fetchFleetData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-white uppercase mb-2">Orbital Viewer</h1>
          <p className="text-gray-400 font-mono text-sm">Real-time 3D spatial mapping of active satellite constellation.</p>
        </div>
        
        <div className="flex space-x-4">
          <div className="bg-[#12192b] border border-gray-800 rounded px-4 py-2 flex items-center space-x-2">
            <Layers size={16} className="text-gray-400" />
            <span className="font-mono text-sm text-white">Assets: {fleetData.length}</span>
          </div>
        </div>
      </div>

      {/* Main Content: 3D Viewer & Controls Sidebar */}
      <div className="flex-1 flex space-x-6 min-h-0">
        
        {/* 3D Canvas Container */}
        <div className="flex-1 rounded-lg overflow-hidden relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#050810] border border-gray-800 rounded-lg">
              <Activity className="animate-pulse text-[#00F0FF]" size={48} />
            </div>
          ) : (
            <Scene 
              fleetData={fleetData} 
              groundStations={groundStations}
              showRings={showRings} 
              showLabels={showLabels} 
              showUplinks={showUplinks}
              nightMode={nightMode} 
              autoRotate={autoRotate}
            />
          )}
        </div>

        {/* Side Panel */}
        <div className="w-80 shrink-0 flex flex-col space-y-4">
          
          <div className="bg-[#0A0F1F] border border-gray-800 p-4 rounded-lg">
            <h3 className="text-white font-mono text-sm tracking-widest uppercase border-b border-gray-800 pb-2 mb-4">Tracking Targets</h3>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
              <input 
                type="text" 
                placeholder="Search SAT ID..." 
                className="w-full bg-[#12192b] border border-gray-800 text-white rounded py-2 pl-9 pr-3 font-mono text-xs focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
              />
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {fleetData.map((data) => (
                <div key={data.satellite._id} className="flex items-center justify-between p-2 bg-[#12192b]/50 rounded hover:bg-[#12192b] cursor-pointer border border-transparent hover:border-gray-800 transition-all">
                  <div className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${data.satellite.status === 'OFFLINE' ? 'bg-[#FF2A2A]' : 'bg-[#00F0FF]'}`}></div>
                    <span className="text-sm font-bold text-white">{data.satellite.satelliteId}</span>
                  </div>
                  <span className="text-xs font-mono text-gray-400">{data.satellite.orbitType}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0A0F1F] border border-gray-800 p-4 rounded-lg">
            <h3 className="text-white font-mono text-sm tracking-widest uppercase border-b border-gray-800 pb-2 mb-4 flex items-center justify-between">
              <span>Ground Network</span>
              <RadioTower size={14} className="text-[#00F0FF]" />
            </h3>
            <div className="space-y-2">
              {groundStations.map((gs) => (
                <div key={gs._id} className="flex flex-col p-2 bg-[#12192b]/50 rounded border border-gray-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-white">{gs.name}</span>
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${gs.status === 'OPERATIONAL' ? 'bg-[#00F0FF]/10 text-[#00F0FF]' : 'bg-yellow-500/10 text-yellow-500'}`}>{gs.status}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{gs.country}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0A0F1F] border border-gray-800 p-4 rounded-lg flex-1">
             <h3 className="text-white font-mono text-sm tracking-widest uppercase border-b border-gray-800 pb-2 mb-4">Display Controls</h3>
             <div className="space-y-4 text-sm font-mono text-gray-400">
               <label className="flex items-center space-x-3 cursor-pointer">
                 <input 
                   type="checkbox" 
                   checked={showRings} 
                   onChange={(e) => setShowRings(e.target.checked)} 
                   className="form-checkbox text-[#00F0FF] rounded bg-gray-800 border-gray-700" 
                 />
                 <span>Show Orbital Rings</span>
               </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showLabels} 
                    onChange={(e) => setShowLabels(e.target.checked)} 
                    className="form-checkbox text-[#00F0FF] rounded bg-gray-800 border-gray-700" 
                  />
                  <span>Show Data Labels</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showUplinks} 
                    onChange={(e) => setShowUplinks(e.target.checked)} 
                    className="form-checkbox text-[#00F0FF] rounded bg-gray-800 border-gray-700" 
                  />
                  <span>Show Comm Uplinks</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={nightMode} 
                    onChange={(e) => setNightMode(e.target.checked)} 
                    className="form-checkbox text-[#00F0FF] rounded bg-gray-800 border-gray-700" 
                  />
                  <span>Night Vision Mode</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoRotate} 
                    onChange={(e) => setAutoRotate(e.target.checked)} 
                    className="form-checkbox text-[#00F0FF] rounded bg-gray-800 border-gray-700" 
                  />
                  <span>Globe Auto-Rotation</span>
                </label>
             </div>
          </div>
          
        </div>
      </div>

    </div>
  );
}
