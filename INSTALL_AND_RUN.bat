@echo off
cd /d "%~dp0"
echo =============================================
echo Jannat Ihram Ghar - First Time Setup
echo =============================================
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install Node.js LTS first from https://nodejs.org/
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Reinstall Node.js LTS and restart this window.
  pause
  exit /b 1
)
echo [1/5] Installing project packages...
call npm install
if errorlevel 1 goto failed
echo [2/5] Generating Prisma client...
call npx prisma generate
if errorlevel 1 goto failed
echo [3/5] Creating local database tables...
call npx prisma db push
if errorlevel 1 goto failed
echo [4/5] Adding starter categories, sample products and admin login...
call npm run db:seed
if errorlevel 1 goto failed
echo [5/5] Starting website...
call npm run dev
pause
exit /b 0
:failed
echo Setup stopped because a command failed. Copy the error and send it to ChatGPT.
pause
exit /b 1
