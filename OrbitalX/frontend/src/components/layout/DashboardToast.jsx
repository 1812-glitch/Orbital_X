import React from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';

export default function DashboardToast({ activeToast, setActiveToast, getNotifIcon }) {
  if (!activeToast) return null;

  return (
    <div 
      id="live-notification-toast"
      className="fixed top-20 right-6 max-w-sm w-full bg-[#0B1221]/95 border border-[#00F0FF]/50 shadow-[0_0_25px_rgba(0,240,255,0.2)] rounded-lg p-4 z-50 backdrop-blur-md animate-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-[#050810] border border-[#00F0FF]/30 rounded text-[#00F0FF] shrink-0">
          {getNotifIcon(activeToast.type, activeToast.title)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
              {activeToast.type || 'SYSTEM ALERT'}
            </span>
            <button 
              onClick={() => setActiveToast(null)}
              className="text-gray-500 hover:text-white transition-colors ml-2"
            >
              <X size={14} />
            </button>
          </div>
          <h4 className="text-xs font-mono font-semibold text-white mt-1 truncate">
            {activeToast.title}
          </h4>
          <p className="text-[11px] text-gray-300 font-sans mt-0.5 line-clamp-2">
            {activeToast.message}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[9px] font-mono text-gray-500">JUST NOW</span>
            <NavLink
              to="/notifications"
              onClick={() => setActiveToast(null)}
              className="text-[10px] font-mono text-[#00F0FF] hover:underline"
            >
              OPEN CENTER →
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}
