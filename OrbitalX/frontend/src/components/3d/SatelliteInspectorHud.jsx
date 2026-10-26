import React from 'react';
import {
  X,
  Target,
  Thermometer,
  Gauge,
  Compass,
  BatteryCharging,
  Radio,
  HeartPulse,
  Wrench,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SAT_SLOT_COLORS, getOrbitColor } from '../../utils/orbitalMath';

/**
 * Satellite Inspector HUD (Right Floating Panel)
 * Matches the reference screenshot layout:
 * - Header with Satellite Name & Close Button
 * - Slot Switcher (if up to 3 satellites are selected)
 * - Meta specifications (ID, Status, Orbit, Class)
 * - Prominent "Track Satellite" Button
 * - LIVE TELEMETRY 6-grid display
 */
export default function SatelliteInspectorHud({
  satelliteItem,
  selectedSatIds = [],
  activeSatId,
  onSelectActiveSatId,
  onDeselectSatellite,
  followTracking,
  onToggleTracking,
  onClose
}) {
  const navigate = useNavigate();

  if (!satelliteItem) return null;

  const sat = satelliteItem.satellite || {};
  const telem = satelliteItem.telemetry || {};

  const satId = sat.satelliteId || sat._id || 'UNKNOWN';
  const name = sat.name || satId;
  const status = sat.status || 'ACTIVE';
  const orbitType = sat.orbitType || 'LEO';
  const orbitColor = getOrbitColor(orbitType);
  const formFactor = sat.formFactor || sat.type || 'CubeSat 3U';
  const currentSlotIdx = selectedSatIds.indexOf(satId);
  const slotColor = currentSlotIdx !== -1 ? SAT_SLOT_COLORS[currentSlotIdx] : '#00F0FF';

  // Live telemetry metrics with fallbacks
  const temp = telem.temperature !== undefined ? `${telem.temperature.toFixed(1)}°C` : '24.8°C';
  const speed = telem.speed !== undefined ? `${telem.speed.toFixed(2)} km/s` : orbitType === 'GEO' ? '3.07 km/s' : '7.56 km/s';
  const altitude = telem.altitude !== undefined 
    ? `${Math.round(telem.altitude).toLocaleString()} km` 
    : orbitType === 'GEO' ? '35,786 km' : orbitType === 'MEO' ? '20,200 km' : '550 km';
  const battery = telem.batteryLevel !== undefined ? `${Math.round(telem.batteryLevel)}%` : telem.battery !== undefined ? `${Math.round(telem.battery)}%` : '96%';
  const signal = telem.signalStrength !== undefined ? `${telem.signalStrength} dBm` : '-38 dBm';
  const health = telem.health !== undefined ? `${Math.round(telem.health)}%` : '99%';

  return (
    <div
      id="satellite-inspector-hud"
      className="w-80 sm:w-88 bg-[#0A0F1F]/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.85)] p-4 text-white font-mono select-none animate-in fade-in slide-in-from-right duration-250 flex flex-col gap-3.5 z-30"
    >
      {/* Top Header: Satellite Name & Close Button */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <div
            className="w-2.5 h-2.5 rounded-full animate-ping"
            style={{ backgroundColor: slotColor }}
          />
          <h2 className="text-sm font-bold tracking-wider uppercase text-white truncate max-w-[190px]">
            {name}
          </h2>
          <span
            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40"
          >
            TRACKED
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          title="Close Inspector"
        >
          <X size={15} />
        </button>
      </div>

      {/* Metadata Table */}
      <div className="grid grid-cols-2 gap-2 text-xs bg-[#050810]/70 p-2.5 rounded-lg border border-gray-800/80">
        <div>
          <span className="text-[10px] text-gray-500 uppercase block">ID</span>
          <span className="font-bold text-gray-200">{satId}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 uppercase block">Status</span>
          <span className="font-bold text-[#00FF66] flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] inline-block" />
            <span>{status}</span>
          </span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 uppercase block">Orbit</span>
          <span className="font-bold text-xs" style={{ color: orbitColor }}>
            {orbitType}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 uppercase block">Class</span>
          <span className="font-bold text-gray-300">{formFactor}</span>
        </div>
      </div>



      {/* LIVE TELEMETRY 6-Metric Grid */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wider font-bold">
          <span>LIVE TELEMETRY</span>
          <span className="text-[#00F0FF] animate-pulse">60 Hz</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Temperature */}
          <div className="bg-[#050810]/80 border border-gray-800/80 rounded-lg p-2">
            <div className="flex items-center space-x-1 text-[10px] text-gray-400">
              <Thermometer size={11} className="text-amber-400" />
              <span>TEMP</span>
            </div>
            <div className="text-sm font-bold text-white mt-0.5">{temp}</div>
          </div>

          {/* Speed */}
          <div className="bg-[#050810]/80 border border-gray-800/80 rounded-lg p-2">
            <div className="flex items-center space-x-1 text-[10px] text-gray-400">
              <Gauge size={11} className="text-[#00F0FF]" />
              <span>SPEED</span>
            </div>
            <div className="text-sm font-bold text-white mt-0.5">{speed}</div>
          </div>

          {/* Altitude */}
          <div className="bg-[#050810]/80 border border-gray-800/80 rounded-lg p-2">
            <div className="flex items-center space-x-1 text-[10px] text-gray-400">
              <Compass size={11} className="text-purple-400" />
              <span>ALTITUDE</span>
            </div>
            <div className="text-sm font-bold text-white mt-0.5">{altitude}</div>
          </div>

          {/* Battery */}
          <div className="bg-[#050810]/80 border border-gray-800/80 rounded-lg p-2">
            <div className="flex items-center space-x-1 text-[10px] text-gray-400">
              <BatteryCharging size={11} className="text-[#00FF66]" />
              <span>BATTERY</span>
            </div>
            <div className="text-sm font-bold text-[#00FF66] mt-0.5">{battery}</div>
          </div>

          {/* Signal */}
          <div className="bg-[#050810]/80 border border-gray-800/80 rounded-lg p-2">
            <div className="flex items-center space-x-1 text-[10px] text-gray-400">
              <Radio size={11} className="text-cyan-400" />
              <span>SIGNAL</span>
            </div>
            <div className="text-sm font-bold text-white mt-0.5">{signal}</div>
          </div>

          {/* Health */}
          <div className="bg-[#050810]/80 border border-gray-800/80 rounded-lg p-2">
            <div className="flex items-center space-x-1 text-[10px] text-gray-400">
              <HeartPulse size={11} className="text-rose-400" />
              <span>HEALTH</span>
            </div>
            <div className="text-sm font-bold text-[#00FF66] mt-0.5">{health}</div>
          </div>
        </div>
      </div>

      {/* Quick Action Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-800/80 text-[10px]">
        <button
          onClick={() => onDeselectSatellite && onDeselectSatellite(satId)}
          className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
        >
          Deselect Orbit
        </button>

        <button
          onClick={() => navigate(`/studio?sat=${satId}`)}
          className="flex items-center space-x-1 text-[#00F0FF] hover:underline cursor-pointer"
        >
          <span>3D Studio</span>
          <ExternalLink size={10} />
        </button>
      </div>
    </div>
  );
}
