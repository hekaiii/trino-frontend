@echo off
echo Starting Trino Frontend (Simple Mode - No Proxy)...
echo Project directory: %cd%

REM Stop any existing servers
echo Stopping any existing servers...
taskkill /f /im "python.exe" >nul 2>&1
taskkill /f /im "node.exe" >nul 2>&1
timeout /t 2 >nul

echo.
echo You have two options:
echo.
echo 1. Development Mode (Hot Reload)
echo    - Run: npm start
echo    - Access: http://localhost:3000
echo    - Supports hot reload for development
echo.
echo 2. Production Mode (Built Version)
echo    - Uses optimized build
echo    - Access: http://localhost:3001
echo.

set /p choice="Choose option (1 or 2, default is 1): "

if "%choice%"=="2" goto production
if "%choice%"=="" goto development
if "%choice%"=="1" goto development
goto development

:development
echo.
echo Starting development server...
echo This will open automatically in your browser.
echo Press Ctrl+C to stop the server.
npm start
goto end

:production
echo.
echo Building project...
call npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo Starting production server...
cd build
echo Frontend will be available at: http://localhost:3001
echo Press Ctrl+C to stop the server.
python -m http.server 3001

:end
pause