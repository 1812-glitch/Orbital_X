import React from 'react';
import { Terminal } from 'lucide-react';

export default function Diagnostics() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[800px]">
      
      {/* Header */}
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Core Diagnostics</h1>
        <p className="text-gray-400 font-mono text-xs uppercase tracking-widest flex items-center justify-between">
          <span>SYSTEM HEALTH OVERVIEW</span>
          <span className="text-[#00F0FF]">AUTO-REFRESH: ON</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* API */}
        <div className="bg-[#0B1221] border border-gray-800 rounded p-6 relative overflow-hidden group">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]"></div>
          <p className="text-[10px] font-mono text-gray-500 tracking-widest uppercase mb-2">API Connection</p>
          <p className="text-white font-bold tracking-widest">CONNECTED</p>
        </div>

        {/* WS */}
        <div className="bg-[#0B1221] border border-gray-800 rounded p-6 relative overflow-hidden group">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]"></div>
          <p className="text-[10px] font-mono text-gray-500 tracking-widest uppercase mb-2">Websocket Stream</p>
          <p className="text-white font-bold tracking-widest">CONNECTED</p>
        </div>

        {/* SIM */}
        <div className="bg-[#0B1221] border border-gray-800 rounded p-6 relative overflow-hidden group">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]"></div>
          <p className="text-[10px] font-mono text-gray-500 tracking-widest uppercase mb-2">Simulation Engine</p>
          <p className="text-white font-bold tracking-widest">RUNNING</p>
        </div>

        {/* DB */}
        <div className="bg-[#0B1221] border border-gray-800 rounded p-6 relative overflow-hidden group">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]"></div>
          <p className="text-[10px] font-mono text-gray-500 tracking-widest uppercase mb-2">Database Uplink</p>
          <p className="text-white font-bold tracking-widest">SYNCED</p>
        </div>

      </div>

      <div className="flex justify-end pt-4 border-t border-gray-800">
        <button className="flex items-center text-gray-500 hover:text-[#00F0FF] text-[10px] font-mono uppercase tracking-widest transition-colors">
          <Terminal size={14} className="mr-2" />
          View Raw Logs
        </button>
      </div>

    </div>
  );
}
