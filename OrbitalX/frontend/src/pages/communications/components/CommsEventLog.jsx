import React from 'react';
import { FileText, Download, ChevronUp, ChevronDown, X } from 'lucide-react';

export default function CommsEventLog({
  showEventLog,
  setShowEventLog,
  eventLogs,
  handleExportLog,
  isEventLogMinimized,
  setIsEventLogMinimized
}) {
  if (!showEventLog) return null;

  return (
    <div className="w-full bg-[#0A0F1F] border border-gray-800 rounded-lg overflow-hidden shadow-xl animate-in fade-in duration-200">
      {/* Log Header with Controls */}
      <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between bg-[#070C18]">
        <div className="flex items-center space-x-3 font-mono">
          <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center space-x-2">
            <FileText size={13} className="text-[#00F0FF]" />
            <span>COMMUNICATION EVENT LOG</span>
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-[#00F0FF]">
            {eventLogs.length} EVENTS
          </span>
        </div>

        <div className="flex items-center space-x-3 font-mono text-xs">
          <button
            onClick={handleExportLog}
            className="flex items-center space-x-1.5 text-gray-400 hover:text-[#00F0FF] transition-colors"
            title="Download CSV log"
          >
            <Download size={12} />
            <span className="uppercase text-[11px]">EXPORT</span>
          </button>

          <button
            onClick={() => setIsEventLogMinimized(!isEventLogMinimized)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title={isEventLogMinimized ? "Expand Event Log" : "Minimize Event Log"}
          >
            {isEventLogMinimized ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          <button
            onClick={() => setShowEventLog(false)}
            className="p-1 text-gray-400 hover:text-[#FF2A2A] transition-colors"
            title="Close Event Log (Maximize Space)"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Log Lines */}
      {!isEventLogMinimized && (
        <div className="p-4 font-mono text-xs space-y-2 max-h-48 overflow-y-auto bg-[#050912]">
          {eventLogs.map((log, index) => (
            <div key={index} className="flex items-start space-x-3 border-l-2 border-transparent hover:border-[#00F0FF] pl-2 py-0.5 transition-colors">
              <span className="text-gray-500 whitespace-nowrap text-[11px]">{log.time}</span>
              <span className={`font-bold whitespace-nowrap text-[11px] ${
                log.level === 'WARN' ? 'text-[#FFB020]' : log.level === 'ERROR' ? 'text-[#FF2A2A]' : 'text-[#00F0FF]'
              }`}>
                {log.level}
              </span>
              <span className="text-gray-400 whitespace-nowrap text-[11px]">{log.src}</span>
              <span className="text-gray-300 text-[11px] leading-tight">{log.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
