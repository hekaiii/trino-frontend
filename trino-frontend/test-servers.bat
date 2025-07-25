@echo off
echo Testing servers individually...

echo.
echo 1. Testing React development server (port 3000)...
echo Run: npm start
echo Then open: http://localhost:3000
echo.

echo 2. Testing built frontend with Python server (port 3001)...
echo Building project first...
call npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo Starting Python server...
cd build
echo Frontend will be available at: http://localhost:3001
echo Press Ctrl+C to stop the server when done testing
python -m http.server 3001