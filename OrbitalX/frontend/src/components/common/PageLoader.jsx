import React from 'react';

export default function PageLoader() {
  return (
    <div className="h-[60vh] w-full flex flex-col items-center justify-center space-y-4">
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Outer pulsating orbital ring */}
        <div className="absolute inset-0 rounded-full border-2 border-[#00F0FF]/20 border-t-[#00F0FF] animate-spin"></div>
        {/* Inner reverse spin ring */}
        <div className="w-8 h-8 rounded-full border-2 border-[#00FF66]/20 border-b-[#00FF66] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}></div>
        {/* Center core dot */}
        <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse"></div>
      </div>
      
      <div className="flex flex-col items-center space-y-1">
        <span className="font-mono text-xs tracking-widest text-white uppercase font-bold">
          INITIALIZING TELEMETRY STREAM
        </span>
        <span className="font-mono text-[10px] text-gray-500 tracking-wider">
          SYNCHRONIZING ORBITAL DATA...
        </span>
      </div>
    </div>
  );
}
