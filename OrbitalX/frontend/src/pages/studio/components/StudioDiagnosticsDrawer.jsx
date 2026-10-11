import React from 'react';
import { 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Plus, 
  Minus, 
  DownloadCloud 
} from 'lucide-react';
import { FORM_FACTORS, CUBESAT_COMPONENTS } from '../cubesatComponents';

export default function StudioDiagnosticsDrawer({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  formFactor,
  totalMass,
  totalVolume,
  totalPowerCons,
  totalPowerGen,
  totalCost,
  totalParts,
  batteryRuntime,
  subsystems,
  warnings,
  mountedComponents,
  onAddComponent,
  onRemoveComponent,
  onHighlightComponent,
  onExportCAD
}) {
  if (!isOpen) return null;

  const currentConfig = FORM_FACTORS[formFactor] || FORM_FACTORS['1U'];
  const massRatio = Math.min(100, Math.round((totalMass / currentConfig.maxMass) * 100));
  const volumeRatio = Math.min(100, Math.round((totalVolume / currentConfig.maxVolume) * 100));
  const powerSurplus = totalPowerGen - totalPowerCons;

  return (
    <div className="absolute top-16 right-3 bottom-14 sm:bottom-16 w-84 sm:w-96 z-30 bg-[#0A0F1F]/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-250">
      {/* Header with Tab Switcher & Close Button */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-[#0A0F1F]">
        <div className="flex items-center space-x-1 bg-[#050810] border border-gray-800 rounded p-0.5">
          <button
            onClick={() => setActiveTab('SPECS')}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
              activeTab === 'SPECS' 
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            SPECS & COMPLIANCE
          </button>
          <button
            onClick={() => setActiveTab('BOM')}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
              activeTab === 'BOM' 
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            BOM ({totalParts})
          </button>
        </div>

        <button
          id="close-diagnostics-sidebar-btn"
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
          title="Close Diagnostics & BOM Panel"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">
        {activeTab === 'SPECS' ? (
          <>
            {/* Primary Physical Specs Cards */}
            <div className="space-y-3">
              {/* Mass Budget */}
              <div className="bg-[#050810]/70 border border-gray-800 rounded-lg p-2.5">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400">Total Mass</span>
                  <span className={totalMass > currentConfig.maxMass ? 'text-rose-400 font-bold' : 'text-gray-200 font-bold'}>
                    {totalMass}g / {currentConfig.maxMass}g
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      totalMass > currentConfig.maxMass ? 'bg-rose-500' : 'bg-[#00F0FF]'
                    }`}
                    style={{ width: `${massRatio}%` }}
                  />
                </div>
              </div>

              {/* Volume Budget */}
              <div className="bg-[#050810]/70 border border-gray-800 rounded-lg p-2.5">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400">Volume Enclosed</span>
                  <span className={totalVolume > currentConfig.maxVolume ? 'text-rose-400 font-bold' : 'text-gray-200 font-bold'}>
                    {totalVolume}U / {currentConfig.maxVolume}U
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      totalVolume > currentConfig.maxVolume ? 'bg-rose-500' : 'bg-[#00FF66]'
                    }`}
                    style={{ width: `${volumeRatio}%` }}
                  />
                </div>
              </div>

              {/* Power Balance */}
              <div className="bg-[#050810]/70 border border-gray-800 rounded-lg p-2.5">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400">Net Power Balance</span>
                  <span className={powerSurplus >= 0 ? 'text-[#00FF66] font-bold' : 'text-rose-400 font-bold'}>
                    {powerSurplus > 0 ? `+${powerSurplus.toFixed(1)}W` : `${powerSurplus.toFixed(1)}W`}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] font-mono text-gray-500">
                  <span>Gen: +{totalPowerGen}W</span>
                  <span>Cons: -{totalPowerCons}W</span>
                  <span>Shadow: {batteryRuntime}</span>
                </div>
              </div>
            </div>

            {/* Subsystem Readiness Checklist */}
            <div className="bg-[#050810]/70 border border-gray-800 rounded-lg p-2.5">
              <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-2">
                Subsystems Status
              </h3>
              <div className="space-y-1.5 text-xs font-mono">
                {Object.entries(subsystems).map(([sys, ready]) => (
                  <div key={sys} className="flex items-center justify-between">
                    <span className="text-gray-400 uppercase">{sys}</span>
                    <span className={`flex items-center space-x-1 ${ready ? 'text-[#00FF66]' : 'text-rose-400'}`}>
                      {ready ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                      <span>{ready ? 'READY' : 'MISSING'}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Advisory Warnings Card */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">
                Telemetry Diagnostics
              </h3>
              {warnings.map((warn, idx) => (
                <div 
                  key={idx}
                  className={`p-2 rounded text-xs font-mono flex items-start space-x-2 ${
                    warn.startsWith('ALL SYSTEMS') 
                      ? 'bg-[#00FF66]/10 border border-[#00FF66]/30 text-[#00FF66]' 
                      : 'bg-amber-950/30 border border-amber-800/50 text-amber-300'
                  }`}
                >
                  {warn.startsWith('ALL SYSTEMS') ? (
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                  ) : (
                    <Info size={14} className="shrink-0 mt-0.5 text-amber-400" />
                  )}
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* BILL OF MATERIALS TAB */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400 pb-1 border-b border-gray-800">
              <span>Item / Subsystem</span>
              <span>Qty · Cost</span>
            </div>

            {Object.keys(mountedComponents).length === 0 ? (
              <div className="text-center py-10 text-gray-500 font-mono text-xs">
                No components mounted yet.
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(mountedComponents).map(([id, count]) => {
                  const comp = CUBESAT_COMPONENTS.find(c => c.id === id);
                  if (!comp || count <= 0) return null;

                  return (
                    <div 
                      key={id}
                      onMouseEnter={() => onHighlightComponent(id)}
                      onMouseLeave={() => onHighlightComponent(null)}
                      className="p-2 bg-[#050810]/70 border border-gray-800 rounded flex items-center justify-between text-xs font-mono hover:border-[#00F0FF]/40 transition-colors"
                    >
                      <div>
                        <div className="text-white font-bold">{comp.name}</div>
                        <div className="text-[10px] text-gray-500">
                          {comp.category} · {comp.mass * count}g · ${comp.cost} ea
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#00FF66]">
                          ${(comp.cost * count).toLocaleString()}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onRemoveComponent(comp)}
                            className="w-5 h-5 rounded bg-gray-800 hover:bg-rose-900/50 hover:text-rose-400 text-gray-300 flex items-center justify-center"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-4 text-center font-bold text-[#00F0FF]">
                            {count}
                          </span>
                          <button
                            onClick={() => onAddComponent(comp)}
                            disabled={count >= comp.maxCount}
                            className="w-5 h-5 rounded bg-gray-800 hover:bg-[#00F0FF]/30 hover:text-[#00F0FF] text-gray-300 flex items-center justify-center disabled:opacity-30"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total Budget Summary */}
            <div className="pt-2 border-t border-gray-800 space-y-1 text-xs font-mono">
              <div className="flex justify-between text-gray-400">
                <span>Total Payload Mass</span>
                <span className="text-gray-200">{totalMass}g</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Total Part Count</span>
                <span className="text-gray-200">{totalParts} units</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-800/80">
                <span className="text-[#00F0FF]">ESTIMATED BOM COST</span>
                <span className="text-[#00FF66]">${totalCost.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={onExportCAD}
              className="w-full mt-2 py-2 bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] rounded font-mono text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
            >
              <DownloadCloud size={13} />
              <span>EXPORT MANIFEST (JSON)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
