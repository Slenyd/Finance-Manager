Write-Host "Setting up Finance Manager..." -ForegroundColor Green

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
Write-Host "  Admin: admin@financemanager.com / Password123"
Write-Host "  User:  user@financemanager.com / Password123"
