#!/bin/bash

echo "Setting up Finance Manager..."

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
echo "  Admin: admin@financemanager.com / Password123"
echo "  User:  user@financemanager.com / Password123"
