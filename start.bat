@echo off
echo Starting Server Orchestrator...

REM Check if .env exists
if not exist .env (
    echo WARNING: .env file not found. Creating from .env.example...
    copy .env.example .env
    echo Please edit .env file and update JWT_SECRET and ENCRYPTION_KEY!
    echo ENCRYPTION_KEY must be exactly 32 characters!
    pause
    exit /b 1
)

REM Start containers
echo Building and starting containers...
docker-compose up --build -d

echo.
echo Server Orchestrator is running!
echo.
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:3000
echo WebSocket: ws://localhost:8080
echo.
echo View logs: docker-compose logs -f
echo Stop: docker-compose down
pause
