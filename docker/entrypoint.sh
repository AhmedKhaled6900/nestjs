#!/bin/sh
set -e

echo "=== Aqar API Startup ==="
echo "NODE_ENV=${NODE_ENV:-unknown}"
echo "PORT=${PORT:-3000}"

echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "Running database seed..."
  node dist/prisma/seed.js
fi

echo "Starting application on port ${PORT:-3000}..."
exec "$@"
