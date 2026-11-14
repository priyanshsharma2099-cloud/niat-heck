import React, { useState } from 'react';
import { useStore } from '../../lib/storeContext';
import {
  Store,
  ChevronDown,
  Plus,
  Sparkles,
  Download,
  Loader2,
  Check,
} from 'lucide-react';

interface TopToolbarProps {
  onOpenNewStoreModal: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({ onOpenNewStoreModal }) => {
  const {
    stores,
    activeStore,
    setActiveStore,
    simulateBatch,
    isAnalyzing,
    exportPdf,
  } = useStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 px-6 border-b border-[#18181B0F] bg-white flex items-center justify-between gap-4">
      {/* Left: Store Switcher Segmented Control */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[14px] bg-[#F8F8F5] border border-[#18181B14] hover:bg-zinc-100 text-xs font-semibold text-zinc-900 transition-all shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="max-w-[160px] truncate">{activeStore.name}</span>
            <span className="text-[10px] text-zinc-400 font-mono px-1 bg-zinc-200/60 rounded">
              {activeStore.platform}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
          </button>

          {/* Store Switcher Dropdown */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-2 w-64 rounded-[16px] bg-white border border-[#18181B14] shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Switch Store
                </div>
                {stores.map((st) => {
                  const isCurrent = st.id === activeStore.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => {
                        setActiveStore(st);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                        isCurrent
                          ? 'bg-[#F8F8F5] text-zinc-900 font-semibold'
                          : 'text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <p className="truncate text-zinc-900">{st.name}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{st.category}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-mono text-zinc-500 bg-zinc-100 px-1 py-0.5 rounded">
                          {st.platform}
                        </span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-[#3B5BDB]" />}
                      </div>
                    </button>
                  );
                })}

                <div className="pt-1.5 mt-1 border-t border-zinc-100 px-2">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenNewStoreModal();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#3B5BDB]" />
                    <span>Create New Store</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onOpenNewStoreModal}
          className="p-1.5 rounded-[12px] text-zinc-500 hover:text-zinc-900 hover:bg-[#F8F8F5] transition-colors"
          title="Create New Store"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={simulateBatch}
          disabled={isAnalyzing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#3B5BDB] hover:bg-[#324ec7] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
        >
          {isAnalyzing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
          )}
          <span>Simulate Batch (6 Reviews)</span>
        </button>

        <button
          onClick={exportPdf}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#18181B] hover:bg-black text-white text-xs font-semibold shadow-xs transition-all"
        >
          <Download className="w-3.5 h-3.5 text-zinc-300" />
          <span>Download Report</span>
        </button>
      </div>
    </header>
  );
};
