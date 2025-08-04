@echo off
echo ========================================
echo     UnidataX 平台启动脚本
echo ========================================
echo.

echo 1. 启动后端服务...
cd /d "%~dp0unidatax-backend"
start "UnidataX Backend" cmd /k "mvn spring-boot:run"

echo 2. 等待后端服务启动...
timeout /t 15 /nobreak >nul

echo 3. 启动前端服务...
cd /d "%~dp0unidatax-web"
start "UnidataX Frontend" cmd /k "npm start"

echo 4. 等待前端服务启动...
timeout /t 20 /nobreak >nul

echo.
echo ========================================
echo     服务启动完成！
echo ========================================
echo 前端地址: http://localhost:13000
echo 后端地址: http://localhost:18082
echo.
echo 按任意键退出...
pause >nul 