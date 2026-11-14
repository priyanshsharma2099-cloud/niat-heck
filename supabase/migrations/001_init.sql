-- ==============================================================================
-- CLUEY CART: PRODUCTION SUPABASE MIGRATION (001_init.sql)
-- Multi-Tenant Store Personas, Reviews, Action Tasks, Trend Alerts, and Activity Logs
-- ==============================================================================

-- 1. Enable Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. Store Personas Table
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  platform text not null default 'Shopify' check (platform in ('Shopify', 'Meesho', 'Amazon', 'Custom')),
  category text not null,
  target_demographic text not null,
  brand_tone text not null default 'Warm Boutique' check (brand_tone in ('Warm Boutique', 'Crisp Professional', 'Friendly Casual')),
  focus_keywords text[] default '{}',
  ignore_keywords text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Customer Reviews Table (with Niche AI Telemetry)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  batch_id uuid,
  author text default 'Verified Customer',
  product_name text not null,
  rating smallint check (rating between 1 and 5) not null,
  raw_text text not null,
  source_platform text default 'Storefront',
  
  -- AI Telemetry
  is_noise boolean default false,
  noise_reason text,
  sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  sentiment_score numeric(4,2) default 0.00,
  niche_relevance smallint default 80 check (niche_relevance between 0 and 100),
  topics text[] default '{}',
  ai_summary text,
  drafted_reply text,
  reply_status text default 'pending' check (reply_status in ('pending', 'drafted', 'copied')),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  analyzed_at timestamp with time zone
);

-- 4. Weekly Action Tasks Table
create table if not exists public.action_tasks (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  batch_id uuid,
  title text not null,
  description text,
  priority text check (priority in ('high', 'medium', 'low')) default 'medium',
  category text default 'Manufacturing',
  impact_estimate text,
  evidence_quote text,
  related_review_ids uuid[] default '{}',
  completed boolean default false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Smart Sentiment Trend Alerts Table
create table if not exists public.trend_alerts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  topic text not null,
  severity text check (severity in ('critical', 'warning', 'info')) default 'warning',
  negative_count integer default 0,
  delta_percent numeric(5,1) default 0.0,
  summary text not null,
  acknowledged boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Chronological Activity Logs Table
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  type text not null check (type in ('import', 'analyze', 'alert', 'draft_reply', 'copy_reply', 'task_complete', 'persona_edit', 'pdf_export')),
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. High-Performance Query Indexes
create index if not exists idx_stores_user_id on public.stores(user_id);
create index if not exists idx_reviews_store_created on public.reviews(store_id, created_at desc);
create index if not exists idx_tasks_store_created on public.action_tasks(store_id, created_at desc);
create index if not exists idx_alerts_store_created on public.trend_alerts(store_id, created_at desc);
create index if not exists idx_logs_store_created on public.activity_logs(store_id, created_at desc);

-- 8. Enable Row-Level Security (RLS)
alter table public.stores enable row level security;
alter table public.reviews enable row level security;
alter table public.action_tasks enable row level security;
alter table public.trend_alerts enable row level security;
alter table public.activity_logs enable row level security;

-- 9. Strict Isolation RLS Policies
-- Stores: Users can only see & manage their own stores
create policy "Users can view own stores" on public.stores
  for select using (auth.uid() = user_id);

create policy "Users can insert own stores" on public.stores
  for insert with check (auth.uid() = user_id);

create policy "Users can update own stores" on public.stores
  for update using (auth.uid() = user_id);

create policy "Users can delete own stores" on public.stores
  for delete using (auth.uid() = user_id);

-- Child tables: verified against parent store ownership
create policy "Users can view reviews of own stores" on public.reviews
  for select using (exists (select 1 from public.stores s where s.id = store_id and s.user_id = auth.uid()));

create policy "Users can manage reviews of own stores" on public.reviews
  for all using (exists (select 1 from public.stores s where s.id = store_id and s.user_id = auth.uid()));

create policy "Users can view tasks of own stores" on public.action_tasks
  for select using (exists (select 1 from public.stores s where s.id = store_id and s.user_id = auth.uid()));

create policy "Users can manage tasks of own stores" on public.action_tasks
  for all using (exists (select 1 from public.stores s where s.id = store_id and s.user_id = auth.uid()));

create policy "Users can view alerts of own stores" on public.trend_alerts
  for select using (exists (select 1 from public.stores s where s.id = store_id and s.user_id = auth.uid()));

create policy "Users can manage alerts of own stores" on public.trend_alerts
  for all using (exists (select 1 from public.stores s where s.id = store_id and s.user_id = auth.uid()));

create policy "Users can view activity logs of own stores" on public.activity_logs
  for select using (exists (select 1 from public.stores s where s.id = store_id and s.user_id = auth.uid()));

create policy "Users can insert activity logs of own stores" on public.activity_logs
  for insert with check (exists (select 1 from public.stores s where s.id = store_id and s.user_id = auth.uid()));
