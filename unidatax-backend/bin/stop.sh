#!/bin/bash

# UnidataX 平台停止脚本
# 作者: UnidataX Team
# 版本: 1.0.0

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_HOME="$(dirname "$SCRIPT_DIR")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 停止前端服务
stop_frontend() {
    log_info "停止前端服务..."
    
    if [ -f "$APP_HOME/logs/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$APP_HOME/logs/frontend.pid")
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            log_info "正在停止前端服务 (PID: $FRONTEND_PID)..."
            kill $FRONTEND_PID
            sleep 3
            if kill -0 $FRONTEND_PID 2>/dev/null; then
                log_warning "强制停止前端服务..."
                kill -9 $FRONTEND_PID
            fi
            log_success "前端服务已停止"
        else
            log_warning "前端服务未运行"
        fi
        rm -f "$APP_HOME/logs/frontend.pid"
    else
        log_warning "前端服务未运行"
    fi
}

# 停止后端服务
stop_backend() {
    log_info "停止后端服务..."
    
    if [ -f "$APP_HOME/logs/backend.pid" ]; then
        BACKEND_PID=$(cat "$APP_HOME/logs/backend.pid")
        if kill -0 $BACKEND_PID 2>/dev/null; then
            log_info "正在停止后端服务 (PID: $BACKEND_PID)..."
            kill $BACKEND_PID
            sleep 5
            if kill -0 $BACKEND_PID 2>/dev/null; then
                log_warning "强制停止后端服务..."
                kill -9 $BACKEND_PID
            fi
            log_success "后端服务已停止"
        else
            log_warning "后端服务未运行"
        fi
        rm -f "$APP_HOME/logs/backend.pid"
    else
        log_warning "后端服务未运行"
    fi
}

# 清理残留进程
cleanup_processes() {
    log_info "清理残留进程..."
    
    # 清理Java进程
    JAVA_PIDS=$(pgrep -f "unidatax-backend.jar" 2>/dev/null)
    if [ ! -z "$JAVA_PIDS" ]; then
        log_info "清理残留的Java进程..."
        echo $JAVA_PIDS | xargs kill -9 2>/dev/null
    fi
    
    # 清理HTTP服务器进程
    HTTP_PIDS=$(pgrep -f "http.server\|SimpleHTTPServer\|http-server" 2>/dev/null)
    if [ ! -z "$HTTP_PIDS" ]; then
        log_info "清理残留的HTTP服务器进程..."
        echo $HTTP_PIDS | xargs kill -9 2>/dev/null
    fi
}

# 主函数
main() {
    echo "========================================"
    echo "    停止 UnidataX 平台服务"
    echo "========================================"
    echo
    
    cd "$APP_HOME"
    
    # 停止前端
    stop_frontend
    
    echo
    
    # 停止后端
    stop_backend
    
    echo
    
    # 清理残留进程
    cleanup_processes
    
    echo
    log_success "所有服务已停止！"
}

# 执行主函数
main "$@" 