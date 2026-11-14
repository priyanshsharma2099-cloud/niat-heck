import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  StorePersona,
  Review,
  ActionItem,
  SentimentAlert,
  ActivityLog,
  DashboardMetrics,
} from '../types';
import {
  INITIAL_STORES,
  INITIAL_REVIEWS,
  INITIAL_ACTION_ITEMS,
  INITIAL_SENTIMENT_ALERTS,
  INITIAL_ACTIVITY_LOGS,
} from './mockData';
import { analyzeReviewsWithGemini } from './geminiService';
import confetti from 'canvas-confetti';

interface StoreContextType {
  stores: StorePersona[];
  activeStore: StorePersona;
  setActiveStore: (store: StorePersona) => void;
  updateStore: (updated: StorePersona) => void;
  createStore: (newStore: Omit<StorePersona, 'id' | 'created_at' | 'updated_at'>) => void;
  reviews: Review[];
  addReviews: (rawReviews: Partial<Review>[], replaceExisting?: boolean) => Promise<void>;
  actionItems: ActionItem[];
  toggleActionCompleted: (id: string) => void;
  addActionItem: (item: Omit<ActionItem, 'id' | 'created_at' | 'store_id'>) => void;
  sentimentAlerts: SentimentAlert[];
  dismissAlert: (id: string) => void;
  activityLogs: ActivityLog[];
  metrics: DashboardMetrics;
  isAnalyzing: boolean;
  activeTab: 'dashboard' | 'checklist' | 'reviews' | 'alerts' | 'persona';
  setActiveTab: (tab: 'dashboard' | 'checklist' | 'reviews' | 'alerts' | 'persona') => void;
  reanalyzeAllReviews: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Stores State
  const [stores, setStores] = useState<StorePersona[]>(() => {
    const saved = localStorage.getItem('cluey_stores_v2');
    return saved ? JSON.parse(saved) : INITIAL_STORES;
  });

  const [activeStoreId, setActiveStoreId] = useState<string>(() => {
    const saved = localStorage.getItem('cluey_active_store_id_v2');
    return saved || INITIAL_STORES[0]?.id || 'store-apparel';
  });

  const activeStore = useMemo(() => {
    return stores.find((s) => s.id === activeStoreId) || stores[0] || INITIAL_STORES[0];
  }, [stores, activeStoreId]);

  // 2. Reviews State
  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('cluey_reviews_v2');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  // 3. Action Items State
  const [actionItems, setActionItems] = useState<ActionItem[]>(() => {
    const saved = localStorage.getItem('cluey_action_items_v2');
    return saved ? JSON.parse(saved) : INITIAL_ACTION_ITEMS;
  });

  // 4. Alerts State
  const [sentimentAlerts, setSentimentAlerts] = useState<SentimentAlert[]>(() => {
    const saved = localStorage.getItem('cluey_sentiment_alerts_v2');
    return saved ? JSON.parse(saved) : INITIAL_SENTIMENT_ALERTS;
  });

  // 5. Activity Logs State
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('cluey_activity_logs_v2');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
  });

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'checklist' | 'reviews' | 'alerts' | 'persona'>('dashboard');

  // Persistence Effects
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
    localStorage.setItem('cluey_action_items_v2', JSON.stringify(actionItems));
  }, [actionItems]);

  useEffect(() => {
    localStorage.setItem('cluey_sentiment_alerts_v2', JSON.stringify(sentimentAlerts));
  }, [sentimentAlerts]);

  useEffect(() => {
    localStorage.setItem('cluey_activity_logs_v2', JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Filter scoped to active store
  const currentStoreReviews = useMemo(() => {
    return reviews.filter((r) => r.store_id === activeStore.id);
  }, [reviews, activeStore.id]);

  const currentStoreActions = useMemo(() => {
    return actionItems.filter((a) => a.store_id === activeStore.id);
  }, [actionItems, activeStore.id]);

  const currentStoreAlerts = useMemo(() => {
    return sentimentAlerts.filter((al) => al.store_id === activeStore.id && !al.is_dismissed);
  }, [sentimentAlerts, activeStore.id]);

  // Compute Dashboard Metrics
  const metrics: DashboardMetrics = useMemo(() => {
    const total = currentStoreReviews.length;
    if (total === 0) {
      return {
        netSentimentScore: 0,
        totalReviews: 0,
        noiseReviewsCount: 0,
        noisePercentage: 0,
        positiveCount: 0,
        neutralCount: 0,
        negativeCount: 0,
        pendingTasksCount: 0,
        criticalAlertsCount: 0,
        averageRating: 0,
      };
    }

    const noiseCount = currentStoreReviews.filter((r) => r.is_noise).length;
    const meaningful = currentStoreReviews.filter((r) => !r.is_noise);
    const positiveCount = meaningful.filter((r) => r.sentiment_label === 'positive').length;
    const neutralCount = meaningful.filter((r) => r.sentiment_label === 'neutral').length;
    const negativeCount = meaningful.filter((r) => r.sentiment_label === 'negative').length;

    const netScore = meaningful.length > 0
      ? Math.round(((positiveCount - negativeCount) / meaningful.length) * 100)
      : 0;

    const avgRating = Number(
      (currentStoreReviews.reduce((acc, r) => acc + (r.rating || 0), 0) / total).toFixed(1)
    );

    const pendingTasks = currentStoreActions.filter((a) => !a.is_completed).length;
    const criticalAlerts = currentStoreAlerts.filter((al) => al.severity === 'high').length;

    return {
      netSentimentScore: netScore,
      totalReviews: total,
      noiseReviewsCount: noiseCount,
      noisePercentage: Math.round((noiseCount / total) * 100),
      positiveCount,
      neutralCount,
      negativeCount,
      pendingTasksCount: pendingTasks,
      criticalAlertsCount: criticalAlerts,
      averageRating: avgRating,
    };
  }, [currentStoreReviews, currentStoreActions, currentStoreAlerts]);

  // Add and analyze new reviews
  const addReviews = async (newRawReviews: Partial<Review>[], replaceExisting: boolean = false) => {
    setIsAnalyzing(true);
    const logId = `log-${Date.now()}`;

    // Add Ingest Log
    setActivityLogs((prev) => [
      {
        id: logId,
        timestamp: 'Just now',
        type: 'ingest',
        title: `Loaded ${newRawReviews.length} Reviews`,
        description: `Imported customer review dataset for "${activeStore.name}".`,
      },
      ...prev,
    ]);

    try {
      // Execute Review Evaluation
      const analysis = await analyzeReviewsWithGemini(activeStore, newRawReviews);

      // Merge evaluated telemetry into reviews
      const evaluatedReviews: Review[] = newRawReviews.map((raw, idx) => {
        const aiMatch = analysis.analyzed_reviews.find((a) => a.review_id === raw.id) || analysis.analyzed_reviews[idx];
        return {
          id: raw.id || `rev-${Date.now()}-${idx}`,
          store_id: activeStore.id,
          source_platform: raw.source_platform || 'Storefront',
          external_review_id: raw.external_review_id,
          product_name: raw.product_name || 'Core Item',
          product_sku: raw.product_sku || 'SKU-001',
          rating: raw.rating || 3,
          review_title: raw.review_title || 'Customer Feedback',
          review_text: raw.review_text || '',
          review_date: raw.review_date || new Date().toISOString(),
          is_noise: aiMatch?.is_noise ?? false,
          noise_reason: aiMatch?.noise_reason ?? null,
          sentiment_score: aiMatch?.sentiment_score ?? 0,
          sentiment_label: aiMatch?.sentiment_label ?? (raw.rating && raw.rating >= 4 ? 'positive' : raw.rating && raw.rating <= 2 ? 'negative' : 'neutral'),
          primary_attribute: aiMatch?.primary_attribute ?? 'fabric',
          key_phrases: aiMatch?.key_phrases ?? [],
          created_at: new Date().toISOString(),
        };
      });

      // Update reviews
      if (replaceExisting) {
        setReviews((prev) => [...evaluatedReviews, ...prev.filter((r) => r.store_id !== activeStore.id)]);
      } else {
        setReviews((prev) => [...evaluatedReviews, ...prev]);
      }

      // Add newly synthesized action items
      if (analysis.action_items && analysis.action_items.length > 0) {
        const newActions: ActionItem[] = analysis.action_items.map((act, i) => ({
          id: `act-${Date.now()}-${i}`,
          store_id: activeStore.id,
          title: act.title,
          description: act.description,
          category: act.category,
          priority: act.priority,
          estimated_impact: act.estimated_impact,
          is_completed: false,
          completed_at: null,
          evidence_review_ids: evaluatedReviews.map((r) => r.id).slice(0, 2),
          created_at: new Date().toISOString(),
        }));

        if (replaceExisting) {
          setActionItems((prev) => [...newActions, ...prev.filter((a) => a.store_id !== activeStore.id)]);
        } else {
          setActionItems((prev) => [...newActions, ...prev]);
        }
      }

      // Add newly detected alerts
      if (analysis.sentiment_alerts && analysis.sentiment_alerts.length > 0) {
        const newAlerts: SentimentAlert[] = analysis.sentiment_alerts.map((alt, i) => ({
          id: `alt-${Date.now()}-${i}`,
          store_id: activeStore.id,
          attribute: alt.attribute,
          severity: alt.severity,
          percentage_surge: alt.percentage_surge,
          message: alt.message,
          is_dismissed: false,
          created_at: new Date().toISOString(),
        }));

        if (replaceExisting) {
          setSentimentAlerts((prev) => [...newAlerts, ...prev.filter((al) => al.store_id !== activeStore.id)]);
        } else {
          setSentimentAlerts((prev) => [...newAlerts, ...prev]);
        }
      } else if (replaceExisting) {
        setSentimentAlerts((prev) => prev.filter((al) => al.store_id !== activeStore.id));
      }

      // Add Completion Log
      const noiseFiltered = evaluatedReviews.filter((r) => r.is_noise).length;
      setActivityLogs((prev) => [
        {
          id: `log-done-${Date.now()}`,
          timestamp: 'Just now',
          type: 'filter',
          title: `${evaluatedReviews.length} Reviews Analyzed`,
          description: `Processed ${evaluatedReviews.length} customer reviews. Filtered ${noiseFiltered} courier delivery complaints.`,
        },
        ...prev,
      ]);
    } catch (err) {
      console.error('Error in addReviews:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Re-run full analysis across current store's reviews
  const reanalyzeAllReviews = async () => {
    if (currentStoreReviews.length === 0) return;
    await addReviews(currentStoreReviews);
  };

  // Toggle action item completion status
  const toggleActionCompleted = (id: string) => {
    setActionItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.is_completed;
          if (nextState) {
            // Trigger gentle celebratory confetti
            confetti({
              particleCount: 40,
              spread: 60,
              origin: { y: 0.8 },
            });
            setActivityLogs((logs) => [
              {
                id: `log-act-${Date.now()}`,
                timestamp: 'Just now',
                type: 'task_complete',
                title: 'Operational Task Completed',
                description: `"${item.title.slice(0, 40)}..." marked resolved.`,
              },
              ...logs,
            ]);
          }
          return {
            ...item,
            is_completed: nextState,
            completed_at: nextState ? new Date().toISOString() : null,
          };
        }
        return item;
      })
    );
  };

  const addActionItem = (item: Omit<ActionItem, 'id' | 'created_at' | 'store_id'>) => {
    const newItem: ActionItem = {
      ...item,
      id: `act-manual-${Date.now()}`,
      store_id: activeStore.id,
      created_at: new Date().toISOString(),
    };
    setActionItems((prev) => [newItem, ...prev]);
  };

  const dismissAlert = (id: string) => {
    setSentimentAlerts((prev) =>
      prev.map((al) => (al.id === id ? { ...al, is_dismissed: true } : al))
    );
  };

  const updateStore = (updated: StorePersona) => {
    setStores((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const createStore = (newStoreData: Omit<StorePersona, 'id' | 'created_at' | 'updated_at'>) => {
    const newStore: StorePersona = {
      ...newStoreData,
      id: `store-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStores((prev) => [...prev, newStore]);
    setActiveStoreId(newStore.id);
  };

  return (
    <StoreContext.Provider
      value={{
        stores,
        activeStore,
        setActiveStore: (s) => setActiveStoreId(s.id),
        updateStore,
        createStore,
        reviews: currentStoreReviews,
        addReviews,
        actionItems: currentStoreActions,
        toggleActionCompleted,
        addActionItem,
        sentimentAlerts: currentStoreAlerts,
        dismissAlert,
        activityLogs,
        metrics,
        isAnalyzing,
        activeTab,
        setActiveTab,
        reanalyzeAllReviews,
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
