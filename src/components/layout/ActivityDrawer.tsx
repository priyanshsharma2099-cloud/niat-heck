import React from 'react';
import { useStore } from '../../lib/storeContext';
import {
  X,
  Activity,
  CheckCircle2,
  Filter,
  AlertTriangle,
  ArrowDownToLine,
  MessageSquare,
} from 'lucide-react';

interface ActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({ isOpen, onClose }) => {
  const { activityLogs } = useStore();

  if (!isOpen) return null;

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'ingest':
        return <ArrowDownToLine className="w-4 h-4 text-indigo-500" />;
      case 'filter':
        return <Filter className="w-4 h-4 text-emerald-500" />;
      case 'task_complete':
        return <CheckCircle2 className="w-4 h-4 text-teal-500" />;
      case 'alert_generated':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'reply_copied':
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white/95 backdrop-blur-2xl border-l border-slate-200/90 shadow-2xl z-50 flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Live Activity Stream
            </h3>
            <span className="text-[10px] text-slate-400">Autonomous Telemetry Feed</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activityLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No activity logged yet.
          </div>
        ) : (
          activityLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-all text-xs space-y-1"
            >
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  {getLogIcon(log.type)}
                  <span>{log.title}</span>
                </div>
                <span className="text-slate-400 font-mono">{log.timestamp}</span>
              </div>
              <p className="text-slate-600 pl-5 text-[11px] leading-relaxed">
                {log.description}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center text-[10px] text-slate-400">
        Updates automatically during review ingestion & AI actions
      </div>
    </div>
  );
};
