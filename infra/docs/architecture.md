# The Vault Platform Architecture

## Runtime split

- Mobile client: Expo Router app at repo root
- API orchestration: Vercel Node routes in `apps/api/api`
- Data platform: Supabase Postgres + RLS schema in `infra/supabase/migrations`

## Domain modules

- auth
- catalog
- wallet
- ledger
- streak
- gameplay
- redemption
- payment methods
- risk
- offers
- notifications
- admin
- monetization
- vault level and revenue share
- compliance
- audit

## Financial controls scaffolded

- idempotency keys for mutating operations
- audit log append/list endpoints
- risk evaluation and review queue
- payout guardrails endpoint
- dynamic tier model with revenue-share basis points
- ad rewards recorded as estimated/pending before verification
- wallet balances split into available, pending, and locked funds
