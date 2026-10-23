import React from 'react';
import { ORBIT_TYPE_COLORS } from '../../utils/orbitalMath';

/**
 * Bottom-Left Orbit Types Legend as displayed in the OrbitalX 3D Simulator HUD.
 */
export default function OrbitTypesLegend() {
  const legendItems = [
    { label: 'LEO', color: ORBIT_TYPE_COLORS.LEO, desc: 'Low Earth (160–2,000 km)' },
    { label: 'MEO', color: ORBIT_TYPE_COLORS.MEO, desc: 'Medium Earth (2,000–35,786 km)' },
    { label: 'GEO', color: ORBIT_TYPE_COLORS.GEO, desc: 'Geostationary (35,786 km)' },
    { label: 'SSO', color: ORBIT_TYPE_COLORS.SSO, desc: 'Sun-Synchronous (Polar LEO)' },
    { label: 'POLAR', color: ORBIT_TYPE_COLORS.POLAR, desc: 'High-Inclination Polar' },
    { label: 'Graveyard', color: ORBIT_TYPE_COLORS.GRAVEYARD, desc: 'Disposal Orbit' }
  ];

  return (
    <div
      id="orbit-types-legend"
      className="bg-[#0A0F1F]/90 backdrop-blur-md border border-gray-800/80 rounded-xl px-3.5 py-2.5 shadow-xl select-none font-mono text-[11px]"
    >
      <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2 flex items-center justify-between">
        <span>ORBIT TYPES</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]/60" />
      </div>
      <div className="space-y-1">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center space-x-2 text-gray-300" title={item.desc}>
            <span
              className="w-3.5 h-[2px] rounded-full inline-block"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-bold text-[10px]" style={{ color: item.color }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
