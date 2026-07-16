#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DEFAULT_APP_PORT=48185

port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltn "( sport = :$port )" | tail -n +2 | grep -q .
    return $?
  fi

  return 1
}

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

APP_PORT="${APP_PORT:-$DEFAULT_APP_PORT}"
if port_in_use "$APP_PORT"; then
  echo "Port $APP_PORT is still busy. Stop the conflicting service or choose a different APP_PORT and update nginx to match."
  exit 1
fi

export APP_PORT
echo "Using host port $APP_PORT"

echo "Building production image..."
if [ "${FORCE_REBUILD:-0}" = "1" ]; then
  "${COMPOSE_CMD[@]}" build --no-cache
else
  "${COMPOSE_CMD[@]}" build
fi

echo "Starting services..."
"${COMPOSE_CMD[@]}" up -d

echo "Deployment complete."
"${COMPOSE_CMD[@]}" ps
