import React from 'react';
import { 
  Gauge, 
  Thermometer, 
  Cpu, 
  BatteryCharging, 
  Compass, 
  DownloadCloud, 
  HardDrive, 
  Flame, 
  Activity, 
  ChevronLeft 
} from 'lucide-react';

export default function SimTelemetryDrawer({
  metricsOpen,
  setMetricsOpen,
  sat,
  panelTransit,
  panelCountdown
}) {
  if (!metricsOpen) return null;

  return (
    <div className="absolute top-16 left-3 bottom-14 sm:bottom-16 w-80 sm:w-92 z-30 bg-[#0A0F1F]/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-in slide-in-from-left duration-250">
      {/* Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-[#0A0F1F]">
        <div className="flex items-center space-x-2">
          <Activity size={15} className="text-[#00FF66]" />
          <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
            TELEMETRY & SUBSYSTEMS
          </span>
        </div>
        <button
          id="close-metrics-panel-btn"
          onClick={() => setMetricsOpen(false)}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
          title="Close Telemetry HUD"
        >
          <ChevronLeft size={17} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {/* Metric 1: Orbital Speed */}
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-3 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-xs font-mono tracking-widest uppercase flex items-center">
              <Gauge size={14} className="mr-1.5 text-[#00F0FF]" /> ORBITAL SPEED
            </span>
            <span className="text-[10px] font-mono text-[#00FF66] bg-[#00FF66]/10 px-1.5 py-0.5 rounded">
              LEO REGIME
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {sat.speed}
            </span>
            <span className="text-xs font-mono text-gray-400">km/s</span>
            <span className="text-[10px] font-mono text-gray-500 ml-1">({(sat.speed * 3600).toFixed(0)} km/h)</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-gray-400 border-t border-gray-800/80 pt-1.5">
            <span>Altitude: <strong className="text-white">{sat.altitude} km</strong></span>
            <span>Period: <strong className="text-[#00F0FF]">94.8 min</strong></span>
          </div>
        </div>

        {/* Metric 2: Core Temperature */}
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-3 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-xs font-mono tracking-widest uppercase flex items-center">
              <Thermometer size={14} className="mr-1.5 text-[#FFB000]" /> CORE TEMPERATURE
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
              sat.heaterActive ? 'text-[#FFEA00] bg-[#FFD700]/20 border border-[#FFD700]/50' : 'text-gray-400 bg-gray-800/60'
            }`}>
              {sat.heaterActive ? 'HEATER ACTIVE' : 'NOMINAL'}
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-bold font-mono tracking-tight ${sat.heaterActive ? 'text-[#FFEA00]' : 'text-white'}`}>
              {sat.temperature?.bus >= 0 ? `+${sat.temperature?.bus}` : sat.temperature?.bus}°C
            </span>
            <span className="text-xs font-mono text-gray-500">BUS CORE</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] font-mono text-gray-400 border-t border-gray-800/80 pt-1.5">
            <div>SOL: <span className="text-[#FFB000] font-bold">+{sat.temperature?.solar}°C</span></div>
            <div>BAT: <span className="text-white font-bold">+{sat.temperature?.battery}°C</span></div>
            <div>RF: <span className="text-[#00F0FF] font-bold">+{sat.temperature?.radio}°C</span></div>
          </div>
        </div>

        {/* Metric 3: Processing & Load */}
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-3 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-xs font-mono tracking-widest uppercase flex items-center">
              <Cpu size={14} className="mr-1.5 text-[#00FF66]" /> PROCESSING & LOAD
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              POWER: <strong className="text-white">{sat.load?.busPower}W</strong>
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-bold font-mono tracking-tight ${
              sat.load?.cpu > 80 ? 'text-[#FF2A2A]' : sat.load?.cpu > 50 ? 'text-[#FFB000]' : 'text-white'
            }`}>
              {sat.load?.cpu}%
            </span>
            <span className="text-xs font-mono text-gray-500">CPU LOAD</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-gray-400 border-t border-gray-800/80 pt-1.5">
            <span>RAM: <strong className="text-white">{sat.load?.memory}%</strong></span>
            <span>Bus: <strong className="text-[#00FF66]">{sat.load?.busPower} W</strong></span>
          </div>
        </div>

        {/* Metric 4: Battery & Power Flow */}
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-3 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-xs font-mono tracking-widest uppercase flex items-center">
              <BatteryCharging size={14} className="mr-1.5 text-[#00F0FF]" /> BATTERY & POWER
            </span>
            <span className={`text-[10px] font-mono font-bold ${
              panelTransit === 'DEPLOYING' ? 'text-[#00F0FF] animate-pulse' :
              panelTransit === 'STOWING' ? 'text-[#FFB000] animate-pulse' :
              sat.solarPanelsDeployed ? 'text-[#00FF66]' : 'text-[#FFB000]'
            }`}>
              {panelTransit === 'DEPLOYING' ? `DEPLOYING (${panelCountdown}s)` :
               panelTransit === 'STOWING' ? `STOWING (${panelCountdown}s)` :
               sat.solarPanelsDeployed ? 'WINGS DEPLOYED' : 'WINGS STOWED'}
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {sat.battery}%
            </span>
            <span className="text-xs font-mono text-[#00FF66]">+32W CHARGING</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-gray-400 border-t border-gray-800/80 pt-1.5">
            <span>Propellant: <strong className="text-white">{sat.propellant}%</strong></span>
            <span>Link: <strong className="text-[#00F0FF]">{sat.snr} dB</strong></span>
          </div>
        </div>

        {/* Quick Subsystems Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
          <div className="bg-[#0B1221] border border-gray-800 rounded p-2">
            <span className="text-gray-500 text-[9px] block">ADCS STATUS</span>
            <span className="text-white font-bold flex items-center mt-0.5 text-[11px]">
              <Compass size={12} className="mr-1 text-[#00F0FF]" />
              {sat.attitude?.spinRate < 0.05 ? 'LOCKED' : 'TUMBLING'}
            </span>
          </div>

          <div className="bg-[#0B1221] border border-gray-800 rounded p-2">
            <span className="text-gray-500 text-[9px] block">PAYLOAD BUFF</span>
            <span className="text-white font-bold flex items-center mt-0.5 text-[11px]">
              <HardDrive size={12} className="mr-1 text-[#FFB000]" />
              {sat.load?.memory}% Full
            </span>
          </div>

          <div className="bg-[#0B1221] border border-gray-800 rounded p-2">
            <span className="text-gray-500 text-[9px] block">DOWNLINKED</span>
            <span className="text-white font-bold flex items-center mt-0.5 text-[11px]">
              <DownloadCloud size={12} className="mr-1 text-[#00FF66]" />
              {sat.packetsDownlinked.toLocaleString()} Pkts
            </span>
          </div>

          <div className="bg-[#0B1221] border border-gray-800 rounded p-2">
            <span className="text-gray-500 text-[9px] block">PROPELLANT</span>
            <span className="text-white font-bold flex items-center mt-0.5 text-[11px]">
              <Flame size={12} className="mr-1 text-[#FF2A2A]" />
              {sat.propellant}% Tank
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
