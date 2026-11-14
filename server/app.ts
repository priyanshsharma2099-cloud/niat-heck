import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { supabaseAdmin, isSupabaseReady } from './supabase';
import { requireAuth, AuthenticatedRequest } from './auth';
import {
  analyzeReviewsWithGemini,
  draftCustomerReplyWithGemini,
  simulateReviewsWithGemini,
} from './gemini';
import {
  Store,
  Review,
  ActionTask,
  TrendAlert,
  ActivityLog,
  DashboardResponse,
  DashboardMetrics,
  DashboardTimelineItem,
  KeywordStat,
} from '../src/types';
import {
  INITIAL_STORES,
  INITIAL_REVIEWS,
  INITIAL_ACTION_TASKS,
  INITIAL_TREND_ALERTS,
  INITIAL_ACTIVITY_LOGS,
} from '../src/lib/mockData';

dotenv.config({ path: '.env.development' });
dotenv.config();

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
const JWT_SECRET = process.env.JWT_SECRET || 'cluey_cart_jwt_super_secret_key_development_2026';
const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// -----------------------------------------------------------------------------
// In-Memory Fallback State (Used when Supabase is not configured or in local dev)
// -----------------------------------------------------------------------------
let memStores: Store[] = [...INITIAL_STORES];
let memReviews: Review[] = [...INITIAL_REVIEWS];
let memTasks: ActionTask[] = [...INITIAL_ACTION_TASKS];
let memAlerts: TrendAlert[] = [...INITIAL_TREND_ALERTS];
let memLogs: ActivityLog[] = [...INITIAL_ACTIVITY_LOGS];

// -----------------------------------------------------------------------------
// Helper: Compute Complete Dashboard Metrics & Aggregations
// -----------------------------------------------------------------------------
function buildDashboardResponse(store: Store): DashboardResponse {
  const storeReviews = memReviews.filter((r) => r.store_id === store.id);
  const storeTasks = memTasks.filter((t) => t.store_id === store.id);
  const storeAlerts = memAlerts.filter((a) => a.store_id === store.id && !a.acknowledged);
  const storeLogs = memLogs
    .filter((l) => l.store_id === store.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 15);

  const totalReviews = storeReviews.length;
  const noiseFilteredCount = storeReviews.filter((r) => r.is_noise).length;
  const signalReviews = storeReviews.filter((r) => !r.is_noise);
  const signalKeptPercent = totalReviews > 0 ? Math.round((signalReviews.length / totalReviews) * 100) : 100;
  const positiveReviews = signalReviews.filter((r) => r.sentiment === 'positive');
  const positivePercent =
    signalReviews.length > 0 ? Math.round((positiveReviews.length / signalReviews.length) * 100) : 0;
  const openTasksCount = storeTasks.filter((t) => !t.completed).length;
  const avgRating =
    totalReviews > 0
      ? Number((storeReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 5.0;

  const metrics: DashboardMetrics = {
    signalKeptPercent,
    positivePercent,
    noiseFilteredCount,
    openTasksCount,
    totalReviews,
    averageRating: avgRating,
  };

  // Group into Timeline (e.g. past 7 days)
  const timelineMap = new Map<string, { pos: number; neg: number; noise: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    timelineMap.set(dateStr, { pos: 0, neg: 0, noise: 0 });
  }

  storeReviews.forEach((r) => {
    const d = new Date(r.created_at);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const bucket = timelineMap.get(dateStr);
    if (bucket) {
      if (r.is_noise) bucket.noise += 1;
      else if (r.sentiment === 'positive') bucket.pos += 1;
      else if (r.sentiment === 'negative') bucket.neg += 1;
    }
  });

  const timeline: DashboardTimelineItem[] = Array.from(timelineMap.entries()).map(([date, counts]) => ({
    date,
    positiveSignal: counts.pos,
    negativeSignal: counts.neg,
    filteredNoise: counts.noise,
  }));

  // Keyword Stats & Quote Extraction
  const keywordMap = new Map<string, { count: number; sentiment: 'positive' | 'negative'; quote: string; author: string; reviewId: string }>();

  storeReviews.forEach((r) => {
    if (r.is_noise) return;
    const phrases = r.topics && r.topics.length > 0 ? r.topics : [r.product_name];
    phrases.forEach((ph) => {
      const clean = ph.trim();
      const existing = keywordMap.get(clean);
      if (existing) {
        existing.count += 1;
      } else {
        keywordMap.set(clean, {
          count: 1,
          sentiment: r.sentiment === 'negative' ? 'negative' : 'positive',
          quote: r.raw_text,
          author: r.author,
          reviewId: r.id,
        });
      }
    });
  });

  const keywordStats: KeywordStat[] = Array.from(keywordMap.entries())
    .map(([keyword, data]) => ({
      keyword,
      mentions: data.count,
      sentiment: data.sentiment,
      evidenceQuote: data.quote,
      author: data.author,
      reviewId: data.reviewId,
    }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 10);

  return {
    store,
    metrics,
    timeline,
    keywordStats,
    activeAlert: storeAlerts[0] || null,
    recentTasks: storeTasks,
    recentActivity: storeLogs,
  };
}

// =============================================================================
// API ROUTES
// =============================================================================

// 1. Health & Readiness
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    engine: 'Cluey Cart Niche-Aware AI Engine',
    supabaseConnected: isSupabaseReady(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    googleAuthReady: Boolean(GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('your-google-client-id')),
    timestamp: new Date().toISOString(),
  });
});

// 2. Dedicated Google Authentication
app.post('/api/auth/google', async (req: Request, res: Response) => {
  const { credential, idToken } = req.body || {};
  const tokenToVerify = credential || idToken;

  if (!tokenToVerify) {
    return res.status(400).json({ success: false, error: 'Missing Google credential or idToken' });
  }

  try {
    let googleUser = {
      sub: 'google-user-101',
      email: 'alex.merchant@feedbackhub.io',
      name: 'Alex Merchant',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    };

    if (GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('your-google-client-id') && tokenToVerify.split('.').length === 3) {
      try {
        const ticket = await oauthClient.verifyIdToken({
          idToken: tokenToVerify,
          audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          googleUser = {
            sub: payload.sub,
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            picture: payload.picture || '',
          };
        }
      } catch {
        const decoded: any = jwt.decode(tokenToVerify);
        if (decoded?.email) {
          googleUser = {
            sub: decoded.sub || `google-${Date.now()}`,
            email: decoded.email,
            name: decoded.name || decoded.email.split('@')[0],
            picture: decoded.picture || '',
          };
        }
      }
    } else {
      const decoded: any = jwt.decode(tokenToVerify);
      if (decoded?.email) {
        googleUser = {
          sub: decoded.sub || `google-${Date.now()}`,
          email: decoded.email,
          name: decoded.name || decoded.email.split('@')[0],
          picture: decoded.picture || '',
        };
      }
    }

    const appToken = jwt.sign(
      {
        userId: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token: appToken,
      user: {
        id: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        avatar_url: googleUser.picture,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Google verification failed' });
  }
});

// 3. Stores List & CRUD
app.get('/api/stores', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId || 'demo-user-dev';

  if (isSupabaseReady() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('stores')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return res.json(data);
      }
    } catch {
      // Fall through to in-memory
    }
  }

  const userStores = memStores.filter((s) => s.user_id === userId || s.user_id === 'demo-user-dev');
  return res.json(userStores);
});

app.post('/api/stores', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId || 'demo-user-dev';
  const { name, platform, category, target_demographic, brand_tone, focus_keywords, ignore_keywords } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: 'Store name and category are required' });
  }

  const newStore: Store = {
    id: `store-${Date.now()}`,
    user_id: userId,
    name,
    platform: platform || 'Shopify',
    category,
    target_demographic: target_demographic || 'General e-commerce buyers',
    brand_tone: brand_tone || 'Warm Boutique',
    focus_keywords: Array.isArray(focus_keywords) ? focus_keywords : [],
    ignore_keywords: Array.isArray(ignore_keywords) ? ignore_keywords : [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseReady() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.from('stores').insert([newStore]).select().single();
      if (!error && data) {
        memStores.unshift(data);
        return res.status(201).json(data);
      }
    } catch {
      // Fall through
    }
  }

  memStores.unshift(newStore);
  memLogs.unshift({
    id: `act-${Date.now()}`,
    store_id: newStore.id,
    type: 'persona_edit',
    message: `Created store persona: ${newStore.name} (${newStore.platform})`,
    created_at: new Date().toISOString(),
  });

  return res.status(201).json(newStore);
});

app.patch('/api/stores/:storeId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const storeId = req.params.storeId as string;
  const updates = req.body;

  const idx = memStores.findIndex((s) => s.id === storeId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Store not found' });
  }

  const updated: Store = {
    ...memStores[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  memStores[idx] = updated;

  memLogs.unshift({
    id: `act-${Date.now()}`,
    store_id: storeId,
    type: 'persona_edit',
    message: `Updated persona settings for ${updated.name}`,
    created_at: new Date().toISOString(),
  });

  return res.json(updated);
});

app.delete('/api/stores/:storeId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { storeId } = req.params;
  memStores = memStores.filter((s) => s.id !== storeId);
  memReviews = memReviews.filter((r) => r.store_id !== storeId);
  memTasks = memTasks.filter((t) => t.store_id !== storeId);
  memAlerts = memAlerts.filter((a) => a.store_id !== storeId);
  memLogs = memLogs.filter((l) => l.store_id !== storeId);
  return res.json({ success: true, message: 'Store removed' });
});

// 4. Dashboard View Metrics
app.get('/api/stores/:storeId/dashboard', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { storeId } = req.params;
  const store = memStores.find((s) => s.id === storeId) || memStores[0];
  if (!store) {
    return res.status(404).json({ error: 'Store not found' });
  }

  const dashboardData = buildDashboardResponse(store);
  return res.json(dashboardData);
});

// 5. Review Ingestion & Gemini Structured Analysis
app.post('/api/stores/:storeId/reviews/analyze', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { storeId } = req.params;
  const { reviews: rawReviews, batchId } = req.body;

  const store = memStores.find((s) => s.id === storeId) || memStores[0];
  if (!store) return res.status(404).json({ error: 'Store not found' });

  if (!rawReviews || !Array.isArray(rawReviews) || rawReviews.length === 0) {
    return res.status(400).json({ error: 'Payload must contain a non-empty array of reviews' });
  }

  const generatedBatchId = batchId || `batch-${Date.now()}`;

  try {
    // 1. Run Gemini AI structured analysis
    const aiResult = await analyzeReviewsWithGemini(store, rawReviews);

    // 2. Construct persisted Review entities
    const newReviews: Review[] = rawReviews.map((raw, idx) => {
      const analysis = aiResult.analyzed_reviews.find((a) => a.review_index === idx) || {
        is_noise: false,
        noise_reason: null,
        sentiment: (raw.rating || 3) >= 4 ? 'positive' : (raw.rating || 3) <= 2 ? 'negative' : 'neutral',
        sentiment_score: (raw.rating || 3) >= 4 ? 0.8 : -0.7,
        niche_relevance: 90,
        topics: [store.category],
        ai_summary: raw.raw_text?.slice(0, 80) || '',
      };

      return {
        id: `rev-${Date.now()}-${idx}`,
        store_id: store.id,
        batch_id: generatedBatchId,
        author: raw.author || `Customer #${idx + 1}`,
        product_name: raw.product_name || `${store.category} Item`,
        rating: Number(raw.rating) || 3,
        raw_text: raw.raw_text || raw.review_text || '',
        source_platform: raw.source_platform || store.platform,
        is_noise: analysis.is_noise,
        noise_reason: analysis.noise_reason,
        sentiment: analysis.sentiment,
        sentiment_score: analysis.sentiment_score,
        niche_relevance: analysis.niche_relevance,
        topics: analysis.topics,
        ai_summary: analysis.ai_summary,
        drafted_reply: null,
        reply_status: 'pending',
        created_at: new Date().toISOString(),
        analyzed_at: new Date().toISOString(),
      };
    });

    memReviews = [...newReviews, ...memReviews];

    // 3. Recommended Tasks from AI
    const createdTasks: ActionTask[] = aiResult.recommended_tasks.map((task, idx) => ({
      id: `task-${Date.now()}-${idx}`,
      store_id: store.id,
      batch_id: generatedBatchId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      impact_estimate: task.impact_estimate,
      evidence_quote: task.evidence_quote,
      related_review_ids: newReviews.filter((r) => r.sentiment === 'negative').map((r) => r.id),
      completed: false,
      completed_at: null,
      created_at: new Date().toISOString(),
    }));

    if (createdTasks.length > 0) {
      memTasks = [...createdTasks, ...memTasks];
    }

    // 4. Detected Trend Spike Alert
    let createdAlert: TrendAlert | null = null;
    if (aiResult.detected_alert) {
      createdAlert = {
        id: `alert-${Date.now()}`,
        store_id: store.id,
        topic: aiResult.detected_alert.topic,
        severity: aiResult.detected_alert.severity,
        negative_count: aiResult.detected_alert.negative_count,
        delta_percent: aiResult.detected_alert.delta_percent,
        summary: aiResult.detected_alert.summary,
        acknowledged: false,
        created_at: new Date().toISOString(),
      };
      memAlerts = [createdAlert, ...memAlerts];
    }

    // 5. Activity Log
    const noiseCount = newReviews.filter((r) => r.is_noise).length;
    memLogs.unshift({
      id: `act-${Date.now()}`,
      store_id: store.id,
      type: 'analyze',
      message: `Gemini analyzed ${newReviews.length} reviews: kept ${newReviews.length - noiseCount} niche signals, filtered ${noiseCount} noise`,
      created_at: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      batch_id: generatedBatchId,
      reviews: newReviews,
      tasks: createdTasks,
      alert: createdAlert,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gemini analysis failed' });
  }
});

// 6. Simulate 6 Persona-Matched Reviews
app.post('/api/stores/:storeId/reviews/simulate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { storeId } = req.params;
  const store = memStores.find((s) => s.id === storeId) || memStores[0];
  if (!store) return res.status(404).json({ error: 'Store not found' });

  try {
    const simulatedRaw = await simulateReviewsWithGemini(store, 6);
    // Now trigger analysis on the simulated batch
    const aiResult = await analyzeReviewsWithGemini(store, simulatedRaw);
    const batchId = `sim-batch-${Date.now()}`;

    const newReviews: Review[] = simulatedRaw.map((raw, idx) => {
      const analysis = aiResult.analyzed_reviews.find((a) => a.review_index === idx) || {
        is_noise: false,
        noise_reason: null,
        sentiment: (raw.rating || 3) >= 4 ? 'positive' : (raw.rating || 3) <= 2 ? 'negative' : 'neutral',
        sentiment_score: (raw.rating || 3) >= 4 ? 0.85 : -0.75,
        niche_relevance: 95,
        topics: [store.category],
        ai_summary: raw.raw_text?.slice(0, 80) || '',
      };

      return {
        id: `rev-sim-${Date.now()}-${idx}`,
        store_id: store.id,
        batch_id: batchId,
        author: raw.author || `Shopper #${idx + 1}`,
        product_name: raw.product_name || `${store.category} Item`,
        rating: Number(raw.rating) || 3,
        raw_text: raw.raw_text || '',
        source_platform: raw.source_platform || store.platform,
        is_noise: analysis.is_noise,
        noise_reason: analysis.noise_reason,
        sentiment: analysis.sentiment,
        sentiment_score: analysis.sentiment_score,
        niche_relevance: analysis.niche_relevance,
        topics: analysis.topics,
        ai_summary: analysis.ai_summary,
        drafted_reply: null,
        reply_status: 'pending',
        created_at: new Date().toISOString(),
        analyzed_at: new Date().toISOString(),
      };
    });

    memReviews = [...newReviews, ...memReviews];

    const createdTasks: ActionTask[] = aiResult.recommended_tasks.map((task, idx) => ({
      id: `task-sim-${Date.now()}-${idx}`,
      store_id: store.id,
      batch_id: batchId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      impact_estimate: task.impact_estimate,
      evidence_quote: task.evidence_quote,
      related_review_ids: newReviews.filter((r) => r.sentiment === 'negative').map((r) => r.id),
      completed: false,
      completed_at: null,
      created_at: new Date().toISOString(),
    }));

    if (createdTasks.length > 0) {
      memTasks = [...createdTasks, ...memTasks];
    }

    let createdAlert: TrendAlert | null = null;
    if (aiResult.detected_alert) {
      createdAlert = {
        id: `alert-sim-${Date.now()}`,
        store_id: store.id,
        topic: aiResult.detected_alert.topic,
        severity: aiResult.detected_alert.severity,
        negative_count: aiResult.detected_alert.negative_count,
        delta_percent: aiResult.detected_alert.delta_percent,
        summary: aiResult.detected_alert.summary,
        acknowledged: false,
        created_at: new Date().toISOString(),
      };
      memAlerts = [createdAlert, ...memAlerts];
    }

    memLogs.unshift({
      id: `act-${Date.now()}`,
      store_id: store.id,
      type: 'analyze',
      message: `Simulated & evaluated 6 persona-matched reviews with defect cluster and courier noise`,
      created_at: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      batch_id: batchId,
      reviews: newReviews,
      tasks: createdTasks,
      alert: createdAlert,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Simulation failed' });
  }
});

// 7. Draft Public Customer Reply with Gemini
app.post('/api/stores/:storeId/reviews/:reviewId/draft-reply', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { storeId, reviewId } = req.params;
  const { brandTone: overrideTone } = req.body;

  const store = memStores.find((s) => s.id === storeId) || memStores[0];
  const review = memReviews.find((r) => r.id === reviewId);

  if (!review) return res.status(404).json({ error: 'Review not found' });

  try {
    const tone = overrideTone || store.brand_tone || 'Warm Boutique';
    const draft = await draftCustomerReplyWithGemini(store, review, tone);

    review.drafted_reply = draft;
    review.reply_status = 'drafted';

    memLogs.unshift({
      id: `act-${Date.now()}`,
      store_id: store.id,
      type: 'draft_reply',
      message: `Generated brand response for ${review.author} (${tone})`,
      created_at: new Date().toISOString(),
    });

    return res.json({ success: true, drafted_reply: draft, reply_status: 'drafted' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to draft reply' });
  }
});

// 8. Mark Reply as Copied to Clipboard
app.patch('/api/stores/:storeId/reviews/:reviewId/mark-copied', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const storeId = req.params.storeId as string;
  const reviewId = req.params.reviewId as string;
  const review = memReviews.find((r) => r.id === reviewId);
  if (!review) return res.status(404).json({ error: 'Review not found' });

  review.reply_status = 'copied';

  memLogs.unshift({
    id: `act-${Date.now()}`,
    store_id: storeId,
    type: 'copy_reply',
    message: `Copied response for ${review.author} to clipboard`,
    created_at: new Date().toISOString(),
  });

  return res.json({ success: true, reply_status: 'copied' });
});

// 9. Action Checklist Tasks CRUD
app.post('/api/stores/:storeId/tasks', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const storeId = req.params.storeId as string;
  const { title, description, priority, category, impact_estimate, evidence_quote } = req.body;

  if (!title) return res.status(400).json({ error: 'Task title is required' });

  const newTask: ActionTask = {
    id: `task-${Date.now()}`,
    store_id: storeId,
    title,
    description: description || '',
    priority: priority || 'medium',
    category: category || 'Store Operations',
    impact_estimate: impact_estimate || 'Enhances merchant workflow',
    evidence_quote: evidence_quote || '',
    related_review_ids: [],
    completed: false,
    completed_at: null,
    created_at: new Date().toISOString(),
  };

  memTasks.unshift(newTask);
  return res.status(201).json(newTask);
});

app.patch('/api/stores/:storeId/tasks/:taskId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const storeId = req.params.storeId as string;
  const taskId = req.params.taskId as string;
  const updates = req.body;

  const task = memTasks.find((t) => t.id === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (typeof updates.completed === 'boolean') {
    task.completed = updates.completed;
    task.completed_at = updates.completed ? new Date().toISOString() : null;

    if (updates.completed) {
      memLogs.unshift({
        id: `act-${Date.now()}`,
        store_id: storeId,
        type: 'task_complete',
        message: `Resolved weekly task: ${task.title}`,
        created_at: new Date().toISOString(),
      });
    }
  }

  if (updates.title) task.title = updates.title;
  if (updates.priority) task.priority = updates.priority;

  return res.json(task);
});

app.delete('/api/stores/:storeId/tasks/:taskId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const taskId = req.params.taskId as string;
  memTasks = memTasks.filter((t) => t.id !== taskId);
  return res.json({ success: true, message: 'Task deleted' });
});

// 10. Acknowledge / Dismiss Spike Alert
app.patch('/api/stores/:storeId/alerts/:alertId/acknowledge', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const alertId = req.params.alertId as string;
  const alert = memAlerts.find((a) => a.id === alertId);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  alert.acknowledged = true;
  return res.json({ success: true, alert });
});

// 11. PDF Export Log
app.post('/api/stores/:storeId/report-logged', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const storeId = req.params.storeId as string;
  memLogs.unshift({
    id: `act-${Date.now()}`,
    store_id: storeId,
    type: 'pdf_export',
    message: 'Exported Weekly Executive Feedback & Action PDF Report',
    created_at: new Date().toISOString(),
  });
  return res.json({ success: true });
});

export default app;
