import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ArrowLeft, 
  Settings, 
  Wrench, 
  Zap, 
  Save, 
  DownloadCloud, 
  Trash2, 
  Plus, 
  SlidersHorizontal 
} from 'lucide-react';
import { FORM_FACTORS } from '../cubesatComponents';

export default function StudioToolbar({
  missionName,
  setMissionName,
  isEditingName,
  setIsEditingName,
  formFactor,
  setFormFactor,
  targetOrbit,
  setTargetOrbit,
  isValidating,
  triggerValidate,
  handleSave,
  handleExportCAD,
  handleReset,
  componentsOpen,
  setComponentsOpen,
  diagnosticsOpen,
  setDiagnosticsOpen,
  warningsCount = 0,
  totalParts = 0
}) {
  return (
    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20 gap-3">
      {/* Left: Quick Nav, Mission Name, Mode, Form Factor, Orbit */}
      <div className="pointer-events-auto flex flex-wrap items-center gap-2.5 bg-[#0A0F1F]/92 backdrop-blur-md border border-gray-800 rounded-xl px-3.5 py-1.5 shadow-2xl">
        <NavLink
          to="/dashboard"
          className="flex items-center space-x-1 text-xs font-mono text-gray-400 hover:text-[#00F0FF] transition-colors pr-2 border-r border-gray-800"
          title="Exit 3D Studio"
        >
          <ArrowLeft size={13} className="text-[#00F0FF]" />
          <span className="font-bold hidden sm:inline">EXIT</span>
        </NavLink>

        {/* Editable Mission Name */}
        <div className="flex items-center space-x-2 pr-1 border-r border-gray-800">
          <Settings size={14} className="text-[#00F0FF] animate-spin-slow" />
          {isEditingName ? (
            <input 
              type="text"
              value={missionName}
              onChange={(e) => setMissionName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              autoFocus
              className="bg-[#12192b] border border-[#00F0FF] text-white px-2 py-0.5 rounded font-mono text-xs focus:outline-none"
            />
          ) : (
            <div 
              onClick={() => setIsEditingName(true)}
              className="group flex items-center space-x-1.5 cursor-pointer"
            >
              <h1 className="text-xs sm:text-sm font-bold tracking-wider text-white uppercase font-mono group-hover:text-[#00F0FF] transition-colors">
                {missionName}
              </h1>
              <span className="text-gray-600 text-[10px] font-mono group-hover:text-gray-400">✎</span>
            </div>
          )}
        </div>

        {/* CAD Studio Mode Pill */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#00F0FF]/15 border border-[#00F0FF]/30 rounded font-mono text-xs font-bold text-[#00F0FF]">
          <Wrench size={12} />
          <span>CAD ASSEMBLY</span>
        </div>

        {/* Form Factor Switcher */}
        <div className="flex items-center bg-[#050810] border border-gray-800 rounded p-0.5 space-x-1 font-mono text-xs font-bold overflow-x-auto max-w-full">
          {Object.keys(FORM_FACTORS).map((ff) => (
            <button
              key={ff}
              onClick={() => setFormFactor(ff)}
              className={`px-2 py-1 rounded transition-all whitespace-nowrap ${
                formFactor === ff 
                  ? 'bg-[#00F0FF]/25 text-[#00F0FF] font-bold border border-[#00F0FF]/40 shadow-[0_0_8px_rgba(0,240,255,0.25)]' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
              }`}
              title={`${FORM_FACTORS[ff].dimensions} - ${FORM_FACTORS[ff].desc}`}
            >
              {ff}
            </button>
          ))}
        </div>

        {/* Target Orbit Dropdown */}
        <div className="hidden lg:flex items-center">
          <select
            value={targetOrbit}
            onChange={(e) => setTargetOrbit(e.target.value)}
            className="bg-[#050810] border border-gray-800 text-gray-300 font-mono text-xs rounded px-2.5 py-1 focus:outline-none focus:border-[#00F0FF]/50 cursor-pointer"
          >
            <option value="LEO (400km)">LEO (400 km) · ISS Co-Orbit</option>
            <option value="SSO (550km)">SSO (550 km) · Sun-Synch</option>
            <option value="VLEO (250km)">VLEO (250 km) · High-Drag</option>
            <option value="MEO (2000km)">MEO (2,000 km) · Radiation</option>
            <option value="Lunar Transfer">Lunar Transfer Trajectory</option>
          </select>
        </div>
      </div>

      {/* Right: Validation, Save, Export, Reset & Drawers Controls */}
      <div className="pointer-events-auto flex items-center space-x-2 bg-[#0A0F1F]/92 backdrop-blur-md border border-gray-800 rounded-xl px-2.5 py-1.5 shadow-2xl">
        <button
          onClick={triggerValidate}
          disabled={isValidating}
          className="flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono font-bold transition-all bg-[#00FF66]/15 hover:bg-[#00FF66]/25 border border-[#00FF66]/40 text-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.15)] disabled:opacity-50"
          title="Run Flight Feasibility Scan"
        >
          <Zap size={12} className={isValidating ? 'animate-bounce' : ''} />
          <span className="hidden sm:inline">VALIDATE</span>
        </button>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1 px-2.5 py-1 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-200 hover:text-white rounded text-xs font-mono transition-colors"
          title="Save to Browser Telemetry Cache"
        >
          <Save size={12} />
          <span className="hidden md:inline">SAVE</span>
        </button>

        <button
          onClick={handleExportCAD}
          className="flex items-center space-x-1 px-2.5 py-1 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-200 hover:text-white rounded text-xs font-mono transition-colors"
          title="Export Assembly Manifest JSON"
        >
          <DownloadCloud size={12} />
          <span className="hidden md:inline">EXPORT</span>
        </button>

        <button
          onClick={handleReset}
          className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
          title="Reset All Hardware"
        >
          <Trash2 size={13} />
        </button>

        <div className="h-4 w-px bg-gray-800 mx-1" />

        {/* Toggle Library Drawer Button */}
        <button
          id="toggle-components-sidebar-btn"
          onClick={() => setComponentsOpen(!componentsOpen)}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
            componentsOpen 
              ? 'bg-[#00FF66]/20 border-[#00FF66]/50 text-[#00FF66]' 
              : 'bg-gray-800/70 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
          title="Toggle Hardware Components Drawer"
        >
          <Plus size={13} />
          <span className="font-bold hidden sm:inline">COMPONENTS</span>
        </button>

        {/* Toggle Diagnostics / BOM Drawer Button */}
        <button
          id="toggle-diagnostics-sidebar-btn"
          onClick={() => setDiagnosticsOpen(!diagnosticsOpen)}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono transition-colors border relative ${
            diagnosticsOpen 
              ? 'bg-[#00F0FF]/20 border-[#00F0FF]/50 text-[#00F0FF]' 
              : 'bg-gray-800/70 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
          title="Toggle Telemetry Diagnostics & BOM Drawer"
        >
          <SlidersHorizontal size={13} />
          <span className="font-bold hidden sm:inline">SPECS</span>
          {warningsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
          )}
        </button>
      </div>
    </div>
  );
}
