import React from 'react';
import { RadioTower, MapPin, Eye, Radio } from 'lucide-react';

export default function GroundStationDetailDrawer({
  activeStation,
  openDetailModal,
  setShowDiagnostics,
  handleRunDiagnostics
}) {
  const isDegraded = activeStation.status === 'DEGRADED';
  const isOffline = activeStation.status === 'OFFLINE';

  return (
    <div className="lg:col-span-4 bg-[#0A0F1F] border border-gray-800 rounded-lg p-5 flex flex-col justify-between shadow-2xl relative font-mono">
      <div>
        {/* Header: Station ID & Status Badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <RadioTower size={18} className="text-[#00F0FF]" />
            <h2 className="text-2xl font-bold text-white tracking-wider">
              {activeStation.stationId}
            </h2>
          </div>

          <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center space-x-1.5 ${
            isOffline 
              ? 'bg-[#FF2A2A]/15 text-[#FF2A2A] border border-[#FF2A2A]/40 shadow-[0_0_10px_rgba(255,42,42,0.2)]' 
              : isDegraded 
                ? 'bg-[#FFB000]/15 text-[#FFB000] border border-[#FFB000]/40' 
                : 'bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/40 shadow-[0_0_10px_rgba(0,255,102,0.15)]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isOffline ? 'bg-[#FF2A2A]' : isDegraded ? 'bg-[#FFB000]' : 'bg-[#00FF66] animate-pulse'
            }`}></span>
            <span>{isOffline ? 'OFFLINE' : isDegraded ? 'DEGRADED' : 'ACTIVE / NOMINAL'}</span>
          </span>
        </div>

        {/* Station Title & Location */}
        <div className="mb-4">
          <h3 className="text-white text-sm font-bold tracking-wider uppercase mb-1">
            {activeStation.name}
          </h3>
          <div className="flex items-center space-x-1.5 text-xs text-gray-400">
            <MapPin size={13} className="text-[#00F0FF]" />
            <span>
              {activeStation.locationName || `${activeStation.country} (${activeStation.latitude?.toFixed(2)}°, ${activeStation.longitude?.toFixed(2)}°)`}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-800/80 pt-4 space-y-4 text-xs">
          {/* Connected Satellites */}
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-bold">
              CONNECTED SATELLITES & ACTIVE PASSES
            </label>
            <div className="flex flex-wrap gap-1.5">
              {activeStation.connectedSatellites && activeStation.connectedSatellites.length > 0 ? (
                activeStation.connectedSatellites.map((sat, idx) => {
                  const satName = typeof sat === 'object' ? `${sat.satelliteId || 'SAT-001'} (${sat.name || 'ORION'})` : `SAT-${idx + 1}`;
                  return (
                    <button 
                      key={idx}
                      onClick={() => {
                        if (typeof sat === 'object') openDetailModal(sat);
                      }}
                      className="px-2.5 py-1 bg-[#121C36] hover:bg-[#182547] border border-[#00F0FF]/30 text-[#00F0FF] rounded font-bold text-xs tracking-wider transition-all shadow-sm flex items-center space-x-1"
                    >
                      <Eye size={11} />
                      <span>{satName}</span>
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 bg-[#121C36] border border-[#00F0FF]/30 text-[#00F0FF] rounded font-bold text-xs">
                    SAT-ALPHA-1 (Alpha One)
                  </span>
                  <span className="px-2.5 py-1 bg-[#121C36] border border-[#00F0FF]/30 text-[#00F0FF] rounded font-bold text-xs">
                    CUBESAT-ION (CubeSat Ion-X)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Signal Quality Bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="text-gray-500 uppercase tracking-widest text-[10px] font-bold">SIGNAL QUALITY</span>
              <span className={`font-bold ${
                (activeStation.signalQuality || 98) < 70 ? 'text-[#FFB000]' : 'text-[#00F0FF]'
              }`}>
                {activeStation.signalQuality || 98}%
              </span>
            </div>
            <div className="w-full bg-[#050810] h-2 rounded-full overflow-hidden border border-gray-800">
              <div 
                className={`h-full transition-all duration-500 shadow-sm ${
                  (activeStation.signalQuality || 98) < 70 
                    ? 'bg-gradient-to-r from-[#FFB000]/70 to-[#FFB000]' 
                    : 'bg-gradient-to-r from-[#00F0FF]/60 to-[#00F0FF]'
                }`}
                style={{ width: `${activeStation.signalQuality || 98}%` }}
              ></div>
            </div>
          </div>

          {/* Current Contact & Next Window */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="bg-[#050810] border border-gray-800 rounded p-2.5">
              <span className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">
                CURRENT CONTACT
              </span>
              <span className="text-white text-xs font-bold tracking-wider">
                {activeStation.lastContact 
                  ? new Date(activeStation.lastContact).toUTCString().slice(17, 25) + ' UTC' 
                  : '16:53:55 UTC'}
              </span>
            </div>

            <div className="bg-[#050810] border border-gray-800 rounded p-2.5">
              <span className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">
                NEXT WINDOW
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-white text-xs font-bold tracking-wider">
                  {activeStation.nextContact 
                    ? new Date(activeStation.nextContact).toUTCString().slice(17, 25) + ' UTC' 
                    : '18:21:55 UTC'}
                </span>
                <span className="text-[#FFB000] text-[10px] font-bold">
                  -00:23:05
                </span>
              </div>
            </div>
          </div>

          {/* Hardware Specs */}
          <div className="bg-[#050810] border border-gray-800 rounded p-2.5 space-y-1.5 text-[11px] text-gray-400">
            <div className="flex justify-between">
              <span className="text-gray-500">Antenna Aperture:</span>
              <span className="text-white font-bold">11.3m Parabolic Reflector</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Downlink Band:</span>
              <span className="text-[#00F0FF] font-bold">2.2 GHz S-Band / 8.4 GHz X-Band</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tracking Servo:</span>
              <span className="text-[#00FF66] font-bold">AZ/EL Full Steerable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action: Open Diagnostics */}
      <div className="mt-5 pt-3 border-t border-gray-800">
        <button
          id="open-diagnostics-btn"
          onClick={() => {
            setShowDiagnostics(true);
            handleRunDiagnostics();
          }}
          className="w-full flex items-center justify-center space-x-2 bg-[#00F0FF]/15 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-[#0A0F1F] border border-[#00F0FF]/60 hover:border-[#00F0FF] py-3 rounded text-xs font-mono font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
        >
          <Radio size={14} className="animate-pulse" />
          <span>DIAGNOSTICS</span>
        </button>
      </div>
    </div>
  );
}
