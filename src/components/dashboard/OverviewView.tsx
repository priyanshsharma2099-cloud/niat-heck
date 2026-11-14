import React, { useState, useMemo } from 'react';
import { useStore } from '../../lib/storeContext';
import {
  AlertTriangle,
  X,
  TrendingUp,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Quote,
  Star,
  Activity,
  CheckSquare,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const OverviewView: React.FC = () => {
  const {
    activeStore,
    reviews,
    tasks,
    alerts,
    dismissAlert,
    metrics,
    activityLogs,
    setActiveTab,
    toggleTask,
  } = useStore();

  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  // Active Store Scoped Data
  const storeReviews = useMemo(() => {
    return reviews.filter((r) => r.store_id === activeStore.id);
  }, [reviews, activeStore.id]);

  const activeAlert = useMemo(() => {
    return alerts.find((a) => a.store_id === activeStore.id && !a.acknowledged) || null;
  }, [alerts, activeStore.id]);

  // Dynamic Keyword Frequency & Quotes
  const { keywordStats, allQuotes } = useMemo(() => {
    const kwMap = new Map<
      string,
      { count: number; sentiment: 'positive' | 'negative'; quotes: { text: string; author: string; rating: number; platform: string }[] }
    >();

    storeReviews.forEach((r) => {
      if (r.is_noise) return;
      const terms = r.topics && r.topics.length > 0 ? r.topics : [activeStore.category];
      terms.forEach((term) => {
        const clean = term.trim();
        const existing = kwMap.get(clean) || {
          count: 0,
          sentiment: r.sentiment === 'negative' ? 'negative' : 'positive',
          quotes: [],
        };
        existing.count += 1;
        existing.quotes.push({
          text: r.raw_text,
          author: r.author,
          rating: r.rating,
          platform: r.source_platform,
        });
        kwMap.set(clean, existing);
      });
    });

    const stats = Array.from(kwMap.entries())
      .map(([kw, data]) => ({
        keyword: kw,
        count: data.count,
        sentiment: data.sentiment,
        quotes: data.quotes,
      }))
      .sort((a, b) => b.count - a.count);

    return { keywordStats: stats, allQuotes: storeReviews.filter((r) => !r.is_noise) };
  }, [storeReviews, activeStore.category]);

  // Displayed Verbatim Quotes based on active keyword filter
  const displayedQuotes = useMemo(() => {
    if (!selectedKeyword) {
      return storeReviews
        .filter((r) => !r.is_noise)
        .slice(0, 3)
        .map((r) => ({
          text: r.raw_text,
          author: r.author,
          rating: r.rating,
          platform: r.source_platform,
          sentiment: r.sentiment,
        }));
    }

    const matched = keywordStats.find((k) => k.keyword === selectedKeyword);
    if (!matched) return [];
    return matched.quotes.map((q) => ({
      ...q,
      sentiment: matched.sentiment,
    }));
  }, [selectedKeyword, keywordStats, storeReviews]);

  // Chart Timeline Data (Days of week or simulated timeline)
  const chartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, idx) => {
      const pos = Math.max(1, (idx * 2 + 3) % 7);
      const neg = idx === 3 || idx === 5 ? 3 : 1;
      const noise = idx % 2 === 0 ? 2 : 1;
      return {
        name: day,
        'Positive Signal': pos,
        'Negative Signal': neg,
        'Filtered Noise': noise,
      };
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Proactive Sentiment Trend Spike Warning Banner */}
      {activeAlert && (
        <div
          className={`rounded-[20px] p-4 border transition-all ${
            activeAlert.severity === 'critical'
              ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]'
              : 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-[12px] shrink-0 ${
                  activeAlert.severity === 'critical' ? 'bg-[#FFE4E6]' : 'bg-[#FEF3C7]'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider font-mono">
                    {activeAlert.severity} Surge Warning (+{activeAlert.delta_percent}%)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 font-semibold">
                    {activeAlert.topic}
                  </span>
                </div>
                <p className="text-xs mt-1 text-zinc-800 leading-relaxed max-w-3xl">
                  {activeAlert.summary}
                </p>
                <div className="flex items-center gap-2.5 mt-2.5">
                  <button
                    onClick={() => setSelectedKeyword(activeAlert.topic)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-zinc-900 bg-white px-2.5 py-1 rounded-[10px] border border-zinc-200/80 shadow-2xs hover:bg-zinc-50 transition-colors"
                  >
                    <Filter className="w-3 h-3" />
                    <span>Filter Evidence Quotes</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('actions')}
                    className="flex items-center gap-1 text-[11px] font-semibold text-zinc-900 hover:underline"
                  >
                    <span>View Recommended Actions</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => dismissAlert(activeAlert.id)}
              className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg transition-colors"
              title="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. 4-Column KPI Strip (JetBrains Mono Tabular Numerals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-[20px] p-5 border border-[#18181B12] shadow-2xs">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Niche Signal Kept
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-[#18181B] tracking-tight">
              {metrics.signalKeptPercent}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 font-mono">
              {metrics.totalReviews - metrics.noiseFilteredCount} of {metrics.totalReviews}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Logistics & spam noise isolated
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-[20px] p-5 border border-[#18181B12] shadow-2xs">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Positive Sentiment
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-[#18181B] tracking-tight">
              {metrics.positivePercent}%
            </span>
            <span className="text-xs font-semibold text-[#15803D] bg-[#ECFDF3] px-1.5 py-0.5 rounded font-mono">
              Signal Only
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            True product craftsmanship score
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-[20px] p-5 border border-[#18181B12] shadow-2xs">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Noise Filtered Out
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-[#18181B] tracking-tight">
              {metrics.noiseFilteredCount}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              reviews
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Courier delivery & transit delays
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-[20px] p-5 border border-[#18181B12] shadow-2xs">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Weekly Tasks Open
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-[#18181B] tracking-tight">
              {metrics.openTasksCount}
            </span>
            <span className="text-xs font-semibold text-rose-600 font-mono">
              pending
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Evidence-backed action checklist
          </p>
        </div>
      </div>

      {/* 3. Main Analytical-to-Activity Split (8 cols / 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 8 cols */}
        <div className="lg:col-span-8 space-y-6">
          {/* Stacked Recharts BarChart */}
          <div className="bg-white rounded-[24px] p-6 border border-[#18181B12] shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-plus-jakarta font-bold text-sm text-zinc-900">
                  Signal vs. Noise Timeline
                </h3>
                <p className="text-xs text-zinc-400">
                  Daily ratio of verified product sentiment vs. filtered logistics noise
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#15803D]" />
                  Positive Signal
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#BE123C]" />
                  Negative Signal
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#D4D4D8]" />
                  Filtered Noise
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F1ED" vertical={false} />
                  <XAxis dataKey="name" stroke="#A1A1AA" fontSize={11} tickLine={false} />
                  <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #18181B12',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="Positive Signal" stackId="a" fill="#15803D" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Negative Signal" stackId="a" fill="#BE123C" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Filtered Noise" stackId="a" fill="#D4D4D8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Keyword Filter Pills & Verbatim Quotes */}
          <div className="bg-white rounded-[24px] p-6 border border-[#18181B12] shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-plus-jakarta font-bold text-sm text-zinc-900">
                  Key Feedback Topics & Verbatim Customer Quotes
                </h3>
                <p className="text-xs text-zinc-400">
                  Click a topic pill to inspect verbatim customer evidence
                </p>
              </div>

              {selectedKeyword && (
                <button
                  onClick={() => setSelectedKeyword(null)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-900 underline font-medium"
                >
                  Reset filter
                </button>
              )}
            </div>

            {/* Keyword Pills Cloud */}
            <div className="flex flex-wrap gap-2 mb-5">
              {keywordStats.map((k) => {
                const isSelected = selectedKeyword === k.keyword;
                const isNegative = k.sentiment === 'negative';

                return (
                  <button
                    key={k.keyword}
                    onClick={() => setSelectedKeyword(isSelected ? null : k.keyword)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#18181B] text-white shadow-xs'
                        : isNegative
                        ? 'bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] hover:bg-[#FFE4E6]'
                        : 'bg-[#ECFDF3] text-[#15803D] border border-[#BBF7D0] hover:bg-[#DCFCE7]'
                    }`}
                  >
                    <span>{k.keyword}</span>
                    <span
                      className={`text-[10px] font-mono px-1 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : isNegative
                          ? 'bg-rose-200/50 text-[#BE123C]'
                          : 'bg-emerald-200/50 text-[#15803D]'
                      }`}
                    >
                      {k.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Verbatim Quote Callouts Container */}
            <div className="space-y-3">
              {displayedQuotes.length === 0 ? (
                <p className="text-xs text-zinc-400 py-4 text-center">
                  No verbatim quotes available for this filter.
                </p>
              ) : (
                displayedQuotes.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-[16px] bg-[#F8F8F5] border border-[#18181B0A] space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-800">{q.author}</span>
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: q.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">{q.platform}</span>
                    </div>

                    <p className="text-xs text-zinc-700 italic leading-relaxed">
                      "{q.text}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 4 cols */}
        <div className="lg:col-span-4 space-y-6">
          {/* Action Tasks Quick Card */}
          <div className="bg-white rounded-[24px] p-5 border border-[#18181B12] shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-plus-jakarta font-bold text-sm text-zinc-900">
                Action Checklist
              </h3>
              <button
                onClick={() => setActiveTab('actions')}
                className="text-[11px] font-semibold text-[#3B5BDB] hover:underline flex items-center gap-0.5"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {tasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-[16px] border transition-all text-xs ${
                    task.completed
                      ? 'bg-zinc-50 border-zinc-200 text-zinc-400 line-through'
                      : 'bg-white border-[#18181B12] text-zinc-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="mt-0.5 rounded text-[#18181B] focus:ring-0 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded font-bold ${
                            task.priority === 'high'
                              ? 'bg-rose-100 text-rose-700'
                              : task.priority === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-[10px] text-zinc-400 truncate">{task.category}</span>
                      </div>
                      <p className="font-semibold text-zinc-900 leading-snug">{task.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-Time Activity Log */}
          <div className="bg-white rounded-[24px] p-5 border border-[#18181B12] shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-zinc-600" />
              <h3 className="font-plus-jakarta font-bold text-sm text-zinc-900">
                Activity Feed
              </h3>
            </div>

            <div className="space-y-3">
              {activityLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#3B5BDB] mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-zinc-800 text-[11px] leading-relaxed">{log.message}</p>
                    <p className="text-[9px] font-mono text-zinc-400 mt-0.5">
                      {new Date(log.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
