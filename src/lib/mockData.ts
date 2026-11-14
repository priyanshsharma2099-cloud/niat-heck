import { StorePersona, Review, ActionItem, SentimentAlert, ActivityLog } from '../types';

export const INITIAL_STORES: StorePersona[] = [
  {
    id: 'store-apparel',
    name: 'Apparel & Lifestyle',
    category: 'Fashion & Everyday Wear',
    target_demographic: 'Shoppers looking for breathable, high-comfort fabrics',
    price_tier: 'mid_tier',
    brand_tone: 'Thoughtful, modern, and resolution-oriented',
    acceptable_variations: 'Natural fabric weave textures and unbleached cotton flecks',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'store-home',
    name: 'Home & Essentials',
    category: 'Daily Living & Ceramics',
    target_demographic: 'Urban dwellers seeking functional minimalist goods',
    price_tier: 'mid_tier',
    brand_tone: 'Warm, minimalist, and proactive',
    acceptable_variations: 'Minor organic ceramic glaze variations',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-001',
    store_id: 'store-apparel',
    source_platform: 'Storefront',
    product_name: 'Organic Cotton Crewneck',
    product_sku: 'OCC-IND-M',
    rating: 2,
    review_title: 'Bodice fits well but tight sleeves',
    review_text: 'The bodice fits well, but the tight sleeves pinch around the upper arm when lifting.',
    review_date: new Date(Date.now() - 1 * 86400000).toISOString(),
    is_noise: false,
    sentiment_score: -0.65,
    sentiment_label: 'negative',
    primary_attribute: 'sizing',
    key_phrases: ['tight sleeves', 'upper arm pinch', 'size M fit'],
  },
  {
    id: 'rev-002',
    store_id: 'store-apparel',
    source_platform: 'Storefront',
    product_name: 'Organic Cotton Crewneck',
    product_sku: 'OCC-IND-L',
    rating: 5,
    review_title: 'Breathable soft cotton feels effortless',
    review_text: 'The breathable soft cotton feels effortless all day in warm weather — already ordered two more colors.',
    review_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    is_noise: false,
    sentiment_score: 0.95,
    sentiment_label: 'positive',
    primary_attribute: 'fabric',
    key_phrases: ['soft cotton', 'breathable', 'ordered two more'],
  },
  {
    id: 'rev-003',
    store_id: 'store-apparel',
    source_platform: 'Marketplace',
    product_name: 'Organic Cotton Crewneck',
    product_sku: 'OCC-IND-S',
    rating: 5,
    review_title: 'Fast dispatch and clean presentation',
    review_text: 'Arrived in 36 hours neatly folded with zero creases right before the weekend.',
    review_date: new Date(Date.now() - 3 * 86400000).toISOString(),
    is_noise: false,
    sentiment_score: 0.9,
    sentiment_label: 'positive',
    primary_attribute: 'service',
    key_phrases: ['fast delivery', 'neatly folded', 'zero creases'],
  },
  {
    id: 'rev-004',
    store_id: 'store-apparel',
    source_platform: 'Direct',
    product_name: 'Organic Cotton Crewneck',
    product_sku: 'OCC-IND-M',
    rating: 2,
    review_title: 'Color fading after initial cold wash',
    review_text: 'Noticeable color fading on the collar trim after a gentle hand wash.',
    review_date: new Date(Date.now() - 4 * 86400000).toISOString(),
    is_noise: false,
    sentiment_score: -0.85,
    sentiment_label: 'negative',
    primary_attribute: 'color',
    key_phrases: ['color fading', 'collar trim', 'first wash'],
  }
];

export const INITIAL_ACTION_ITEMS: ActionItem[] = [
  {
    id: 'act-001',
    store_id: 'store-apparel',
    title: 'Add +1.5 cm armhole allowance on Crewneck M & L pattern cuts',
    description: 'Addresses 64% of recent sizing return inquiries',
    category: 'Catalog & Sizing',
    priority: 'critical',
    estimated_impact: 'Addresses 64% of recent sizing returns',
    is_completed: false,
    completed_at: null,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'act-002',
    store_id: 'store-apparel',
    title: 'Include a cold-wash care card & pre-wash dye-fix note in packaging',
    description: 'Prevents first-wash color fading and trim wear complaints',
    category: 'Packaging & Care',
    priority: 'critical',
    estimated_impact: 'Prevents first-wash color fading complaints',
    is_completed: false,
    completed_at: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'act-003',
    store_id: 'store-apparel',
    title: 'Send automated 48-hour fit check with free 1-click sleeve exchange',
    description: 'Intercepts 1-star reviews before public posting',
    category: 'Customer Care',
    priority: 'medium',
    estimated_impact: 'Intercepts 1-star reviews before public posting',
    is_completed: false,
    completed_at: null,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  }
];

export const INITIAL_SENTIMENT_ALERTS: SentimentAlert[] = [
  {
    id: 'alt-001',
    store_id: 'store-apparel',
    attribute: 'tight sleeves',
    severity: 'high',
    percentage_surge: 38.5,
    message: "Feedback dip detected this week — Leading causes: 'tight sleeves' & 'color fading'",
    is_dismissed: false,
    created_at: new Date(Date.now() - 18 * 3600000).toISOString(),
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-001',
    timestamp: 'Just now',
    type: 'ingest',
    title: 'Scanned 160 reviews',
    description: 'Scanned 160 reviews for Apparel & Lifestyle.',
  },
  {
    id: 'log-002',
    timestamp: '10m ago',
    type: 'alert_generated',
    title: "Flagged 'tight sleeves' surge",
    description: "Sizing pattern alert triggered on M & L sizes.",
  },
  {
    id: 'log-003',
    timestamp: 'Today',
    type: 'alert_generated',
    title: 'Return velocity alert',
    description: 'Negative feedback velocity exceeded threshold.',
  }
];
