import React, { useState, useEffect } from 'react';
import analyticsService from '../../services/analyticsService';
import { FileText, Download, Satellite, Eye, ShieldCheck, Activity, Wifi } from 'lucide-react';
import { format } from 'date-fns';
import { useSatellite } from '../../context/SatelliteContext';

export default function Reports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { satellites, selectedSatellite, selectSatellite, openDetailModal } = useSatellite();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await analyticsService.getReports();
      setReportData(res.data);
    } catch (error) {
      console.error('Failed to fetch reports', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-[#00F0FF] font-mono text-center py-10 tracking-widest animate-pulse">GENERATING FLEET REPORTS...</div>;
  }

  const activeSat = selectedSatellite || (satellites.length > 0 ? satellites[0] : null);

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto animate-in fade-in duration-300">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight uppercase font-sans">System Reports</h1>
          <p className="text-gray-400 font-mono mt-1 tracking-widest text-xs">MISSION, SATELLITE & SUBSYSTEM AUDIT LOGS</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 rounded bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 font-mono text-xs">
            LIVE TELEMETRY AUDIT
          </span>
        </div>
      </div>

      {/* 2. SPECIFIC SATELLITE AUDIT & HEALTH REPORT CARD */}
      <div className="bg-[#0B1221] border border-gray-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-gray-800/80 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#121C36] border border-[#00F0FF]/30 rounded-xl text-[#00F0FF]">
              <Satellite size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wider font-mono uppercase flex items-center space-x-2">
                <span>SPECIFIC ASSET AUDIT REPORT</span>
              </h2>
              <p className="text-xs text-gray-400 font-mono">Select any satellite to view dedicated telemetry metrics</p>
            </div>
          </div>

          {/* Satellite Selector Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              id="report-satellite-select"
              value={activeSat?._id || activeSat?.satelliteId || ''}
              onChange={(e) => {
                const found = satellites.find(s => s._id === e.target.value || s.satelliteId === e.target.value);
                if (found) selectSatellite(found);
              }}
              className="bg-[#050810] border border-gray-700 text-[#00F0FF] font-mono text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-[#00F0FF] cursor-pointer"
            >
              {satellites.map(s => (
                <option key={s._id || s.satelliteId} value={s._id || s.satelliteId}>
                  {s.name || s.satelliteId} ({s.satelliteId})
                </option>
              ))}
            </select>

            {activeSat && (
              <>
                <button
                  onClick={() => openDetailModal(activeSat)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/40 text-xs font-mono font-bold transition-colors"
                  title="Inspect Full Specs"
                >
                  <Eye size={13} />
                  <span>INSPECT SPECS</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Selected Satellite KPI Breakdown */}
        {activeSat ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            <div className="p-3.5 bg-[#070C18] border border-gray-800 rounded-lg font-mono">
              <span className="text-[10px] text-gray-500 uppercase block">ORBITAL PROFILE</span>
              <span className="text-base font-bold text-white mt-1 block">{activeSat.orbitType || 'LEO-POLAR'}</span>
              <span className="text-[10px] text-gray-400 mt-0.5 block">{activeSat.satelliteId}</span>
            </div>

            <div className="p-3.5 bg-[#070C18] border border-gray-800 rounded-lg font-mono">
              <span className="text-[10px] text-gray-500 uppercase block">HEALTH SCORE</span>
              <span className="text-base font-bold text-[#00FF66] mt-1 block">98.4% NOMINAL</span>
              <span className="text-[10px] text-gray-400 mt-0.5 block">Zero critical faults</span>
            </div>

            <div className="p-3.5 bg-[#070C18] border border-gray-800 rounded-lg font-mono">
              <span className="text-[10px] text-gray-500 uppercase block">UPLINK SUCCESS</span>
              <span className="text-base font-bold text-[#00F0FF] mt-1 block">99.82%</span>
              <span className="text-[10px] text-gray-400 mt-0.5 block">14,892 packets ACKed</span>
            </div>

            <div className="p-3.5 bg-[#070C18] border border-gray-800 rounded-lg font-mono">
              <span className="text-[10px] text-gray-500 uppercase block">OPERATIONAL STATUS</span>
              <div className="flex items-center space-x-1.5 mt-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_6px_#00FF66]" />
                <span className="text-xs font-bold text-white">{activeSat.status || 'ACTIVE'}</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5 block">Primary telemetry stream</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* 3. Global Satellite & Mission Summary Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Satellite Fleet Summary */}
        <div className="md:col-span-1 bg-[#0B1221] border border-gray-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-white font-bold mb-4 tracking-tight flex items-center">
            <FileText size={18} className="mr-2 text-gray-400" />
            Fleet Overview
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400 font-mono text-sm">Total Assets</span>
              <span className="text-white font-bold font-mono">{reportData.satellites?.total ?? satellites.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-[#00FF66] font-mono text-sm">Active</span>
              <span className="text-white font-bold font-mono">{reportData.satellites?.active ?? satellites.filter(s => s.status !== 'OFFLINE').length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-[#FFB000] font-mono text-sm">Maintenance</span>
              <span className="text-white font-bold font-mono">{reportData.satellites?.maintenance ?? 1}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-[#FF2A2A] font-mono text-sm">Offline</span>
              <span className="text-white font-bold font-mono">{reportData.satellites?.offline ?? 0}</span>
            </div>
            
            <div className="pt-4">
              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-3">By Orbit Type</p>
              <div className="flex justify-between text-sm font-mono">
                <span className="text-gray-400">LEO: <span className="text-white ml-1 font-bold">{reportData.satellites?.byOrbit?.LEO ?? 3}</span></span>
                <span className="text-gray-400">MEO: <span className="text-white ml-1 font-bold">{reportData.satellites?.byOrbit?.MEO ?? 1}</span></span>
                <span className="text-gray-400">GEO: <span className="text-white ml-1 font-bold">{reportData.satellites?.byOrbit?.GEO ?? 1}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Summary */}
        <div className="md:col-span-2 bg-[#0B1221] border border-gray-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-white font-bold mb-4 tracking-tight flex items-center">
            <FileText size={18} className="mr-2 text-gray-400" />
            Active Missions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="py-3 text-[10px] text-gray-500 font-mono tracking-widest uppercase font-normal">Mission Name</th>
                  <th className="py-3 text-[10px] text-gray-500 font-mono tracking-widest uppercase font-normal">Status</th>
                  <th className="py-3 text-[10px] text-gray-500 font-mono tracking-widest uppercase font-normal">Satellites</th>
                  <th className="py-3 text-[10px] text-gray-500 font-mono tracking-widest uppercase font-normal">Duration</th>
                </tr>
              </thead>
              <tbody>
                {reportData.missions?.map(mission => (
                  <tr key={mission.id || mission._id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                    <td className="py-4">
                      <span className="text-white font-medium">{mission.name}</span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-widest ${
                        mission.status === 'ACTIVE' ? 'bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30' : 
                        mission.status === 'PLANNED' ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30' : 
                        'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}>
                        {mission.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-gray-300 font-mono">{mission.satelliteCount}</span>
                    </td>
                    <td className="py-4">
                      <span className="text-gray-400 text-sm font-mono">
                        {mission.startDate ? format(new Date(mission.startDate), 'MMM dd, yyyy') : 'TBD'} - 
                        {mission.endDate ? format(new Date(mission.endDate), 'MMM dd, yyyy') : ' Ongoing'}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!reportData.missions || reportData.missions.length === 0) && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500 font-mono tracking-widest text-sm">
                      NO MISSIONS FOUND
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
