import React from 'react';
import { Plus, Minus, Search, X, ChevronLeft } from 'lucide-react';
import { COMPONENT_CATEGORIES } from '../cubesatComponents';

export default function StudioHardwareDrawer({
  isOpen,
  onClose,
  filteredComponents,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  mountedComponents,
  onAddComponent,
  onRemoveComponent,
  onHighlightComponent
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-16 left-3 bottom-14 sm:bottom-16 w-80 sm:w-92 z-30 bg-[#0A0F1F]/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-in slide-in-from-left duration-250">
      {/* Sidebar Header & Close Button */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-[#0A0F1F]">
        <div className="flex items-center space-x-2">
          <Plus size={15} className="text-[#00FF66]" />
          <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
            COMPONENTS ({filteredComponents.length})
          </span>
        </div>
        <button
          id="close-components-sidebar-btn"
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
          title="Close Components Library"
        >
          <ChevronLeft size={17} />
        </button>
      </div>

      {/* Search & Filter Pills */}
      <div className="p-3 border-b border-gray-800/80 space-y-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2 text-gray-500" />
          <input 
            type="text"
            placeholder="Search hardware..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#050810] border border-gray-800 rounded pl-8 pr-7 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 font-mono transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1.5 text-gray-500 hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {COMPONENT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider transition-colors ${
                activeCategory === cat.id 
                  ? 'bg-[#00F0FF] text-[#0A0F1F] font-bold' 
                  : 'bg-[#12192b] text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {filteredComponents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 font-mono text-xs">
            No matching hardware found.
          </div>
        ) : (
          filteredComponents.map(comp => {
            const count = mountedComponents[comp.id] || 0;
            const isMax = count >= comp.maxCount;

            return (
              <div 
                key={comp.id}
                onMouseEnter={() => onHighlightComponent(comp.id)}
                onMouseLeave={() => onHighlightComponent(null)}
                className={`p-2.5 rounded-lg border transition-all ${
                  count > 0 
                    ? 'bg-[#12192b]/80 border-[#00F0FF]/40 shadow-sm' 
                    : 'bg-[#050810]/70 border-gray-800/80 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: comp.color }} 
                    />
                    <h2 className="text-xs font-bold text-white font-mono leading-tight">
                      {comp.name}
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-800 text-gray-400 uppercase">
                    {comp.category}
                  </span>
                </div>

                <p className="text-[11px] text-gray-400 line-clamp-1 mb-2">
                  {comp.desc}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-2">
                  <span>Mass: <strong className="text-gray-200">{comp.mass}g</strong></span>
                  <span>Vol: <strong className="text-gray-200">{comp.volume}U</strong></span>
                  <span>
                    Power: <strong className="text-gray-200">
                      {comp.powerCons > 0 ? `-${comp.powerCons}W` : comp.powerGen > 0 ? `+${comp.powerGen}W` : '0W'}
                    </strong>
                  </span>
                </div>

                {/* Counter / Add Button */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-800/50">
                  <span className="text-xs font-mono font-bold text-[#00FF66]">
                    ${comp.cost.toLocaleString()}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {count > 0 && (
                      <button
                        onClick={() => onRemoveComponent(comp)}
                        className="w-6 h-6 rounded bg-gray-800 hover:bg-rose-900/50 hover:text-rose-400 text-gray-300 flex items-center justify-center transition-colors"
                        title="Remove 1 unit"
                      >
                        <Minus size={11} />
                      </button>
                    )}

                    {count > 0 && (
                      <span className="text-xs font-mono font-bold text-[#00F0FF] w-5 text-center">
                        {count}
                      </span>
                    )}

                    <button
                      onClick={() => onAddComponent(comp)}
                      disabled={isMax}
                      className={`px-2.5 py-1 rounded text-xs font-mono flex items-center space-x-1 transition-all ${
                        isMax 
                          ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed' 
                          : 'bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/30 hover:border-[#00F0FF]/60'
                      }`}
                    >
                      <Plus size={11} />
                      <span>{count > 0 ? 'Add' : 'Mount'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
