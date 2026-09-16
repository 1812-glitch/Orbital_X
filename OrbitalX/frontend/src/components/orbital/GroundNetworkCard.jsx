import React from 'react';
import { RadioTower } from 'lucide-react';

export default function GroundNetworkCard({ groundStations = [] }) {
  return (
    <div className="bg-[#0A0F1F] border border-gray-800 p-4 rounded-lg">
      <h3 className="text-white font-mono text-xs tracking-widest uppercase border-b border-gray-800 pb-2 mb-3 flex items-center justify-between">
        <span>Ground Network</span>
        <RadioTower size={14} className="text-[#00F0FF]" />
      </h3>
      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
        {groundStations.map((gs) => (
          <div
            key={gs._id || gs.stationId}
            className="flex flex-col p-2 bg-[#12192b]/50 rounded border border-gray-800"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-white truncate">{gs.name}</span>
              <span
                className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono ${
                  gs.status === 'ACTIVE' || gs.status === 'OPERATIONAL'
                    ? 'bg-[#00F0FF]/10 text-[#00F0FF]'
                    : 'bg-yellow-500/10 text-yellow-500'
                }`}
              >
                {gs.status}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
              <span>{gs.country}</span>
              <span className="text-gray-500">{gs.stationId}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
