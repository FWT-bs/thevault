create type public.vault_tier_id as enum ('starter', 'bronze', 'silver', 'gold', 'platinum', 'diamond');
create type public.ad_impression_status as enum ('estimated', 'verified', 'invalidated');
create type public.ad_reward_status as enum ('pending', 'confirmed', 'reversed');

alter table public.wallets
  add column if not exists available_credits bigint not null default 0,
  add column if not exists pending_credits bigint not null default 0,
  add column if not exists locked_credits bigint not null default 0,
  add column if not exists lifetime_generated_usd numeric(12,4) not null default 0,
  add column if not exists lifetime_earned_usd numeric(12,4) not null default 0,
  add column if not exists current_share_bps integer not null default 3000;

update public.wallets
set available_credits = credits_balance
where available_credits = 0 and credits_balance > 0;

create table if not exists public.user_tiers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_tier public.vault_tier_id not null default 'starter',
  revenue_share_bps integer not null default 3000 check (revenue_share_bps between 0 and 10000),
  tier_started_at timestamptz not null default now(),
  tier_expires_at timestamptz,
  lifetime_verified_ads bigint not null default 0,
  active_days integer not null default 0,
  clean_activity_days integer not null default 0,
  successful_redemptions integer not null default 0,
  trust_score integer not null default 50 check (trust_score between 0 and 100),
  ads_watched_today integer not null default 0,
  earnings_today_usd numeric(12,4) not null default 0,
  counters_reset_at date not null default current_date,
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_impressions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ad_network text not null,
  placement_id text not null,
  estimated_revenue_usd numeric(12,6) not null default 0,
  verified_revenue_usd numeric(12,6),
  currency text not null default 'USD',
  status public.ad_impression_status not null default 'estimated',
  invalidation_reason text,
  watched_at timestamptz not null default now(),
  verified_at timestamptz,
  idempotency_key text,
  unique(user_id, ad_network, idempotency_key)
);

create table if not exists public.ad_reward_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  impression_id uuid not null references public.ad_impressions(id) on delete cascade,
  revenue_share_bps integer not null check (revenue_share_bps between 0 and 10000),
  estimated_reward_usd numeric(12,6) not null default 0,
  final_reward_usd numeric(12,6),
  ledger_entry_id uuid references public.ledger_entries(id) on delete set null,
  status public.ad_reward_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, impression_id)
);

create table if not exists public.tier_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  old_tier public.vault_tier_id,
  new_tier public.vault_tier_id not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists user_tiers_tier_idx on public.user_tiers (current_tier, trust_score desc);
create index if not exists ad_impressions_user_watched_idx on public.ad_impressions (user_id, watched_at desc);
create index if not exists ad_reward_entries_user_status_idx on public.ad_reward_entries (user_id, status, created_at desc);
create index if not exists tier_events_user_created_idx on public.tier_events (user_id, created_at desc);

alter table public.user_tiers enable row level security;
alter table public.ad_impressions enable row level security;
alter table public.ad_reward_entries enable row level security;
alter table public.tier_events enable row level security;

create policy "user_tiers_read_own" on public.user_tiers
  for select using (auth.uid() = user_id);

create policy "ad_impressions_read_own" on public.ad_impressions
  for select using (auth.uid() = user_id);

create policy "ad_reward_entries_read_own" on public.ad_reward_entries
  for select using (auth.uid() = user_id);

create policy "tier_events_read_own" on public.tier_events
  for select using (auth.uid() = user_id);
