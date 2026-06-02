#!/usr/bin/env bash
#
# Production deploy: build the Next.js app, then restart the PM2 process.
#
# In production, `next start` serves the compiled build in .next/ — source
# changes are NOT live until you rebuild. This script enforces build-then-restart
# so code changes always reach production.
#
# Usage:
#   ./scripts/deploy.sh            # build + restart
#   ./scripts/deploy.sh --pull     # git pull first, then build + restart
#
set -euo pipefail

PM2_APP="korvia-app"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_DIR"

if [[ "${1:-}" == "--pull" ]]; then
  echo "==> git pull"
  git pull --ff-only
fi

echo "==> npm run build"
npm run build

echo "==> pm2 restart ${PM2_APP}"
pm2 restart "$PM2_APP" --update-env

echo "==> deploy complete"
pm2 describe "$PM2_APP" | grep -E "status|uptime|restarts" | head -3
