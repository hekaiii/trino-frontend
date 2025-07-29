@echo off
setlocal enabledelayedexpansion

REM Trino Frontend 项目管理脚本 (Windows版本)
REM 作者: Claude Code Assistant
REM 版本: 1.0.0
REM 描述: 提供启动、停止、重启、状态查看功能

REM 设置变量
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..
set CONFIG_DIR=%PROJECT_DIR%\config
set LOG_DIR=%PROJECT_DIR%\logs
set LIB_DIR=%PROJECT_DIR%\lib
set PID_FILE=%PROJECT_DIR%\trino-frontend.pid
set LOG_FILE=%LOG_DIR%\trino-frontend.log

REM 应用配置
set APP_NAME=Trino Frontend
set APP_MAIN_CLASS=com.queryu.trino.TrinoBackendApplication
set JAVA_OPTS=-Xms512m -Xmx1024m -server
set SPRING_PROFILES_ACTIVE=prod

REM 检查Java环境
:check_java
if "%JAVA_HOME%"=="" (
    set JAVA_CMD=java
) else (
    set JAVA_CMD=%JAVA_HOME%\bin\java
)

REM 测试Java命令是否可用
%JAVA_CMD% -version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 未找到Java运行环境，请安装Java 8或更高版本
    exit /b 1
)

echo [INFO] 使用Java环境: %JAVA_CMD%
goto :eof

REM 创建必要的目录
:create_dirs
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"
goto :eof

REM 获取进程PID
:get_pid
set PID=
if exist "%PID_FILE%" (
    set /p PID=<"%PID_FILE%"
    if not "!PID!"=="" (
        tasklist /FI "PID eq !PID!" 2>nul | findstr "!PID!" >nul
        if errorlevel 1 (
            del "%PID_FILE%" >nul 2>&1
            set PID=
        )
    )
)
goto :eof

REM 检查应用是否运行
:is_running
call :get_pid
if not "%PID%"=="" (
    exit /b 0
) else (
    exit /b 1
)

REM 启动应用
:start
echo [INFO] 正在启动 %APP_NAME%...

call :is_running
if not errorlevel 1 (
    echo [WARN] %APP_NAME% 已经在运行中 ^(PID: %PID%^)
    exit /b 0
)

call :check_java
call :create_dirs

REM 构建classpath
set CLASSPATH=%CONFIG_DIR%;%LIB_DIR%\*

REM 启动命令
set START_CMD=%JAVA_CMD% %JAVA_OPTS% -Dspring.profiles.active=%SPRING_PROFILES_ACTIVE% -Dspring.config.location=classpath:/,file:%CONFIG_DIR%/ -Dlogging.config=file:%CONFIG_DIR%/logback-spring.xml -Dfile.encoding=UTF-8 -Djava.awt.headless=true -cp "%CLASSPATH%" %APP_MAIN_CLASS%

echo [INFO] 启动命令: %START_CMD%

REM 后台启动应用
start "Trino Frontend" /B %START_CMD% >> "%LOG_FILE%" 2>&1

REM 获取新启动的进程PID
timeout /t 2 >nul
for /f "tokens=2" %%i in ('tasklist /FI "IMAGENAME eq java.exe" /FI "WINDOWTITLE eq Trino Frontend" /FO CSV ^| findstr "java.exe"') do set NEW_PID=%%i
set NEW_PID=%NEW_PID:"=%

if not "%NEW_PID%"=="" (
    echo %NEW_PID% > "%PID_FILE%"
    echo [SUCCESS] %APP_NAME% 启动成功! ^(PID: %NEW_PID%^)
    echo [INFO] 日志文件: %LOG_FILE%
    echo [INFO] 配置目录: %CONFIG_DIR%
) else (
    echo [ERROR] %APP_NAME% 启动失败，请查看日志: %LOG_FILE%
    if exist "%PID_FILE%" del "%PID_FILE%"
    exit /b 1
)
goto :eof

REM 停止应用
:stop
echo [INFO] 正在停止 %APP_NAME%...

call :get_pid
if "%PID%"=="" (
    echo [WARN] %APP_NAME% 没有运行
    exit /b 0
)

REM 终止进程
taskkill /PID %PID% /T /F >nul 2>&1

REM 等待进程结束
timeout /t 3 >nul

REM 清理PID文件
if exist "%PID_FILE%" del "%PID_FILE%"

REM 验证进程是否已终止
tasklist /FI "PID eq %PID%" 2>nul | findstr "%PID%" >nul
if not errorlevel 1 (
    echo [ERROR] %APP_NAME% 停止失败
    exit /b 1
) else (
    echo [SUCCESS] %APP_NAME% 已停止
    exit /b 0
)

REM 重启应用
:restart
echo [INFO] 正在重启 %APP_NAME%...
call :stop
timeout /t 2 >nul
call :start
goto :eof

REM 查看状态
:status
call :get_pid
if not "%PID%"=="" (
    echo [SUCCESS] %APP_NAME% 正在运行 ^(PID: %PID%^)
    
    REM 显示进程信息
    echo.
    echo [INFO] 进程信息:
    tasklist /FI "PID eq %PID%" /FO TABLE
    
    REM 显示端口占用情况
    echo.
    echo [INFO] 端口占用情况:
    netstat -ano | findstr %PID%
    
    exit /b 0
) else (
    echo [ERROR] %APP_NAME% 没有运行
    exit /b 1
)

REM 查看日志
:logs
if exist "%LOG_FILE%" (
    echo [INFO] 显示最新日志 ^(按Ctrl+C退出^):
    powershell -command "Get-Content '%LOG_FILE%' -Wait"
) else (
    echo [WARN] 日志文件不存在: %LOG_FILE%
)
goto :eof

REM 显示帮助信息
:usage
echo 用法: %~nx0 {start^|stop^|restart^|status^|logs^|help}
echo.
echo 命令说明:
echo   start   - 启动应用
echo   stop    - 停止应用
echo   restart - 重启应用
echo   status  - 查看运行状态
echo   logs    - 查看实时日志
echo   help    - 显示帮助信息
echo.
echo 配置文件位置: %CONFIG_DIR%
echo 日志文件位置: %LOG_FILE%
echo PID文件位置: %PID_FILE%
goto :eof

REM 主函数
:main
if "%1"=="start" (
    call :start
) else if "%1"=="stop" (
    call :stop
) else if "%1"=="restart" (
    call :restart
) else if "%1"=="status" (
    call :status
) else if "%1"=="logs" (
    call :logs
) else if "%1"=="help" (
    call :usage
) else if "%1"=="--help" (
    call :usage
) else if "%1"=="-h" (
    call :usage
) else (
    echo [ERROR] 未知命令: %1
    call :usage
    exit /b 1
)

REM 执行主函数
call :main %*