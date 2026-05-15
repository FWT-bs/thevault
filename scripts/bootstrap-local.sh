#!/usr/bin/env bash
set -euo pipefail

echo "Installing workspace dependencies..."
npm ci

echo "Preparing local environment..."
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example"
fi

if [ ! -f apps/api/.env.local ]; then
  cp apps/api/.env.example apps/api/.env.local
  echo "Created apps/api/.env.local from apps/api/.env.example"
fi

echo "Done. Start API with: npm run api:dev"
echo "Start mobile with: npm run start"
