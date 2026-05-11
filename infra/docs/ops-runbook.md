# The Vault Ops Runbook (Scaffold)

## Local bootstrap

1. `npm ci`
2. Configure `.env` from `.env.example`
3. Start API route runtime (or Vercel dev): `npm run api:dev`
4. Start mobile: `npm run start`

## Supabase migration workflow

- Migrations live in `infra/supabase/migrations`
- Seed script: `infra/supabase/seeds/seed.sql`
- Reset DB: `npm run supabase:reset`
- Generate typed schema placeholders: `npm run supabase:types`

## Smoke tests

- API smoke script: `npm --prefix apps/api run smoke`
- Verifies auth, catalog, wallet, streak, and redemption paths.

## Incident checklist

- Check `/api/admin/summary`
- Inspect `/api/risk/reviews?scope=all`
- Pull user audit timeline from `/api/audit/list` using `x-user-id`
