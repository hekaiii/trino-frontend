@echo off
echo 启动 UnidataX 前端服务...
cd /d "%~dp0unidatax-web"
echo 当前目录: %CD%
echo 正在启动前端服务，端口: 13000
start "UnidataX Frontend" cmd /k "npm start"
echo 前端服务启动中，请等待...
timeout /t 15 /nobreak >nul
echo 前端服务已启动在 http://localhost:13000
pause 