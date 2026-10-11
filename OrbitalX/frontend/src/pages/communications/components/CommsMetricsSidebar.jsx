import React from 'react';
import { Activity, X, ShieldCheck } from 'lucide-react';

export default function CommsMetricsSidebar({
  showMetricsSidebar,
  setShowMetricsSidebar,
  currentSat
}) {
  if (!showMetricsSidebar) return null;

  return (
    <div className="xl:col-span-3 w-full bg-[#0A0F1F] border border-gray-800 rounded-lg p-4 flex flex-col justify-between shadow-xl space-y-4 animate-in fade-in slide-in-from-right duration-200">
      <div>
        {/* Sidebar Header with Close Button */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <Activity size={14} className="text-[#00F0FF]" />
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              COMM METRICS
            </h3>
          </div>
          
          <button
            onClick={() => setShowMetricsSidebar(false)}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
            title="Close Metrics Sidebar (Maximize Terminal)"
          >
            <X size={14} />
          </button>
        </div>

        {/* Selected Target Quick Overview Card */}
        <div className="bg-[#12192b]/70 border border-gray-800 rounded p-3 mb-4 font-mono">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">TARGET IN FOCUS</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30">
              ONLINE
            </span>
          </div>
          <div className="text-sm font-bold text-white mb-1">
            {currentSat.satelliteId} - {currentSat.name}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 pt-2 border-t border-gray-800/80">
            <div>
              <span className="text-gray-500 block">TYPE</span>
              <span className="text-gray-200">{currentSat.type || 'CubeSat 3U'}</span>
            </div>
            <div>
              <span className="text-gray-500 block">ORBIT</span>
              <span className="text-[#00F0FF]">{currentSat.orbitType || 'LEO-POLAR'}</span>
            </div>
          </div>
        </div>

        {/* Signal Strength & Latency Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="bg-[#121C36]/70 border border-gray-800 rounded p-2.5 font-mono">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">
              SIGNAL STR
            </span>
            <div className="text-lg font-bold text-white mb-1.5">
              -62 <span className="text-xs font-normal text-gray-400">dBm</span>
            </div>
            <div className="flex items-end space-x-1 h-3">
              <span className="w-1.5 h-1 bg-[#00F0FF] rounded-xs"></span>
              <span className="w-1.5 h-1.5 bg-[#00F0FF] rounded-xs"></span>
              <span className="w-1.5 h-2 bg-[#00F0FF] rounded-xs"></span>
              <span className="w-1.5 h-2.5 bg-[#00F0FF] rounded-xs"></span>
              <span className="w-1.5 h-3 bg-[#00F0FF] rounded-xs"></span>
            </div>
          </div>

          <div className="bg-[#121C36]/70 border border-gray-800 rounded p-2.5 font-mono">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">
              LATENCY
            </span>
            <div className="text-lg font-bold text-white mb-1.5">
              124 <span className="text-xs font-normal text-gray-400">ms</span>
            </div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#00FF66] h-full w-[35%]"></div>
            </div>
          </div>
        </div>

        {/* Link Parameters Table */}
        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between py-1 border-b border-gray-800/60">
            <span className="text-gray-500">Link Status</span>
            <span className="text-[#00FF66] font-bold">CONNECTED</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-gray-800/60">
            <span className="text-gray-500">Last Contact</span>
            <span className="text-white">14:22:05 UTC</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-gray-800/60">
            <span className="text-gray-500">Ground Station</span>
            <span className="text-[#00F0FF] font-bold">GS-001 INDIA</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-gray-800/60">
            <span className="text-gray-500">Protocol</span>
            <span className="text-gray-300">S-BAND XFER</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-gray-500">Encryption</span>
            <span className="text-[#00FF66] font-bold flex items-center space-x-1">
              <ShieldCheck size={12} />
              <span>AES-256</span>
            </span>
          </div>
        </div>
      </div>

      {/* Quick Frequency Uplink Indicator */}
      <div className="p-2.5 rounded bg-[#0A1628] border border-gray-800 text-[10px] font-mono text-gray-400 flex items-center justify-between mt-2">
        <span>UPLINK FREQ: 2025.5 MHz</span>
        <span className="text-[#00F0FF] font-bold">LOCKED</span>
      </div>
    </div>
  );
}
