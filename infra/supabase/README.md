# Supabase Infrastructure

## Structure

- `config.toml` - local supabase project config
- `migrations/` - SQL migrations
- `seeds/seed.sql` - initial catalog/ledger seed data

## Environment

Paste public Expo/mobile values into the root `.env.local` file:

```sh
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_publishable_key
```

Paste server-only values into `apps/api/.env.local`:

```sh
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=your_supabase_secret_key
SUPABASE_PROJECT_ID=your-project-ref
```

Keep the secret key server-only. If your project still uses the legacy service
role JWT, you can set `SUPABASE_SERVICE_ROLE_KEY` instead. Do not add either
server-side key to any `EXPO_PUBLIC_*` variable because Expo public variables
are bundled into the mobile app.

## Commands

- Check env: `npm run supabase:env`
- Start local Supabase: `npm run supabase:start`
- Stop local Supabase: `npm run supabase:stop`
- Show local Supabase status: `npm run supabase:status`
- Reset local DB: `npm run supabase:reset`
- Generate types: `npm run supabase:types`
