import React from 'react';
import { Radio, X, CheckCircle2, Terminal } from 'lucide-react';

export default function GroundStationsDiagnosticsModal({
  showDiagnostics,
  setShowDiagnostics,
  activeStation,
  diagnosticsRunning,
  handleRunDiagnostics,
  diagnosticsLogs
}) {
  if (!showDiagnostics) return null;

  return (
    <div className="w-full bg-[#0A0F1F] border border-[#00F0FF]/50 rounded-lg p-5 shadow-[0_0_35px_rgba(0,240,255,0.15)] animate-in fade-in slide-in-from-top-4 duration-300 font-mono">
      {/* Header with Closable X Button */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center">
            <Radio size={16} className="text-[#00F0FF]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center space-x-2">
              <span>RF TELEMETRY DIAGNOSTICS</span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40">
                {activeStation.stationId} • {activeStation.name}
              </span>
            </h3>
            <p className="text-[11px] text-gray-400">
              Realtime transceiver sweep, frequency carrier lock, and antenna tracking servo diagnostics
            </p>
          </div>
        </div>

        <button
          id="close-diagnostics-btn"
          onClick={() => setShowDiagnostics(false)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-gray-800/80 hover:bg-[#FF2A2A]/20 text-gray-300 hover:text-[#FF2A2A] border border-gray-700 hover:border-[#FF2A2A]/40 transition-colors text-xs font-bold"
          title="Close Diagnostics Panel"
        >
          <X size={15} />
          <span>CLOSE</span>
        </button>
      </div>

      {/* Diagnostic Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
        <div className="bg-[#050810] border border-gray-800 p-3 rounded">
          <span className="text-gray-500 text-[10px] block mb-1">UPLINK PHASE LOCK</span>
          <span className="text-base font-bold text-[#00FF66] flex items-center space-x-1">
            <CheckCircle2 size={14} />
            <span>100% (LOCKED)</span>
          </span>
          <span className="text-[10px] text-gray-500 block mt-1">Loop BW: 200 Hz</span>
        </div>

        <div className="bg-[#050810] border border-gray-800 p-3 rounded">
          <span className="text-gray-500 text-[10px] block mb-1">CARRIER-TO-NOISE (CNR)</span>
          <span className="text-base font-bold text-[#00F0FF]">18.4 dB</span>
          <span className="text-[10px] text-gray-500 block mt-1">Threshold: 12.0 dB</span>
        </div>

        <div className="bg-[#050810] border border-gray-800 p-3 rounded">
          <span className="text-gray-500 text-[10px] block mb-1">SERVO TRACKING</span>
          <span className="text-base font-bold text-white">AZ 142.8° / EL 48.2°</span>
          <span className="text-[10px] text-[#00FF66] block mt-1">Motor Drift: 0.00°</span>
        </div>

        <div className="bg-[#050810] border border-gray-800 p-3 rounded">
          <span className="text-gray-500 text-[10px] block mb-1">HIGH POWER AMP (SSPA)</span>
          <span className="text-base font-bold text-[#00FF66]">250 WATT NOMINAL</span>
          <span className="text-[10px] text-gray-500 block mt-1">Cryo LNA Temp: 14 K</span>
        </div>
      </div>

      {/* Diagnostic Log Terminal */}
      <div className="bg-[#050810] border border-gray-800 rounded p-3 mb-4">
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-800/80 text-[11px]">
          <span className="text-gray-400 flex items-center space-x-1.5">
            <Terminal size={12} className="text-[#00F0FF]" />
            <span>DIAGNOSTIC TERMINAL LOGS</span>
          </span>
          <button
            onClick={handleRunDiagnostics}
            disabled={diagnosticsRunning}
            className="text-[#00F0FF] hover:underline font-bold disabled:opacity-50"
          >
            {diagnosticsRunning ? 'RUNNING RE-TEST...' : 'RE-RUN SWEEP'}
          </button>
        </div>

        <div className="space-y-1 text-xs text-gray-300 max-h-32 overflow-y-auto">
          {diagnosticsLogs.map((log, idx) => (
            <div key={idx} className="leading-relaxed">
              <span className="text-[#00F0FF] mr-2">›</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowDiagnostics(false)}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs font-bold uppercase transition-colors"
        >
          Done / Dismiss Diagnostics
        </button>
      </div>
    </div>
  );
}
