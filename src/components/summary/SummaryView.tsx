import React, { useState, useMemo } from 'react';
import { useStore } from '../../lib/storeContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  CheckCircle2,
  AlertCircle,
  Scissors,
  Shirt,
  Palette,
  Truck,
  Layers,
  Tag,
  MessageSquareQuote,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import { Review } from '../../types';

interface SummaryViewProps {
  onDraftReply: (review: Review) => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ onDraftReply }) => {
  const { activeStore, reviews, metrics } = useStore();

  // Active store's reviews
  const storeReviews = useMemo(() => {
    return reviews.filter((r) => r.store_id === activeStore.id);
  }, [reviews, activeStore.id]);

  // Dynamic KPI counts
  const totalReviews = storeReviews.length;
  const posCount = storeReviews.filter((r) => r.sentiment_label === 'positive').length;
  const neuCount = storeReviews.filter((r) => r.sentiment_label === 'neutral').length;
  const negCount = storeReviews.filter((r) => r.sentiment_label === 'negative').length;

  const posPercent = totalReviews > 0 ? Math.round((posCount / totalReviews) * 100) : 0;
  const neuPercent = totalReviews > 0 ? Math.round((neuCount / totalReviews) * 100) : 0;
  const negPercent = totalReviews > 0 ? Math.max(0, 100 - posPercent - neuPercent) : 0;

  // Dynamic 7-day or sequential satisfaction trend
  const trendData = useMemo(() => {
    if (storeReviews.length === 0) {
      return [
        { day: 'Mon', score: 0 },
        { day: 'Tue', score: 0 },
        { day: 'Wed', score: 0 },
        { day: 'Thu', score: 0 },
        { day: 'Fri', score: 0 },
        { day: 'Sat', score: 0 },
        { day: 'Sun', score: 0 },
      ];
    }

    const sorted = [...storeReviews].sort(
      (a, b) => new Date(a.review_date).getTime() - new Date(b.review_date).getTime()
    );

    // Group into 7 time chunks
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const chunkSize = Math.max(1, Math.ceil(sorted.length / 7));

    return days.map((day, idx) => {
      const slice = sorted.slice(0, Math.min(sorted.length, (idx + 1) * chunkSize));
      const posInSlice = slice.filter((r) => r.sentiment_label === 'positive').length;
      const score = slice.length > 0 ? Math.round((posInSlice / slice.length) * 100) : posPercent;
      return { day, score };
    });
  }, [storeReviews, posPercent]);

  // Dynamic Top Strengths and Areas to Improve
  const { topStrengths, topIssues } = useMemo(() => {
    const posReviews = storeReviews.filter((r) => r.sentiment_label === 'positive');
    const negReviews = storeReviews.filter((r) => r.sentiment_label === 'negative');

    // Aggregate positive phrases
    const posMap = new Map<string, { count: number; sampleQuote: string }>();
    posReviews.forEach((r) => {
      const phrases = r.key_phrases && r.key_phrases.length > 0 ? r.key_phrases : [r.primary_attribute];
      phrases.forEach((ph) => {
        if (!ph) return;
        const clean = ph.trim().toLowerCase();
        const existing = posMap.get(clean) || { count: 0, sampleQuote: r.review_text };
        existing.count += 1;
        posMap.set(clean, existing);
      });
    });

    // Aggregate negative phrases
    const negMap = new Map<string, { count: number; sampleQuote: string }>();
    negReviews.forEach((r) => {
      const phrases = r.key_phrases && r.key_phrases.length > 0 ? r.key_phrases : [r.primary_attribute];
      phrases.forEach((ph) => {
        if (!ph) return;
        const clean = ph.trim().toLowerCase();
        const existing = negMap.get(clean) || { count: 0, sampleQuote: r.review_text };
        existing.count += 1;
        negMap.set(clean, existing);
      });
    });

    const sortedPos = Array.from(posMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 2);

    const sortedNeg = Array.from(negMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 2);

    return {
      topStrengths: sortedPos.map(([phrase, d]) => ({
        phrase: phrase.charAt(0).toUpperCase() + phrase.slice(1),
        count: d.count,
        quote: d.sampleQuote,
      })),
      topIssues: sortedNeg.map(([phrase, d]) => ({
        phrase: phrase.charAt(0).toUpperCase() + phrase.slice(1),
        count: d.count,
        quote: d.sampleQuote,
      })),
    };
  }, [storeReviews]);

  // Product Aspects configuration
  const aspectConfigs = useMemo(() => [
    { id: 'sizing', dimension: 'Sizing & Fit', icon: Scissors, defaultFinding: 'Fit dimensions and ease allowance across standard sizes' },
    { id: 'fabric', dimension: 'Fabric Quality', icon: Shirt, defaultFinding: 'Drape, hand-feel, and breathability of cloth' },
    { id: 'stitching', dimension: 'Stitching & Seams', icon: Layers, defaultFinding: 'Hem durability, tassel finishes, and seam tacking' },
    { id: 'color', dimension: 'Color Fastness', icon: Palette, defaultFinding: 'Dye retention and wash resistance across colorways' },
    { id: 'service', dimension: 'Packaging & Delivery', icon: Truck, defaultFinding: 'Transit fulfillment speed and parcel protection' },
    { id: 'value', dimension: 'Value & Pricing', icon: Tag, defaultFinding: 'Perceived value relative to quality and expectations' },
  ], []);

  // Compute dynamic table data across aspects
  const dimensionData = useMemo(() => {
    return aspectConfigs.map((cfg) => {
      const aspectReviews = storeReviews.filter((r) => r.primary_attribute === cfg.id);
      const mPos = aspectReviews.filter((r) => r.sentiment_label === 'positive').length;
      const mNeg = aspectReviews.filter((r) => r.sentiment_label === 'negative').length;
      const total = aspectReviews.length;

      const pPercent = total > 0 ? Math.round((mPos / total) * 100) : 0;
      const nPercent = total > 0 ? Math.round((mNeg / total) * 100) : 0;

      let statusType: 'danger' | 'warning' | 'success' | 'neutral' = 'neutral';
      let status = 'No Data';

      if (total > 0) {
        if (nPercent >= 50 || mNeg >= 2) {
          statusType = 'danger';
          status = 'Needs Attention';
        } else if (nPercent >= 20 || mNeg >= 1) {
          statusType = 'warning';
          status = 'Watch';
        } else {
          statusType = 'success';
          status = 'Good';
        }
      }

      // Find representative quote
      const worstReview = aspectReviews.find((r) => r.sentiment_label === 'negative');
      const bestReview = aspectReviews.find((r) => r.sentiment_label === 'positive');
      const sampleReview = worstReview || bestReview || aspectReviews[0];

      let finding = cfg.defaultFinding;
      if (sampleReview) {
        if (sampleReview.review_title && sampleReview.review_title.length > 5) {
          finding = sampleReview.review_title;
        } else if (sampleReview.review_text) {
          finding = sampleReview.review_text.slice(0, 70) + (sampleReview.review_text.length > 70 ? '...' : '');
        }
      }

      const sampleQuote = sampleReview ? `"${sampleReview.review_text}"` : `"No specific feedback recorded for this category yet."`;
      const author = sampleReview
        ? `${sampleReview.product_name || 'Verified Customer'} · ${sampleReview.rating}★ Review`
        : 'Store Feedback';

      return {
        id: cfg.id,
        dimension: cfg.dimension,
        icon: cfg.icon,
        posPercent: pPercent,
        negPercent: nPercent,
        posCount: mPos,
        negCount: mNeg,
        totalMentions: total,
        finding,
        status,
        statusType,
        sampleQuote,
        author,
        sampleReview,
      };
    });
  }, [aspectConfigs, storeReviews]);

  // Selected row state
  const [selectedDimension, setSelectedDimension] = useState<string>('Sizing & Fit');

  const activeRow = useMemo(() => {
    return dimensionData.find((d) => d.dimension === selectedDimension) || dimensionData[0];
  }, [dimensionData, selectedDimension]);

  if (totalReviews === 0) {
    return (
      <div className="minimal-card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
          No Reviews Ingested Yet
        </h3>
        <p style={{ margin: 0, fontSize: '12px', maxWidth: '380px', marginInline: 'auto', lineHeight: '1.5' }}>
          Upload a customer review CSV or add sample reviews using the buttons in the top navbar to generate structured feedback analytics.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* ============================================================
       * 1. MINIMAL OVERVIEW & CASUAL GRAPH (DYNAMIC DATA)
       * ============================================================ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Sentiment Overview Bar */}
        <div className="minimal-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Customer Sentiment
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    {posPercent}%
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: posPercent >= 70 ? '#059669' : posPercent >= 45 ? '#d97706' : '#e11d48',
                    }}
                  >
                    {posPercent >= 70 ? 'Positive overall' : posPercent >= 45 ? 'Mixed sentiment' : 'Needs attention'}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-subtle)', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: '6px' }}>
                {totalReviews} reviews
              </span>
            </div>

            {/* Clean, single-strip horizontal sentiment bar */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ width: '100%', height: '8px', borderRadius: '999px', background: '#f1f5f9', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${posPercent}%`, background: '#10b981', height: '100%' }} title={`${posPercent}% Positive`} />
                <div style={{ width: `${neuPercent}%`, background: '#cbd5e1', height: '100%' }} title={`${neuPercent}% Neutral`} />
                <div style={{ width: `${negPercent}%`, background: '#f43f5e', height: '100%' }} title={`${negPercent}% Issues`} />
              </div>

              {/* 3 simple pills */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11.5px' }}>
                <span style={{ color: '#059669', fontWeight: 500 }}>● {posCount} Positive</span>
                <span style={{ color: 'var(--text-muted)' }}>● {neuCount} Neutral</span>
                <span style={{ color: '#e11d48', fontWeight: 500 }}>● {negCount} Issues</span>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Satisfaction Trend Chart */}
        <div className="minimal-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                Satisfaction Trend
              </span>
              <div style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: 600, marginTop: '2px' }}>
                Tracking ~{posPercent}% positive feedback
              </div>
            </div>
            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600, background: '#ecfdf5', padding: '2px 8px', borderRadius: '999px' }}>
              {metrics.averageRating > 0 ? `${metrics.averageRating} / 5.0 Rating` : 'Active'}
            </span>
          </div>

          {/* Simple sparkline chart without enterprise clutter */}
          <div style={{ height: '70px', width: '100%', marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="minimalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10.5, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} hide={true} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{ background: '#0f172a', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>
                          {payload[0].value}% positive
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#minimalGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ============================================================
       * 2. STRUCTURED FEEDBACK HIGHLIGHTS (DYNAMIC)
       * ============================================================ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Top Strengths */}
        <div className="minimal-card" style={{ padding: '14px 16px', borderLeft: '3px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <CheckCircle2 className="w-4 h-4" style={{ color: '#059669' }} />
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
              Top Strengths
            </h3>
          </div>
          {topStrengths.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {topStrengths.map((s, idx) => (
                <li key={idx}>
                  <strong style={{ color: 'var(--text-main)', fontWeight: 600 }}>{s.phrase}</strong> ({s.count} mentions) — praised by customers for quality and satisfaction.
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              No positive mentions recorded in current dataset.
            </p>
          )}
        </div>

        {/* Areas to Improve */}
        <div className="minimal-card" style={{ padding: '14px 16px', borderLeft: '3px solid #f43f5e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <AlertCircle className="w-4 h-4" style={{ color: '#e11d48' }} />
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
              Areas to Improve
            </h3>
          </div>
          {topIssues.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {topIssues.map((iss, idx) => (
                <li key={idx}>
                  <strong style={{ color: 'var(--text-main)', fontWeight: 600 }}>{iss.phrase}</strong> ({iss.count} mentions) — flagged in customer feedback inquiries.
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: '#059669', fontWeight: 500 }}>
              Zero critical pain points detected in current feedback.
            </p>
          )}
        </div>
      </div>

      {/* ============================================================
       * 3. STRUCTURED TABULAR COLUMNS (DYNAMIC)
       * ============================================================ */}
      <div className="minimal-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)' }}>
              Feedback by Product Aspect
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Select a row to review customer quotes and reply
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
            {dimensionData.filter((d) => d.totalMentions > 0).length} active categories
          </span>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Aspect</th>
                <th style={{ padding: '8px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Sentiment</th>
                <th style={{ padding: '8px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Summary of Finding</th>
                <th style={{ padding: '8px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Mentions</th>
                <th style={{ padding: '8px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '8px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {dimensionData.map((row) => {
                const isSelected = selectedDimension === row.dimension;
                const IconComponent = row.icon;

                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedDimension(row.dimension)}
                    style={{
                      borderBottom: '1px solid var(--border-default)',
                      backgroundColor: isSelected ? 'var(--bg-accent-soft)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.12s ease',
                    }}
                  >
                    {/* 1. Aspect */}
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: isSelected ? 'var(--primary)' : 'var(--bg-subtle)',
                            color: isSelected ? '#ffffff' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span>{row.dimension}</span>
                      </div>
                    </td>

                    {/* 2. Sentiment Progress */}
                    <td style={{ padding: '10px 14px', minWidth: '130px' }}>
                      {row.totalMentions > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                            <span style={{ color: '#059669', fontWeight: 600 }}>{row.posPercent}%</span>
                            <span style={{ color: '#e11d48', fontWeight: 600 }}>{row.negPercent}%</span>
                          </div>
                          <div style={{ width: '100%', height: '5px', borderRadius: '999px', background: '#fee2e2', overflow: 'hidden', display: 'flex' }}>
                            <div style={{ width: `${row.posPercent}%`, background: '#10b981', height: '100%' }} />
                            <div style={{ width: `${row.negPercent}%`, background: '#f43f5e', height: '100%' }} />
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>No reviews</span>
                      )}
                    </td>

                    {/* 3. Summary of Finding */}
                    <td style={{ padding: '10px 14px', color: 'var(--text-main)', maxWidth: '280px' }}>
                      <span style={{ fontSize: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {row.finding}
                      </span>
                    </td>

                    {/* 4. Mentions */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {row.totalMentions}
                      </span>
                    </td>

                    {/* 5. Status */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {row.statusType === 'danger' && (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#e11d48', background: '#fff1f2', padding: '2px 8px', borderRadius: '4px' }}>
                          Needs Attention
                        </span>
                      )}
                      {row.statusType === 'warning' && (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px' }}>
                          Watch
                        </span>
                      )}
                      {row.statusType === 'success' && (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>
                          Good
                        </span>
                      )}
                      {row.statusType === 'neutral' && (
                        <span style={{ fontSize: '11px', color: 'var(--text-subtle)', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: '4px' }}>
                          No Data
                        </span>
                      )}
                    </td>

                    {/* 6. Action */}
                    <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDimension(row.dimension);
                        }}
                        style={{
                          background: 'transparent',
                          color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                          border: 'none',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        <span>Quote</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================
       * 4. CUSTOMER QUOTE & DIRECT REPLY (DYNAMIC QUOTE)
       * ============================================================ */}
      <div className="minimal-card" style={{ padding: '14px 16px', background: '#fafbfc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquareQuote className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
              Customer Quote · {activeRow.dimension}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ({activeRow.author})
            </span>
          </div>

          {activeRow.sampleReview && (
            <button
              type="button"
              onClick={() => onDraftReply(activeRow.sampleReview!)}
              className="btn-primary-mini"
              style={{ fontSize: '11.5px', padding: '3px 10px', height: '28px' }}
            >
              Reply to Customer
            </button>
          )}
        </div>

        <p style={{ margin: '8px 0 0 0', fontSize: '12.5px', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: '1.45' }}>
          {activeRow.sampleQuote}
        </p>
      </div>
    </div>
  );
};
