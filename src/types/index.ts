export type PriceTier = 'budget' | 'mid_tier' | 'luxury';
export type SentimentLabel = 'positive' | 'neutral' | 'negative';
export type PriorityLevel = 'critical' | 'medium' | 'low';
export type AlertSeverity = 'high' | 'medium' | 'info';
export type ActionCategory =
  | 'Catalog & Sizing'
  | 'Quality & Manufacturing'
  | 'Packaging & Care'
  | 'Customer Care'
  | 'Sizing / Catalog'
  | 'Manufacturing'
  | 'Packaging'
  | 'Photography'
  | 'Customer Support';
export type ReviewSource = 'Storefront' | 'Marketplace' | 'Direct';

export interface StorePersona {
  id: string;
  name: string;
  category: string;
  target_demographic: string;
  price_tier: PriceTier;
  brand_tone: string;
  acceptable_variations: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  store_id: string;
  source_platform: ReviewSource;
  external_review_id?: string;
  product_name: string;
  product_sku?: string;
  rating: number; // 1 to 5
  review_title?: string;
  review_text: string;
  review_date: string;
  
  // AI Telemetry
  is_noise?: boolean;
  noise_reason?: string | null;
  sentiment_score?: number; // -1.00 to +1.00
  sentiment_label?: SentimentLabel;
  primary_attribute?: 'sizing' | 'fabric' | 'stitching' | 'color' | 'value' | 'service';
  key_phrases?: string[];
  created_at?: string;
}

export interface ActionItem {
  id: string;
  store_id: string;
  title: string;
  description: string;
  category: ActionCategory;
  priority: PriorityLevel;
  estimated_impact: string;
  is_completed: boolean;
  completed_at?: string | null;
  evidence_review_ids?: string[];
  created_at: string;
}

export interface SentimentAlert {
  id: string;
  store_id: string;
  attribute: string;
  severity: AlertSeverity;
  percentage_surge: number;
  message: string;
  is_dismissed: boolean;
  created_at: string;
}

export interface CustomerReply {
  id: string;
  review_id: string;
  store_id: string;
  drafted_reply: string;
  tone_applied: string;
  copied_to_clipboard: boolean;
  created_at: string;
}

export interface DashboardMetrics {
  netSentimentScore: number;
  totalReviews: number;
  noiseReviewsCount: number;
  noisePercentage: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  pendingTasksCount: number;
  criticalAlertsCount: number;
  averageRating: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'ingest' | 'filter' | 'task_complete' | 'alert_generated';
  title: string;
  description: string;
}

export interface GeminiAnalysisResult {
  analyzed_reviews: {
    review_id: string;
    is_noise: boolean;
    noise_reason: string | null;
    sentiment_score: number;
    sentiment_label: SentimentLabel;
    primary_attribute: 'sizing' | 'fabric' | 'stitching' | 'color' | 'value' | 'service';
    key_phrases: string[];
  }[];
  action_items: {
    title: string;
    description: string;
    category: ActionCategory;
    priority: PriorityLevel;
    estimated_impact: string;
  }[];
  sentiment_alerts: {
    attribute: string;
    severity: AlertSeverity;
    percentage_surge: number;
    message: string;
  }[];
}
