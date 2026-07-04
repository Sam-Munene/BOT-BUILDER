#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
elif docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
else
  echo "Docker Compose is not available. Install docker-compose or the Docker Compose plugin."
  exit 1
fi

echo "Pulling latest changes..."
git pull --ff-only origin main

echo "Stopping any running stack..."
"${COMPOSE_CMD[@]}" down || true

echo "Building production image..."
"${COMPOSE_CMD[@]}" build --no-cache

echo "Starting services..."
"${COMPOSE_CMD[@]}" up -d

echo "Deployment complete."
"${COMPOSE_CMD[@]}" ps
