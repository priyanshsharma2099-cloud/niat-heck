import axios from 'axios';
import {
  Store,
  StorePersonaInput,
  Review,
  ActionTask,
  TrendAlert,
  DashboardResponse,
  ActivityLog,
} from '../types';
import {
  INITIAL_STORES,
  INITIAL_REVIEWS,
  INITIAL_ACTION_TASKS,
  INITIAL_TREND_ALERTS,
  INITIAL_ACTIVITY_LOGS,
} from './mockData';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 25000,
});

// Interceptor to attach auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('cluey_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// -----------------------------------------------------------------------------
// Offline / Fallback Local Storage Simulation
// -----------------------------------------------------------------------------
function getLocalStores(): Store[] {
  const raw = localStorage.getItem('cluey_stores_v2');
  return raw ? JSON.parse(raw) : INITIAL_STORES;
}

function setLocalStores(stores: Store[]) {
  localStorage.setItem('cluey_stores_v2', JSON.stringify(stores));
}

function getLocalReviews(): Review[] {
  const raw = localStorage.getItem('cluey_reviews_v2');
  return raw ? JSON.parse(raw) : INITIAL_REVIEWS;
}

function setLocalReviews(reviews: Review[]) {
  localStorage.setItem('cluey_reviews_v2', JSON.stringify(reviews));
}

function getLocalTasks(): ActionTask[] {
  const raw = localStorage.getItem('cluey_tasks_v2');
  return raw ? JSON.parse(raw) : INITIAL_ACTION_TASKS;
}

function setLocalTasks(tasks: ActionTask[]) {
  localStorage.setItem('cluey_tasks_v2', JSON.stringify(tasks));
}

function getLocalAlerts(): TrendAlert[] {
  const raw = localStorage.getItem('cluey_alerts_v2');
  return raw ? JSON.parse(raw) : INITIAL_TREND_ALERTS;
}

function setLocalAlerts(alerts: TrendAlert[]) {
  localStorage.setItem('cluey_alerts_v2', JSON.stringify(alerts));
}

function getLocalLogs(): ActivityLog[] {
  const raw = localStorage.getItem('cluey_logs_v2');
  return raw ? JSON.parse(raw) : INITIAL_ACTIVITY_LOGS;
}

function setLocalLogs(logs: ActivityLog[]) {
  localStorage.setItem('cluey_logs_v2', JSON.stringify(logs));
}

// -----------------------------------------------------------------------------
// API CLIENT IMPLEMENTATION
// -----------------------------------------------------------------------------
export const api = {
  // 1. Health
  async checkHealth() {
    try {
      const res = await apiClient.get('/health');
      return res.data;
    } catch {
      return { status: 'offline', localFallback: true };
    }
  },

  // 2. Google Auth
  async verifyGoogleToken(credential: string) {
    try {
      const res = await apiClient.post('/auth/google', { credential });
      if (res.data?.token) {
        localStorage.setItem('cluey_auth_token', res.data.token);
      }
      return res.data;
    } catch (err: any) {
      // Local fallback for offline demo
      const fallbackUser = {
        id: `usr-${Date.now()}`,
        email: 'merchant@clueycart.com',
        name: 'Merchant Partner',
      };
      localStorage.setItem('cluey_auth_token', 'demo-token');
      return { success: true, user: fallbackUser, token: 'demo-token' };
    }
  },

  // 3. Stores
  async getStores(): Promise<Store[]> {
    try {
      const res = await apiClient.get('/stores');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setLocalStores(res.data);
        return res.data;
      }
    } catch {
      // fallback
    }
    return getLocalStores();
  },

  async createStore(storeInput: StorePersonaInput): Promise<Store> {
    try {
      const res = await apiClient.post('/stores', storeInput);
      if (res.data?.id) {
        const local = getLocalStores();
        setLocalStores([res.data, ...local]);
        return res.data;
      }
    } catch {
      // fallback
    }
    const newStore: Store = {
      id: `store-${Date.now()}`,
      user_id: 'demo-user-dev',
      ...storeInput,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const local = getLocalStores();
    setLocalStores([newStore, ...local]);
    return newStore;
  },

  async updateStore(storeId: string, updates: Partial<Store>): Promise<Store> {
    try {
      const res = await apiClient.patch(`/stores/${storeId}`, updates);
      if (res.data?.id) {
        const local = getLocalStores().map((s) => (s.id === storeId ? res.data : s));
        setLocalStores(local);
        return res.data;
      }
    } catch {
      // fallback
    }
    const local = getLocalStores().map((s) => (s.id === storeId ? { ...s, ...updates, updated_at: new Date().toISOString() } : s));
    setLocalStores(local);
    return local.find((s) => s.id === storeId)!;
  },

  async deleteStore(storeId: string): Promise<void> {
    try {
      await apiClient.delete(`/stores/${storeId}`);
    } catch {
      // fallback
    }
    const local = getLocalStores().filter((s) => s.id !== storeId);
    setLocalStores(local);
  },

  // 4. Dashboard Metrics
  async getDashboard(storeId: string): Promise<DashboardResponse> {
    try {
      const res = await apiClient.get(`/stores/${storeId}/dashboard`);
      if (res.data?.metrics) {
        return res.data;
      }
    } catch {
      // fallback calculation
    }

    const stores = getLocalStores();
    const store = stores.find((s) => s.id === storeId) || stores[0] || INITIAL_STORES[0];
    const reviews = getLocalReviews().filter((r) => r.store_id === store.id);
    const tasks = getLocalTasks().filter((t) => t.store_id === store.id);
    const alerts = getLocalAlerts().filter((a) => a.store_id === store.id && !a.acknowledged);
    const logs = getLocalLogs().filter((l) => l.store_id === store.id);

    const totalReviews = reviews.length;
    const noiseFilteredCount = reviews.filter((r) => r.is_noise).length;
    const signalReviews = reviews.filter((r) => !r.is_noise);
    const signalKeptPercent = totalReviews > 0 ? Math.round((signalReviews.length / totalReviews) * 100) : 100;
    const positiveReviews = signalReviews.filter((r) => r.sentiment === 'positive');
    const positivePercent = signalReviews.length > 0 ? Math.round((positiveReviews.length / signalReviews.length) * 100) : 0;
    const openTasksCount = tasks.filter((t) => !t.completed).length;

    return {
      store,
      metrics: {
        signalKeptPercent,
        positivePercent,
        noiseFilteredCount,
        openTasksCount,
        totalReviews,
        averageRating: 4.2,
      },
      timeline: [
        { date: 'Mon', positiveSignal: 4, negativeSignal: 1, filteredNoise: 2 },
        { date: 'Tue', positiveSignal: 3, negativeSignal: 2, filteredNoise: 1 },
        { date: 'Wed', positiveSignal: 5, negativeSignal: 0, filteredNoise: 3 },
        { date: 'Thu', positiveSignal: 2, negativeSignal: 3, filteredNoise: 2 },
        { date: 'Fri', positiveSignal: 6, negativeSignal: 1, filteredNoise: 1 },
        { date: 'Sat', positiveSignal: 8, negativeSignal: 2, filteredNoise: 4 },
        { date: 'Sun', positiveSignal: 5, negativeSignal: 2, filteredNoise: 2 },
      ],
      keywordStats: [
        {
          keyword: 'pure linen drape',
          mentions: 8,
          sentiment: 'positive',
          evidenceQuote: 'The drape and fabric feel effortless all day in hot humid afternoons.',
          author: 'Pooja Kashyap',
        },
        {
          keyword: 'tight armhole ease',
          mentions: 5,
          sentiment: 'negative',
          evidenceQuote: 'Tight sleeves and high armholes pinch painfully when lifting arms.',
          author: 'Sunita Mehra',
        },
        {
          keyword: 'botanical indigo dye',
          mentions: 3,
          sentiment: 'positive',
          evidenceQuote: 'Organic indigo hue is stunning and buttons are genuine shell.',
          author: 'Ananya Bose',
        },
      ],
      activeAlert: alerts[0] || null,
      recentTasks: tasks,
      recentActivity: logs,
    };
  },

  // 5. Review Analysis
  async analyzeReviews(storeId: string, rawReviews: Partial<Review>[], batchId?: string) {
    try {
      const res = await apiClient.post(`/stores/${storeId}/reviews/analyze`, {
        reviews: rawReviews,
        batchId,
      });
      if (res.data?.success) {
        return res.data;
      }
    } catch {
      // fallback
    }

    // Offline heuristic analysis
    const newReviews: Review[] = rawReviews.map((r, i) => {
      const text = (r.raw_text || '').toLowerCase();
      const is_noise = /courier|delivery|threw parcel|tracking|box|delayed/.test(text);
      return {
        id: `rev-${Date.now()}-${i}`,
        store_id: storeId,
        batch_id: batchId || `batch-${Date.now()}`,
        author: r.author || `Customer #${i + 1}`,
        product_name: r.product_name || 'Apparel Item',
        rating: r.rating || 3,
        raw_text: r.raw_text || '',
        source_platform: r.source_platform || 'Shopify',
        is_noise,
        noise_reason: is_noise ? 'Third-party delivery courier issue' : null,
        sentiment: (r.rating || 3) >= 4 ? 'positive' : (r.rating || 3) <= 2 ? 'negative' : 'neutral',
        sentiment_score: (r.rating || 3) >= 4 ? 0.8 : -0.7,
        niche_relevance: is_noise ? 15 : 95,
        topics: ['Craftsmanship & Sizing'],
        ai_summary: r.raw_text?.slice(0, 80) || '',
        drafted_reply: null,
        reply_status: 'pending',
        created_at: new Date().toISOString(),
        analyzed_at: new Date().toISOString(),
      };
    });

    const current = getLocalReviews();
    setLocalReviews([...newReviews, ...current]);

    return { success: true, reviews: newReviews, tasks: [], alert: null };
  },

  // 6. Simulate Reviews
  async simulateReviews(storeId: string) {
    try {
      const res = await apiClient.post(`/stores/${storeId}/reviews/simulate`);
      if (res.data?.success) {
        return res.data;
      }
    } catch {
      // fallback
    }

    // Default simulation fallback
    const simulated = INITIAL_REVIEWS.slice(0, 6).map((r, i) => ({
      ...r,
      id: `rev-sim-${Date.now()}-${i}`,
      store_id: storeId,
      created_at: new Date().toISOString(),
    }));

    const current = getLocalReviews();
    setLocalReviews([...simulated, ...current]);

    return { success: true, reviews: simulated, tasks: [], alert: null };
  },

  // 7. Draft Reply
  async draftReply(storeId: string, reviewId: string, brandTone?: string) {
    try {
      const res = await apiClient.post(`/stores/${storeId}/reviews/${reviewId}/draft-reply`, {
        brandTone,
      });
      if (res.data?.success) {
        return res.data;
      }
    } catch {
      // fallback
    }

    const draft = `Thank you for choosing our pieces and sharing your experience. We take fabric quality and sizing very seriously, and we are actively recalibrating this cut for future batches. Please reach out to our team so we can arrange an exchange or custom alteration for you!`;
    const reviews = getLocalReviews().map((r) =>
      r.id === reviewId ? { ...r, drafted_reply: draft, reply_status: 'drafted' as const } : r
    );
    setLocalReviews(reviews);

    return { success: true, drafted_reply: draft, reply_status: 'drafted' };
  },

  // 8. Mark Copied
  async markReplyCopied(storeId: string, reviewId: string) {
    try {
      await apiClient.patch(`/stores/${storeId}/reviews/${reviewId}/mark-copied`);
    } catch {
      // fallback
    }
    const reviews = getLocalReviews().map((r) =>
      r.id === reviewId ? { ...r, reply_status: 'copied' as const } : r
    );
    setLocalReviews(reviews);
    return { success: true };
  },

  // 9. Tasks
  async createTask(storeId: string, taskInput: Partial<ActionTask>) {
    try {
      const res = await apiClient.post(`/stores/${storeId}/tasks`, taskInput);
      if (res.data?.id) {
        const local = getLocalTasks();
        setLocalTasks([res.data, ...local]);
        return res.data;
      }
    } catch {
      // fallback
    }

    const newTask: ActionTask = {
      id: `task-${Date.now()}`,
      store_id: storeId,
      title: taskInput.title || 'Weekly Quality Check',
      description: taskInput.description || '',
      priority: taskInput.priority || 'medium',
      category: taskInput.category || 'Operations',
      impact_estimate: taskInput.impact_estimate || 'Enhances merchant experience',
      evidence_quote: taskInput.evidence_quote || '',
      related_review_ids: [],
      completed: false,
      completed_at: null,
      created_at: new Date().toISOString(),
    };
    const local = getLocalTasks();
    setLocalTasks([newTask, ...local]);
    return newTask;
  },

  async updateTask(storeId: string, taskId: string, updates: Partial<ActionTask>) {
    try {
      const res = await apiClient.patch(`/stores/${storeId}/tasks/${taskId}`, updates);
      if (res.data?.id) {
        const local = getLocalTasks().map((t) => (t.id === taskId ? res.data : t));
        setLocalTasks(local);
        return res.data;
      }
    } catch {
      // fallback
    }

    const local = getLocalTasks().map((t) =>
      t.id === taskId
        ? {
            ...t,
            ...updates,
            completed_at: updates.completed ? new Date().toISOString() : t.completed_at,
          }
        : t
    );
    setLocalTasks(local);
    return local.find((t) => t.id === taskId)!;
  },

  async deleteTask(storeId: string, taskId: string) {
    try {
      await apiClient.delete(`/stores/${storeId}/tasks/${taskId}`);
    } catch {
      // fallback
    }
    const local = getLocalTasks().filter((t) => t.id !== taskId);
    setLocalTasks(local);
  },

  // 10. Acknowledge Alert
  async acknowledgeAlert(storeId: string, alertId: string) {
    try {
      await apiClient.patch(`/stores/${storeId}/alerts/${alertId}/acknowledge`);
    } catch {
      // fallback
    }
    const local = getLocalAlerts().map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a));
    setLocalAlerts(local);
  },

  // 11. PDF Export Log
  async logReportExport(storeId: string) {
    try {
      await apiClient.post(`/stores/${storeId}/report-logged`);
    } catch {
      // fallback
    }
    const logs = getLocalLogs();
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      store_id: storeId,
      type: 'pdf_export',
      message: 'Exported Weekly Executive Feedback & Action PDF Report',
      created_at: new Date().toISOString(),
    };
    setLocalLogs([newLog, ...logs]);
  },
};
