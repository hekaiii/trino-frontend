@echo off
REM Trino Frontend Server Startup Script
REM This script starts the Python HTTP server to serve the static files
REM for Windows environment

set PROJECT_DIR=%cd%
set PORT=3001

echo Starting Trino Frontend Server...
echo Project directory: %PROJECT_DIR%
echo Port: %PORT%

REM Build the project if build directory doesn't exist
if not exist "build" (
    echo Building React project...
    call npm run build
    if errorlevel 1 (
        echo Error: Failed to build project
        pause
        exit /b 1
    )
)

REM Stop existing server on the port
echo Stopping any existing servers...
taskkill /f /im "python.exe" >nul 2>&1
timeout /t 2 >nul

REM Navigate to build directory
cd build
if errorlevel 1 (
    echo Error: Cannot navigate to build directory
    pause
    exit /b 1
)

REM Start Python HTTP server in a new window
echo Starting Python HTTP server on port %PORT%...
start "Frontend Server" cmd /c "python -m http.server %PORT%"

REM Wait for server to start
timeout /t 3 >nul

echo ✅ Server started successfully!
echo 🌐 Access from browser: http://localhost:%PORT%
echo.
echo A command window has opened for the server.
echo Close that window to stop the server.
echo.

pause