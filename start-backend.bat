@echo off
echo 启动 UnidataX 后端服务...
cd /d "%~dp0unidatax-backend"
echo 当前目录: %CD%
echo 正在启动后端服务，端口: 18082
start "UnidataX Backend" cmd /k "mvn spring-boot:run"
echo 后端服务启动中，请等待...
timeout /t 10 /nobreak >nul
echo 后端服务已启动在 http://localhost:18082
pause 