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

pick_port() {
  local requested_port="${APP_PORT:-}"
  local candidates=()
  local offset

  if [ -n "$requested_port" ]; then
    candidates+=("$requested_port")
  fi

  for offset in 0 1 2 3 4 5; do
    candidates+=("$((DEFAULT_APP_PORT + offset))")
  done

  local port
  for port in "${candidates[@]}"; do
    if ! port_in_use "$port"; then
      echo "$port"
      return 0
    fi
  done

  return 1
}

SELECTED_APP_PORT="$(pick_port)" || {
  echo "No free port found for bot-builder."
  exit 1
}

export APP_PORT="$SELECTED_APP_PORT"
echo "Using host port $APP_PORT"

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
if [ "${FORCE_REBUILD:-0}" = "1" ]; then
  "${COMPOSE_CMD[@]}" build --no-cache
else
  "${COMPOSE_CMD[@]}" build
fi

echo "Starting services..."
"${COMPOSE_CMD[@]}" up -d

echo "Deployment complete."
"${COMPOSE_CMD[@]}" ps
