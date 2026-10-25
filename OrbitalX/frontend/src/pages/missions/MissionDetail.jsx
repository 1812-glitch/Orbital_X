import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import missionService from '../../services/missionService';
import satelliteService from '../../services/satelliteService';
import { communicationService } from '../../services/communicationService';
import { Target, Calendar, MapPin, Settings, Terminal, Send, AlertTriangle, Box, ArrowLeft, Undo2, Cpu, Globe2, Trash2, Rocket, Plus, Radio, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MissionCubeSatViewer from '../../components/3d/MissionCubeSatViewer';
import DeployCubeSatModal from '../../components/forms/DeployCubeSatModal';

export default function MissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mission, setMission] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedSatId, setSelectedSatId] = useState('');
  const logsEndRef = useRef(null);

  // Retrieve / Disconnect Modal State
  const [isRetrieveModalOpen, setIsRetrieveModalOpen] = useState(false);
  const [retrieveTargetSat, setRetrieveTargetSat] = useState(null);
  const [selectedDirective, setSelectedDirective] = useState('RETRIEVE'); // 'RETRIEVE' or 'DISCONNECT'
  const [isExecutingDirective, setIsExecutingDirective] = useState(false);
  const [directiveFeedback, setDirectiveFeedback] = useState(null);

  const openRetrieveModal = (sat = null) => {
    const target = sat || (mission?.assignedSatellites?.[0] || null);
    setRetrieveTargetSat(target);
    setSelectedDirective('RETRIEVE');
    setDirectiveFeedback(null);
    setIsRetrieveModalOpen(true);
  };

  const handleExecuteDirective = async () => {
    if (!retrieveTargetSat || !mission) return;
    setIsExecutingDirective(true);
    setDirectiveFeedback(null);

    const isRetrieve = selectedDirective === 'RETRIEVE';
    const telecommand = isRetrieve ? 'CMD_PROP_DEORBIT_RETRO' : 'CMD_COMMS_TRANSMITTER_KILL';
    const newStatus = isRetrieve ? 'RETRIEVED' : 'DISCONNECTED';

    try {
      // Simulate radio uplink delay
      await new Promise(r => setTimeout(r, 1000));

      // 1. Update satellite status in MongoDB
      if (retrieveTargetSat._id) {
        await satelliteService.update(retrieveTargetSat._id, {
          status: newStatus
        }).catch(err => console.warn('Could not update satellite status:', err));
      }

      // 2. Remove satellite from mission's active assignedSatellites in MongoDB
      const currentSatIds = (mission.assignedSatellites || [])
        .map(s => typeof s === 'object' ? s._id : s)
        .filter(id => id !== retrieveTargetSat._id && id !== retrieveTargetSat);

      await missionService.update(mission._id, {
        assignedSatellites: currentSatIds
      });

      // 3. Set success feedback
      setDirectiveFeedback({
        type: 'success',
        satelliteName: retrieveTargetSat.name,
        action: selectedDirective,
        telecommand,
        message: isRetrieve 
          ? `Uplink Verified (${telecommand}). Satellite "${retrieveTargetSat.name}" initiated safe deorbit and marked as RETRIEVED.`
          : `Uplink Verified (${telecommand}). Satellite "${retrieveTargetSat.name}" disconnected and released into graveyard orbit.`
      });

      // 4. Refresh mission details
      await fetchMissionData();

      // Automatically close modal after brief visual verification
      setTimeout(() => {
        setIsRetrieveModalOpen(false);
        setIsExecutingDirective(false);
        setDirectiveFeedback(null);
      }, 2000);

    } catch (err) {
      console.error('Failed to execute directive:', err);
      setDirectiveFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to execute directive. Please retry.'
      });
      setIsExecutingDirective(false);
    }
  };

  const handleLaunchNewSatellite = async () => {
    if (!mission) return;
    setIsLaunching(true);
    try {
      const nextIndex = (mission.assignedSatellites?.length || 0) + 1;
      const cleanPrefix = mission.missionId?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'SAT';
      const timestampSuffix = Math.floor(100 + Math.random() * 900);
      const satId = `${cleanPrefix}-0${nextIndex}-${timestampSuffix}`;
      const satName = `${mission.name} - CubeSat ${nextIndex}`;
      const orbitType = mission.orbitType || 'LEO';
      const formFactor = mission.formFactor || '3U';

      // 1. Create the new satellite in MongoDB Atlas
      const satRes = await satelliteService.create({
        name: satName,
        satelliteId: satId,
        type: `CUBESAT_${formFactor}`,
        formFactor: formFactor,
        orbitType: orbitType,
        status: 'ACTIVE',
        cubesatDesign: {
          missionName: satName,
          formFactor: formFactor,
          targetOrbit: `${orbitType} (500km)`,
          mountedComponents: {
            'obc_core': 1,
            'battery_pack': 1,
            'solar_panel_1u': 2,
            'antenna_deployable': 1,
            'camera_visible': 1
          },
          savedAt: new Date().toISOString()
        }
      });

      const newSat = satRes?.data;
      const newSatObjectId = newSat?._id;

      // 2. Add satellite to this particular mission's assignedSatellites in MongoDB
      const currentSatIds = (mission.assignedSatellites || []).map(s => typeof s === 'object' ? s._id : s);
      if (newSatObjectId && !currentSatIds.includes(newSatObjectId)) {
        await missionService.update(mission._id, {
          assignedSatellites: [...currentSatIds, newSatObjectId]
        });
      }

      // 3. Take user directly to the 3D design studio with mission context
      navigate(`/studio?missionId=${encodeURIComponent(mission.missionId)}&missionDbId=${mission._id}&satId=${encodeURIComponent(satId)}&satName=${encodeURIComponent(satName)}&formFactor=${formFactor}`);
    } catch (err) {
      console.error('Failed to create satellite before opening studio:', err);
      // Fallback: take user directly to 3D studio with mission context
      navigate(`/studio?missionId=${encodeURIComponent(mission.missionId)}&missionDbId=${mission._id}&missionName=${encodeURIComponent(mission.name)}`);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleDeleteMission = async () => {
    if (!mission) return;
    const confirmDelete = window.confirm(
      `Permanently delete mission "${mission.name}" (${mission.missionId}) from MongoDB Atlas?`
    );
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      await missionService.delete(id);
      navigate('/missions');
    } catch (err) {
      console.error('Failed to delete mission:', err);
      alert(err.response?.data?.message || 'Failed to delete mission from database.');
      setIsDeleting(false);
    }
  };

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
          <button 
            type="button"
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/missions');
              }
            }}
            className="text-gray-400 hover:text-[#00F0FF] transition-colors flex items-center space-x-1.5 cursor-pointer group"
            title="Undo / Back: Return to most immediate recently opened page"
          >
            <Undo2 size={14} className="text-[#00F0FF] group-hover:-rotate-45 transition-transform duration-200" />
            <span>Missions</span>
          </button>
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
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-4xl font-bold text-white tracking-tight uppercase">{mission.name}</h1>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase font-bold border ${
                mission.status === 'ACTIVE' ? 'border-[#00FF66]/40 bg-[#00FF66]/15 text-[#00FF66]' : 
                mission.status === 'PLANNED' ? 'border-[#FFB000]/40 bg-[#FFB000]/15 text-[#FFB000]' : 
                'border-gray-600 bg-gray-800 text-gray-400'
              }`}>
                {mission.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-6 font-mono text-xs text-gray-400 tracking-widest mt-2">
              <span className="flex items-center"><Target size={14} className="mr-2 text-[#00F0FF]" /> {mission.missionId}</span>
              <span className="flex items-center"><Calendar size={14} className="mr-2 text-[#00F0FF]" /> {mission.launchDate ? new Date(mission.launchDate).toLocaleDateString() : 'TBD'}</span>
              <span className="flex items-center"><MapPin size={14} className="mr-2 text-[#00F0FF]" /> {mission.launchSite || 'N/A'}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 mt-6 md:mt-0">
            {/* LAUNCH NEW SATELLITE BUTTON */}
            <button
              type="button"
              id="launch-new-satellite-btn"
              onClick={() => setIsLaunchModalOpen(true)}
              disabled={isLaunching}
              className="bg-[#00FF66] hover:bg-[#82FFB0] text-[#0A0F1F] font-bold px-4 py-2 rounded text-[11px] font-mono tracking-widest uppercase flex items-center space-x-2 shadow-[0_0_20px_rgba(0,255,102,0.4)] transition-all transform hover:scale-[1.02] disabled:opacity-60 cursor-pointer"
              title={`Launch new satellite for ${mission.name}: choose between 3D Studio Assembly or Flight-Ready Presets`}
            >
              <Rocket size={14} className="text-[#0A0F1F]" />
              <span>LAUNCH NEW SATELLITE</span>
            </button>

            <Link 
              to="/missions"
              className="bg-[#121C36] hover:bg-[#1a284e] text-white border border-gray-700 font-bold px-4 py-2 rounded text-[11px] font-mono tracking-widest uppercase flex items-center space-x-2 transition-colors"
            >
              <span>Back to Fleet</span>
            </Link>
            <button
              type="button"
              onClick={handleDeleteMission}
              disabled={isDeleting}
              className="bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 font-bold px-4 py-2 rounded text-[11px] font-mono tracking-widest uppercase flex items-center space-x-1.5 transition-all shadow-[0_0_12px_rgba(239,68,68,0.2)] disabled:opacity-50"
              title="Delete mission permanently from MongoDB Atlas"
            >
              <Trash2 size={13} className={isDeleting ? 'animate-spin' : ''} />
              <span>{isDeleting ? 'Deleting...' : 'Delete Mission'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mission Strategic Objective & Technical Specifications Banner */}
      <div className="bg-[#0A0F1F] border border-gray-800 rounded-lg p-5 font-mono">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center space-x-1.5">
              <Target size={12} className="text-[#00F0FF]" />
              <span>Strategic Mission Objective</span>
            </div>
            <p className="text-white text-xs leading-relaxed">
              {mission.objective || mission.description || 'Primary orbital deployment and payload verification directive.'}
            </p>
            {mission.description && mission.objective && mission.description !== mission.objective && (
              <p className="text-gray-400 text-[11px] pt-1">{mission.description}</p>
            )}
          </div>

          <div className="space-y-1.5 md:border-l border-gray-800/80 md:pl-4">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Spacecraft & Target Orbit</div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-[#00F0FF]">{mission.formFactor || '3U'} CubeSat</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                {mission.orbitType || 'LEO'}
              </span>
            </div>
            <div className="text-[10px] text-gray-400">
              {mission.assignedSatellites?.[0]?.name ? `Carrier: ${mission.assignedSatellites[0].name}` : 'Autonomous Deployment'}
            </div>
          </div>

          <div className="space-y-1.5 md:border-l border-gray-800/80 md:pl-4">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Trajectory & Launch Site</div>
            <div className="text-sm font-bold text-white">{mission.launchSite || 'Cape Canaveral SLC-40'}</div>
            <div className="text-[10px] text-gray-400">
              Orbit Profile: {mission.orbitType === 'GEO' ? '35,786 km Fixed' : mission.orbitType === 'MEO' ? 'Medium Earth' : mission.orbitType === 'SSO' ? 'Sun-Synchronous' : 'Low Earth (LEO)'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Live Communications Terminal & Spacecraft Deck */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Live Communications Terminal */}
          <div className="bg-[#050810] border border-gray-800 rounded-lg flex flex-col h-[380px]">
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
            </div>
          </div>

          {/* 2. Below Command Panel: 3D CubeSat Architecture & Avionics Deck */}
          <div className="bg-[#0A0F1F] border border-gray-800 rounded-lg p-5 font-mono">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Box size={16} className="text-[#00F0FF]" />
                <span className="text-white text-xs tracking-widest uppercase font-bold">
                  Mission 3D CubeSat Architecture & Avionics
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {mission.orbitType || 'LEO'} ORBIT
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40">
                  {mission.formFactor || '3U'} CUBESAT
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              {/* Left: 3D WebGL Model */}
              <div className="bg-[#050810] border border-gray-800/80 rounded-lg p-2 overflow-hidden relative">
                <div className="absolute top-2 left-2 z-10 text-[9px] text-[#00F0FF] bg-black/70 px-2 py-0.5 rounded border border-[#00F0FF]/30 tracking-widest uppercase">
                  3D WebGL Telemetry
                </div>
                <MissionCubeSatViewer
                  formFactor={mission.formFactor || '3U'}
                  interactive={true}
                  autoRotate={true}
                  className="w-full h-48"
                />
              </div>

              {/* Right: Technical Specs & Quick CAD Tools */}
              <div className="space-y-3">
                <div className="space-y-2 text-xs bg-[#12192b]/50 p-3 rounded border border-gray-800/80">
                  <div className="flex justify-between border-b border-gray-800/60 pb-1.5">
                    <span className="text-gray-500">CHASSIS SPEC:</span>
                    <span className="text-white font-bold">{mission.formFactor || '3U'} Spacecraft Standard</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800/60 pb-1.5">
                    <span className="text-gray-500">TARGET TRAJECTORY:</span>
                    <span className="text-[#00F0FF] font-bold">{mission.orbitType || 'LEO'} Orbit</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800/60 pb-1.5">
                    <span className="text-gray-500">PRIMARY CARRIER:</span>
                    <span className="text-[#00FF66] font-bold">
                      {mission.assignedSatellites?.[0]?.name || 'Autonomous Bus'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">LAUNCH BASE:</span>
                    <span className="text-gray-300 font-bold truncate max-w-[170px]">
                      {mission.launchSite || 'Cape Canaveral SFS'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to="/studio"
                    className="text-center py-2.5 px-3 rounded bg-[#00F0FF]/15 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-black font-bold text-[11px] tracking-wider uppercase transition-all border border-[#00F0FF]/40 shadow-[0_0_12px_rgba(0,240,255,0.15)]"
                  >
                    Open 3D Studio
                  </Link>
                  <Link
                    to={`/cubesat-sim?mission=${mission.missionId}`}
                    className="text-center py-2.5 px-3 rounded bg-[#00FF66]/15 hover:bg-[#00FF66] text-[#00FF66] hover:text-black font-bold text-[11px] tracking-wider uppercase transition-all border border-[#00FF66]/40 shadow-[0_0_12px_rgba(0,255,102,0.15)]"
                  >
                    Simulate Flight
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Assets & Alerts */}
        <div className="space-y-6">
          
          {/* Assigned Satellite Assets */}
          <div className="bg-[#0A0F1F] border border-gray-800 rounded-lg p-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-4">
              <h3 className="text-white font-mono text-sm tracking-widest uppercase">
                Assigned Assets ({mission.assignedSatellites?.length || 0})
              </h3>
              <button
                type="button"
                id="retrieve-satellite-header-btn"
                onClick={() => openRetrieveModal(mission.assignedSatellites?.[0] || null)}
                disabled={!mission.assignedSatellites || mission.assignedSatellites.length === 0}
                className="text-[10px] font-mono text-[#00FF66] hover:text-black hover:bg-[#00FF66] flex items-center space-x-1.5 bg-[#00FF66]/15 border border-[#00FF66]/40 px-3 py-1 rounded transition-all shadow-[0_0_12px_rgba(0,255,102,0.2)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer font-bold"
                title="Retrieve, deorbit, or disconnect a completed satellite from this mission"
              >
                <Radio size={12} className="text-[#00FF66]" />
                <span>RETRIEVE SATELLITE</span>
              </button>
            </div>
            {mission.assignedSatellites?.length === 0 ? (
              <div className="text-center font-mono text-xs text-gray-600 uppercase tracking-widest py-6">
                Autonomous CubeSat • No Secondary Bus
              </div>
            ) : (
              <div className="space-y-2">
                {mission.assignedSatellites.map(sat => (
                  <div key={sat._id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 bg-[#12192b]/50 rounded-lg border border-gray-800 hover:border-[#00F0FF]/40 transition-colors gap-2">
                    <div>
                      <div className="font-bold text-white text-sm tracking-tight">{sat.name}</div>
                      <div className="font-mono text-[10px] text-gray-400">
                        <span className="text-[#00F0FF] font-bold">{sat.satelliteId}</span> • {sat.orbitType}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {/* 1-Click Launch in CubeSat Simulator */}
                      <Link
                        to={`/cubesat-sim?sat=${sat.satelliteId}&mission=${mission.missionId}`}
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-[#00F0FF]/15 hover:bg-[#00F0FF]/30 text-[#00F0FF] border border-[#00F0FF]/30 font-mono text-[10px] font-bold uppercase tracking-wider transition-all"
                        title="Simulate this spacecraft in 3D simulator"
                      >
                        <Cpu size={10} />
                        <span>SIMULATE</span>
                      </Link>

                      {/* 1-Click Track in Orbital Viewer */}
                      <Link
                        to={`/orbit?sat=${sat.satelliteId}&mission=${mission.missionId}`}
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-[#00FF66]/15 hover:bg-[#00FF66]/30 text-[#00FF66] border border-[#00FF66]/30 font-mono text-[10px] font-bold uppercase tracking-wider transition-all"
                        title="Track this spacecraft in 3D orbital viewer"
                      >
                        <Globe2 size={10} />
                        <span>ORBIT</span>
                      </Link>

                      {/* Retrieve / Disconnect Directive */}
                      <button
                        type="button"
                        onClick={() => openRetrieveModal(sat)}
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-[#FFB000]/15 hover:bg-[#FFB000] text-[#FFB000] hover:text-black border border-[#FFB000]/40 font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                        title={`Retrieve or disconnect ${sat.name}`}
                      >
                        <Radio size={10} />
                        <span>RETRIEVE</span>
                      </button>

                      <Link 
                        to={`/satellites/${sat._id}`} 
                        className="px-2 py-1 rounded bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 font-mono text-[10px] uppercase tracking-wider transition-colors"
                      >
                        VIEW
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mission Alerts */}
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
                  <p className="text-gray-500 text-[10px] font-mono">Possible interference in {mission.orbitType || 'LEO'} orbit bands. Monitoring telemetry drops.</p>
                </div>
              </div>
              <div className="p-3 bg-gray-800/30 border border-gray-700/50 rounded flex space-x-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-1.5 shrink-0"></div>
                <div>
                  <p className="text-gray-300 text-xs font-mono mb-1">Routine Ground Station Window</p>
                  <p className="text-gray-500 text-[10px] font-mono">Tracking pass scheduled for 14:00 UTC. Nominal TX/RX handshake expected.</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
        
      </div>

      {/* Retrieve / Disconnect Modal */}
      {isRetrieveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0A0F1F] border border-gray-700 rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF]">
                  <Radio size={16} />
                </div>
                <div>
                  <h3 className="text-white font-mono font-bold text-sm uppercase tracking-wider">
                    SPACECRAFT DISPOSAL & RETRIEVAL DIRECTIVE
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    Mission: <span className="text-white font-bold">{mission.name}</span> ({mission.missionId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isExecutingDirective && setIsRetrieveModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Target Satellite Selector (if multiple) */}
            {mission.assignedSatellites?.length > 1 && (
              <div className="space-y-1.5 font-mono">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                  SELECT COMPLETED SATELLITE:
                </label>
                <select
                  value={retrieveTargetSat?._id || ''}
                  onChange={(e) => {
                    const found = mission.assignedSatellites.find(s => s._id === e.target.value);
                    if (found) setRetrieveTargetSat(found);
                  }}
                  disabled={isExecutingDirective}
                  className="w-full bg-[#050810] border border-gray-700 rounded px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#00F0FF] cursor-pointer"
                >
                  {mission.assignedSatellites.map(sat => (
                    <option key={sat._id} value={sat._id}>
                      {sat.name} ({sat.satelliteId} · {sat.orbitType})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selected Satellite Specs Summary */}
            {retrieveTargetSat && (
              <div className="bg-[#050810]/70 border border-gray-800 rounded-lg p-3 font-mono flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-400 text-[10px] block font-bold uppercase">TARGET ASSET</span>
                  <span className="text-white font-bold text-sm">{retrieveTargetSat.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 text-[10px] block font-bold uppercase">FLIGHT BUS / ORBIT</span>
                  <span className="text-[#00F0FF] font-bold font-mono">{retrieveTargetSat.satelliteId} • {retrieveTargetSat.orbitType}</span>
                </div>
              </div>
            )}

            {/* The 2 Options (Choose 1) */}
            <div className="space-y-3 font-mono">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                SELECT OPERATIONAL DIRECTIVE (CHOOSE 1):
              </span>

              {/* Option 1: RETRIEVE */}
              <div
                onClick={() => !isExecutingDirective && setSelectedDirective('RETRIEVE')}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 relative ${
                  selectedDirective === 'RETRIEVE'
                    ? 'bg-[#00FF66]/10 border-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.25)]'
                    : 'bg-[#050810]/50 border-gray-800 hover:border-gray-700 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <input
                      type="radio"
                      name="directiveOption"
                      checked={selectedDirective === 'RETRIEVE'}
                      onChange={() => setSelectedDirective('RETRIEVE')}
                      className="accent-[#00FF66] w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-white uppercase tracking-wider">
                          🪂 RETRIEVE SATELLITE
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40 uppercase">
                          CONTROLLED RECOVERY
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                        Initiate autonomous retro-burn deorbit sequence (<code className="text-[#00FF66]">CMD_PROP_DEORBIT_RETRO</code>). Spacecraft re-enters atmosphere into Pacific Recovery Corridor. Payloads and physical hardware will be safely collected and marked as RETRIEVED.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: DISCONNECT / LET IT GO */}
              <div
                onClick={() => !isExecutingDirective && setSelectedDirective('DISCONNECT')}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 relative ${
                  selectedDirective === 'DISCONNECT'
                    ? 'bg-[#FFB000]/10 border-[#FFB000] shadow-[0_0_15px_rgba(255,176,0,0.25)]'
                    : 'bg-[#050810]/50 border-gray-800 hover:border-gray-700 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <input
                      type="radio"
                      name="directiveOption"
                      checked={selectedDirective === 'DISCONNECT'}
                      onChange={() => setSelectedDirective('DISCONNECT')}
                      className="accent-[#FFB000] w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-white uppercase tracking-wider">
                          📡 DISCONNECT SATELLITE (LET IT GO)
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#FFB000]/20 text-[#FFB000] border border-[#FFB000]/40 uppercase">
                          GRAVEYARD ORBIT
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                        Transmit beacon termination sequence (<code className="text-[#FFB000]">CMD_COMMS_TRANSMITTER_KILL</code>). Sever active telemetry uplink, discharge batteries, disconnect from this mission, and let the spacecraft drift freely into disposal orbit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Directive Feedback Banner if Transmitting / Complete */}
            {directiveFeedback && (
              <div className={`p-3 rounded-lg border text-xs font-mono flex items-center space-x-2.5 ${
                directiveFeedback.type === 'success'
                  ? 'bg-[#00FF66]/15 border-[#00FF66]/40 text-[#00FF66]'
                  : 'bg-red-500/15 border-red-500/40 text-red-400'
              }`}>
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{directiveFeedback.message}</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setIsRetrieveModalOpen(false)}
                disabled={isExecutingDirective}
                className="px-4 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-gray-800/80 hover:bg-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                id="confirm-execute-directive-btn"
                onClick={handleExecuteDirective}
                disabled={isExecutingDirective || !retrieveTargetSat}
                className={`px-5 py-2.5 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 cursor-pointer ${
                  selectedDirective === 'RETRIEVE'
                    ? 'bg-[#00FF66] hover:bg-[#82FFB0] text-black shadow-[0_0_20px_rgba(0,255,102,0.4)]'
                    : 'bg-[#FFB000] hover:bg-[#ffd166] text-black shadow-[0_0_20px_rgba(255,176,0,0.4)]'
                }`}
              >
                {isExecutingDirective ? (
                  <>
                    <Send size={13} className="animate-spin text-black" />
                    <span>TRANSMITTING DIRECTIVE...</span>
                  </>
                ) : selectedDirective === 'RETRIEVE' ? (
                  <>
                    <Rocket size={13} className="text-black" />
                    <span>CONFIRM & RETRIEVE SATELLITE</span>
                  </>
                ) : (
                  <>
                    <Radio size={13} className="text-black" />
                    <span>CONFIRM & DISCONNECT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Launch Satellite Workflow Modal (Asks Assemble Themselves vs Use Presets) */}
      <DeployCubeSatModal
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
        initialMissionId={mission?._id}
        initialMissionObj={mission}
        initialTarget="MISSION"
        lockTarget={true}
        onCubeSatCreated={(data) => {
          fetchMissionDetail();
          setDirectiveFeedback({
            type: 'success',
            message: `Satellite "${data?.satellite?.name || 'CubeSat'}" successfully deployed to mission "${mission?.name}".`
          });
        }}
      />
    </div>
  );
}
