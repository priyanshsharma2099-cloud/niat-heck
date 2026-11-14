import React from 'react';
import { useStore } from '../../lib/storeContext';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { isGeminiConfigured } from '../../lib/geminiService';
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquareQuote,
  AlertTriangle,
  Store,
  Sparkles,
  Database,
  ExternalLink,
} from 'lucide-react';

interface SidebarProps {
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings }) => {
  const { activeTab, setActiveTab, metrics, sentimentAlerts, activeStore } = useStore();
  const hasSupabase = isSupabaseConfigured();
  const hasGemini = isGeminiConfigured();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'checklist',
      label: 'Action Tasks',
      icon: CheckSquare,
      badge: metrics.pendingTasksCount > 0 ? metrics.pendingTasksCount : null,
      badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    },
    {
      id: 'reviews',
      label: 'Feedback Feed',
      icon: MessageSquareQuote,
      badge: metrics.totalReviews > 0 ? metrics.totalReviews : null,
      badgeColor: 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400',
    },
    {
      id: 'alerts',
      label: 'Trend Alerts',
      icon: AlertTriangle,
      badge: sentimentAlerts.length > 0 ? sentimentAlerts.length : null,
      badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 animate-pulse',
    },
    {
      id: 'persona',
      label: 'Store Persona',
      icon: Store,
      badge: null,
    },
  ];

  return (
    <aside className="w-[184px] shrink-0 border-r border-slate-200/80 bg-white/80 backdrop-blur-xl h-screen sticky top-0 flex flex-col justify-between p-3 select-none z-20">
      {/* Top Branding */}
      <div>
        <div className="flex items-center gap-2.5 px-2 py-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 block leading-none">
              CLUEY CART
            </span>
            <span className="text-[10px] text-indigo-600 font-semibold tracking-wider uppercase block mt-1">
              AI ENGINE
            </span>
          </div>
        </div>

        {/* Current Active Store Badge */}
        <div className="mx-1 mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
            Active Store
          </span>
          <span className="font-bold text-slate-800 truncate block mt-0.5" title={activeStore.name}>
            {activeStore.name}
          </span>
          <span className="text-[10px] text-slate-500 truncate block mt-0.5">
            {activeStore.category}
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-indigo-500/30 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Service Connectors & Settings */}
      <div className="space-y-2 pt-3 border-t border-slate-100">
        <button
          onClick={onOpenSettings}
          className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition-colors"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Connections
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 flex items-center gap-1">
                <Database className="w-3 h-3 text-slate-400" /> Supabase
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  hasSupabase ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
                title={hasSupabase ? 'Supabase Connected' : 'Mock/Local Mode'}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-slate-400" /> Gemini AI
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  hasGemini ? 'bg-emerald-500' : 'bg-indigo-400 animate-pulse'
                }`}
                title={hasGemini ? 'Gemini 1.5 Active' : 'Intelligent Fallback Simulation'}
              />
            </div>
          </div>
        </button>

        <div className="px-2 py-1 flex items-center justify-between text-[10px] text-slate-400">
          <span>v1.0.0 Luminous</span>
          <span className="text-emerald-600 font-semibold">Ready</span>
        </div>
      </div>
    </aside>
  );
};
