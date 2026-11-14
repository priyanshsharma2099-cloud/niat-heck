import React from 'react';
import { useStore } from '../../lib/storeContext';
import {
  TrendingUp,
  TrendingDown,
  Filter,
  CheckCircle2,
  Star,
  Layers,
} from 'lucide-react';

export const MetricCards: React.FC = () => {
  const { metrics } = useStore();

  const isNetPos = metrics.netSentimentScore >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Net Sentiment Score */}
      <div className="p-5 rounded-[28px] bg-white border border-slate-200/80 shadow-soft hover:shadow-elevated transition-all relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Net Sentiment
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isNetPos ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            {isNetPos ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-3xl font-extrabold tracking-tight ${
              isNetPos ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {metrics.netSentimentScore > 0 ? '+' : ''}
            {metrics.netSentimentScore}%
          </span>
          <span className="text-xs text-slate-400 font-medium">Index</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>{metrics.positiveCount} Pos</span>
          <span className="text-slate-300">•</span>
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
          <span>{metrics.neutralCount} Neu</span>
          <span className="text-slate-300">•</span>
          <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
          <span>{metrics.negativeCount} Neg</span>
        </div>
      </div>

      {/* 2. Total Ingested Reviews & Star Rating */}
      <div className="p-5 rounded-[28px] bg-white border border-slate-200/80 shadow-soft hover:shadow-elevated transition-all relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Reviews Ingested
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">
            {metrics.totalReviews}
          </span>
          <span className="text-xs text-slate-400 font-medium">Records</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <div className="flex items-center text-amber-500">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="ml-1 font-bold">{metrics.averageRating}</span>
          </div>
          <span className="text-slate-400">/ 5.0 store average</span>
        </div>
      </div>

      {/* 3. Noise Filtered Rate */}
      <div className="p-5 rounded-[28px] bg-white border border-slate-200/80 shadow-soft hover:shadow-elevated transition-all relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Noise Filtered
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Filter className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-purple-600">
            {metrics.noisePercentage}%
          </span>
          <span className="text-xs text-slate-400 font-medium">
            ({metrics.noiseReviewsCount} stripped)
          </span>
        </div>
        <div className="mt-3 text-xs text-slate-500 truncate" title="Couriers, delivery partner delays, squished boxes">
          3rd-party logistics noise isolated
        </div>
      </div>

      {/* 4. Action Tasks Pending */}
      <div className="p-5 rounded-[28px] bg-white border border-slate-200/80 shadow-soft hover:shadow-elevated transition-all relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Action Tasks
          </span>
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">
            {metrics.pendingTasksCount}
          </span>
          <span className="text-xs text-slate-400 font-medium">Pending</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {metrics.criticalAlertsCount > 0 ? (
            <span className="text-rose-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              {metrics.criticalAlertsCount} critical alert active
            </span>
          ) : (
            <span className="text-emerald-600 font-medium">Operational load balanced</span>
          )}
        </div>
      </div>
    </div>
  );
};
