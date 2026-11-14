import React from 'react';
import { useStore } from '../../lib/storeContext';
import { AlertTriangle, X, ShieldAlert, ArrowUpRight } from 'lucide-react';

export const AnomalyAlertBanner: React.FC = () => {
  const { sentimentAlerts, dismissAlert, setActiveTab } = useStore();

  if (sentimentAlerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {sentimentAlerts.map((alert) => {
        const isHigh = alert.severity === 'high';
        return (
          <div
            key={alert.id}
            className={`p-4 rounded-[20px] border transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isHigh
                ? 'bg-gradient-to-r from-rose-50 via-white to-rose-50/40 border-rose-200 text-rose-950 shadow-sm'
                : 'bg-gradient-to-r from-amber-50 via-white to-amber-50/40 border-amber-200 text-amber-950'
            }`}
          >
            {/* Ambient Pulse indicator */}
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isHigh ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-amber-500 text-white'
                }`}
              >
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      isHigh ? 'bg-rose-200/80 text-rose-800' : 'bg-amber-200/80 text-amber-800'
                    }`}
                  >
                    {alert.severity} Spike
                  </span>
                  <span className="font-bold text-sm text-slate-900">
                    {alert.attribute}
                  </span>
                  <span
                    className={`text-xs font-extrabold ${
                      isHigh ? 'text-rose-600' : 'text-amber-700'
                    }`}
                  >
                    +{alert.percentage_surge}% surge
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {alert.message}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={() => setActiveTab('checklist')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-800 shadow-sm flex items-center gap-1 transition-all active:scale-95"
              >
                <span>View Action Fix</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="p-1.5 rounded-xl hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors"
                title="Dismiss Warning"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
