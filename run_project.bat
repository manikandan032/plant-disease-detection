@echo off
echo ===================================================
echo Starting Cloud Plant Disease Detection System
echo ===================================================

echo [1/3] Starting Backend Server (Port 8000)...
:: Navigate to backend, install deps, and start FastAPI
start "Backend API" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 8000"

echo [2/3] Waiting for Backend to initialize...
timeout /t 5 >nul

echo [3/3] Starting Frontend Server (Port 5500)...
:: Navigate to frontend and start Python HTTP Server
start "Frontend UI" cmd /k "cd frontend && python -m http.server 5500"

echo Opening Application in default browser...
timeout /t 2 >nul
start http://127.0.0.1:5500

echo ===================================================
echo System is running!
echo Close the popup windows to stop the servers.
echo ===================================================
pause
