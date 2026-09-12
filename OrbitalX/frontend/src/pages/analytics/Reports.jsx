import React, { useState, useEffect } from 'react';
import analyticsService from '../../services/analyticsService';
import { FileText, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function Reports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const exportCSV = () => {
    if (!reportData) return;
    
    // Quick CSV Generation for Missions
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Mission Name,Status,Satellites Assigned,Start Date,End Date\n";
    
    reportData.missions.forEach(m => {
      const row = `${m.name},${m.status},${m.satelliteCount},${m.startDate ? format(new Date(m.startDate), 'yyyy-MM-dd') : 'N/A'},${m.endDate ? format(new Date(m.endDate), 'yyyy-MM-dd') : 'Ongoing'}`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orbitalx_mission_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="text-[#00F0FF] font-mono text-center py-10 tracking-widest">GENERATING REPORTS...</div>;
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Reports</h1>
          <p className="text-gray-400 font-mono mt-2 tracking-widest text-sm">MISSION & SATELLITE SUMMARIES</p>
        </div>
        <button 
          onClick={exportCSV}
          className="flex items-center space-x-2 bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 px-4 py-2 rounded font-mono text-xs tracking-widest uppercase hover:bg-[#00F0FF]/20 transition-colors"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Satellite Summary */}
        <div className="md:col-span-1 bg-[#0B1221] border border-gray-800 rounded p-6">
          <h2 className="text-white font-bold mb-4 tracking-tight flex items-center">
            <FileText size={18} className="mr-2 text-gray-400" />
            Satellite Summary
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400 font-mono text-sm">Total Assets</span>
              <span className="text-white font-bold">{reportData.satellites.total}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-[#00FF66] font-mono text-sm">Active</span>
              <span className="text-white font-bold">{reportData.satellites.active}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-[#FFB000] font-mono text-sm">Maintenance</span>
              <span className="text-white font-bold">{reportData.satellites.maintenance}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-[#FF2A2A] font-mono text-sm">Offline</span>
              <span className="text-white font-bold">{reportData.satellites.offline}</span>
            </div>
            
            <div className="pt-4">
              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-3">By Orbit</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">LEO: <span className="text-white ml-1">{reportData.satellites.byOrbit.LEO}</span></span>
                <span className="text-gray-400">MEO: <span className="text-white ml-1">{reportData.satellites.byOrbit.MEO}</span></span>
                <span className="text-gray-400">GEO: <span className="text-white ml-1">{reportData.satellites.byOrbit.GEO}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Summary */}
        <div className="md:col-span-2 bg-[#0B1221] border border-gray-800 rounded p-6">
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
                {reportData.missions.map(mission => (
                  <tr key={mission.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
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
                      <span className="text-gray-400 text-sm">
                        {mission.startDate ? format(new Date(mission.startDate), 'MMM dd, yyyy') : 'TBD'} - 
                        {mission.endDate ? format(new Date(mission.endDate), 'MMM dd, yyyy') : ' Ongoing'}
                      </span>
                    </td>
                  </tr>
                ))}
                {reportData.missions.length === 0 && (
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
