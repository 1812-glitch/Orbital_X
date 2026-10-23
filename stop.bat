@echo off
TITLE Stop OrbitalX Services
echo ======================================================================
echo                STOPPING ORBITALX FLEET SERVICES
echo ======================================================================
echo.
echo Stopping OrbitalX AI Microservice...
taskkill /FI "WINDOWTITLE eq OrbitalX AI Microservice*" /T /F > nul 2>&1

echo Stopping OrbitalX Backend Server...
taskkill /FI "WINDOWTITLE eq OrbitalX Backend*" /T /F > nul 2>&1

echo Stopping OrbitalX Frontend Web Server...
taskkill /FI "WINDOWTITLE eq OrbitalX Frontend*" /T /F > nul 2>&1

echo.
echo All OrbitalX services have been stopped.
echo ======================================================================
timeout /t 2 /nobreak > nul
