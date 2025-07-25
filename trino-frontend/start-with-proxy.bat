@echo off
echo Starting Trino Frontend with CORS Proxy...
echo Project directory: %cd%

REM Stop existing servers
echo Stopping any existing servers...
taskkill /f /im "node.exe" >nul 2>&1
taskkill /f /im "python.exe" >nul 2>&1
timeout /t 2 >nul

REM Clear proxy environment variables
set http_proxy=
set https_proxy=
set HTTP_PROXY=
set HTTPS_PROXY=
set all_proxy=
set ALL_PROXY=

echo Proxy variables cleared for this session

REM Build the project first
echo Building React project...
call npm run build
if errorlevel 1 (
    echo Failed to build React project
    pause
    exit /b 1
)

REM Start CORS proxy server
echo Starting CORS proxy server on port 3002...
start "CORS Proxy" cmd /c "node proxy-server.js"
timeout /t 3 >nul

REM Start frontend server
echo Starting frontend server on port 3001...
cd build
start "Frontend Server" cmd /c "python -m http.server 3001"

REM Wait for servers to start
timeout /t 3 >nul

echo.
echo ✅ All servers started successfully!
echo 📱 Frontend: http://localhost:3001
echo 🔄 CORS Proxy: http://localhost:3002
echo.
echo Two command windows have opened for the servers.
echo Close those windows to stop the servers.
echo.

pause