#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Pulling latest changes..."
git pull --ff-only origin main

echo "Stopping any running stack..."
docker compose down || true

echo "Building production image..."
docker compose build --no-cache

echo "Starting services..."
docker compose up -d

echo "Deployment complete."
docker compose ps
