import React from 'react';
import { useStore } from '../../lib/storeContext';
import { generateWeeklyExecutiveReport } from '../../lib/pdfReportGenerator';
import {
  Upload,
  FlaskConical,
  Download,
  Plus,
  SlidersHorizontal,
  Activity,
  Store as StoreIcon,
} from 'lucide-react';

interface HeaderProps {
  onOpenUpload: () => void;
  onOpenSimulator: () => void;
  onOpenNewStore: () => void;
  onOpenSettings: () => void;
  onToggleActivityDrawer: () => void;
  activityDrawerOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  onOpenSimulator,
  onOpenNewStore,
  onOpenSettings,
  onToggleActivityDrawer,
  activityDrawerOpen,
}) => {
  const {
    stores,
    activeStore,
    setActiveStore,
    reviews,
    actionItems,
    sentimentAlerts,
    metrics,
    isAnalyzing,
  } = useStore();

  const handleDownloadReport = () => {
    generateWeeklyExecutiveReport(activeStore, reviews, actionItems, sentimentAlerts, metrics);
  };

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 transition-all">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Segmented Store Switcher */}
        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-inner">
            {stores.map((store) => {
              const isActive = store.id === activeStore.id;
              return (
                <button
                  key={store.id}
                  onClick={() => setActiveStore(store)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <StoreIcon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="truncate max-w-[140px]">{store.name}</span>
                </button>
              );
            })}
            <button
              onClick={onOpenNewStore}
              title="Add New Store Persona"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-xl transition-colors ml-0.5"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Demographic summary pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-indigo-50/70 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="truncate max-w-[240px]">
              {activeStore.category} • {activeStore.price_tier.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Right: Operational Tool Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Review Ingestion & Simulator */}
          <button
            onClick={onOpenSimulator}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition-all active:scale-95"
          >
            <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
            <span>Simulator Sandbox</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span>Ingest CSV</span>
          </button>

          {/* Export Report */}
          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-sm transition-all active:scale-95"
            title="Export Weekly Executive Report PDF"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          {/* Activity Drawer Toggle */}
          <button
            onClick={onToggleActivityDrawer}
            className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
              activityDrawerOpen
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle Live Telemetry Log"
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* API Keys Configuration */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition-all"
            title="Configure Supabase & Gemini API Keys"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global AI Processing Banner */}
      {isAnalyzing && (
        <div className="mt-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white flex items-center justify-between text-xs font-medium animate-pulse shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>Gemini AI is analyzing reviews against "{activeStore.name}" persona...</span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Filtering noise & synthesizing actions</span>
        </div>
      )}
    </header>
  );
};
