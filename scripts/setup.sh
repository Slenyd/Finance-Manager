#!/bin/bash

echo "Setting up Coin Toss..."

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
cd ..

# Install frontend dependencies
cd frontend
npm install
cp .env.example .env
cd ..

echo ""
echo "Setup complete!"
echo ""
echo "Start development:"
echo "  npm run dev"
echo ""
echo "Default accounts:"
echo "  Admin: admin@cointoss.app / Password123"
echo "  User:  user@cointoss.app / Password123"
