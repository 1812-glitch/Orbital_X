@echo off
TITLE OrbitalX Mission Control Launcher
echo ======================================================================
echo          ORBITALX AEROSPACE FLEET & AI COPILOT LAUNCHER
echo ======================================================================
echo.

echo [1/4] Starting OrbitalX AI Anomaly & Collision Microservice (Port 5050)...
start "OrbitalX AI Microservice" cmd /k "cd /d %~dp0AI && python ai_inference_service.py --serve"

echo [2/4] Starting OrbitalX Backend Server (Port 4000)...
start "OrbitalX Backend" cmd /k "cd /d %~dp0OrbitalX\backend && npm run dev"

echo [3/4] Starting OrbitalX Frontend Web Server (Port 4173)...
start "OrbitalX Frontend" cmd /k "cd /d %~dp0OrbitalX\frontend && npm run dev"

echo [4/4] Waiting for services to initialize...
timeout /t 5 /nobreak > nul

echo.
echo Launching OrbitalX Mission Control in browser...
start http://localhost:4173/dashboard
echo.
echo ======================================================================
echo   OrbitalX Full-Stack Aerospace System is now running!
echo ======================================================================
echo   - AI Microservice : http://localhost:5050/diagnose
echo   - Backend REST API: http://localhost:4000/api/health
echo   - Mission Web UI  : http://localhost:4173
echo ======================================================================
echo.
pause
