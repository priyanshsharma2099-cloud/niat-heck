import React, { useState, useMemo } from 'react';
import { useStore } from '../../lib/storeContext';
import { Review, BrandTone } from '../../types';
import {
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  Star,
  ShieldAlert,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export const ReviewsView: React.FC = () => {
  const {
    activeStore,
    reviews,
    draftReply,
    markReplyCopied,
  } = useStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'signal' | 'noise' | 'pending' | 'drafted'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [draftingId, setDraftingId] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<BrandTone>(activeStore.brand_tone || 'Warm Boutique');
  const [editedDrafts, setEditedDrafts] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const storeReviews = useMemo(() => {
    return reviews.filter((r) => r.store_id === activeStore.id);
  }, [reviews, activeStore.id]);

  const filteredReviews = useMemo(() => {
    return storeReviews.filter((r) => {
      // Filter tab
      if (activeFilter === 'signal' && r.is_noise) return false;
      if (activeFilter === 'noise' && !r.is_noise) return false;
      if (activeFilter === 'pending' && (r.is_noise || r.reply_status !== 'pending')) return false;
      if (activeFilter === 'drafted' && r.reply_status === 'pending') return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const textMatch = r.raw_text.toLowerCase().includes(query);
        const authorMatch = r.author.toLowerCase().includes(query);
        const productMatch = r.product_name.toLowerCase().includes(query);
        return textMatch || authorMatch || productMatch;
      }

      return true;
    });
  }, [storeReviews, activeFilter, searchQuery]);

  const handleDraft = async (review: Review) => {
    setDraftingId(review.id);
    setSelectedReviewId(review.id);
    try {
      const generated = await draftReply(review.id, selectedTone);
      setEditedDrafts((prev) => ({ ...prev, [review.id]: generated }));
    } finally {
      setDraftingId(null);
    }
  };

  const handleCopy = async (reviewId: string, textToCopy: string) => {
    await navigator.clipboard.writeText(textToCopy);
    await markReplyCopied(reviewId);
    setCopiedId(reviewId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Toolbar */}
      <div className="bg-white rounded-[24px] p-5 border border-[#18181B12] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-plus-jakarta font-bold text-base text-zinc-900">
              Customer Reviews & AI Reply Engine
            </h2>
            <p className="text-xs text-zinc-400">
              Isolate product feedback from courier noise and draft empathetic brand responses
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search feedback or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none focus:border-zinc-400 font-sans"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100">
          {[
            { id: 'all', label: 'All Reviews', count: storeReviews.length },
            { id: 'signal', label: 'Signal Only', count: storeReviews.filter((r) => !r.is_noise).length },
            { id: 'noise', label: 'Filtered Noise', count: storeReviews.filter((r) => r.is_noise).length },
            {
              id: 'pending',
              label: 'Pending Reply',
              count: storeReviews.filter((r) => !r.is_noise && r.reply_status === 'pending').length,
            },
            {
              id: 'drafted',
              label: 'Drafted / Copied',
              count: storeReviews.filter((r) => r.reply_status !== 'pending').length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeFilter === tab.id
                  ? 'bg-[#18181B] text-white shadow-xs'
                  : 'bg-[#F8F8F5] text-zinc-600 hover:bg-zinc-200/60'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1 rounded-full ${
                  activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 text-center border border-[#18181B12]">
            <p className="text-zinc-500 text-sm">No reviews matching the active filter.</p>
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const isSelected = selectedReviewId === rev.id;
            const isDrafting = draftingId === rev.id;
            const currentDraft = editedDrafts[rev.id] || rev.drafted_reply || '';

            return (
              <div
                key={rev.id}
                className={`bg-white rounded-[24px] p-5 border transition-all ${
                  rev.is_noise
                    ? 'border-zinc-200/80 bg-zinc-50/50'
                    : isSelected
                    ? 'border-[#3B5BDB] shadow-sm'
                    : 'border-[#18181B12] shadow-2xs hover:border-zinc-300'
                }`}
              >
                {/* Review Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-xs text-zinc-900">{rev.author}</span>
                    <div className="flex items-center text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? 'fill-current text-amber-400' : 'text-zinc-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {rev.product_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Noise vs Signal Badge */}
                    {rev.is_noise ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-700 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-zinc-500" />
                        Noise Filtered
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                          rev.sentiment === 'positive'
                            ? 'bg-[#ECFDF3] text-[#15803D]'
                            : rev.sentiment === 'negative'
                            ? 'bg-[#FFF1F2] text-[#BE123C]'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {rev.sentiment.toUpperCase()} ({rev.sentiment_score > 0 ? '+' : ''}
                        {rev.sentiment_score})
                      </span>
                    )}

                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                      {rev.source_platform}
                    </span>
                  </div>
                </div>

                {/* Review Content */}
                <div className="py-3">
                  <p className="text-xs text-zinc-800 leading-relaxed font-sans">{rev.raw_text}</p>

                  {/* Noise Explanation Callout */}
                  {rev.is_noise && rev.noise_reason && (
                    <div className="mt-2.5 p-2.5 rounded-[12px] bg-zinc-100/80 text-[11px] text-zinc-600 flex items-start gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-zinc-700">Excluded from Signal:</strong>{' '}
                        {rev.noise_reason}
                      </span>
                    </div>
                  )}

                  {/* Topics Pills */}
                  {rev.topics && rev.topics.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {rev.topics.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-[#F8F8F5] text-zinc-600 border border-zinc-200/60 font-medium"
                        >
                          {t}
                        </span>
                      ))}
                      <span className="text-[10px] font-mono text-zinc-400 ml-1">
                        Relevance: {rev.niche_relevance}/100
                      </span>
                    </div>
                  )}
                </div>

                {/* Reply Section (Signal Reviews Only) */}
                {!rev.is_noise && (
                  <div className="mt-3 pt-3 border-t border-zinc-100">
                    {!isSelected && !rev.drafted_reply ? (
                      <button
                        onClick={() => handleDraft(rev)}
                        disabled={isDrafting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-[#F8F8F5] hover:bg-zinc-200/60 text-xs font-semibold text-zinc-800 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#3B5BDB]" />
                        <span>Draft Customer Reply with Gemini</span>
                      </button>
                    ) : (
                      <div className="space-y-3 bg-[#F8F8F5] p-3.5 rounded-[16px] border border-[#18181B0D]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-zinc-700">Tone:</span>
                            <select
                              value={selectedTone}
                              onChange={(e) => setSelectedTone(e.target.value as BrandTone)}
                              className="text-xs bg-white border border-zinc-200 rounded-lg px-2 py-1 font-sans focus:outline-none"
                            >
                              <option value="Warm Boutique">Warm Boutique</option>
                              <option value="Crisp Professional">Crisp Professional</option>
                              <option value="Friendly Casual">Friendly Casual</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDraft(rev)}
                              disabled={isDrafting}
                              className="flex items-center gap-1 text-[11px] font-semibold text-[#3B5BDB] hover:underline"
                            >
                              {isDrafting ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                              <span>Regenerate</span>
                            </button>
                          </div>
                        </div>

                        {/* Editable Draft Textarea */}
                        <textarea
                          rows={3}
                          value={currentDraft}
                          onChange={(e) =>
                            setEditedDrafts((prev) => ({ ...prev, [rev.id]: e.target.value }))
                          }
                          placeholder="Drafting response..."
                          className="w-full p-2.5 rounded-[12px] bg-white border border-zinc-200 text-xs text-zinc-800 leading-relaxed font-sans focus:outline-none focus:border-zinc-400"
                        />

                        {/* Copy & Status Bar */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-zinc-400">
                            Status:{' '}
                            <strong
                              className={
                                rev.reply_status === 'copied'
                                  ? 'text-emerald-600'
                                  : rev.reply_status === 'drafted'
                                  ? 'text-indigo-600'
                                  : 'text-zinc-500'
                              }
                            >
                              {rev.reply_status.toUpperCase()}
                            </strong>
                          </span>

                          <button
                            onClick={() => handleCopy(rev.id, currentDraft)}
                            disabled={!currentDraft}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-semibold transition-all ${
                              copiedId === rev.id
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#18181B] text-white hover:bg-black'
                            }`}
                          >
                            {copiedId === rev.id ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied to Clipboard!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-zinc-300" />
                                <span>Copy Response</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
