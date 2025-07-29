#!/bin/bash

# ===================================================================
# Trino Frontend Database Setup Script (Linux/macOS)
# Version: 1.0
# Description: 一键执行所有数据库初始化脚本
# Author: System
# Date: 2025-07-28
# ===================================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印彩色消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo
    print_message $BLUE "========================================"
    print_message $BLUE "$1"
    print_message $BLUE "========================================"
    echo
}

print_success() {
    print_message $GREEN "✓ $1"
}

print_error() {
    print_message $RED "✗ 错误: $1"
}

print_warning() {
    print_message $YELLOW "⚠ 警告: $1"
}

# 数据库连接参数
MYSQL_USER="admin"
MYSQL_PASSWORD="hekaig24"
MYSQL_HOST="localhost"
MYSQL_PORT="3306"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_header "Trino Frontend Database Setup"

echo "数据库连接参数:"
echo "主机: $MYSQL_HOST:$MYSQL_PORT"
echo "用户: $MYSQL_USER"
echo

# 检查MySQL命令是否可用
if ! command -v mysql &> /dev/null; then
    print_error "未找到MySQL命令，请安装MySQL客户端"
    echo
    echo "安装方法:"
    echo "Ubuntu/Debian: sudo apt-get install mysql-client"
    echo "CentOS/RHEL: sudo yum install mysql"
    echo "macOS: brew install mysql-client"
    exit 1
fi

print_success "MySQL客户端检查通过"
echo

# 测试数据库连接
print_message $BLUE "测试数据库连接..."
if ! mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -h"$MYSQL_HOST" -P"$MYSQL_PORT" -e "SELECT 1;" &> /dev/null; then
    print_error "无法连接到数据库，请检查连接参数"
    echo "用户名: $MYSQL_USER"
    echo "主机: $MYSQL_HOST:$MYSQL_PORT"
    echo
    echo "请确认:"
    echo "1. MySQL服务是否正在运行"
    echo "2. 用户名和密码是否正确"
    echo "3. 主机和端口是否正确"
    exit 1
fi

print_success "数据库连接成功"
echo

# 确认执行
print_warning "此操作将创建/重置数据库 'trino_frontend_dev'"
print_warning "如果数据库已存在，现有数据可能会被覆盖！"
echo
read -p "确定要继续吗? (Y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "操作已取消"
    exit 0
fi

echo
print_message $BLUE "开始执行数据库初始化脚本..."
echo

# 执行脚本函数
execute_script() {
    local script_name=$1
    local description=$2
    local step=$3
    
    print_message $BLUE "[$step/3] 执行 $script_name - $description..."
    
    if mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -h"$MYSQL_HOST" -P"$MYSQL_PORT" < "$SCRIPT_DIR/$script_name"; then
        print_success "$description完成"
        echo
        return 0
    else
        print_error "$script_name 执行失败"
        return 1
    fi
}

# 执行第一个脚本 - 创建数据库结构
if ! execute_script "01_create_database.sql" "创建数据库结构" "1"; then
    exit 1
fi

# 执行第二个脚本 - 初始化数据
if ! execute_script "02_init_data.sql" "插入初始数据" "2"; then
    exit 1
fi

# 执行第三个脚本 - 性能优化
if ! execute_script "03_indexes_and_optimization.sql" "性能优化" "3"; then
    exit 1
fi

# 验证数据库设置
print_message $BLUE "验证数据库设置..."
if mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -h"$MYSQL_HOST" -P"$MYSQL_PORT" -D trino_frontend_dev -e "
SELECT 'Database Setup Verification' as status;
SELECT table_name, table_rows, table_comment 
FROM information_schema.tables 
WHERE table_schema = 'trino_frontend_dev' 
ORDER BY table_name;
" 2>/dev/null; then
    print_success "数据库验证成功"
else
    print_warning "数据库验证失败，但脚本可能已成功执行"
fi

echo
print_header "数据库初始化完成！"

echo "数据库信息:"
echo "  数据库名: trino_frontend_dev"
echo "  主机: $MYSQL_HOST:$MYSQL_PORT"
echo "  用户: $MYSQL_USER"
echo
echo "测试账号信息:"
print_message $GREEN "  管理员: admin / admin123 (ADMIN角色)"
print_message $GREEN "  测试用户: test / test123 (USER角色)"
print_message $GREEN "  开发用户: developer / dev123 (USER角色)"
echo
print_warning "注意: 这些是测试密码，生产环境请更改！"
echo
echo "接下来可以启动Spring Boot应用进行测试"
echo