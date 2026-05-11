insert into public.ledger_accounts (code, name, account_type)
values
  ('wallet_user', 'User Wallet Credits', 'liability'),
  ('promo_rewards', 'Promotional Rewards', 'expense'),
  ('redeem_holds', 'Redemption Holds', 'liability')
on conflict (code) do nothing;

insert into public.offers (id, title, category, payout_usd, payout_credits, active, metadata)
values
  ('brand-pulse', 'Brand Pulse Survey', 'survey', 2.20, 220, true, '{"availability":"Hot","timeEstimate":"~6 min"}'::jsonb),
  ('snack-opinion', 'Snack Opinion', 'survey', 0.70, 70, true, '{"availability":"New","timeEstimate":"~2 min"}'::jsonb),
  ('offer-streak', 'Offer Streak Bonus', 'bundle', 5.00, 500, true, '{"availability":"Limited","timeEstimate":"~12 min"}'::jsonb)
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  payout_usd = excluded.payout_usd,
  payout_credits = excluded.payout_credits,
  active = excluded.active,
  metadata = excluded.metadata;
