import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Store,
  StorePersonaInput,
  Review,
  ActionTask,
  TrendAlert,
  ActivityLog,
  DashboardMetrics,
} from '../types';
import {
  INITIAL_STORES,
  INITIAL_REVIEWS,
  INITIAL_ACTION_TASKS,
  INITIAL_TREND_ALERTS,
  INITIAL_ACTIVITY_LOGS,
} from './mockData';
import { api } from './api';
import { exportWeeklyExecutivePdfReport } from './pdfExport';

export type ActiveNavTab = 'overview' | 'reviews' | 'actions' | 'import' | 'persona';

interface StoreContextType {
  stores: Store[];
  activeStore: Store;
  setActiveStore: (store: Store) => void;
  createStore: (input: StorePersonaInput) => Promise<Store>;
  updateStore: (updates: Partial<Store>) => Promise<Store>;
  deleteStore: (storeId: string) => Promise<void>;

  reviews: Review[];
  addReviews: (rawReviews: Partial<Review>[]) => Promise<void>;
  simulateBatch: () => Promise<void>;
  draftReply: (reviewId: string, tone?: string) => Promise<string>;
  markReplyCopied: (reviewId: string) => Promise<void>;

  tasks: ActionTask[];
  actionItems: ActionTask[]; // Backwards alias
  toggleTask: (taskId: string) => Promise<void>;
  toggleActionCompleted: (taskId: string) => void; // Backwards alias
  createTask: (input: Partial<ActionTask>) => Promise<void>;
  addActionItem: (input: Partial<ActionTask>) => void; // Backwards alias
  deleteTask: (taskId: string) => Promise<void>;

  alerts: TrendAlert[];
  sentimentAlerts: TrendAlert[]; // Backwards alias
  dismissAlert: (alertId: string) => Promise<void>;

  activityLogs: ActivityLog[];
  metrics: DashboardMetrics;
  isAnalyzing: boolean;

  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;

  exportPdf: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Stores
  const [stores, setStores] = useState<Store[]>(() => {
    const saved = localStorage.getItem('cluey_stores_v2');
    return saved ? JSON.parse(saved) : INITIAL_STORES;
  });

  const [activeStoreId, setActiveStoreId] = useState<string>(() => {
    const saved = localStorage.getItem('cluey_active_store_id_v2');
    return saved || INITIAL_STORES[0]?.id || 'store-apparel-01';
  });

  const activeStore = useMemo(() => {
    return stores.find((s) => s.id === activeStoreId) || stores[0] || INITIAL_STORES[0];
  }, [stores, activeStoreId]);

  // 2. Reviews
  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('cluey_reviews_v2');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  // 3. Tasks
  const [tasks, setTasks] = useState<ActionTask[]>(() => {
    const saved = localStorage.getItem('cluey_tasks_v2');
    return saved ? JSON.parse(saved) : INITIAL_ACTION_TASKS;
  });

  // 4. Alerts
  const [alerts, setAlerts] = useState<TrendAlert[]>(() => {
    const saved = localStorage.getItem('cluey_alerts_v2');
    return saved ? JSON.parse(saved) : INITIAL_TREND_ALERTS;
  });

  // 5. Activity Logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('cluey_logs_v2');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
  });

  const [activeTab, setActiveTab] = useState<ActiveNavTab>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('cluey_stores_v2', JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem('cluey_active_store_id_v2', activeStoreId);
  }, [activeStoreId]);

  useEffect(() => {
    localStorage.setItem('cluey_reviews_v2', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('cluey_tasks_v2', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('cluey_alerts_v2', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('cluey_logs_v2', JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Sync with Backend API on mount
  useEffect(() => {
    let mounted = true;
    api.getStores().then((fetchedStores) => {
      if (mounted && Array.isArray(fetchedStores) && fetchedStores.length > 0) {
        setStores(fetchedStores);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Compute Live Metrics for the Active Store
  const storeReviews = useMemo(() => {
    return reviews.filter((r) => r.store_id === activeStore.id);
  }, [reviews, activeStore.id]);

  const storeTasks = useMemo(() => {
    return tasks.filter((t) => t.store_id === activeStore.id);
  }, [tasks, activeStore.id]);

  const metrics: DashboardMetrics = useMemo(() => {
    const total = storeReviews.length;
    const noiseCount = storeReviews.filter((r) => r.is_noise).length;
    const signalReviews = storeReviews.filter((r) => !r.is_noise);
    const signalPercent = total > 0 ? Math.round((signalReviews.length / total) * 100) : 100;
    const posReviews = signalReviews.filter((r) => r.sentiment === 'positive');
    const posPercent = signalReviews.length > 0 ? Math.round((posReviews.length / signalReviews.length) * 100) : 0;
    const openTasks = storeTasks.filter((t) => !t.completed).length;
    const avgRating =
      total > 0 ? Number((storeReviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)) : 5.0;

    return {
      signalKeptPercent: signalPercent,
      positivePercent: posPercent,
      noiseFilteredCount: noiseCount,
      openTasksCount: openTasks,
      totalReviews: total,
      averageRating: avgRating,
    };
  }, [storeReviews, storeTasks]);

  // Actions
  const handleSetActiveStore = useCallback((store: Store) => {
    setActiveStoreId(store.id);
  }, []);

  const handleCreateStore = async (input: StorePersonaInput): Promise<Store> => {
    const created = await api.createStore(input);
    setStores((prev) => [created, ...prev]);
    setActiveStoreId(created.id);
    return created;
  };

  const handleUpdateStore = async (updates: Partial<Store>): Promise<Store> => {
    const updated = await api.updateStore(activeStore.id, updates);
    setStores((prev) => prev.map((s) => (s.id === activeStore.id ? updated : s)));
    return updated;
  };

  const handleDeleteStore = async (storeId: string): Promise<void> => {
    await api.deleteStore(storeId);
    setStores((prev) => prev.filter((s) => s.id !== storeId));
    if (activeStoreId === storeId) {
      const remaining = stores.filter((s) => s.id !== storeId);
      if (remaining.length > 0) setActiveStoreId(remaining[0].id);
    }
  };

  const handleAddReviews = async (rawReviews: Partial<Review>[]) => {
    setIsAnalyzing(true);
    try {
      const result = await api.analyzeReviews(activeStore.id, rawReviews);
      if (result.reviews) {
        setReviews((prev) => [...result.reviews, ...prev]);
      }
      if (result.tasks && result.tasks.length > 0) {
        setTasks((prev) => [...result.tasks, ...prev]);
      }
      if (result.alert) {
        setAlerts((prev) => [result.alert, ...prev]);
      }

      setActivityLogs((prev) => [
        {
          id: `act-${Date.now()}`,
          store_id: activeStore.id,
          type: 'analyze',
          message: `Ingested & analyzed ${rawReviews.length} customer feedback items`,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSimulateBatch = async () => {
    setIsAnalyzing(true);
    try {
      const result = await api.simulateReviews(activeStore.id);
      if (result.reviews) {
        setReviews((prev) => [...result.reviews, ...prev]);
      }
      if (result.tasks && result.tasks.length > 0) {
        setTasks((prev) => [...result.tasks, ...prev]);
      }
      if (result.alert) {
        setAlerts((prev) => [result.alert, ...prev]);
      }

      setActivityLogs((prev) => [
        {
          id: `act-${Date.now()}`,
          store_id: activeStore.id,
          type: 'analyze',
          message: 'Simulated 6 persona-matched reviews (praise, courier noise, defect cluster)',
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDraftReply = async (reviewId: string, tone?: string): Promise<string> => {
    const result = await api.draftReply(activeStore.id, reviewId, tone);
    const draftText = result.drafted_reply || '';

    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, drafted_reply: draftText, reply_status: 'drafted' } : r
      )
    );

    setActivityLogs((prev) => [
      {
        id: `act-${Date.now()}`,
        store_id: activeStore.id,
        type: 'draft_reply',
        message: `Drafted brand reply with tone: ${tone || activeStore.brand_tone}`,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    return draftText;
  };

  const handleMarkReplyCopied = async (reviewId: string) => {
    await api.markReplyCopied(activeStore.id, reviewId);
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, reply_status: 'copied' } : r))
    );

    setActivityLogs((prev) => [
      {
        id: `act-${Date.now()}`,
        store_id: activeStore.id,
        type: 'copy_reply',
        message: 'Customer reply copied to clipboard for storefront posting',
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;
    await api.updateTask(activeStore.id, taskId, { completed: newCompleted });

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: newCompleted,
              completed_at: newCompleted ? new Date().toISOString() : null,
            }
          : t
      )
    );

    if (newCompleted) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });

      setActivityLogs((prev) => [
        {
          id: `act-${Date.now()}`,
          store_id: activeStore.id,
          type: 'task_complete',
          message: `Completed weekly action: "${task.title}"`,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  };

  const handleCreateTask = async (input: Partial<ActionTask>) => {
    const created = await api.createTask(activeStore.id, input);
    setTasks((prev) => [created, ...prev]);
  };

  const handleDeleteTask = async (taskId: string) => {
    await api.deleteTask(activeStore.id, taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleDismissAlert = async (alertId: string) => {
    await api.acknowledgeAlert(activeStore.id, alertId);
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
  };

  const handleExportPdf = () => {
    exportWeeklyExecutivePdfReport(
      activeStore,
      storeReviews,
      storeTasks,
      alerts.filter((a) => a.store_id === activeStore.id),
      metrics
    );
    api.logReportExport(activeStore.id);

    setActivityLogs((prev) => [
      {
        id: `act-${Date.now()}`,
        store_id: activeStore.id,
        type: 'pdf_export',
        message: 'Exported Weekly Executive Feedback & Action PDF Report',
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  return (
    <StoreContext.Provider
      value={{
        stores,
        activeStore,
        setActiveStore: handleSetActiveStore,
        createStore: handleCreateStore,
        updateStore: handleUpdateStore,
        deleteStore: handleDeleteStore,

        reviews,
        addReviews: handleAddReviews,
        simulateBatch: handleSimulateBatch,
        draftReply: handleDraftReply,
        markReplyCopied: handleMarkReplyCopied,

        tasks,
        actionItems: tasks,
        toggleTask: handleToggleTask,
        toggleActionCompleted: handleToggleTask,
        createTask: handleCreateTask,
        addActionItem: handleCreateTask,
        deleteTask: handleDeleteTask,

        alerts,
        sentimentAlerts: alerts,
        dismissAlert: handleDismissAlert,

        activityLogs,
        metrics,
        isAnalyzing,

        activeTab,
        setActiveTab,

        exportPdf: handleExportPdf,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
