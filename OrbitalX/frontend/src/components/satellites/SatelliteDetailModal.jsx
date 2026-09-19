import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Globe, 
  Activity, 
  Radio, 
  BatteryCharging, 
  Thermometer, 
  Cpu, 
  Compass, 
  ExternalLink,
  ShieldCheck,
  RadioTower,
  Zap
} from 'lucide-react';
import { useSatellite } from '../../context/SatelliteContext';

export default function SatelliteDetailModal() {
  const { isDetailModalOpen, modalSatellite, closeDetailModal, selectSatellite } = useSatellite();
  const navigate = useNavigate();

  if (!isDetailModalOpen || !modalSatellite) return null;

  const sat = modalSatellite;
  const isCubeSat = (sat.type || '').toUpperCase().includes('CUBESAT') || (sat.name || '').toLowerCase().includes('cubesat');
  
  // Safe default metrics if not populated in current satellite object
  const altitude = sat.altitude || (sat.orbitType === 'GEO' ? 35786 : sat.orbitType === 'MEO' ? 20200 : 550);
  const velocity = sat.velocity || (sat.orbitType === 'GEO' ? 3.07 : sat.orbitType === 'MEO' ? 3.87 : 7.66);
  const batteryPct = sat.batteryLevel ?? 92;
  const solarGen = sat.solarPower ?? (isCubeSat ? 18.5 : 240);
  const tempC = sat.temperature ?? 24.2;
  const signalDbm = sat.signalStrength ?? -72;

  const handleNavigate = (path) => {
    selectSatellite(sat);
    closeDetailModal();
    navigate(path);
  };

  return (
    <div 
      id="satellite-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target.id === 'satellite-detail-modal-backdrop') closeDetailModal();
      }}
    >
      <div 
        className="relative w-full max-w-3xl bg-[#0A0F1F] border border-gray-700/90 rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.95)] overflow-hidden font-sans text-gray-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Accent Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#00F0FF] via-[#00FF66] to-[#82E6E6]" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-800 flex items-start justify-between bg-[#070C18]">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-[#121C36] border border-[#00F0FF]/30 rounded-xl text-[#00F0FF] shrink-0 mt-0.5">
              <Globe size={24} className="animate-spin-slow" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wider font-mono uppercase">
                  {sat.name}
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                  {sat.satelliteId}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-800 text-gray-300 border border-gray-700">
                  {sat.orbitType || 'LEO'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-gray-400 mt-1.5">
                <span>NORAD: <strong className="text-gray-200">{sat.noradId || '98234'}</strong></span>
                <span>•</span>
                <span>TYPE: <strong className="text-gray-200">{sat.type || (isCubeSat ? '3U CubeSat' : 'Bus Satellite')}</strong></span>
                <span>•</span>
                <div className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    sat.status === 'CRITICAL' ? 'bg-[#FF2A2A] shadow-[0_0_8px_#FF2A2A]' :
                    sat.status === 'WARNING' ? 'bg-[#FFB000] shadow-[0_0_8px_#FFB000]' :
                    'bg-[#00FF66] shadow-[0_0_8px_#00FF66]'
                  }`} />
                  <span className={`font-bold ${
                    sat.status === 'CRITICAL' ? 'text-[#FF2A2A]' :
                    sat.status === 'WARNING' ? 'text-[#FFB000]' :
                    'text-[#00FF66]'
                  }`}>
                    {sat.status || 'NOMINAL'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            id="close-satellite-detail-modal-btn"
            onClick={closeDetailModal}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Close Modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Shortcuts Bar */}
        <div className="px-5 sm:px-6 py-2.5 bg-[#0B1426] border-b border-gray-800 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-gray-500 mr-1 text-[11px] uppercase tracking-wider">QUICK ACTIONS:</span>
          
          <button
            onClick={() => handleNavigate('/orbit')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/40 font-bold transition-colors"
          >
            <Globe size={13} />
            <span>3D ORBIT VIEW</span>
          </button>

          <button
            onClick={() => handleNavigate('/telemetry')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#121C36] hover:bg-[#182649] text-gray-200 hover:text-white border border-gray-700 hover:border-[#00F0FF]/50 font-bold transition-colors"
          >
            <Activity size={13} className="text-[#00FF66]" />
            <span>TELEMETRY STREAM</span>
          </button>

          <button
            onClick={() => handleNavigate('/communications')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#121C36] hover:bg-[#182649] text-gray-200 hover:text-white border border-gray-700 hover:border-[#00F0FF]/50 font-bold transition-colors"
          >
            <Radio size={13} className="text-[#FFB000]" />
            <span>COMMS UPLINK</span>
          </button>

          <button
            onClick={() => handleNavigate(`/satellites/${sat._id || sat.satelliteId}`)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ml-auto"
          >
            <span>FULL PROFILE</span>
            <ExternalLink size={12} />
          </button>
        </div>

        {/* Modal Body: Subsystems & Live Specs */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          
          {/* 1. Realtime Telemetry KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#070C18] border border-gray-800/90 rounded-xl">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">ALTITUDE</span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-xl font-bold font-mono text-white">{Math.round(altitude).toLocaleString()}</span>
                <span className="text-xs text-gray-400 font-mono">km</span>
              </div>
              <span className="text-[9px] text-[#00FF66] font-mono">ORBIT STABLE</span>
            </div>

            <div className="p-3 bg-[#070C18] border border-gray-800/90 rounded-xl">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">ORBITAL SPEED</span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-xl font-bold font-mono text-white">{Number(velocity).toFixed(2)}</span>
                <span className="text-xs text-gray-400 font-mono">km/s</span>
              </div>
              <span className="text-[9px] text-[#00F0FF] font-mono">MACH 22.4</span>
            </div>

            <div className="p-3 bg-[#070C18] border border-gray-800/90 rounded-xl">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">BATTERY STATE</span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-xl font-bold font-mono text-[#00FF66]">{batteryPct}%</span>
                <span className="text-xs text-gray-400 font-mono">SoC</span>
              </div>
              <span className="text-[9px] text-gray-400 font-mono">28.4V BUS</span>
            </div>

            <div className="p-3 bg-[#070C18] border border-gray-800/90 rounded-xl">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">CORE TEMP</span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-xl font-bold font-mono text-white">{Number(tempC).toFixed(1)}</span>
                <span className="text-xs text-gray-400 font-mono">°C</span>
              </div>
              <span className="text-[9px] text-[#00FF66] font-mono">THERMAL NOMINAL</span>
            </div>
          </div>

          {/* 2. Subsystems Status & Health Matrix */}
          <div className="bg-[#070C18] border border-gray-800 rounded-xl p-4">
            <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <ShieldCheck size={14} className="text-[#00FF66]" />
              <span>SUBSYSTEM OPERATIONAL STATUS</span>
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono text-xs">
              <div className="p-2.5 bg-[#0A0F1F] border border-gray-800 rounded-lg flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-400 text-[10px]">
                  <span>OBC</span>
                  <Cpu size={12} className="text-[#00F0FF]" />
                </div>
                <span className="font-bold text-white text-xs mt-1">ARM Cortex-M7</span>
                <span className="text-[10px] text-[#00FF66] font-semibold mt-0.5">NOMINAL (99%)</span>
              </div>

              <div className="p-2.5 bg-[#0A0F1F] border border-gray-800 rounded-lg flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-400 text-[10px]">
                  <span>EPS</span>
                  <Zap size={12} className="text-[#FFB000]" />
                </div>
                <span className="font-bold text-white text-xs mt-1">+{solarGen}W Solar</span>
                <span className="text-[10px] text-[#00FF66] font-semibold mt-0.5">GENERATING</span>
              </div>

              <div className="p-2.5 bg-[#0A0F1F] border border-gray-800 rounded-lg flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-400 text-[10px]">
                  <span>ADCS</span>
                  <Compass size={12} className="text-[#82E6E6]" />
                </div>
                <span className="font-bold text-white text-xs mt-1">Nadir Pointing</span>
                <span className="text-[10px] text-[#00FF66] font-semibold mt-0.5">LOCKED ±0.05°</span>
              </div>

              <div className="p-2.5 bg-[#0A0F1F] border border-gray-800 rounded-lg flex flex-col justify-between">
                <div className="flex items-center justify-between text-gray-400 text-[10px]">
                  <span>COMMS</span>
                  <Radio size={12} className="text-[#00F0FF]" />
                </div>
                <span className="font-bold text-white text-xs mt-1">S-Band Carrier</span>
                <span className="text-[10px] text-[#00FF66] font-semibold mt-0.5">{signalDbm} dBm</span>
              </div>

              <div className="p-2.5 bg-[#0A0F1F] border border-gray-800 rounded-lg flex flex-col justify-between col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-gray-400 text-[10px]">
                  <span>PAYLOAD</span>
                  <Activity size={12} className="text-purple-400" />
                </div>
                <span className="font-bold text-white text-xs mt-1">Multispectral</span>
                <span className="text-[10px] text-[#00F0FF] font-semibold mt-0.5">STANDBY</span>
              </div>
            </div>
          </div>

          {/* 3. Pass Prediction & Ground Station Link */}
          <div className="bg-[#070C18] border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#121C36] border border-[#00FF66]/30 rounded-lg text-[#00FF66]">
                <RadioTower size={16} />
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">NEXT GROUND STATION PASS</span>
                <span className="font-bold text-white text-xs sm:text-sm">Canberra Complex (GS-004)</span>
                <span className="text-gray-500 block text-[11px]">AOS in 18 min 40 sec • Duration: 08:32 min • Max Elevation: 68°</span>
              </div>
            </div>

            <button
              onClick={() => handleNavigate('/ground-stations')}
              className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[11px] font-bold transition-colors whitespace-nowrap"
            >
              STATION STATUS →
            </button>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#070C18] border-t border-gray-800 flex items-center justify-between text-xs font-mono text-gray-500">
          <span>ORBITAL-X ASSET TELEMETRY HUB</span>
          <button
            onClick={closeDetailModal}
            className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold transition-colors"
          >
            CLOSE
          </button>
        </div>

      </div>
    </div>
  );
}
