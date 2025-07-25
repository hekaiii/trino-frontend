@echo off
echo Stopping Trino Frontend servers...

REM Stop Node.js proxy server
echo Stopping CORS proxy server...
taskkill /f /im "node.exe" >nul 2>&1

REM Stop Python HTTP server
echo Stopping frontend server...
taskkill /f /im "python.exe" >nul 2>&1

REM Wait a moment
timeout /t 2 >nul

echo ✅ All servers stopped successfully!
pause