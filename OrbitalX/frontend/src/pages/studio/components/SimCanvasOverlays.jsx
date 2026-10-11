import React from 'react';
import { Gauge, Thermometer, Flame, Zap } from 'lucide-react';

function SimCanvasOverlays({
  showEmbeddedHud,
  status,
  formFactor,
  solarPanelsDeployed,
  panelHudSpanRef,
  heaterActive,
  speed,
  isThrusting
}) {
  return (
    <>
      {showEmbeddedHud && (
        <>
          {/* TOP-LEFT HUD BADGE */}
          <div className="absolute top-3 left-3 bg-[#0A0F1F]/90 backdrop-blur-md border border-gray-800 rounded-lg px-3 py-2 text-[11px] font-mono text-gray-300 flex items-center space-x-2.5 shadow-xl z-10">
            <div className={`w-2 h-2 rounded-full ${
              status === 'SAFE_MODE' ? 'bg-[#FF2A2A]' : 'bg-[#00F0FF]'
            } animate-ping`} />
            <span className="font-bold text-white tracking-wide">{formFactor} BUS CLOSE-UP</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">PANELS: </span>
            <span className={solarPanelsDeployed ? 'text-[#00FF66] font-semibold flex items-center' : 'text-[#FFB000] font-semibold flex items-center'}>
              <Zap size={11} className="mr-1" />
              <span ref={panelHudSpanRef}>
                {solarPanelsDeployed ? 'DEPLOYED (COPLANAR)' : 'STOWED (ORIGAMI Z-FOLD)'}
              </span>
            </span>
          </div>

          {/* TOP-RIGHT SPEED & HEATER STATUS HUD */}
          <div className="absolute top-3 right-3 flex items-center space-x-2.5 z-10">
            <div className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg border font-mono text-xs backdrop-blur-md shadow-xl transition-all ${
              heaterActive
                ? 'bg-[#FFD700]/25 border-[#FFD700] text-[#FFEA00] shadow-[0_0_20px_rgba(255,234,0,0.4)]'
                : 'bg-[#0A0F1F]/90 border-gray-800 text-gray-400'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                heaterActive ? 'bg-[#FFEA00] animate-pulse shadow-[0_0_12px_#ffea00]' : 'bg-gray-700'
              }`} />
              <Thermometer size={14} className={heaterActive ? 'text-[#FFEA00]' : 'text-gray-500'} />
              <span className="font-bold tracking-wide">
                {heaterActive ? 'HEATER: ON (YELLOW BEACON ACTIVE)' : 'HEATER: OFF'}
              </span>
            </div>

            <div className="flex items-center space-x-2.5 bg-[#0A0F1F]/90 backdrop-blur-md border border-gray-800 rounded-lg px-3.5 py-2 font-mono shadow-xl">
              <Gauge size={16} className="text-[#00F0FF]" />
              <div>
                <div className="text-[9px] text-gray-400 tracking-wider">ORBITAL SPEED</div>
                <div className="text-white font-bold text-sm flex items-baseline space-x-1">
                  <span className="text-[#00F0FF] text-base">{speed}</span>
                  <span className="text-[10px] text-gray-400">km/s</span>
                  <span className="text-[10px] text-gray-500 ml-1">({(speed * 3600).toFixed(0)} km/h)</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* THRUSTER CLOUD BURST ACTIVE POPUP BANNER */}
      {(isThrusting || status === 'THRUSTER_BURN') && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#FF6600]/25 border-2 border-[#FF6600] backdrop-blur-md text-[#FFAA00] px-5 py-2 rounded-full font-mono text-xs font-bold flex items-center space-x-2.5 shadow-[0_0_30px_rgba(255,102,0,0.5)] animate-bounce z-10">
          <Flame size={16} className="text-[#FF6600] animate-pulse" />
          <span>COLD-GAS CLOUD BURST FIRING (ORANGE GAS CLOUDS ACTIVE)</span>
        </div>
      )}
    </>
  );
}

export default React.memo(SimCanvasOverlays);
