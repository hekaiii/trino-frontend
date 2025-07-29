@echo off
REM ===================================================================
REM Trino Frontend Database Setup Script (Windows)
REM Version: 1.0
REM Description: 一键执行所有数据库初始化脚本
REM Author: System
REM Date: 2025-07-28
REM ===================================================================

echo.
echo ========================================
echo Trino Frontend Database Setup
echo ========================================
echo.

REM 设置数据库连接参数
set MYSQL_USER=admin
set MYSQL_PASSWORD=hekaig24
set MYSQL_HOST=localhost
set MYSQL_PORT=3306

REM 获取脚本所在目录
set SCRIPT_DIR=%~dp0

echo 数据库连接参数:
echo 主机: %MYSQL_HOST%:%MYSQL_PORT%
echo 用户: %MYSQL_USER%
echo.

REM 检查MySQL命令是否可用
mysql --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到MySQL命令，请确保MySQL客户端已安装并添加到PATH环境变量中
    echo.
    echo 安装MySQL客户端后，请将MySQL的bin目录添加到系统PATH中
    echo 例如: C:\Program Files\MySQL\MySQL Server 8.0\bin
    pause
    exit /b 1
)

echo MySQL客户端检查通过
echo.

REM 测试数据库连接
echo 测试数据库连接...
mysql -u%MYSQL_USER% -p%MYSQL_PASSWORD% -h%MYSQL_HOST% -P%MYSQL_PORT% -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo 错误: 无法连接到数据库，请检查连接参数
    echo 用户名: %MYSQL_USER%
    echo 主机: %MYSQL_HOST%:%MYSQL_PORT%
    echo.
    echo 请确认:
    echo 1. MySQL服务是否正在运行
    echo 2. 用户名和密码是否正确
    echo 3. 主机和端口是否正确
    pause
    exit /b 1
)

echo 数据库连接成功
echo.

REM 确认执行
echo 警告: 此操作将创建/重置数据库 'trino_frontend_dev'
echo 如果数据库已存在，现有数据可能会被覆盖！
echo.
set /p confirm=确定要继续吗? (Y/N): 
if /i not "%confirm%"=="Y" (
    echo 操作已取消
    pause
    exit /b 0
)

echo.
echo 开始执行数据库初始化脚本...
echo.

REM 执行第一个脚本 - 创建数据库结构
echo [1/3] 执行 01_create_database.sql - 创建数据库结构...
mysql -u%MYSQL_USER% -p%MYSQL_PASSWORD% -h%MYSQL_HOST% -P%MYSQL_PORT% < "%SCRIPT_DIR%01_create_database.sql"
if errorlevel 1 (
    echo 错误: 01_create_database.sql 执行失败
    pause
    exit /b 1
)
echo ✓ 数据库结构创建完成
echo.

REM 执行第二个脚本 - 初始化数据
echo [2/3] 执行 02_init_data.sql - 插入初始数据...
mysql -u%MYSQL_USER% -p%MYSQL_PASSWORD% -h%MYSQL_HOST% -P%MYSQL_PORT% < "%SCRIPT_DIR%02_init_data.sql"
if errorlevel 1 (
    echo 错误: 02_init_data.sql 执行失败
    pause
    exit /b 1
)
echo ✓ 初始数据插入完成
echo.

REM 执行第三个脚本 - 性能优化
echo [3/3] 执行 03_indexes_and_optimization.sql - 性能优化...
mysql -u%MYSQL_USER% -p%MYSQL_PASSWORD% -h%MYSQL_HOST% -P%MYSQL_PORT% < "%SCRIPT_DIR%03_indexes_and_optimization.sql"
if errorlevel 1 (
    echo 错误: 03_indexes_and_optimization.sql 执行失败
    pause
    exit /b 1
)
echo ✓ 性能优化完成
echo.

REM 验证数据库设置
echo 验证数据库设置...
mysql -u%MYSQL_USER% -p%MYSQL_PASSWORD% -h%MYSQL_HOST% -P%MYSQL_PORT% -D trino_frontend_dev -e "
SELECT 'Database Setup Verification' as status;
SELECT table_name, table_rows, table_comment 
FROM information_schema.tables 
WHERE table_schema = 'trino_frontend_dev' 
ORDER BY table_name;
"
if errorlevel 1 (
    echo 警告: 数据库验证失败，但脚本可能已成功执行
)

echo.
echo ========================================
echo 数据库初始化完成！
echo ========================================
echo.
echo 数据库信息:
echo   数据库名: trino_frontend_dev
echo   主机: %MYSQL_HOST%:%MYSQL_PORT%
echo   用户: %MYSQL_USER%
echo.
echo 测试账号信息:
echo   管理员: admin / admin123 (ADMIN角色)
echo   测试用户: test / test123 (USER角色)
echo   开发用户: developer / dev123 (USER角色)
echo.
echo 注意: 这些是测试密码，生产环境请更改！
echo.
echo 接下来可以启动Spring Boot应用进行测试
echo.

pause