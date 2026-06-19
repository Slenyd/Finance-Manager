Write-Host "Setting up Coin Toss..." -ForegroundColor Green

# Install root dependencies
npm install

# Install backend dependencies
Set-Location backend
npm install
Copy-Item .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
Set-Location ..

# Install frontend dependencies
Set-Location frontend
npm install
Copy-Item .env.example .env
Set-Location ..

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Start development:"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Default accounts:"
Write-Host "  Admin: admin@cointoss.app / Password123"
Write-Host "  User:  user@cointoss.app / Password123"
