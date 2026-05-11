create extension if not exists "pgcrypto";

create type public.ledger_entry_kind as enum ('credit', 'debit', 'hold', 'release', 'adjustment');
create type public.redemption_status as enum ('created', 'review', 'processing', 'paid', 'failed');
create type public.risk_level as enum ('allow', 'review', 'block');

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Player',
  phone text,
  tier text not null default 'bronze',
  kyc_status text not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_fingerprint text not null,
  platform text not null,
  trusted boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credits_balance bigint not null default 0,
  usd_balance numeric(12,2) not null default 0,
  fx_cr_per_usd integer not null default 100,
  updated_at timestamptz not null default now()
);

create table if not exists public.ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  account_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.ledger_entry_kind not null,
  amount_credits bigint not null,
  amount_usd numeric(12,2) not null default 0,
  title text not null,
  detail text not null default '',
  source_type text not null,
  source_id text,
  idempotency_key text,
  created_at timestamptz not null default now()
);

create index if not exists ledger_entries_user_created_idx on public.ledger_entries (user_id, created_at desc);
create unique index if not exists ledger_entries_user_idempotency_idx
  on public.ledger_entries (user_id, idempotency_key)
  where idempotency_key is not null;

create table if not exists public.ledger_postings (
  id uuid primary key default gen_random_uuid(),
  ledger_entry_id uuid not null references public.ledger_entries(id) on delete cascade,
  ledger_account_id uuid not null references public.ledger_accounts(id) on delete restrict,
  direction text not null check (direction in ('dr', 'cr')),
  amount_credits bigint not null default 0,
  amount_usd numeric(12,2) not null default 0
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  mode_id text not null,
  state text not null default 'started',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null references public.game_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer,
  won boolean,
  rewards_credits bigint not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.streak_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_days integer not null default 0,
  best_days integer not null default 0,
  bonus_percent integer not null default 0,
  last_claimed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.streak_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_date date not null,
  awarded_credits integer not null default 0,
  idempotency_key text,
  created_at timestamptz not null default now(),
  unique(user_id, claim_date)
);

create unique index if not exists streak_claims_user_idempotency_idx
  on public.streak_claims (user_id, idempotency_key)
  where idempotency_key is not null;

create table if not exists public.offers (
  id text primary key,
  title text not null,
  category text not null,
  payout_usd numeric(10,2) not null,
  payout_credits integer not null,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.offer_events (
  id uuid primary key default gen_random_uuid(),
  offer_id text not null references public.offers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  provider_ref text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.offer_completions (
  id uuid primary key default gen_random_uuid(),
  offer_id text not null references public.offers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_ref text not null,
  awarded_credits integer not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique(offer_id, provider_ref)
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  method_type text not null,
  destination_masked text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.redemption_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  method_type text not null,
  amount_usd numeric(12,2) not null,
  credits_debited bigint not null,
  destination_masked text not null,
  status public.redemption_status not null default 'created',
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists redemption_requests_user_idempotency_idx
  on public.redemption_requests (user_id, idempotency_key)
  where idempotency_key is not null;

create table if not exists public.redemption_attempts (
  id uuid primary key default gen_random_uuid(),
  redemption_request_id uuid not null references public.redemption_requests(id) on delete cascade,
  provider_name text not null,
  provider_ref text,
  status text not null,
  response_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.payout_events (
  id uuid primary key default gen_random_uuid(),
  redemption_request_id uuid not null references public.redemption_requests(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.risk_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rule_code text not null,
  level public.risk_level not null,
  reason text not null,
  related_entity_type text,
  related_entity_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.risk_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  risk_flag_id uuid references public.risk_flags(id) on delete set null,
  status text not null default 'open',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null,
  key text not null,
  response_hash text,
  created_at timestamptz not null default now(),
  unique(user_id, scope, key)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.devices enable row level security;
alter table public.wallets enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_results enable row level security;
alter table public.streak_profiles enable row level security;
alter table public.streak_claims enable row level security;
alter table public.offer_events enable row level security;
alter table public.offer_completions enable row level security;
alter table public.payment_methods enable row level security;
alter table public.redemption_requests enable row level security;
alter table public.redemption_attempts enable row level security;
alter table public.payout_events enable row level security;
alter table public.risk_flags enable row level security;
alter table public.risk_reviews enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_read_own" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);

create policy "devices_read_own" on public.devices
  for select using (auth.uid() = user_id);

create policy "wallets_read_own" on public.wallets
  for select using (auth.uid() = user_id);

create policy "ledger_entries_read_own" on public.ledger_entries
  for select using (auth.uid() = user_id);

create policy "game_sessions_read_own" on public.game_sessions
  for select using (auth.uid() = user_id);

create policy "game_results_read_own" on public.game_results
  for select using (auth.uid() = user_id);

create policy "streak_profiles_read_own" on public.streak_profiles
  for select using (auth.uid() = user_id);

create policy "streak_claims_read_own" on public.streak_claims
  for select using (auth.uid() = user_id);

create policy "offer_events_read_own" on public.offer_events
  for select using (auth.uid() = user_id);

create policy "offer_completions_read_own" on public.offer_completions
  for select using (auth.uid() = user_id);

create policy "payment_methods_read_own" on public.payment_methods
  for select using (auth.uid() = user_id);

create policy "redemption_requests_read_own" on public.redemption_requests
  for select using (auth.uid() = user_id);

create policy "redemption_attempts_read_own" on public.redemption_attempts
  for select using (
    exists (
      select 1 from public.redemption_requests rr
      where rr.id = redemption_attempts.redemption_request_id and rr.user_id = auth.uid()
    )
  );

create policy "payout_events_read_own" on public.payout_events
  for select using (
    exists (
      select 1 from public.redemption_requests rr
      where rr.id = payout_events.redemption_request_id and rr.user_id = auth.uid()
    )
  );

create policy "risk_flags_read_own" on public.risk_flags
  for select using (auth.uid() = user_id);

create policy "risk_reviews_read_own" on public.risk_reviews
  for select using (auth.uid() = user_id);

create policy "idempotency_keys_read_own" on public.idempotency_keys
  for select using (auth.uid() = user_id);

create policy "audit_logs_read_own" on public.audit_logs
  for select using (actor_user_id = auth.uid());
