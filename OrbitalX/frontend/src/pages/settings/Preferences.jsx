import React from 'react';
import { Settings as SettingsIcon, Shield, Monitor, Smartphone } from 'lucide-react';

export default function Preferences() {

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Configuration Matrix</h1>
        <p className="text-[#00F0FF] font-mono text-xs uppercase tracking-widest flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] mr-2"></span>
          System synchronization active. Awaiting operator input.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Environment Preferences */}
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-6">
          <h3 className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-6 flex items-center">
            <SettingsIcon size={14} className="mr-2" /> Environment Preferences
          </h3>

          <div className="space-y-4">
            <div className="border border-gray-800 rounded p-4 flex justify-between items-center bg-[#050810]">
              <div>
                <p className="text-sm text-white mb-1">Interface Theme</p>
                <p className="text-[10px] text-gray-500 font-mono tracking-widest">Force dark mode or system default</p>
              </div>
              <div className="flex border border-gray-700 rounded overflow-hidden">
                <button className="bg-gray-800 text-gray-300 px-3 py-1 text-[10px] font-mono tracking-widest">DARK</button>
                <button className="bg-[#050810] text-gray-500 hover:text-gray-300 px-3 py-1 text-[10px] font-mono tracking-widest">AUTO</button>
              </div>
            </div>

            <div className="border border-[#00F0FF]/30 rounded p-4 bg-[#00F0FF]/5">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-white">Simulation Time Dilation</p>
                <span className="bg-[#121C36] border border-[#00F0FF]/30 text-[#00F0FF] px-2 py-0.5 rounded text-[10px] font-mono">1.0x</span>
              </div>
              <input type="range" className="w-full accent-[#00F0FF] mb-2 bg-gray-800 h-1 appearance-none rounded" min="0.1" max="5" step="0.1" defaultValue="1" />
              <div className="flex justify-between text-[10px] font-mono text-gray-500 tracking-widest">
                <span>MIN (0.1x)</span>
                <span>MAX (5.0x)</span>
              </div>
            </div>

            <div className="border border-gray-800 rounded p-4 flex justify-between items-center bg-[#050810]">
              <div>
                <p className="text-sm text-white mb-1">Global Notifications</p>
                <p className="text-[10px] text-gray-500 font-mono tracking-widest">Telemetry and system alerts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00F0FF]"></div>
              </label>
            </div>

            <div className="border border-gray-800 rounded p-4 bg-[#050810]">
              <p className="text-sm text-white mb-2">Primary Tracking Target</p>
              <select className="w-full bg-[#121C36] border border-gray-700 text-gray-300 rounded p-2 text-xs font-mono outline-none focus:border-[#00F0FF]">
                <option>SAT-ALPHA (Geo-Sync)</option>
                <option>SAT-BETA (LEO)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & Access (Placeholder for matrix view) */}
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-6">
            <h3 className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-6 flex items-center justify-between">
              <span className="flex items-center"><Shield size={14} className="mr-2" /> Access Control</span>
              <span className="border border-[#00FF66]/30 text-[#00FF66] px-2 py-0.5 rounded bg-[#00FF66]/10">SECURE</span>
            </h3>
            
            <p className="text-xs text-white mb-4">Active Sessions</p>
            
            <div className="space-y-3">
              <div className="border border-[#00FF66]/30 rounded p-4 flex items-center bg-[#00FF66]/5 relative overflow-hidden">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#00FF66] rounded-full shadow-[0_0_5px_#00FF66]"></div>
                <Monitor className="text-[#00FF66] mr-4" size={20} />
                <div>
                  <p className="text-sm text-white">Main Console (Current)</p>
                  <p className="text-[10px] text-gray-500 font-mono tracking-widest">IP: 192.168.1.104 • Location: Command Center</p>
                </div>
              </div>

              <div className="border border-gray-800 rounded p-4 flex items-center justify-between bg-[#050810]">
                <div className="flex items-center">
                  <Smartphone className="text-gray-500 mr-4" size={20} />
                  <div>
                    <p className="text-sm text-gray-300">Mobile Uplink</p>
                    <p className="text-[10px] text-gray-600 font-mono tracking-widest">IP: 10.0.0.52 • Last active: 2h ago</p>
                  </div>
                </div>
                <button className="text-[10px] text-[#FFB000] font-mono tracking-widest hover:underline">TERMINATE</button>
              </div>
            </div>

            <div className="flex justify-between space-x-4 border-t border-gray-800 mt-6 pt-6">
              <button className="w-1/2 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/10 py-2 rounded text-[10px] font-mono tracking-widest uppercase transition-colors">
                Change Cipher
              </button>
              <button className="w-1/2 border border-[#FF2A2A]/30 text-[#FF2A2A] hover:bg-[#FF2A2A]/10 py-2 rounded text-[10px] font-mono tracking-widest uppercase transition-colors">
                Purge All Sessions
              </button>
            </div>
        </div>

      </div>
    </div>
  );
}
