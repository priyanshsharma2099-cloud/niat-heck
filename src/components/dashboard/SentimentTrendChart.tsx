import React, { useState, useMemo } from 'react';
import { useStore } from '../../lib/storeContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';

export const SentimentTrendChart: React.FC = () => {
  const { reviews } = useStore();
  const [viewMode, setViewMode] = useState<'attribute' | 'timeline'>('attribute');

  // Attribute Breakdown Data
  const attributeData = useMemo(() => {
    const counts: Record<string, { positive: number; neutral: number; negative: number }> = {
      Sizing: { positive: 0, neutral: 0, negative: 0 },
      Fabric: { positive: 0, neutral: 0, negative: 0 },
      Stitching: { positive: 0, neutral: 0, negative: 0 },
      Color: { positive: 0, neutral: 0, negative: 0 },
      Value: { positive: 0, neutral: 0, negative: 0 },
      Service: { positive: 0, neutral: 0, negative: 0 },
    };

    reviews.forEach((r) => {
      const attrKey = r.primary_attribute
        ? r.primary_attribute.charAt(0).toUpperCase() + r.primary_attribute.slice(1)
        : 'Fabric';

      if (counts[attrKey]) {
        const label = r.sentiment_label || 'neutral';
        counts[attrKey][label] += 1;
      }
    });

    return Object.entries(counts).map(([name, data]) => ({
      name,
      Positive: data.positive,
      Neutral: data.neutral,
      Negative: data.negative,
    }));
  }, [reviews]);

  // Timeline Trend Data (Last 7 Days)
  const timelineData = useMemo(() => {
    const daysMap: Record<string, { date: string; positive: number; negative: number; neutral: number }> = {};
    
    // Seed last 6 days
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      daysMap[key] = { date: key, positive: 0, negative: 0, neutral: 0 };
    }

    reviews.forEach((r) => {
      const d = new Date(r.review_date || Date.now());
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (daysMap[key]) {
        if (r.sentiment_label === 'positive') daysMap[key].positive += 1;
        else if (r.sentiment_label === 'negative') daysMap[key].negative += 1;
        else daysMap[key].neutral += 1;
      }
    });

    return Object.values(daysMap);
  }, [reviews]);

  return (
    <div className="p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-soft">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Niche Sentiment Analytics</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-attribute sentiment distribution and complaint velocity
          </p>
        </div>

        {/* View Toggle */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setViewMode('attribute')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === 'attribute'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            By Attribute
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === 'timeline'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Velocity Trend
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'attribute' ? (
            <BarChart data={attributeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Positive" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Neutral" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Negative" fill="#F43F5E" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="negGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="positive" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#posGrad)" name="Positive" />
              <Area type="monotone" dataKey="negative" stroke="#F43F5E" strokeWidth={2.5} fillOpacity={1} fill="url(#negGrad)" name="Negative" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
