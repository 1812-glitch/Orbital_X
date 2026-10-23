import React from 'react';
import {
  CheckSquare,
  Square,
  Lock,
  RadioTower,
  Radio,
  Wifi,
  Eye,
} from 'lucide-react';
import { isCubeSatType } from '../../../utils/orbitalMath';
import { useSatellite } from '../../../context/SatelliteContext';

export default function OrbitingSatelliteCard({
  item,
  isSelected,
  isMaxReached,
  slotIdx,
  slotColor,
  connectedStations = [],
  onToggle,
}) {
  const sat = item.satellite;
  const tel = item.telemetry;
  const isCubeSat = isCubeSatType(sat);
  const { selectSatellite, openDetailModal } = useSatellite();

  return (
    <div
      id={`sat-card-${sat.satelliteId}`}
      onClick={() => onToggle(sat.satelliteId)}
      className={`group relative p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-[#121c36]/90 border-transparent shadow-[0_0_20px_rgba(0,240,255,0.15)]'
          : isMaxReached
          ? 'bg-[#0e1424]/40 border-gray-800/60 opacity-60 hover:opacity-80'
          : 'bg-[#12192b]/50 border-gray-800 hover:border-gray-700 hover:bg-[#12192b]'
      }`}
      style={isSelected ? { borderColor: slotColor } : {}}
    >
      {/* Active Slot Color Left Border Indicator */}
      {isSelected && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg shadow-sm"
          style={{ backgroundColor: slotColor }}
        />
      )}

      {/* Top Row: Checkbox, Name, ID, Badges */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2.5">
          {/* Checkbox button */}
          <div className="mt-0.5">
            {isSelected ? (
              <div
                className="w-4 h-4 rounded flex items-center justify-center shadow-[0_0_8px_currentColor]"
                style={{ backgroundColor: `${slotColor}25`, color: slotColor }}
              >
                <CheckSquare size={16} style={{ color: slotColor }} />
              </div>
            ) : isMaxReached ? (
              <Lock size={15} className="text-gray-600 mt-0.5" />
            ) : (
              <Square size={16} className="text-gray-500 group-hover:text-gray-400" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white font-mono tracking-wide">
                {sat.satelliteId}
              </span>
              <span className="text-xs text-gray-300 font-medium">
                {sat.name}
              </span>
            </div>

            {/* Type & Orbit Badges */}
            <div className="flex items-center space-x-1.5 mt-1">
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                  isCubeSat
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                }`}
              >
                {isCubeSat ? 'CUBESAT' : sat.type || 'SATELLITE'}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-gray-800 text-gray-400 border border-gray-700">
                {sat.orbitType}
              </span>
              {isSelected && (
                <span
                  className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border shadow-sm"
                  style={{
                    backgroundColor: `${slotColor}20`,
                    color: slotColor,
                    borderColor: `${slotColor}60`,
                  }}
                >
                  SLOT {slotIdx + 1} PATH
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Indicator & Inspect Action */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              selectSatellite(sat);
              openDetailModal(sat);
            }}
            className="p-1 text-gray-400 hover:text-[#00F0FF] hover:bg-gray-800 rounded transition-colors"
            title={`Inspect ${sat.name} Specs`}
          >
            <Eye size={13} />
          </button>
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                sat.status === 'OFFLINE'
                  ? 'bg-red-500'
                  : sat.status === 'WARNING'
                  ? 'bg-yellow-400'
                  : 'bg-[#00FF66] shadow-[0_0_8px_#00FF66]'
              } ${isSelected ? 'animate-pulse' : ''}`}
            />
            <span className="text-[10px] font-mono text-gray-400 uppercase">
              {sat.status}
            </span>
          </div>
        </div>
      </div>

      {/* Telemetry Row: Coordinates & Orbit Specs */}
      {tel && (
        <div className="mt-2.5 pt-2 border-t border-gray-800/60 grid grid-cols-3 gap-2 text-[10px] font-mono text-gray-400">
          <div>
            <span className="text-gray-500">ALT: </span>
            <span className="text-gray-200">
              {Math.round(tel.altitude || 550).toLocaleString()} km
            </span>
          </div>
          <div>
            <span className="text-gray-500">VEL: </span>
            <span className="text-gray-200">
              {(tel.speed || 7.6).toFixed(1)} km/s
            </span>
          </div>
          <div>
            <span className="text-gray-500">LAT/LNG: </span>
            <span className="text-gray-200">
              {(tel.latitude || 0).toFixed(1)}°, {(tel.longitude || 0).toFixed(1)}°
            </span>
          </div>
        </div>
      )}

      {/* Ground Station Connectivity & Active Signal Transmission Details */}
      <div className="mt-2.5 pt-2 border-t border-gray-800/60 block">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-1.5 text-[10px] font-mono text-gray-400 uppercase tracking-wider">
            <RadioTower
              size={12}
              className={isSelected ? 'text-[#00F0FF]' : 'text-gray-500'}
            />
            <span>Connected Ground Stations ({connectedStations.length})</span>
          </div>
          {isSelected && (
            <div className="flex items-center space-x-1 text-[9px] font-mono text-[#00FF66] bg-[#00FF66]/10 px-1.5 py-0.5 rounded border border-[#00FF66]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-ping" />
              <span>TRANSMITTING SIGNALS</span>
            </div>
          )}
        </div>

        {/* Ground Station Badges */}
        <div className="flex flex-wrap gap-1.5">
          {connectedStations.map((gs) => (
            <div
              key={gs._id || gs.stationId}
              className={`flex items-center space-x-1.5 px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                gs.isInSight
                  ? 'bg-[#00FF66]/10 text-white border-[#00FF66]/40 shadow-sm'
                  : 'bg-[#12192b] text-gray-400 border-gray-800'
              }`}
            >
              <Radio
                size={10}
                style={{ color: gs.isInSight ? '#00FF66' : '#6b7280' }}
              />
              <span className="font-semibold text-gray-200">{gs.name}</span>
              <span
                className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase ${
                  gs.isInSight
                    ? 'bg-[#00FF66]/20 text-[#00FF66]'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {gs.isInSight ? 'IN SIGHT' : 'STANDBY'}
              </span>
            </div>
          ))}
        </div>

        {/* Signal Transmission Telemetry Info (Shown when selected) */}
        {isSelected && (
          <div className="mt-2 p-2 rounded bg-[#0A0F1F]/80 border border-gray-800 text-[10px] font-mono space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center space-x-1 text-gray-400">
                <Wifi
                  size={10}
                  className={
                    connectedStations.some((g) => g.isInSight)
                      ? 'text-[#00FF66]'
                      : 'text-gray-500'
                  }
                />
                <span>SENDING DOWNLINK TO:</span>
              </span>
              <span className="text-white font-bold">
                {connectedStations
                  .filter((g) => g.isInSight)
                  .map((g) => g.name)
                  .join(', ') || 'ORBITAL TRANSIT (AWAITING PASS)'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-gray-400 pt-1 border-t border-gray-800/60">
              <div>
                <span className="text-gray-500">RF FREQ: </span>
                <span className="text-[#00F0FF]">
                  {isCubeSat ? '437.5 MHz (UHF)' : '2.24 GHz (S-Band)'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">THROUGHPUT: </span>
                <span className="text-[#00FF66]">
                  {isCubeSat ? '19.2 kbps' : '148.5 Mbps'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">SIGNAL SNR: </span>
                <span className="text-gray-200">
                  {tel?.signal || -74} dBm (98%)
                </span>
              </div>
              <div>
                <span className="text-gray-500">LOCK: </span>
                <span className="text-[#00FF66]">CARRIER LOCKED</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
