import React from 'react';
import { Play, RefreshCw, Sparkles, Zap, Compass, Radio, Thermometer, Cpu, ShieldAlert, Camera, AlertTriangle } from 'lucide-react';

export function getSubsystemIcon(sub) {
  switch (sub) {
    case 'EPS': return <Zap size={13} className="text-[#FFB000]" />;
    case 'ADCS': return <Compass size={13} className="text-[#00F0FF]" />;
    case 'COMMS': return <Radio size={13} className="text-[#00FF66]" />;
    case 'TCS': return <Thermometer size={13} className="text-[#FF2A2A]" />;
    case 'OBC': return <Cpu size={13} className="text-[#C084FC]" />;
    case 'ENV': return <ShieldAlert size={13} className="text-[#F43F5E]" />;
    case 'PAYLOAD': return <Camera size={13} className="text-[#38BDF8]" />;
    default: return <AlertTriangle size={13} className="text-[#FFB000]" />;
  }
}

function AnomalyPresetCard({ preset, isInjecting, onInject }) {
  const isCrit = preset.severity === 'CRITICAL';

  return (
    <div
      className={`bg-[#0B1221] hover:bg-[#0E172A] border rounded-lg p-3.5 space-y-2.5 transition-all ${
        isCrit ? 'border-[#FF2A2A]/40 hover:border-[#FF2A2A]' : 'border-[#FFB000]/40 hover:border-[#FFB000]'
      }`}
    >
      {/* Top Row: Subsystem + Severity + Title */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1 text-[10px] font-bold text-gray-300 bg-[#050810] px-2 py-0.5 rounded border border-gray-800">
              {getSubsystemIcon(preset.subsystem)}
              <span>{preset.subsystem}</span>
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                isCrit
                  ? 'bg-[#FF2A2A]/15 text-[#FF2A2A] border-[#FF2A2A]/40'
                  : 'bg-[#FFB000]/15 text-[#FFB000] border-[#FFB000]/40'
              }`}
            >
              {preset.severity}
            </span>
          </div>
          <h3 className="font-bold text-white text-xs tracking-wide">{preset.title}</h3>
        </div>

        {/* Inject Action Button */}
        <button
          disabled={isInjecting}
          onClick={() => onInject(preset)}
          className={`px-3 py-1.5 rounded text-[11px] font-bold tracking-wider uppercase transition-all flex items-center space-x-1.5 shrink-0 ${
            isInjecting
              ? 'bg-gray-700 text-gray-400 cursor-wait'
              : isCrit
              ? 'bg-[#FF2A2A]/20 hover:bg-[#FF2A2A] text-white border border-[#FF2A2A]/50'
              : 'bg-[#FFB000]/20 hover:bg-[#FFB000] text-[#FFB000] hover:text-black border border-[#FFB000]/50'
          }`}
        >
          {isInjecting ? (
            <>
              <RefreshCw size={11} className="animate-spin" />
              <span>INJECTING...</span>
            </>
          ) : (
            <>
              <Play size={11} />
              <span>INJECT</span>
            </>
          )}
        </button>
      </div>

      {/* Metrics snapshot */}
      <div className="grid grid-cols-3 gap-2 bg-[#050810] p-2 rounded border border-gray-800/80 text-[10px]">
        <div>
          <span className="text-gray-500 block">METRIC:</span>
          <span className="text-gray-300 font-bold truncate block">{preset.metric}</span>
        </div>
        <div>
          <span className="text-gray-500 block">NOMINAL:</span>
          <span className="text-[#00FF66] font-bold truncate block">{preset.nominalValue}</span>
        </div>
        <div>
          <span className="text-gray-500 block">FAULT VAL:</span>
          <span className={`font-bold truncate block ${isCrit ? 'text-[#FF2A2A]' : 'text-[#FFB000]'}`}>
            {preset.faultValue}
          </span>
        </div>
      </div>

      {/* Narrative Description */}
      <p className="text-gray-400 text-[11px] leading-relaxed">{preset.message}</p>

      {/* AI Preview hint */}
      <div className="pt-1.5 border-t border-gray-800/60 flex items-center justify-between text-[10px] text-gray-500">
        <span className="flex items-center space-x-1 text-[#00F0FF]">
          <Sparkles size={11} />
          <span>AI Recovery Ready</span>
        </span>
        <span>{preset.aiAnalysis?.telecommands?.length || 0} telecommands pre-programmed</span>
      </div>
    </div>
  );
}

export default React.memo(AnomalyPresetCard);
