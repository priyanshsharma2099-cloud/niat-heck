import React, { useState, useMemo } from 'react';
import { useStore } from '../../lib/storeContext';
import { Review } from '../../types';
import { ReplyDraftModal } from './ReplyDraftModal';
import {
  Search,
  Filter,
  Star,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  ArrowUpDown,
  Tag,
} from 'lucide-react';

interface ReviewTableProps {
  initialKeyword?: string;
}

export const ReviewTable: React.FC<ReviewTableProps> = ({ initialKeyword = '' }) => {
  const { reviews } = useStore();
  const [search, setSearch] = useState(initialKeyword);
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [noiseFilter, setNoiseFilter] = useState<'all' | 'clean' | 'noise'>('all');
  const [selectedReviewForReply, setSelectedReviewForReply] = useState<Review | null>(null);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Platform filter
      if (platformFilter !== 'all' && r.source_platform !== platformFilter) return false;

      // Sentiment filter
      if (sentimentFilter !== 'all' && r.sentiment_label !== sentimentFilter) return false;

      // Noise filter
      if (noiseFilter === 'clean' && r.is_noise) return false;
      if (noiseFilter === 'noise' && !r.is_noise) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const inText = (r.review_text || '').toLowerCase().includes(q);
        const inProd = (r.product_name || '').toLowerCase().includes(q);
        const inTitle = (r.review_title || '').toLowerCase().includes(q);
        const inPhrases = (r.key_phrases || []).some((p) => p.toLowerCase().includes(q));
        if (!inText && !inProd && !inTitle && !inPhrases) return false;
      }

      return true;
    });
  }, [reviews, platformFilter, sentimentFilter, noiseFilter, search]);

  return (
    <div className="p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-soft space-y-5">
      {/* Table Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <span>Ingested Feedback & Sentiment Feed</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time feed with AI noise separation, attribute categorization, and response drafting
          </p>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reviews, SKUs, or phrases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-60"
            />
          </div>

          {/* Platform */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="all">All Sources</option>
            <option value="Storefront">Storefront</option>
            <option value="Marketplace">Marketplace</option>
            <option value="Direct">Direct Orders</option>
            <option value="manual_sim">Simulator</option>
          </select>

          {/* Sentiment */}
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>

          {/* Noise Strip */}
          <div className="inline-flex p-0.5 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setNoiseFilter('all')}
              className={`px-2 py-1 rounded-lg transition-all ${
                noiseFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setNoiseFilter('clean')}
              className={`px-2 py-1 rounded-lg transition-all ${
                noiseFilter === 'clean' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Clean
            </button>
            <button
              onClick={() => setNoiseFilter('noise')}
              className={`px-2 py-1 rounded-lg transition-all ${
                noiseFilter === 'noise' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Noise Only
            </button>
          </div>
        </div>
      </div>

      {/* Review Cards List */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            No customer reviews match your search and filter criteria.
          </div>
        ) : (
          filteredReviews.map((r) => {
            const isNegative = r.sentiment_label === 'negative';
            const isPositive = r.sentiment_label === 'positive';

            return (
              <div
                key={r.id}
                className={`p-4 rounded-2xl border transition-all duration-200 ${
                  r.is_noise
                    ? 'bg-slate-50/60 border-slate-200/50 opacity-80'
                    : 'bg-white hover:border-slate-300 border-slate-200/80 shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left: Product & Review details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {/* Rating Stars */}
                      <div className="flex text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < r.rating ? 'fill-current' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Product Name */}
                      <span className="font-bold text-slate-900 truncate max-w-xs">
                        {r.product_name}
                      </span>

                      {/* Platform Pill */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                        {r.source_platform}
                      </span>

                      {/* Noise Status Badge */}
                      {r.is_noise ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200"
                          title={r.noise_reason || '3rd party courier noise'}
                        >
                          <ShieldAlert className="w-3 h-3 text-purple-600" />
                          Logistics Noise
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Product Signal
                        </span>
                      )}

                      {/* Sentiment & Attribute */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPositive
                            ? 'bg-emerald-100 text-emerald-800'
                            : isNegative
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.sentiment_label?.toUpperCase()}
                        {r.primary_attribute ? ` • ${r.primary_attribute}` : ''}
                      </span>
                    </div>

                    {/* Review Title & Body */}
                    {r.review_title && (
                      <h4 className="text-xs font-bold text-slate-800">
                        {r.review_title}
                      </h4>
                    )}
                    <p className="text-xs text-slate-600 leading-relaxed">
                      "{r.review_text}"
                    </p>

                    {/* Extracted Key Phrases */}
                    {r.key_phrases && r.key_phrases.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {r.key_phrases.map((phrase, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                              isPositive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isNegative
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {phrase}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Response Trigger */}
                  <div className="self-end sm:self-center shrink-0">
                    <button
                      onClick={() => setSelectedReviewForReply(r)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-indigo-600 text-white flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                      <span>Draft Public Response</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Customer Reply Draft Modal */}
      <ReplyDraftModal
        review={selectedReviewForReply}
        isOpen={Boolean(selectedReviewForReply)}
        onClose={() => setSelectedReviewForReply(null)}
      />
    </div>
  );
};
