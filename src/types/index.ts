// ==============================================================================
// CLUEY CART: CORE TYPESCRIPT DATA CONTRACTS & SCHEMAS
// ==============================================================================

export type StorePlatform = 'Shopify' | 'Meesho' | 'Amazon' | 'Custom';
export type BrandTone = 'Warm Boutique' | 'Crisp Professional' | 'Friendly Casual';
export type SentimentType = 'positive' | 'neutral' | 'negative';
export type TaskPriority = 'high' | 'medium' | 'low';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type ReplyStatus = 'pending' | 'drafted' | 'copied';
export type ActivityType =
  | 'import'
  | 'analyze'
  | 'alert'
  | 'draft_reply'
  | 'copy_reply'
  | 'task_complete'
  | 'persona_edit'
  | 'pdf_export';

/**
 * 1. Store Persona Model
 */
export interface Store {
  id: string;
  user_id: string;
  name: string;
  platform: StorePlatform;
  category: string;
  target_demographic: string;
  brand_tone: BrandTone;
  focus_keywords: string[];
  ignore_keywords: string[];
  created_at: string;
  updated_at: string;
}

export type StorePersona = Store;
export type StorePersonaInput = Omit<Store, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

/**
 * 2. Ingested & Evaluated Customer Review
 */
export interface Review {
  id: string;
  store_id: string;
  batch_id?: string;
  author: string;
  product_name: string;
  rating: number; // 1 to 5
  raw_text: string;
  source_platform: string;

  // AI Telemetry
  is_noise: boolean;
  noise_reason?: string | null;
  sentiment: SentimentType;
  sentiment_score: number; // -1.0 to +1.0
  niche_relevance: number; // 0 to 100
  topics: string[];
  ai_summary?: string | null;
  drafted_reply?: string | null;
  reply_status: ReplyStatus;

  created_at: string;
  analyzed_at?: string | null;
}

/**
 * 3. Weekly Action Checklist Task
 */
export interface ActionTask {
  id: string;
  store_id: string;
  batch_id?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  category: string;
  impact_estimate?: string;
  evidence_quote?: string;
  related_review_ids: string[];
  completed: boolean;
  completed_at?: string | null;
  created_at: string;
}

export type ActionItem = ActionTask;

/**
 * 4. Smart Sentiment Trend Spike Alert
 */
export interface TrendAlert {
  id: string;
  store_id: string;
  topic: string;
  severity: AlertSeverity;
  negative_count: number;
  delta_percent: number;
  summary: string;
  acknowledged: boolean;
  created_at: string;
}

export type SentimentAlert = TrendAlert;

/**
 * 5. Real-Time Activity Log
 */
export interface ActivityLog {
  id: string;
  store_id: string;
  type: ActivityType;
  message: string;
  created_at: string;
}

/**
 * 6. Dashboard Analytics Aggregations
 */
export interface DashboardMetrics {
  signalKeptPercent: number; // % non-noise
  positivePercent: number; // % positive among signal
  noiseFilteredCount: number;
  openTasksCount: number;
  totalReviews: number;
  averageRating: number;
}

export interface DashboardTimelineItem {
  date: string;
  positiveSignal: number;
  negativeSignal: number;
  filteredNoise: number;
}

export interface KeywordStat {
  keyword: string;
  mentions: number;
  sentiment: 'positive' | 'negative';
  evidenceQuote: string;
  author: string;
  reviewId?: string;
}

export interface DashboardResponse {
  store: Store;
  metrics: DashboardMetrics;
  timeline: DashboardTimelineItem[];
  keywordStats: KeywordStat[];
  activeAlert: TrendAlert | null;
  recentTasks: ActionTask[];
  recentActivity: ActivityLog[];
}

/**
 * 7. Server-side Gemini AI Structured Outputs
 */
export interface GeminiReviewAnalysis {
  is_noise: boolean;
  noise_reason: string | null;
  sentiment: SentimentType;
  sentiment_score: number;
  niche_relevance: number;
  topics: string[];
  ai_summary: string;
}

export interface GeminiTaskRecommendation {
  title: string;
  description: string;
  priority: TaskPriority;
  category: string;
  impact_estimate: string;
  evidence_quote: string;
}

export interface GeminiAlertDetection {
  topic: string;
  severity: AlertSeverity;
  negative_count: number;
  delta_percent: number;
  summary: string;
}

export interface GeminiBatchAnalysisResult {
  analyzed_reviews: (GeminiReviewAnalysis & { review_index: number })[];
  recommended_tasks: GeminiTaskRecommendation[];
  detected_alert: GeminiAlertDetection | null;
}
