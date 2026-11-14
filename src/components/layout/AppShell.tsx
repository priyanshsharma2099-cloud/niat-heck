import React, { useState } from 'react';
import { useStore } from '../../lib/storeContext';
import { useAuth } from '../../context/authContext';
import { CsvUploadModal } from '../reviews/CsvUploadModal';
import { ReviewSimulatorModal } from '../reviews/ReviewSimulatorModal';
import { StorePersonaModal } from '../persona/StorePersonaModal';
import { ApiConfigModal } from '../settings/ApiConfigModal';
import { ReplyDraftModal } from '../reviews/ReplyDraftModal';
import { SummaryView } from '../summary/SummaryView';
import { generateWeeklyExecutiveReport } from '../../lib/pdfReportGenerator';
import { Review } from '../../types';
import {
  LayoutDashboard,
  BarChart3,
  Lightbulb,
  Plus,
  Upload,
  FileSpreadsheet,
  Download,
  Settings,
  TrendingDown,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  User,
  LogOut,
} from 'lucide-react';

export const AppShell: React.FC = () => {
  const { user, openAuthModal, logout } = useAuth();
  const {
    stores,
    activeStore,
    setActiveStore,
    reviews,
    actionItems,
    sentimentAlerts,
    activityLogs,
    metrics,
    addReviews,
  } = useStore();

  const [activeNav, setActiveNav] = useState<'dashboard' | 'summary' | 'suggestions' | 'add'>('dashboard');
  const [selectedKw, setSelectedKw] = useState<string>('tight sleeves');
  const [selectedLogIdx, setSelectedLogIdx] = useState<number>(-1);
  const [highlightedZone, setHighlightedZone] = useState<'alert' | 'summary' | null>(null);

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [simulatorModalOpen, setSimulatorModalOpen] = useState(false);
  const [personaModalOpen, setPersonaModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedReviewForReply, setSelectedReviewForReply] = useState<Review | null>(null);

  // Ingestion form state
  const [inputText, setInputText] = useState('');
  const [inputAuthor, setInputAuthor] = useState('');

  // Scoped store reviews
  const storeReviews = React.useMemo(() => {
    return reviews.filter((r) => r.store_id === activeStore.id);
  }, [reviews, activeStore.id]);

  // Dynamic praises and issues extracted from real reviews
  const { praisesList, issuesList, keywordLookup } = React.useMemo(() => {
    const posReviews = storeReviews.filter((r) => r.sentiment_label === 'positive');
    const negReviews = storeReviews.filter((r) => r.sentiment_label === 'negative');

    const posMap = new Map<string, { count: number; review: Review }>();
    posReviews.forEach((r) => {
      const phrases = r.key_phrases && r.key_phrases.length > 0 ? r.key_phrases : [r.primary_attribute];
      phrases.forEach((ph) => {
        if (!ph) return;
        const clean = ph.trim().toLowerCase();
        const existing = posMap.get(clean) || { count: 0, review: r };
        existing.count += 1;
        posMap.set(clean, existing);
      });
    });

    const negMap = new Map<string, { count: number; review: Review }>();
    negReviews.forEach((r) => {
      const phrases = r.key_phrases && r.key_phrases.length > 0 ? r.key_phrases : [r.primary_attribute];
      phrases.forEach((ph) => {
        if (!ph) return;
        const clean = ph.trim().toLowerCase();
        const existing = negMap.get(clean) || { count: 0, review: r };
        existing.count += 1;
        negMap.set(clean, existing);
      });
    });

    const topPos = Array.from(posMap.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 4);
    const topNeg = Array.from(negMap.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 4);

    const lookup: Record<string, { label: string; author: string; quote: string; type: 'pos' | 'neg'; review: Review }> = {};

    topPos.forEach(([ph, d]) => {
      lookup[ph] = {
        label: `${ph} · ${d.count} reviews`,
        author: `${d.review.product_name || 'Verified Customer'} · ${d.review.rating}★ Review`,
        quote: `"${d.review.review_text}"`,
        type: 'pos',
        review: d.review,
      };
    });

    topNeg.forEach(([ph, d]) => {
      lookup[ph] = {
        label: `${ph} · ${d.count} reviews`,
        author: `${d.review.product_name || 'Customer Feedback'} · ${d.review.rating}★ Review`,
        quote: `"${d.review.review_text}"`,
        type: 'neg',
        review: d.review,
      };
    });

    return {
      praisesList: topPos.map(([ph, d]) => ({ phrase: ph, count: d.count })),
      issuesList: topNeg.map(([ph, d]) => ({ phrase: ph, count: d.count })),
      keywordLookup: lookup,
    };
  }, [storeReviews]);

  const activeKwData = React.useMemo(() => {
    if (selectedKw && keywordLookup[selectedKw]) {
      return keywordLookup[selectedKw];
    }
    const keys = Object.keys(keywordLookup);
    if (keys.length > 0) {
      return keywordLookup[keys[0]];
    }
    const sample = storeReviews[0];
    return {
      label: 'customer feedback',
      author: sample ? `${sample.product_name || 'Verified Customer'} · ${sample.rating}★` : 'Verified Customer',
      quote: sample ? `"${sample.review_text}"` : '"Customer feedback highlighted on recent verified orders."',
      type: (sample?.sentiment_label === 'negative' ? 'neg' : 'pos') as 'pos' | 'neg',
      review: sample || null,
    };
  }, [selectedKw, keywordLookup, storeReviews]);

  const handleLogClick = (idx: number, target: 'alert' | 'summary', kw?: string) => {
    setSelectedLogIdx(idx);
    if (activeNav === 'add') setActiveNav('dashboard');
    if (kw && keywordLookup[kw]) setSelectedKw(kw);
    setHighlightedZone(target);
    setTimeout(() => setHighlightedZone(null), 2000);
  };

  const handleAddReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const author = inputAuthor.trim() || 'Verified Customer';
    const newRev: Partial<Review> = {
      product_name: 'Core Collection Item',
      rating: inputText.toLowerCase().includes('tight') || inputText.toLowerCase().includes('fade') ? 2 : 5,
      review_title: 'Customer Feedback',
      review_text: inputText.trim(),
      source_platform: 'Storefront',
      review_date: new Date().toISOString(),
    };

    setInputText('');
    setInputAuthor('');
    setActiveNav('dashboard');
    await addReviews([newRev]);
  };

  return (
    <div className="viewport-frame">
      {/* ============================================================
       * EXECUTIVE SIDEBAR (210px)
       * ============================================================ */}
      <aside className="app-sidebar">
        <div>
          {/* Brand Row */}
          <div className="brand-badge">
            <div className="brand-icon-box">F</div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                Feedback Hub
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>
                Review Analytics
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <button
              type="button"
              onClick={() => setActiveNav('dashboard')}
              className={`nav-item-btn ${activeNav === 'dashboard' ? 'is-active' : ''}`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-500" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('summary')}
              className={`nav-item-btn ${activeNav === 'summary' ? 'is-active' : ''}`}
            >
              <BarChart3 className="w-4 h-4 text-slate-500" />
              <span>Summary</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('suggestions')}
              className={`nav-item-btn ${activeNav === 'suggestions' ? 'is-active' : ''}`}
            >
              <Lightbulb className="w-4 h-4 text-slate-500" />
              <span>Suggestions</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('add')}
              className={`nav-item-btn ${activeNav === 'add' ? 'is-active' : ''}`}
            >
              <Plus className="w-4 h-4 text-slate-500" />
              <span>Add Review</span>
            </button>
          </nav>
        </div>

        {/* Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '10px', borderTop: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', marginBottom: '2px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Recent Activity
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>{activityLogs.length}</span>
          </div>

          {activityLogs.slice(0, 3).map((log, idx) => (
            <button
              key={log.id || idx}
              type="button"
              onClick={() => {
                setSelectedLogIdx(idx);
                if (log.type === 'filter' || log.type === 'ingest') setActiveNav('summary');
                else setActiveNav('dashboard');
              }}
              className={`mini-log-card ${selectedLogIdx === idx ? 'is-selected' : ''}`}
            >
              <span style={{ fontWeight: 500, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '100%' }}>
                {log.title}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-subtle)' }}>
                <span className={`dot-indicator ${log.type === 'alert_generated' || log.type === 'filter' ? 'is-alert' : ''}`} />
                <span>{log.timestamp}</span>
              </div>
            </button>
          ))}

          {/* Bottom Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => setSettingsModalOpen(true)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Config</span>
            </button>
            <button
              type="button"
              onClick={() => generateWeeklyExecutiveReport(activeStore, reviews, actionItems, sentimentAlerts, metrics)}
              style={{ background: 'transparent', border: 'none', color: '#0f172a', fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>

          {/* User Account / Session Profile */}
          <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', marginTop: '4px' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600 }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', lineHeight: 1.2 }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '105px' }}>
                      {user.name}
                    </span>
                    <span style={{ fontSize: '9.5px', color: 'var(--text-subtle)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '105px' }}>
                      {user.email}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '10.5px', cursor: 'pointer', padding: '2px 4px' }}
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', fontSize: '11px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ============================================================
       * MAIN SCREEN
       * ============================================================ */}
      <main className="stage-main">
        {/* Top Navbar */}
        <header className="stage-navbar">
          {/* Active Profile Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)' }}>
              {activeStore.name}
            </h1>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              · {metrics.totalReviews} reviews analyzed
            </span>
          </div>

          {/* Store Switcher & Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="segmented-pill-wrap">
              {stores.map((store) => {
                const isActive = store.id === activeStore.id;
                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => {
                      setActiveStore(store);
                      setSelectedKw('soft cotton');
                    }}
                    className={`segmented-pill-btn ${isActive ? 'is-active' : ''}`}
                  >
                    {store.name}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setSimulatorModalOpen(true)}
              className="btn-ghost-mini"
              title="Add Sample Test Reviews"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Sample Reviews</span>
            </button>

            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="btn-primary-mini"
              title="Upload Customer Reviews CSV"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>

            {/* Auth Session Button / Profile in Header */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '8px', borderLeft: '1px solid var(--border-default)' }}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600 }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 500, cursor: 'pointer', padding: '2px 4px' }}
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="btn-ghost-mini"
                style={{ padding: '0 8px', height: '28px', color: '#0f172a', fontWeight: 600 }}
                title="Sign In with Google"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Content Container */}
        <div className="stage-content">
          {/* Summary View Tab */}
          {activeNav === 'summary' && (
            <SummaryView
              onDraftReply={(rev) => setSelectedReviewForReply(rev)}
            />
          )}

          {/* Overview Tab */}
          {activeNav === 'dashboard' && (
            <>
              {/* Alert Strip */}
              {sentimentAlerts.length > 0 ? (
                <section className={`minimal-alert-strip ${highlightedZone === 'alert' ? 'is-highlighted' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      <strong style={{ fontWeight: 600 }}>{sentimentAlerts[0].attribute}</strong> — {sentimentAlerts[0].message}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveNav('summary')}
                      style={{ background: 'transparent', border: 'none', color: '#0f172a', fontWeight: 500, fontSize: '11.5px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      View Analytics →
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveNav('suggestions')}
                      style={{ background: 'transparent', border: 'none', color: '#e11d48', fontWeight: 600, fontSize: '11.5px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      View Suggestions →
                    </button>
                  </div>
                </section>
              ) : (
                <section className="minimal-card" style={{ padding: '9px 14px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span style={{ fontSize: '12px' }}>
                      <strong style={{ fontWeight: 600, color: 'var(--text-main)' }}>Feedback Steady</strong> — No critical sentiment anomalies flagged across recent orders.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNav('summary')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontWeight: 500, fontSize: '11.5px', cursor: 'pointer' }}
                  >
                    View Analytics →
                  </button>
                </section>
              )}

              {/* Feedback Highlights Card */}
              <section className={`minimal-card ${highlightedZone === 'summary' ? 'is-highlighted' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)' }}>Feedback Highlights</h2>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Key topics summarized across recent verified orders
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNav('summary')}
                    style={{ fontSize: '11.5px', padding: '3px 8px', borderRadius: '4px', background: 'var(--bg-subtle)', color: 'var(--text-main)', border: '1px solid var(--border-default)', cursor: 'pointer', fontWeight: 500 }}
                  >
                    View Table &amp; Analytics →
                  </button>
                </div>

                {/* Structured 2-Column Points */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                  {/* Customer Praises */}
                  <div style={{ padding: '8px 10px', borderRadius: '6px', background: '#f0fdf4', border: '1px solid #dcfce7' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '5px' }}>
                      Customer Praises
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {praisesList.length > 0 ? (
                        praisesList.map((item) => (
                          <button
                            key={item.phrase}
                            type="button"
                            onClick={() => setSelectedKw(item.phrase)}
                            className={`kw-pill kw-pill--pos ${selectedKw === item.phrase ? 'is-selected' : ''}`}
                          >
                            {item.phrase.charAt(0).toUpperCase() + item.phrase.slice(1)} ({item.count})
                          </button>
                        ))
                      ) : (
                        <span style={{ fontSize: '11px', color: '#166534' }}>No praise highlights in current sample.</span>
                      )}
                    </div>
                  </div>

                  {/* Frequent Pain Points */}
                  <div style={{ padding: '8px 10px', borderRadius: '6px', background: '#fff1f2', border: '1px solid #ffe4e6' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#9f1239', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '5px' }}>
                      Frequent Issues
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {issuesList.length > 0 ? (
                        issuesList.map((item) => (
                          <button
                            key={item.phrase}
                            type="button"
                            onClick={() => setSelectedKw(item.phrase)}
                            className={`kw-pill kw-pill--neg ${selectedKw === item.phrase ? 'is-selected' : ''}`}
                          >
                            {item.phrase.charAt(0).toUpperCase() + item.phrase.slice(1)} ({item.count})
                          </button>
                        ))
                      ) : (
                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: 500 }}>No recurring issues reported.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Verbatim Customer Quote Callout */}
                <div className="minimal-quote-box" style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)' }}>
                      Customer Quote: {activeKwData.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                        {activeKwData.author}
                      </span>
                      {activeKwData.review && (
                        <button
                          type="button"
                          onClick={() => setSelectedReviewForReply(activeKwData.review!)}
                          className="btn-primary-mini"
                          style={{ height: '22px', padding: '0 8px', fontSize: '10.5px' }}
                        >
                          Reply to Customer
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                    {activeKwData.quote}
                  </p>
                </div>
              </section>

              {/* Product Suggestions Preview */}
              <section className="minimal-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)' }}>Product Suggestions</h2>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Ideas to prevent common complaints and improve customer satisfaction
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNav('suggestions')}
                    style={{ fontSize: '11.5px', padding: '3px 8px', borderRadius: '4px', background: 'var(--bg-subtle)', color: 'var(--text-main)', border: '1px solid var(--border-default)', cursor: 'pointer', fontWeight: 500 }}
                  >
                    All Suggestions ({actionItems.length}) →
                  </button>
                </div>

                {actionItems.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {actionItems.slice(0, 3).map((sug) => (
                      <div key={sug.id} className="suggestion-card">
                        <div className="suggestion-icon-wrap">
                          <Lightbulb className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)' }}>
                              {sug.title}
                            </span>
                            <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: sug.priority === 'critical' ? '#fee2e2' : '#f1f5f9', color: sug.priority === 'critical' ? '#b91c1c' : '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {sug.category}
                            </span>
                          </div>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            {sug.estimated_impact || sug.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No pending suggestions. Import reviews to synthesize product improvements.
                  </div>
                )}
              </section>
            </>
          )}

          {/* Full Suggestions View */}
          {activeNav === 'suggestions' && (
            <section className="minimal-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                    Improvement Suggestions
                  </h2>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Product and operational suggestions synthesized from customer feedback trends
                  </span>
                </div>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-subtle)', color: 'var(--text-main)', fontWeight: 500 }}>
                  {actionItems.length} suggestions
                </span>
              </div>

              {actionItems.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
                  {actionItems.map((sug) => (
                    <div key={sug.id} className="suggestion-card" style={{ flexDirection: 'column', gap: '6px', background: '#fafbfc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                          {sug.category}
                        </span>
                        <span style={{ fontSize: '10.5px', color: sug.priority === 'critical' ? '#e11d48' : 'var(--text-muted)', fontWeight: 600 }}>
                          {sug.priority === 'critical' ? 'High Impact' : 'Recommended'}
                        </span>
                      </div>

                      <h4 style={{ margin: 0, fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', lineHeight: '1.4' }}>
                        {sug.title}
                      </h4>

                      <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                        {sug.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingTop: '6px', borderTop: '1px solid var(--border-default)', width: '100%' }}>
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: 500 }}>
                          {sug.estimated_impact}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                  No improvement suggestions available. Ingest customer reviews or import a CSV to synthesize operational actions.
                </div>
              )}
            </section>
          )}

          {/* Add Review View */}
          {activeNav === 'add' && (
            <section className="minimal-card">
              <h2 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                Add Customer Review
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '14px' }}>
                Enter review feedback to evaluate category sentiment and suggestions
              </span>

              <form onSubmit={handleAddReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Customer Feedback Text
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="e.g. Loved the breathable fabric, though the upper arm felt a bit snug on size M..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-default)',
                      fontSize: '12.5px',
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Customer Name or Order Reference
                    </label>
                    <input
                      type="text"
                      value={inputAuthor}
                      onChange={(e) => setInputAuthor(e.target.value)}
                      placeholder="e.g. Verified Buyer"
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-default)',
                        fontSize: '12.5px',
                        fontFamily: 'inherit',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <button type="submit" className="btn-primary-mini" style={{ height: '32px', padding: '0 14px' }}>
                    Save Review
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>
      </main>

      {/* Modals */}
      <CsvUploadModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />
      <ReviewSimulatorModal isOpen={simulatorModalOpen} onClose={() => setSimulatorModalOpen(false)} />
      <StorePersonaModal isOpen={personaModalOpen} onClose={() => setPersonaModalOpen(false)} />
      <ApiConfigModal isOpen={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
      <ReplyDraftModal
        review={selectedReviewForReply}
        isOpen={Boolean(selectedReviewForReply)}
        onClose={() => setSelectedReviewForReply(null)}
      />
    </div>
  );
};
