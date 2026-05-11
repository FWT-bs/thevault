alter table public.profiles
  alter column tier set default 'starter';

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (user_id, display_name, phone, tier, kyc_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', 'Player'),
    new.phone,
    'starter',
    'none'
  )
  on conflict (user_id) do nothing;

  insert into public.wallets (
    user_id,
    credits_balance,
    usd_balance,
    fx_cr_per_usd,
    available_credits,
    pending_credits,
    locked_credits,
    lifetime_generated_usd,
    lifetime_earned_usd,
    current_share_bps
  )
  values (new.id, 0, 0, 100, 0, 0, 0, 0, 0, 3000)
  on conflict (user_id) do nothing;

  insert into public.streak_profiles (
    user_id,
    current_days,
    best_days,
    bonus_percent,
    last_claimed_at
  )
  values (new.id, 0, 0, 0, null)
  on conflict (user_id) do nothing;

  insert into public.user_tiers (
    user_id,
    current_tier,
    revenue_share_bps,
    lifetime_verified_ads,
    active_days,
    clean_activity_days,
    successful_redemptions,
    trust_score,
    ads_watched_today,
    earnings_today_usd
  )
  values (new.id, 'starter', 3000, 0, 0, 0, 0, 50, 0, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_vault_defaults on auth.users;

create trigger on_auth_user_created_vault_defaults
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

insert into public.profiles (user_id, display_name, phone, tier, kyc_status)
select
  id,
  coalesce(raw_user_meta_data->>'display_name', raw_user_meta_data->>'full_name', 'Player'),
  phone,
  'starter',
  'none'
from auth.users
on conflict (user_id) do nothing;

insert into public.wallets (
  user_id,
  credits_balance,
  usd_balance,
  fx_cr_per_usd,
  available_credits,
  pending_credits,
  locked_credits,
  lifetime_generated_usd,
  lifetime_earned_usd,
  current_share_bps
)
select id, 0, 0, 100, 0, 0, 0, 0, 0, 3000
from auth.users
on conflict (user_id) do nothing;

insert into public.streak_profiles (
  user_id,
  current_days,
  best_days,
  bonus_percent,
  last_claimed_at
)
select id, 0, 0, 0, null
from auth.users
on conflict (user_id) do nothing;

insert into public.user_tiers (
  user_id,
  current_tier,
  revenue_share_bps,
  lifetime_verified_ads,
  active_days,
  clean_activity_days,
  successful_redemptions,
  trust_score,
  ads_watched_today,
  earnings_today_usd
)
select id, 'starter', 3000, 0, 0, 0, 0, 50, 0, 0
from auth.users
on conflict (user_id) do nothing;
