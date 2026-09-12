@echo off
TITLE OrbitalX System Launcher
echo ===================================================
echo   ORBITALX AEROSPACE FLEET MANAGEMENT SYSTEM
echo ===================================================
echo.
echo [1/3] Starting OrbitalX Backend Server (Port 5000)...
start "OrbitalX Backend" cmd /k "cd /d %~dp0OrbitalX\backend && npm run dev"

echo [2/3] Starting OrbitalX Frontend Web Server (Port 5173)...
start "OrbitalX Frontend" cmd /k "cd /d %~dp0OrbitalX\frontend && npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 5 /nobreak > nul

echo.
echo Launching OrbitalX Mission Control in browser...
start http://localhost:5173/dashboard
echo.
echo OrbitalX is now running!
echo Backend API: http://localhost:5000/api/health
echo Frontend UI: http://localhost:5173
echo.
pause
