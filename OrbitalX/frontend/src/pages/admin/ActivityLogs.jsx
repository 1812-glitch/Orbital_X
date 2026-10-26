import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar, Filter } from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveStream, setLiveStream] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterSeverity !== 'ALL') params.severity = filterSeverity;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      
      const response = await adminService.getAuditLogs(params);
      if (response.success) {
        setLogs(response.data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterSeverity, dateRange]);

  useEffect(() => {
    let interval;
    if (liveStream) {
      interval = setInterval(() => fetchLogs(), 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [liveStream, filterSeverity, dateRange]);

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-[#FF2A2A]/10 text-[#FF2A2A] border-[#FF2A2A]/30';
      case 'WARNING': return 'bg-[#FFB000]/10 text-[#FFB000] border-[#FFB000]/30';
      case 'INFO': default: return 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/30';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 min-h-full flex flex-col">
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#00F0FF]">Activity Logs</h1>
      </div>

      <div className="flex justify-between items-center bg-[#0B1221] p-4 rounded border border-gray-800 shrink-0">
        <div className="flex space-x-4 items-center">
          <div className="flex items-center space-x-2 text-gray-400 text-xs font-mono">
            <Filter size={14} />
            <span>FILTERS:</span>
          </div>
          
          <div className="flex items-center bg-[#050810] border border-gray-800 rounded px-3 py-1.5 space-x-2">
            <Calendar size={14} className="text-gray-500" />
            <input 
              type="date" 
              className="bg-transparent text-gray-300 text-xs font-mono outline-none"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
            />
            <span className="text-gray-600">:</span>
            <input 
              type="date" 
              className="bg-transparent text-gray-300 text-xs font-mono outline-none"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
            />
          </div>

          <div className="flex items-center bg-[#050810] border border-gray-800 rounded px-3 py-1.5">
            <select 
              className="bg-transparent text-gray-300 text-xs font-mono outline-none cursor-pointer"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-4">
          <button 
            onClick={() => setLiveStream(!liveStream)}
            className={`flex items-center border px-4 py-1.5 rounded text-xs font-mono tracking-widest transition-colors ${liveStream ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]' : 'border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/10 bg-transparent'}`}
          >
            <RefreshCw size={14} className={`mr-2 ${liveStream ? 'animate-spin' : ''}`} /> LIVE STREAM
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] font-mono tracking-widest text-gray-500 uppercase px-2 shrink-0">
        <span className="flex items-center">
          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${liveStream ? 'bg-[#00F0FF] shadow-[0_0_5px_#00F0FF]' : 'bg-gray-600'}`}></div>
          SYSTEM AUDIT TRAIL
        </span>
        <span>Rate: {logs.length} logs fetched</span>
      </div>

      <div className="bg-[#0B1221] border border-gray-800 rounded flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#050810] border-b border-gray-800 sticky top-0">
              <tr>
                <th className="px-6 py-4 text-[10px] text-gray-500 font-mono tracking-widest uppercase font-normal">Timestamp (UTC)</th>
                <th className="px-6 py-4 text-[10px] text-gray-500 font-mono tracking-widest uppercase font-normal">Severity</th>
                <th className="px-6 py-4 text-[10px] text-gray-500 font-mono tracking-widest uppercase font-normal">User / Source</th>
                <th className="px-6 py-4 text-[10px] text-gray-500 font-mono tracking-widest uppercase font-normal">Action / Target</th>
                <th className="px-6 py-4 text-[10px] text-gray-500 font-mono tracking-widest uppercase font-normal w-full">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500 font-mono text-xs">Fetching records...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500 font-mono text-xs">No audit logs found for the selected criteria.</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log._id} className="hover:bg-[#121C36]/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">
                      {new Date(log.timestamp).toISOString().replace('T', ' ').replace('Z', '')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`border px-2 py-0.5 rounded text-[10px] font-mono uppercase flex items-center w-fit ${getSeverityStyle(log.severity)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${log.severity === 'CRITICAL' ? 'bg-[#FF2A2A]' : log.severity === 'WARNING' ? 'bg-[#FFB000]' : 'bg-[#00FF66]'}`}></span>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-300">
                      {log.userId ? log.userId.name : log.source}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-300 uppercase">
                      {log.action} @ {log.resource || 'SYS'}
                    </td>
                    <td className="px-6 py-4 text-[10px] font-mono text-gray-500 whitespace-normal min-w-[250px]">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-[#050810] border-t border-gray-800 p-3 flex justify-between items-center text-xs text-gray-500 font-mono">
          <span>Showing latest {logs.length} entries</span>
        </div>
      </div>
    </div>
  );
}
