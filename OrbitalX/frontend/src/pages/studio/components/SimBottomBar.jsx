import React from 'react';
import { Gauge } from 'lucide-react';

export default function SimBottomBar({ sat }) {
  return (
    <div className="absolute bottom-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto z-20 pointer-events-auto bg-[#0A0F1F]/92 backdrop-blur-md border border-gray-800 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between sm:justify-center gap-4 text-xs font-mono shadow-2xl">
      <div className="flex items-center space-x-1.5 text-[#00F0FF]">
        <Gauge size={14} />
        <span className="text-gray-400">SPEED:</span>
        <strong className="text-white text-sm">{sat.speed} km/s</strong>
      </div>
      <div className="hidden sm:block text-gray-700">|</div>
      <div>
        <span className="text-gray-500">ATTITUDE: </span>
        <span className="text-white font-semibold">
          R:{sat.attitude?.roll}° P:{sat.attitude?.pitch}° Y:{sat.attitude?.yaw}°
        </span>
      </div>
      <div className="hidden sm:block text-gray-700">|</div>
      <div>
        <span className="text-gray-500">POINTING: </span>
        <span className="text-[#00F0FF] font-semibold">{sat.attitude?.mode}</span>
      </div>
      <div className="hidden sm:block text-gray-700">|</div>
      <div>
        <span className="text-gray-500">HEATER: </span>
        <span className={sat.heaterActive ? 'text-[#FFEA00] font-bold' : 'text-gray-400'}>
          {sat.heaterActive ? 'ON (BEACON ACTIVE)' : 'OFF'}
        </span>
      </div>
      <div className="hidden sm:block text-gray-700">|</div>
      <div className="flex items-center space-x-1.5">
        <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
        <span className="text-gray-400">GS: </span>
        <span className="text-white">{sat.groundStation}</span>
      </div>
    </div>
  );
}
