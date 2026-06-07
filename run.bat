@echo off
title Disco XOXO Startup Manager
echo ========================================================
echo               DISCO XOXO STARTUP MANAGER
echo ========================================================
echo.

:: Check for .env file
if not exist .env (
    echo [!] .env file not found. Creating from .env.example...
    copy .env.example .env
    echo [!] Please fill out your Discord and Spotify credentials in the .env file.
    echo [!] After editing the .env file, press any key to continue...
    pause > nul
)

echo.
echo [1/4] Installing dependencies for all modules...
call npm install --prefix api
call npm install --prefix bot
call npm install --prefix dashboard

echo.
echo [2/4] Compiling TypeScript code...
call npm run build --prefix api
call npm run build --prefix bot
call npm run build --prefix dashboard

echo.
echo [3/4] Registering Discord slash commands...
cd bot
call npm run deploy-commands
cd ..

echo.
echo [4/4] Starting API, Bot, and Dashboard services...
start "Disco XOXO - API Server" cmd /k "cd api && npm run dev"
start "Disco XOXO - Bot Client" cmd /k "cd bot && npm run dev"
start "Disco XOXO - React Dashboard" cmd /k "cd dashboard && npm run dev"

echo.
echo ========================================================
echo   ✅ All services have been launched in separate windows!
echo   - API Server is running on: http://localhost:3001
echo   - React Dashboard is running on: http://localhost:3000
echo ========================================================
echo.
pause
