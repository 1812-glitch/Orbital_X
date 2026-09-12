import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import missionService from '../../services/missionService';
import { communicationService } from '../../services/communicationService';
import { Target, Calendar, MapPin, Settings, Terminal, Send, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MissionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [mission, setMission] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedSatId, setSelectedSatId] = useState('');
  const logsEndRef = useRef(null);

  const fetchMissionData = async () => {
    try {
      const missionData = await missionService.getById(id);
      setMission(missionData.data);
      if (missionData.data.assignedSatellites?.length > 0) {
        setSelectedSatId(missionData.data.assignedSatellites[0]._id);
      }

      const commData = await communicationService.getMissionCommunications(id);
      // Reverse to show oldest at top, newest at bottom
      setLogs(commData.data.reverse());
    } catch (error) {
      console.error('Error fetching mission details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissionData();
    const interval = setInterval(fetchMissionData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedSatId) return;

    try {
      await communicationService.postCommunication(selectedSatId, inputMessage);
      setInputMessage('');
      fetchMissionData(); // Refresh logs immediately
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (loading) return <div className="p-8 text-center text-[#00F0FF] font-mono">LOADING MISSION DATA...</div>;
  if (!mission) return <div className="p-8 text-center text-[#FF2A2A] font-mono">MISSION NOT FOUND</div>;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center space-x-4 font-mono text-sm tracking-widest uppercase">
          <Link to="/missions" className="text-gray-500 hover:text-white transition-colors">Missions</Link>
          <span className="text-gray-700">/</span>
          <span className="text-[#00F0FF]">{mission.missionId}</span>
          <span className="text-gray-700">/</span>
          <span className="text-white font-bold">{mission.name}</span>
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#00F0FF]/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-end justify-between relative z-10">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight uppercase">{mission.name}</h1>
            <div className="flex items-center space-x-6 font-mono text-xs text-gray-400 tracking-widest mt-2">
              <span className="flex items-center"><Target size={14} className="mr-2 text-[#00F0FF]" /> {mission.missionId}</span>
              <span className="flex items-center"><Calendar size={14} className="mr-2 text-[#00F0FF]" /> {mission.launchDate ? new Date(mission.launchDate).toLocaleDateString() : 'TBD'}</span>
              <span className="flex items-center"><MapPin size={14} className="mr-2 text-[#00F0FF]" /> {mission.launchSite || 'N/A'}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 mt-6 md:mt-0">
            <div className={`border bg-opacity-5 px-4 py-2 rounded flex items-center space-x-2
                ${mission.status === 'ACTIVE' ? 'border-[#00FF66]/30 bg-[#00FF66] text-[#00FF66]' : 
                  mission.status === 'PLANNED' ? 'border-[#FFB000]/30 bg-[#FFB000] text-[#FFB000]' : 
                  'border-gray-600/30 bg-gray-600 text-gray-400'}`}>
              <span className="text-[10px] font-mono tracking-widest uppercase">{mission.status}</span>
            </div>
            <button className="bg-[#82E6E6] hover:bg-white text-[#0A0F1F] font-bold px-6 py-2.5 rounded text-[11px] font-mono tracking-widest uppercase flex items-center space-x-2 transition-colors">
              <Settings size={14} />
              <span>Manage Fleet</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Live Communications Terminal */}
        <div className="lg:col-span-2 bg-[#050810] border border-gray-800 rounded-lg flex flex-col h-[500px]">
          <div className="bg-[#0A0F1F] border-b border-gray-800 p-3 rounded-t-lg flex justify-between items-center">
             <div className="flex items-center space-x-2">
               <Terminal size={14} className="text-[#00F0FF]" />
               <span className="text-white font-mono text-xs tracking-widest uppercase">Live Communications Stream</span>
             </div>
             <div className="flex space-x-1.5">
               <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
             </div>
          </div>
          
          {/* Logs Output */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="text-gray-600 italic">No communication logs available. Awaiting transmission...</div>
            ) : (
              logs.map((log, index) => (
                <div key={log._id || index} className="flex space-x-3 opacity-90 hover:opacity-100 transition-opacity">
                  <span className="text-gray-500 shrink-0">[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                  <span className={`shrink-0 ${log.direction === 'TX' ? 'text-[#00F0FF]' : 'text-[#00FF66]'}`}>
                    {log.direction === 'TX' ? 'TX' : 'RX'}
                  </span>
                  <span className="text-gray-400 shrink-0">({log.satelliteId?.satelliteId || 'UNKNOWN'})</span>
                  <span className="text-white break-all">{log.message}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>

          {/* TX Input / Permission Lock */}
          <div className="p-3 border-t border-gray-800 bg-[#0A0F1F] rounded-b-lg relative">
            {['ADMIN', 'OPERATOR'].includes(user?.role) ? (
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <select 
                  value={selectedSatId}
                  onChange={(e) => setSelectedSatId(e.target.value)}
                  className="bg-[#12192b] border border-gray-800 text-gray-300 rounded px-2 py-2 font-mono text-xs focus:outline-none focus:border-[#00F0FF]/50"
                >
                  {mission.assignedSatellites?.map(sat => (
                    <option key={sat._id} value={sat._id}>{sat.satelliteId}</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Enter command payload..." 
                  className="flex-1 bg-[#12192b] border border-gray-800 text-white rounded px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="bg-transparent border border-gray-700 hover:border-[#00F0FF] text-gray-400 hover:text-[#00F0FF] px-4 rounded flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </form>
            ) : (
              <div className="absolute inset-0 z-10 bg-[#0B1221]/95 backdrop-blur-sm border-t border-gray-800 flex flex-col items-center justify-center rounded-b-lg p-4">
                <div className="text-[#FFB000] mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <h4 className="text-gray-200 text-sm font-medium mb-1 tracking-tight text-center">You do not have permission to perform this action.</h4>
                <p className="text-gray-500 font-mono text-[10px] tracking-widest uppercase">Clearance Level 4 Required.</p>
              </div>
            )}
            
            {/* Dummy hidden form to preserve height if needed, though absolute inset-0 covers it */}
            {!['ADMIN', 'OPERATOR'].includes(user?.role) && (
              <div className="flex space-x-2 opacity-0 pointer-events-none">
                <select className="px-2 py-2"><option>Dummy</option></select>
                <input type="text" className="px-3 py-2 flex-1" />
                <button className="px-4 py-2">SEND</button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Alerts & Satellites */}
        <div className="space-y-6">
          
          <div className="bg-[#0A0F1F] border border-gray-800 rounded-lg p-5">
            <h3 className="text-white font-mono text-sm tracking-widest uppercase border-b border-gray-800 pb-2 mb-4 flex items-center space-x-2">
              <AlertTriangle size={14} className="text-[#FFB000]" />
              <span>Mission Alerts</span>
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-[#FFB000]/10 border border-[#FFB000]/20 rounded flex space-x-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FFB000] mt-1.5 shrink-0"></div>
                <div>
                  <p className="text-white text-xs font-mono mb-1">Solar Flare Activity Detected</p>
                  <p className="text-gray-500 text-[10px] font-mono">Possible interference in LEO orbit bands. Monitoring telemetry drops.</p>
                </div>
              </div>
              <div className="p-3 bg-gray-800/30 border border-gray-700/50 rounded flex space-x-3 items-start">
                 <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-1.5 shrink-0"></div>
                 <div>
                   <p className="text-gray-300 text-xs font-mono mb-1">Routine Maintenance Window</p>
                   <p className="text-gray-500 text-[10px] font-mono">Scheduled for 14:00 UTC. Expect delayed TX acknowledgments.</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0A0F1F] border border-gray-800 rounded-lg p-5">
            <h3 className="text-white font-mono text-sm tracking-widest uppercase border-b border-gray-800 pb-2 mb-4">Assigned Assets ({mission.assignedSatellites?.length || 0})</h3>
            {mission.assignedSatellites?.length === 0 ? (
              <div className="text-center font-mono text-xs text-gray-600 uppercase tracking-widest py-4">No satellites assigned</div>
            ) : (
              <div className="space-y-2">
                {mission.assignedSatellites.map(sat => (
                  <div key={sat._id} className="flex justify-between items-center p-2 bg-[#12192b]/50 rounded border border-gray-800">
                     <div>
                       <div className="font-bold text-white text-sm">{sat.name}</div>
                       <div className="font-mono text-[10px] text-gray-500">{sat.satelliteId} • {sat.orbitType}</div>
                     </div>
                     <Link to={`/satellites/${sat._id}`} className="text-[#00F0FF] text-[10px] uppercase font-mono hover:underline">View</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
        
      </div>
    </div>
  );
}
