#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "Running database seed..."
  node dist/prisma/seed.js
fi

echo "Starting application..."
exec "$@"
