import React from 'react';
import { Layers, RotateCcw, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function StudioBottomBar({
  isAssembling,
  setIsAssembling,
  autoRotate,
  setAutoRotate,
  isValidating,
  triggerValidate,
  formFactor,
  onLoadPreset,
  notification
}) {
  return (
    <>
      {/* Dynamic Toast Alerts */}
      {notification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className={`px-4 py-2 rounded-xl backdrop-blur-md font-mono text-xs shadow-2xl flex items-center space-x-2 border ${
            notification.type === 'error' 
              ? 'bg-rose-950/90 border-rose-500 text-rose-200' 
              : notification.type === 'warning' 
                ? 'bg-amber-950/90 border-amber-500 text-amber-200' 
                : 'bg-[#00FF66]/20 border-[#00FF66] text-[#00FF66]'
          }`}>
            {notification.type === 'error' || notification.type === 'warning' ? (
              <AlertTriangle size={15} />
            ) : (
              <CheckCircle2 size={15} />
            )}
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      {/* Floating Bottom Action Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-[#0A0F1F]/90 backdrop-blur-md border border-gray-800 rounded-full px-3 py-1.5 shadow-2xl z-20 pointer-events-auto">
        <button
          onClick={() => setIsAssembling(!isAssembling)}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all border ${
            isAssembling 
              ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.4)]' 
              : 'border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
          title="Toggle Exploded CAD View"
        >
          <Layers size={13} />
          <span className="font-bold">ASSEMBLE</span>
        </button>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all border ${
            autoRotate 
              ? 'bg-[#00FF66]/20 border-[#00FF66] text-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.3)]' 
              : 'border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
          title="Toggle 360 Turntable Orbit"
        >
          <RotateCcw size={13} className={autoRotate ? 'animate-spin-slow' : ''} />
          <span>TURNTABLE</span>
        </button>

        <div className="h-4 w-px bg-gray-800 mx-1" />

        <button
          onClick={triggerValidate}
          disabled={isValidating}
          className="flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] transition-all disabled:opacity-50"
        >
          <Zap size={13} />
          <span>{isValidating ? 'SCANNING...' : 'SCAN FEASIBILITY'}</span>
        </button>

        {onLoadPreset && (
          <button
            onClick={() => onLoadPreset(formFactor)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 transition-all ml-1"
            title={`Load nominal preset configuration for ${formFactor}`}
          >
            <span>⚡ {formFactor} PRESET</span>
          </button>
        )}
      </div>
    </>
  );
}
