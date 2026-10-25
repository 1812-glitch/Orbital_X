import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  Satellite as SatIcon, 
  Rocket, 
  Globe2, 
  Cpu, 
  Layers, 
  Check, 
  ArrowRight,
  Filter,
  CheckCircle2,
  Activity
} from 'lucide-react';
import missionService from '../../services/missionService';
import satelliteService from '../../services/satelliteService';
import { CUBESAT_FLEET, INITIAL_MISSIONS, synthesizeCubeSatSim } from '../../pages/studio/utils/cubesatFleetData';

export default function MissionFleetSelectorModal({
  isOpen,
  onClose,
  onSelectSatellite,
  selectedSatId,
  selectedSatIds = [],
  multiSelect = false,
  title = "Select CubeSat Asset",
  subtitle = "Choose a Mission, then select any CubeSat to simulate or track (supports 1,000+ assets)",
  actionLabel = "SELECT FOR SIMULATION"
}) {
  const [missions, setMissions] = useState([]);
  const [satellites, setSatellites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [activeMissionId, setActiveMissionId] = useState('ALL'); // 'ALL' or specific missionId
  const [searchQuery, setSearchQuery] = useState('');
  const [formFactorFilter, setFormFactorFilter] = useState('ALL'); // 'ALL', '1U', '3U', '6U', '12U', '16U'
  const [orbitFilter, setOrbitFilter] = useState('ALL'); // 'ALL', 'LEO', 'MEO', 'GEO', 'SSO', 'HEO'

  // Fetch live missions and satellites on open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadFleetData = async () => {
      setLoading(true);
      try {
        const [missionsRes, satsRes] = await Promise.all([
          missionService.getAll().catch(() => ({ data: [] })),
          satelliteService.getAll().catch(() => ({ data: [] }))
        ]);

        if (isMounted) {
          const apiMissions = missionsRes.data || [];
          const apiSats = satsRes.data || [];

          setMissions(apiMissions);
          setSatellites(apiSats);
        }
      } catch (err) {
        console.error('Failed to load fleet hierarchy', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadFleetData();
    return () => { isMounted = false; };
  }, [isOpen]);

  // Combine and organize all satellites with Mission IDs
  const fleetWithMissions = useMemo(() => {
    const list = [];
    const seenIds = new Set();

    // 1. First add all satellites from populated missions
    missions.forEach(m => {
      const assigned = m.assignedSatellites || [];
      assigned.forEach(sat => {
        const satObj = typeof sat === 'object' ? sat : { _id: sat, satelliteId: sat };
        const id = satObj.satelliteId || satObj._id;
        if (!id || seenIds.has(id)) return;
        seenIds.add(id);

        const synthesized = synthesizeCubeSatSim(satObj, m);
        if (synthesized) {
          list.push({
            ...synthesized,
            missionId: m.missionId || '',
            missionName: m.name || 'Orbital Mission'
          });
        }
      });
    });

    // 2. Add API satellites not yet covered
    satellites.forEach(sat => {
      const id = sat.satelliteId || sat._id;
      if (!id || seenIds.has(id)) return;
      seenIds.add(id);

      const synthesized = synthesizeCubeSatSim(sat, {
        missionId: 'FLEET',
        name: 'Fleet Spacecraft'
      });
      if (synthesized) {
        list.push(synthesized);
      }
    });

    return list;
  }, [missions, satellites]);

  // Compute missions with live count of satellites
  const missionListWithCounts = useMemo(() => {
    const map = {};
    fleetWithMissions.forEach(sat => {
      const mId = sat.missionId || 'MSN-APOLLO';
      map[mId] = (map[mId] || 0) + 1;
    });

    const result = [
      {
        missionId: 'ALL',
        name: 'ALL MISSIONS / GLOBAL FLEET',
        objective: 'Inspect entire constellation across all active orbital planes',
        status: 'GLOBAL',
        count: fleetWithMissions.length
      }
    ];

    missions.forEach(m => {
      result.push({
        missionId: m.missionId,
        name: m.name,
        objective: m.objective || m.description,
        status: m.status || 'ACTIVE',
        count: map[m.missionId] || (m.assignedSatellites?.length || 0)
      });
    });

    return result;
  }, [missions, fleetWithMissions]);

  // Filtered CubeSats by Mission, Search, Form Factor, Orbit
  const filteredSatellites = useMemo(() => {
    return fleetWithMissions.filter(sat => {
      // 1. Mission Filter
      if (activeMissionId !== 'ALL' && sat.missionId !== activeMissionId) {
        return false;
      }

      // 2. Form Factor Filter
      if (formFactorFilter !== 'ALL' && sat.formFactor !== formFactorFilter) {
        return false;
      }

      // 3. Orbit Filter
      if (orbitFilter !== 'ALL' && sat.orbitType !== orbitFilter) {
        return false;
      }

      // 4. Search Query (name, satelliteId, missionId, missionName, orbit)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (sat.fullName || sat.name || '').toLowerCase().includes(q);
        const matchId = (sat.satelliteId || '').toLowerCase().includes(q);
        const matchMission = (sat.missionId || '').toLowerCase().includes(q) || (sat.missionName || '').toLowerCase().includes(q);
        const matchOrbit = (sat.orbitType || '').toLowerCase().includes(q);
        const matchFF = (sat.formFactor || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchMission && !matchOrbit && !matchFF) {
          return false;
        }
      }

      return true;
    });
  }, [fleetWithMissions, activeMissionId, formFactorFilter, orbitFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#0A0F1F] border border-[#00F0FF]/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.18)] overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-[#0B1221] via-[#101930] to-[#0B1221]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Rocket className="text-[#00F0FF]" size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide uppercase font-mono">
                  {title}
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40">
                  {fleetWithMissions.length} ASSETS
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/60 rounded-xl transition-colors border border-transparent hover:border-gray-700"
            title="Close Selector"
          >
            <X size={20} />
          </button>
        </div>

        {/* Global Search & Form Factor Filter Bar */}
        <div className="p-3 sm:p-4 bg-[#070B16] border-b border-gray-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 font-mono text-xs">
          {/* Universal Search Input */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search across 1,000+ CubeSats (e.g. SAT-ALPHA-1, MSN-APOLLO, Ion-X, LEO, 3U)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0D1424] border border-gray-800 focus:border-[#00F0FF] rounded-xl pl-9 pr-8 py-2 text-white placeholder-gray-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Form Factor Pills */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <span className="text-gray-500 text-[10px] uppercase font-bold mr-1 hidden sm:inline">BUS SIZE:</span>
            {['ALL', '1U', '3U', '6U', '12U', '16U'].map(ff => (
              <button
                key={ff}
                onClick={() => setFormFactorFilter(ff)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider transition-all cursor-pointer ${
                  formFactorFilter === ff
                    ? 'bg-[#00F0FF] text-[#0A0F1F] shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : 'bg-[#12192b] text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
                }`}
              >
                {ff}
              </button>
            ))}
          </div>

          {/* Orbit Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <span className="text-gray-500 text-[10px] uppercase font-bold mr-1 hidden sm:inline">ORBIT:</span>
            {['ALL', 'LEO', 'MEO', 'GEO', 'SSO', 'HEO'].map(orb => (
              <button
                key={orb}
                onClick={() => setOrbitFilter(orb)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold tracking-wider transition-all cursor-pointer ${
                  orbitFilter === orb
                    ? 'bg-[#00FF66] text-[#0A0F1F] shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                    : 'bg-[#12192b] text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
                }`}
              >
                {orb}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Tier Hierarchical Body: Missions on Left, CubeSats on Right */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
          {/* STEP 1: Select Mission (Left Column, col-span-4) */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-gray-800 bg-[#070B16]/70 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-gray-800/80 bg-[#0B1221] flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-gray-300 tracking-wider uppercase flex items-center space-x-1.5">
                <Rocket size={13} className="text-[#00F0FF]" />
                <span>STEP 1: SELECT MISSION</span>
              </span>
              <span className="text-[10px] font-mono text-gray-500">
                {missionListWithCounts.length - 1} Registered
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar">
              {missionListWithCounts.map(m => {
                const isSelected = activeMissionId === m.missionId;
                return (
                  <div
                    key={m.missionId}
                    onClick={() => setActiveMissionId(m.missionId)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer group text-left ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#00F0FF]/15 to-[#00F0FF]/5 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                        : 'bg-[#0B1221]/80 hover:bg-[#121C36] border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-mono text-xs font-bold uppercase tracking-wider ${
                        isSelected ? 'text-[#00F0FF]' : 'text-white group-hover:text-[#00F0FF]'
                      }`}>
                        {m.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isSelected 
                          ? 'bg-[#00F0FF] text-[#0A0F1F]' 
                          : 'bg-[#12192b] text-gray-300 border border-gray-700'
                      }`}>
                        {m.count} SATS
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-400">
                      <span className="text-[#00F0FF] font-bold">{m.missionId}</span>
                      <span>•</span>
                      <span className="truncate max-w-[170px]">{m.objective || 'Active Flight Campaign'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Select CubeSat From Selected Mission (Right Column, col-span-8) */}
          <div className="md:col-span-8 flex flex-col overflow-hidden bg-[#0A0F1F]">
            <div className="p-3 border-b border-gray-800 bg-[#0B1221] flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-gray-300 tracking-wider uppercase flex items-center space-x-1.5">
                <SatIcon size={13} className="text-[#00FF66]" />
                <span>STEP 2: SELECT CUBESAT ({filteredSatellites.length} FOUND)</span>
              </span>
              <span className="text-[10px] font-mono text-[#00F0FF]">
                {activeMissionId === 'ALL' ? 'GLOBAL FLEET' : `FILTERED BY ${activeMissionId}`}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar">
              {filteredSatellites.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-gray-500 font-mono">
                  <SatIcon size={32} className="mb-2 text-gray-600 animate-pulse" />
                  <p className="text-sm text-gray-400">No CubeSats matched your current mission and filter criteria.</p>
                  <button
                    onClick={() => {
                      setActiveMissionId('ALL');
                      setSearchQuery('');
                      setFormFactorFilter('ALL');
                      setOrbitFilter('ALL');
                    }}
                    className="mt-3 text-xs text-[#00F0FF] hover:underline uppercase"
                  >
                    Reset all filters to view global fleet
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                  {filteredSatellites.map(sat => {
                    const isCurrent = multiSelect 
                      ? selectedSatIds.includes(sat.satelliteId)
                      : selectedSatId === sat.satelliteId;

                    return (
                      <div
                        key={sat.satelliteId}
                        onClick={() => {
                          onSelectSatellite(sat);
                          if (!multiSelect) onClose();
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer group relative flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-gradient-to-br from-[#00F0FF]/20 via-[#00FF66]/10 to-[#0A0F1F] border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.25)]'
                            : 'bg-[#0B1221] hover:bg-[#121C36] border-gray-800 hover:border-gray-600 shadow-md'
                        }`}
                      >
                        {/* Top: Name & Selection Indicator */}
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div>
                              <div className="font-bold text-white text-sm tracking-tight flex items-center space-x-1.5">
                                <span>{sat.fullName || sat.name}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] shadow-[0_0_5px_#00FF66]" />
                              </div>
                              <div className="font-mono text-xs text-[#00F0FF] font-bold">
                                {sat.satelliteId}
                              </div>
                            </div>

                            {/* Active Selection Badge */}
                            {isCurrent && (
                              <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/50">
                                <Check size={11} />
                                <span>ACTIVE</span>
                              </span>
                            )}
                          </div>

                          {/* Mission Tag */}
                          <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded font-mono text-[10px] bg-[#070B16] border border-gray-800 text-gray-300 mb-2.5">
                            <Rocket size={10} className="text-[#00F0FF]" />
                            <span className="text-[#00F0FF] font-bold">{sat.missionId}</span>
                            <span className="text-gray-500">•</span>
                            <span className="truncate max-w-[140px]">{sat.missionName}</span>
                          </div>
                        </div>

                        {/* Middle: Badges for Bus Form Factor, Orbit, Altitude, Speed */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2 border-t border-gray-800/80 mb-3">
                          <div className="bg-[#050810] px-2 py-1 rounded border border-gray-800/60 flex items-center justify-between">
                            <span className="text-gray-500">BUS:</span>
                            <span className="text-white font-bold">{sat.formFactor}</span>
                          </div>
                          <div className="bg-[#050810] px-2 py-1 rounded border border-gray-800/60 flex items-center justify-between">
                            <span className="text-gray-500">ORBIT:</span>
                            <span className="text-white font-bold">{sat.orbitType}</span>
                          </div>
                          <div className="bg-[#050810] px-2 py-1 rounded border border-gray-800/60 flex items-center justify-between">
                            <span className="text-gray-500">ALT:</span>
                            <span className="text-gray-300">{sat.altitude ? `${Math.round(sat.altitude)} km` : '500 km'}</span>
                          </div>
                          <div className="bg-[#050810] px-2 py-1 rounded border border-gray-800/60 flex items-center justify-between">
                            <span className="text-gray-500">SPEED:</span>
                            <span className="text-gray-300">{sat.speed ? `${sat.speed} km/s` : '7.6 km/s'}</span>
                          </div>
                        </div>

                        {/* Action Select Button */}
                        <button
                          type="button"
                          className={`w-full py-1.5 px-3 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all ${
                            isCurrent
                              ? 'bg-[#00F0FF] text-[#0A0F1F] shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                              : 'bg-[#12192b] group-hover:bg-[#00F0FF]/20 text-gray-300 group-hover:text-[#00F0FF] border border-gray-700 group-hover:border-[#00F0FF]/50'
                          }`}
                        >
                          <span>{isCurrent ? 'ACTIVE TARGET' : actionLabel}</span>
                          <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-[#070B16] border-t border-gray-800 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center space-x-2 text-gray-400">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
            <span className="text-[11px]">
              Ready to dispatch any of {fleetWithMissions.length} CubeSats into active 3D visualization.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white uppercase tracking-wider transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
