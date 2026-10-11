import React from 'react';

export default function StudioCanvasOverlays({
  actionBanner,
  hoveredComponent,
  totalMounted,
  formFactor,
  onLoadPreset,
  isAssembling,
  isValidating
}) {
  return (
    <>
      {/* Subtle Micro-Action Toast */}
      {actionBanner && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in duration-150">
          <div className="flex items-center space-x-2 bg-[#0A0F1F]/90 border border-gray-700/60 text-gray-200 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono shadow-sm">
            <span className={`w-1.5 h-1.5 rounded-full ${actionBanner.type === 'ADD' ? 'bg-[#00f0ff]' : 'bg-[#f59e0b]'}`} />
            <span>{actionBanner.type === 'ADD' ? 'Mounted:' : 'Unmounted:'} <strong className={actionBanner.type === 'ADD' ? 'text-[#00f0ff]' : 'text-[#f59e0b]'}>{actionBanner.componentName}</strong></span>
          </div>
        </div>
      )}

      {/* 3D Component Hover HUD Tooltip */}
      {hoveredComponent && (
        <div 
          className="fixed pointer-events-none z-40 bg-[#0A0F1F]/95 border border-[#00F0FF]/60 backdrop-blur-md px-3 py-2 rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.25)] text-gray-200 transition-opacity duration-150"
          style={{
            left: `${hoveredComponent.screenX + 16}px`,
            top: `${hoveredComponent.screenY - 20}px`
          }}
        >
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] rounded font-bold uppercase">
              {hoveredComponent.category}
            </span>
            <span className="font-mono text-xs font-bold text-white truncate max-w-[180px]">
              {hoveredComponent.name}
            </span>
          </div>
          <div className="flex items-center space-x-3 text-[10px] font-mono text-gray-400">
            <span>Mass: <strong className="text-gray-200">{hoveredComponent.mass}g</strong></span>
            <span>•</span>
            <span>Power: <strong className="text-gray-200">{hoveredComponent.powerCons ? `${hoveredComponent.powerCons}W` : `+${hoveredComponent.powerGen}W`}</strong></span>
          </div>
        </div>
      )}

      {/* Empty State Overlay */}
      {totalMounted === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="bg-[#050810]/75 border border-[#00F0FF]/30 backdrop-blur-md px-6 py-4 rounded-xl text-center shadow-2xl pointer-events-auto max-w-sm">
            <h3 className="font-mono text-sm tracking-widest text-[#00F0FF] uppercase mb-1 font-bold">
              EMPTY DESIGN SPACE
            </h3>
            <p className="font-mono text-xs text-gray-400 mb-3">
              Select components from the left hardware library to begin building your {formFactor} CubeSat.
            </p>
            {onLoadPreset && (
              <button
                onClick={() => onLoadPreset(formFactor)}
                className="px-3.5 py-1.5 bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 border border-[#00F0FF]/60 text-[#00F0FF] rounded-lg font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,240,255,0.25)] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              >
                ⚡ LOAD {formFactor} NOMINAL PRESET
              </button>
            )}
          </div>
        </div>
      )}

      {/* Assembly / Validation Toast */}
      {isAssembling && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-[#00F0FF]/15 border border-[#00F0FF] backdrop-blur-md px-4 py-1.5 rounded-full font-mono text-xs text-[#00F0FF] tracking-wider animate-pulse flex items-center space-x-2 shadow-lg shadow-[#00F0FF]/20 pointer-events-none">
          <span>⚙ ASSEMBLE EXPLODED VIEW ACTIVE</span>
        </div>
      )}
      {isValidating && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-[#10B981]/15 border border-[#10B981] backdrop-blur-md px-4 py-1.5 rounded-full font-mono text-xs text-[#10B981] tracking-wider animate-pulse flex items-center space-x-2 shadow-lg shadow-[#10B981]/20 pointer-events-none">
          <span>⚡ TELEMETRY FEASIBILITY SCANNING...</span>
        </div>
      )}

      {/* Controls Guidance */}
      <div className="absolute bottom-14 left-6 hidden lg:flex items-center space-x-3 text-[10px] font-mono text-gray-500/70 pointer-events-none z-10">
        <span>✛ Drag: Rotate</span>
        <span>•</span>
        <span>Scroll: Zoom</span>
        <span>•</span>
        <span>Right-click: Pan</span>
      </div>
    </>
  );
}
