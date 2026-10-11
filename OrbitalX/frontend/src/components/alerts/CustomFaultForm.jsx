import React from 'react';
import { PlusCircle, Play, RefreshCw } from 'lucide-react';

function CustomFaultForm({
  customFault,
  setCustomFault,
  onSubmit,
  isSubmitting
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center space-x-2 text-[#FFB000]">
          <PlusCircle size={14} />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            CUSTOM TELEMETRY FAULT DEFINITION
          </span>
        </div>
        <p className="text-[11px] text-gray-400">
          Compose arbitrary aerospace anomalies, power brownouts, sensor drift, or thermal excursions.
        </p>

        {/* Subsystem & Severity Row */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">
              SUBSYSTEM:
            </label>
            <select
              value={customFault.subsystem}
              onChange={(e) => setCustomFault({ ...customFault, subsystem: e.target.value })}
              className="w-full bg-[#050810] border border-gray-700 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#FFB000]"
            >
              <option value="EPS">EPS (Electrical Power)</option>
              <option value="ADCS">ADCS (Attitude & Control)</option>
              <option value="COMMS">COMMS (RF & Antenna)</option>
              <option value="TCS">TCS (Thermal Control)</option>
              <option value="OBC">OBC (Computer & CDH)</option>
              <option value="ENV">ENV (Debris / Space Weather)</option>
              <option value="PAYLOAD">PAYLOAD (Optics / Sensors)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">
              SEVERITY:
            </label>
            <select
              value={customFault.severity}
              onChange={(e) => setCustomFault({ ...customFault, severity: e.target.value })}
              className="w-full bg-[#050810] border border-gray-700 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#FFB000]"
            >
              <option value="CRITICAL">CRITICAL (Red Alarm)</option>
              <option value="WARNING">WARNING (Amber Advisory)</option>
            </select>
          </div>
        </div>

        {/* Anomaly Title */}
        <div className="space-y-1">
          <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">
            ANOMALY TITLE / FAILURE NAME:
          </label>
          <input
            type="text"
            required
            placeholder="e.g. S-Band Frequency Synthesizer Unlock"
            value={customFault.title}
            onChange={(e) => setCustomFault({ ...customFault, title: e.target.value })}
            className="w-full bg-[#050810] border border-gray-700 rounded px-3 py-1.5 text-white font-mono text-xs placeholder-gray-600 focus:outline-none focus:border-[#FFB000]"
          />
        </div>

        {/* Metric Name, Fault Value, Threshold */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">
              METRIC:
            </label>
            <input
              type="text"
              placeholder="e.g. Synthesizer PLL"
              value={customFault.metric}
              onChange={(e) => setCustomFault({ ...customFault, metric: e.target.value })}
              className="w-full bg-[#050810] border border-gray-700 rounded px-2.5 py-1.5 text-white font-mono text-xs placeholder-gray-600 focus:outline-none focus:border-[#FFB000]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">
              ANOMALOUS VAL:
            </label>
            <input
              type="number"
              placeholder="e.g. 105"
              value={customFault.value}
              onChange={(e) => setCustomFault({ ...customFault, value: e.target.value })}
              className="w-full bg-[#050810] border border-gray-700 rounded px-2.5 py-1.5 text-white font-mono text-xs placeholder-gray-600 focus:outline-none focus:border-[#FFB000]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">
              THRESHOLD:
            </label>
            <input
              type="number"
              placeholder="e.g. 80"
              value={customFault.threshold}
              onChange={(e) => setCustomFault({ ...customFault, threshold: e.target.value })}
              className="w-full bg-[#050810] border border-gray-700 rounded px-2.5 py-1.5 text-white font-mono text-xs placeholder-gray-600 focus:outline-none focus:border-[#FFB000]"
            />
          </div>
        </div>

        {/* Detailed Anomaly Message */}
        <div className="space-y-1">
          <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">
            INCIDENT LOG NARRATIVE:
          </label>
          <textarea
            rows={3}
            required
            placeholder="Describe the telemetry breach, physical symptoms, and subsystem implications..."
            value={customFault.message}
            onChange={(e) => setCustomFault({ ...customFault, message: e.target.value })}
            className="w-full bg-[#050810] border border-gray-700 rounded p-2.5 text-white font-mono text-xs placeholder-gray-600 focus:outline-none focus:border-[#FFB000]"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded bg-[#FFB000] hover:bg-[#e09b00] text-black font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(255,176,0,0.2)]"
        >
          {isSubmitting ? (
            <>
              <RefreshCw size={13} className="animate-spin" />
              <span>DISPATCHING CUSTOM FAULT...</span>
            </>
          ) : (
            <>
              <Play size={13} />
              <span>DISPATCH CUSTOM ANOMALY TO CUBESAT</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default React.memo(CustomFaultForm);
