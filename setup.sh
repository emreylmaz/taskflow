#!/bin/bash
echo "🚀 TaskFlow Setup"

# Backend .env
if [ ! -f packages/backend/.env ]; then
  cp packages/backend/.env.example packages/backend/.env
  JWT_SECRET=$(openssl rand -base64 32)
  JWT_REFRESH=$(openssl rand -base64 32)
  DB_PASS=$(openssl rand -hex 16)
  sed -i "s|JWT_SECRET=|JWT_SECRET=$JWT_SECRET|" packages/backend/.env
  sed -i "s|JWT_REFRESH_SECRET=|JWT_REFRESH_SECRET=$JWT_REFRESH|" packages/backend/.env
  sed -i "s|YOUR_DB_PASSWORD|$DB_PASS|" packages/backend/.env
  echo "POSTGRES_PASSWORD=$DB_PASS" > .env
  echo "✅ Secrets generated in packages/backend/.env"
else
  echo "⏭️  packages/backend/.env already exists"
fi

echo "✅ Done! Run: docker compose up -d && npm install && npm run dev"
