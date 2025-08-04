@echo off
echo ========================================
echo     停止 UnidataX 平台服务
echo ========================================
echo.

echo 正在停止前端服务...
taskkill /f /im node.exe 2>nul
if %errorlevel% equ 0 (
    echo 前端服务已停止
) else (
    echo 前端服务未运行或已停止
)

echo.
echo 正在停止后端服务...
taskkill /f /im java.exe 2>nul
if %errorlevel% equ 0 (
    echo 后端服务已停止
) else (
    echo 后端服务未运行或已停止
)

echo.
echo 所有服务已停止！
echo 按任意键退出...
pause >nul 