#!/usr/bin/env bash
set -euo pipefail

echo "Installing workspace dependencies..."
npm ci

echo "Preparing local environment..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

if [ ! -f apps/api/.env ]; then
  cp apps/api/.env.example apps/api/.env
  echo "Created apps/api/.env from apps/api/.env.example"
fi

echo "Done. Start API with: npm run api:dev"
echo "Start mobile with: npm run start"
