#!/bin/bash

# ===================================================================
# UnidataX Project Management Script (Linux/macOS)
# Version: 2.0
# Description: UnidataX工程管理脚本 - 启动、停止、重启服务
# Author: System
# Date: 2025-07-30
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

print_info() {
    print_message $BLUE "ℹ $1"
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/unidatax-backend"
FRONTEND_DIR="$PROJECT_ROOT/unidatax-web"

# PID文件路径
BACKEND_PID_FILE="$PROJECT_ROOT/backend.pid"
FRONTEND_PID_FILE="$PROJECT_ROOT/frontend.pid"

# 默认配置
START_FRONTEND="false"  # 默认不启动前端服务（适用于生产环境）

# 检查环境依赖
check_environment() {
    print_info "检查环境依赖..."
    
    # 检查Java
    if ! command -v java &> /dev/null; then
        print_error "未找到Java，请安装Java 8或更高版本"
        return 1
    fi
    print_success "Java环境检查通过: $(java -version 2>&1 | head -n 1)"
    
    # 检查后端JAR文件是否存在
    local jar_file=$(find "$BACKEND_DIR" -name "*.jar" -not -path "*/original-*" | head -n 1)
    if [ -z "$jar_file" ]; then
        print_error "未找到后端JAR文件，请先打包项目"
        print_info "打包命令: mvn clean package -DskipTests"
        return 1
    fi
    print_success "后端JAR文件检查通过: $(basename "$jar_file")"
    
    # 检查Node.js（仅在需要前端服务时）
    if [ "$START_FRONTEND" = "true" ]; then
        if ! command -v node &> /dev/null; then
            print_error "未找到Node.js，请安装Node.js 16+或更高版本"
            return 1
        fi
        print_success "Node.js环境检查通过: $(node -v)"
        
        if ! command -v npm &> /dev/null; then
            print_error "未找到npm，请安装npm"
            return 1
        fi
        print_success "npm环境检查通过: $(npm -v)"
    fi
    
    echo
    return 0
}

# 检查进程是否运行
is_process_running() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            return 0  # 进程正在运行
        else
            rm -f "$pid_file"  # 清理无效的PID文件
            return 1  # 进程不存在
        fi
    fi
    return 1  # PID文件不存在
}

# 启动后端服务
start_backend() {
    print_info "启动后端服务..."
    
    if is_process_running "$BACKEND_PID_FILE"; then
        print_warning "后端服务已经在运行中 (PID: $(cat $BACKEND_PID_FILE))"
        return 0
    fi
    
    # 查找JAR文件
    local jar_file=$(find "$BACKEND_DIR" -name "*.jar" -not -path "*/original-*" | head -n 1)
    if [ -z "$jar_file" ]; then
        print_error "未找到后端JAR文件"
        return 1
    fi
    
    print_info "使用JAR文件: $(basename "$jar_file")"
    
    # 启动后端服务 (后台运行)
    nohup java -jar "$jar_file" --spring.profiles.active=prod --server.port=18081 > "$PROJECT_ROOT/backend.log" 2>&1 &
    echo $! > "$BACKEND_PID_FILE"
    
    # 等待服务启动
    print_info "等待后端服务启动..."
    sleep 10
    
    if is_process_running "$BACKEND_PID_FILE"; then
        print_success "后端服务启动成功 (PID: $(cat $BACKEND_PID_FILE))"
        print_info "后端服务地址: http://localhost:18081"
        print_info "日志文件: $PROJECT_ROOT/backend.log"
        return 0
    else
        print_error "后端服务启动失败，查看日志: $PROJECT_ROOT/backend.log"
        return 1
    fi
}

# 启动前端服务
start_frontend() {
    print_info "启动前端服务..."
    
    if is_process_running "$FRONTEND_PID_FILE"; then
        print_warning "前端服务已经在运行中 (PID: $(cat $FRONTEND_PID_FILE))"
        return 0
    fi
    
    cd "$FRONTEND_DIR" || {
        print_error "无法进入前端目录: $FRONTEND_DIR"
        return 1
    }
    
    # 检查依赖是否安装
    if [ ! -d "node_modules" ]; then
        print_info "安装前端依赖..."
        npm install || {
            print_error "前端依赖安装失败"
            return 1
        }
    fi
    
    # 启动前端服务 (后台运行)
    PORT=13000 nohup npm start > "$PROJECT_ROOT/frontend.log" 2>&1 &
    echo $! > "$FRONTEND_PID_FILE"
    
    # 等待服务启动
    print_info "等待前端服务启动..."
    sleep 15
    
    if is_process_running "$FRONTEND_PID_FILE"; then
        print_success "前端服务启动成功 (PID: $(cat $FRONTEND_PID_FILE))"
        print_info "前端服务地址: http://localhost:13000"
        print_info "日志文件: $PROJECT_ROOT/frontend.log"
        return 0
    else
        print_error "前端服务启动失败，查看日志: $PROJECT_ROOT/frontend.log"
        return 1
    fi
}

# 停止服务
stop_service() {
    local service_name=$1
    local pid_file=$2
    
    if is_process_running "$pid_file"; then
        local pid=$(cat "$pid_file")
        print_info "停止${service_name}服务 (PID: $pid)..."
        
        # 优雅停止
        kill "$pid"
        
        # 等待进程结束
        local count=0
        while kill -0 "$pid" 2>/dev/null && [ $count -lt 30 ]; do
            sleep 1
            count=$((count + 1))
        done
        
        # 如果进程仍在运行，强制杀死
        if kill -0 "$pid" 2>/dev/null; then
            print_warning "强制停止${service_name}服务..."
            kill -9 "$pid"
        fi
        
        rm -f "$pid_file"
        print_success "${service_name}服务已停止"
    else
        print_warning "${service_name}服务未运行"
    fi
}

# 显示服务状态
show_status() {
    print_header "服务状态"
    
    # 后端状态
    if is_process_running "$BACKEND_PID_FILE"; then
        print_success "后端服务: 运行中 (PID: $(cat $BACKEND_PID_FILE))"
        print_info "  - 地址: http://localhost:18081"
        print_info "  - 日志: $PROJECT_ROOT/backend.log"
    else
        print_error "后端服务: 未运行"
    fi
    
    echo
    
    # 前端状态（仅在启用时显示）
    if [ "$START_FRONTEND" = "true" ]; then
        if is_process_running "$FRONTEND_PID_FILE"; then
            print_success "前端服务: 运行中 (PID: $(cat $FRONTEND_PID_FILE))"
            print_info "  - 地址: http://localhost:13000"
            print_info "  - 日志: $PROJECT_ROOT/frontend.log"
        else
            print_error "前端服务: 未运行"
        fi
    else
        print_info "前端服务: 已禁用（生产环境模式）"
        print_info "  - 访问地址: http://localhost:18081"
    fi
    
    echo
}

# 显示帮助信息
show_help() {
    echo "用法: $0 {start|stop|restart|status|dev|help}"
    echo
    echo "命令说明:"
    echo "  start     - 启动后端服务（生产模式，仅JAR包）"
    echo "  stop      - 停止所有服务"
    echo "  restart   - 重启所有服务"
    echo "  status    - 查看服务状态"
    echo "  dev       - 启动开发模式（包含前端服务）"
    echo "  help      - 显示帮助信息"
    echo
    echo "生产模式:"
    echo "  - 仅启动后端JAR包服务"
    echo "  - 前端静态文件已打包在JAR中"
    echo "  - 访问地址: http://localhost:18081"
    echo
    echo "开发模式:"
    echo "  - 启动后端JAR包 + 前端开发服务器"
    echo "  - 前端: http://localhost:13000"
    echo "  - 后端: http://localhost:18081"
    echo
    echo "日志文件:"
    echo "  后端: $PROJECT_ROOT/backend.log"
    echo "  前端: $PROJECT_ROOT/frontend.log"
    echo
}

# 主函数
main() {
    case "${1:-help}" in
        "start")
            print_header "UnidataX - 启动服务（生产模式）"
            START_FRONTEND="false"
            check_environment || exit 1
            start_backend || exit 1
            echo
            show_status
            ;;
        "dev")
            print_header "UnidataX - 启动服务（开发模式）"
            START_FRONTEND="true"
            check_environment || exit 1
            start_backend || exit 1
            echo
            start_frontend || exit 1
            echo
            show_status
            ;;
        "stop")
            print_header "UnidataX - 停止服务"
            stop_service "前端" "$FRONTEND_PID_FILE"
            stop_service "后端" "$BACKEND_PID_FILE"
            echo
            show_status
            ;;
        "restart")
            print_header "UnidataX - 重启服务"
            # 保持当前模式
            if is_process_running "$FRONTEND_PID_FILE"; then
                START_FRONTEND="true"
            fi
            
            stop_service "前端" "$FRONTEND_PID_FILE"
            stop_service "后端" "$BACKEND_PID_FILE"
            echo
            check_environment || exit 1
            start_backend || exit 1
            echo
            
            if [ "$START_FRONTEND" = "true" ]; then
                start_frontend || exit 1
                echo
            fi
            
            show_status
            ;;
        "status")
            show_status
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@"