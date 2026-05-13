# The Vault API (Vercel Route Scaffold)

## Environment

Create `apps/api/.env.local` from `apps/api/.env.example`, then paste:

```sh
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=your_supabase_secret_key
SUPABASE_PROJECT_ID=your-project-ref
```

`SUPABASE_SECRET_KEY` is intentionally server-only. If your project still uses
the legacy service role JWT, you can set `SUPABASE_SERVICE_ROLE_KEY` instead.
The Expo app should use `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the root
`.env.local` file.

## Key routes

- `GET /api/auth/me`
- `GET /api/catalog`
- `GET /api/wallet/balance`
- `GET /api/wallet/transactions`
- `GET /api/vault-level/status`
- `GET /api/streak/summary`
- `POST /api/streak/claim`
- `POST /api/redemption/create`
- `GET /api/redemption/list`
- `GET|POST /api/payment-methods`
- `GET /api/ledger/timeline`
- `POST /api/gameplay/start`
- `POST /api/gameplay/complete`
- `POST /api/offers/attribution`
- `POST /api/offers/completion`
- `POST /api/risk/evaluate`
- `GET /api/risk/reviews`
- `POST /api/notifications/streak-reminder`
- `GET /api/admin/summary`
- `POST /api/monetization/ad-decision`
- `POST /api/monetization/rewarded-grant`
- `POST /api/monetization/payout-guardrails`
- `GET /api/compliance/status`
- `POST /api/audit/append`
- `GET /api/audit/list`
