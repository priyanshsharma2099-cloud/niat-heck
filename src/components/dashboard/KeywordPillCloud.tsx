import React, { useMemo } from 'react';
import { useStore } from '../../lib/storeContext';
import { Tags, ThumbsUp, ThumbsDown } from 'lucide-react';

interface KeywordPillCloudProps {
  onSelectKeyword?: (keyword: string) => void;
  selectedKeyword?: string;
}

export const KeywordPillCloud: React.FC<KeywordPillCloudProps> = ({
  onSelectKeyword,
  selectedKeyword,
}) => {
  const { reviews } = useStore();

  const { positivePills, negativePills } = useMemo(() => {
    const posMap: Record<string, number> = {};
    const negMap: Record<string, number> = {};

    reviews.forEach((r) => {
      if (r.is_noise) return;
      const phrases = r.key_phrases || [];
      phrases.forEach((phrase) => {
        const clean = phrase.trim().toLowerCase();
        if (clean.length > 2) {
          if (r.sentiment_label === 'positive') {
            posMap[clean] = (posMap[clean] || 0) + 1;
          } else if (r.sentiment_label === 'negative') {
            negMap[clean] = (negMap[clean] || 0) + 1;
          }
        }
      });
    });

    const pos = Object.entries(posMap)
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const neg = Object.entries(negMap)
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return { positivePills: pos, negativePills: neg };
  }, [reviews]);

  return (
    <div className="p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-soft space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Tags className="w-4 h-4 text-indigo-600" />
          <span>Niche Feedback Keyword Clouds</span>
        </h3>
        <span className="text-[11px] text-slate-400">Extracted by Gemini AI</span>
      </div>

      {/* Positive Highlights */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-2.5">
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>Top Praised Attributes</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {positivePills.length === 0 ? (
            <span className="text-xs text-slate-400 italic">No positive keywords logged</span>
          ) : (
            positivePills.map((pill) => {
              const isSelected = selectedKeyword === pill.text;
              return (
                <button
                  key={pill.text}
                  onClick={() => onSelectKeyword?.(isSelected ? '' : pill.text)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200/70 hover:bg-emerald-100/80'
                  }`}
                >
                  <span>{pill.text}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-emerald-700 text-white' : 'bg-emerald-200/60 text-emerald-900'
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Negative Friction Areas */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 mb-2.5">
          <ThumbsDown className="w-3.5 h-3.5" />
          <span>Critical Friction Signals</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {negativePills.length === 0 ? (
            <span className="text-xs text-slate-400 italic">No negative keywords logged</span>
          ) : (
            negativePills.map((pill) => {
              const isSelected = selectedKeyword === pill.text;
              return (
                <button
                  key={pill.text}
                  onClick={() => onSelectKeyword?.(isSelected ? '' : pill.text)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-rose-50 text-rose-800 border-rose-200/70 hover:bg-rose-100/80'
                  }`}
                >
                  <span>{pill.text}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-rose-700 text-white' : 'bg-rose-200/60 text-rose-900'
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
