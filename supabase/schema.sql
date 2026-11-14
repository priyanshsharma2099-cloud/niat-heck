-- ==============================================================================
-- CLUEY CART: PRODUCTION SUPABASE POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. User Profiles Table (Linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Store Personas Table
create table if not exists public.stores (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  category text not null, -- e.g. 'Ethnic Wear', 'Sustainable Footwear', 'Handmade Jewelry'
  target_demographic text not null, -- e.g. 'Women 25-45, Festive & Wedding Shoppers'
  price_tier text check (price_tier in ('budget', 'mid_tier', 'luxury')) default 'mid_tier',
  brand_tone text default 'Humble, empathetic, and resolution-oriented',
  acceptable_variations text, -- e.g. 'Handloom fabric minor slubs; natural vegetable dye smell'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Customer Reviews Table
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) on delete cascade not null,
  source_platform text default 'shopify', -- 'shopify', 'meesho', 'amazon', 'manual_sim'
  external_review_id text,
  product_name text not null,
  product_sku text,
  rating integer check (rating >= 1 and rating <= 5) not null,
  review_title text,
  review_text text not null,
  review_date timestamp with time zone default timezone('utc'::text, now()),
  
  -- AI Telemetry & Evaluation
  is_noise boolean default false,
  noise_reason text,
  sentiment_score numeric(4,2), -- Scale: -1.00 to +1.00
  sentiment_label text check (sentiment_label in ('positive', 'neutral', 'negative')),
  primary_attribute text, -- 'sizing', 'fabric', 'stitching', 'color', 'value', 'service'
  key_phrases text[],
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Operational Action Checklist Table
create table if not exists public.action_items (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) on delete cascade not null,
  title text not null,
  description text not null,
  category text not null, -- 'Manufacturing', 'Sizing / Catalog', 'Packaging', 'Photography'
  priority text check (priority in ('critical', 'medium', 'low')) default 'medium',
  estimated_impact text, -- e.g., 'Reduces return rate by ~18%'
  is_completed boolean default false,
  completed_at timestamp with time zone,
  evidence_review_ids uuid[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Sentiment Anomaly Alerts Table
create table if not exists public.sentiment_alerts (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) on delete cascade not null,
  attribute text not null,
  severity text check (severity in ('high', 'medium', 'info')) default 'medium',
  percentage_surge numeric(5,2) not null,
  message text not null,
  is_dismissed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Drafted Customer Replies Table
create table if not exists public.customer_replies (
  id uuid default uuid_generate_v4() primary key,
  review_id uuid references public.reviews(id) on delete cascade not null,
  store_id uuid references public.stores(id) on delete cascade not null,
  drafted_reply text not null,
  tone_applied text not null,
  copied_to_clipboard boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.reviews enable row level security;
alter table public.action_items enable row level security;
alter table public.sentiment_alerts enable row level security;
alter table public.customer_replies enable row level security;

-- 9. RLS Policies
-- Profiles
create policy "Users can view own profile" 
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" 
  on public.profiles for update using (auth.uid() = id);

-- Stores
create policy "Users can view own stores" 
  on public.stores for select using (auth.uid() = owner_id);
create policy "Users can insert own stores" 
  on public.stores for insert with check (auth.uid() = owner_id);
create policy "Users can update own stores" 
  on public.stores for update using (auth.uid() = owner_id);
create policy "Users can delete own stores" 
  on public.stores for delete using (auth.uid() = owner_id);

-- Reviews
create policy "Users can view reviews for own stores" 
  on public.reviews for select using (
    exists (select 1 from public.stores where stores.id = reviews.store_id and stores.owner_id = auth.uid())
  );
create policy "Users can insert reviews for own stores" 
  on public.reviews for insert with check (
    exists (select 1 from public.stores where stores.id = reviews.store_id and stores.owner_id = auth.uid())
  );

-- Action Items
create policy "Users can manage action items for own stores" 
  on public.action_items for all using (
    exists (select 1 from public.stores where stores.id = action_items.store_id and stores.owner_id = auth.uid())
  );

-- Sentiment Alerts
create policy "Users can manage alerts for own stores" 
  on public.sentiment_alerts for all using (
    exists (select 1 from public.stores where stores.id = sentiment_alerts.store_id and stores.owner_id = auth.uid())
  );

-- Customer Replies
create policy "Users can manage customer replies for own stores" 
  on public.customer_replies for all using (
    exists (select 1 from public.stores where stores.id = customer_replies.store_id and stores.owner_id = auth.uid())
  );

-- 10. Performance Indexes
create index if not exists idx_reviews_store_id on public.reviews(store_id);
create index if not exists idx_reviews_rating on public.reviews(rating);
create index if not exists idx_reviews_sentiment on public.reviews(sentiment_label);
create index if not exists idx_action_items_store_id on public.action_items(store_id);
create index if not exists idx_sentiment_alerts_store_id on public.sentiment_alerts(store_id);

-- 11. Profile Creation Trigger on Auth Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
