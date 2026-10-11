import React from 'react';
import { Radio } from 'lucide-react';

function GlobeTelemetryBar({
  satName,
  formFactor,
  uiTelemetry
}) {
  return (
    <div className="absolute bottom-3 left-3 right-3 bg-[#0A0F1F]/90 backdrop-blur-md border border-gray-800 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-xl z-10 pointer-events-auto">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
          <span className="text-white font-bold">{satName} ({formFactor})</span>
        </div>
        <div className="text-gray-400">
          POSITION: <strong className="text-white">
            {uiTelemetry.lat >= 0 ? `${uiTelemetry.lat}° N` : `${Math.abs(uiTelemetry.lat)}° S`}, {uiTelemetry.lng >= 0 ? `${uiTelemetry.lng}° E` : `${Math.abs(uiTelemetry.lng)}° W`}
          </strong>
        </div>
        <div className="text-gray-400 hidden sm:inline">
          HEADING: <strong className="text-[#00F0FF]">{uiTelemetry.heading}°</strong>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5">
          <Radio size={12} className={uiTelemetry.activeStations.length > 0 ? 'text-[#00FF66] animate-pulse' : 'text-gray-500'} />
          <span className="text-gray-400">LINK: </span>
          <span className={uiTelemetry.activeStations.length > 0 ? 'text-[#00FF66] font-semibold' : 'text-gray-500'}>
            {uiTelemetry.connectedStationName}
          </span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(GlobeTelemetryBar);
