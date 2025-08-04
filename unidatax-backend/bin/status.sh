#!/bin/bash

# UnidataX 平台状态查看脚本
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

# 检查后端服务状态
check_backend_status() {
    log_info "检查后端服务状态..."
    
    if [ -f "$APP_HOME/logs/backend.pid" ]; then
        BACKEND_PID=$(cat "$APP_HOME/logs/backend.pid")
        if kill -0 $BACKEND_PID 2>/dev/null; then
            log_success "后端服务运行中 (PID: $BACKEND_PID)"
            
            # 检查端口
            if netstat -tlnp 2>/dev/null | grep -q ":18082"; then
                log_success "后端端口18082监听正常"
            else
                log_warning "后端端口18082未监听"
            fi
            
            # 检查健康状态
            if curl -s http://localhost:18082/actuator/health > /dev/null 2>&1; then
                log_success "后端健康检查通过"
            else
                log_warning "后端健康检查失败"
            fi
            
            # 显示内存使用
            if command -v ps &> /dev/null; then
                MEMORY=$(ps -o rss= -p $BACKEND_PID 2>/dev/null | awk '{print $1/1024 " MB"}')
                log_info "后端内存使用: $MEMORY"
            fi
        else
            log_error "后端服务未运行 (PID文件存在但进程不存在)"
        fi
    else
        log_warning "后端服务未运行 (无PID文件)"
    fi
}

# 检查前端服务状态
check_frontend_status() {
    log_info "检查前端服务状态..."
    
    if [ -f "$APP_HOME/logs/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$APP_HOME/logs/frontend.pid")
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            log_success "前端服务运行中 (PID: $FRONTEND_PID)"
            
            # 检查端口
            if netstat -tlnp 2>/dev/null | grep -q ":13000"; then
                log_success "前端端口13000监听正常"
            else
                log_warning "前端端口13000未监听"
            fi
            
            # 检查服务响应
            if curl -s http://localhost:13000 > /dev/null 2>&1; then
                log_success "前端服务响应正常"
            else
                log_warning "前端服务无响应"
            fi
            
            # 显示内存使用
            if command -v ps &> /dev/null; then
                MEMORY=$(ps -o rss= -p $FRONTEND_PID 2>/dev/null | awk '{print $1/1024 " MB"}')
                log_info "前端内存使用: $MEMORY"
            fi
        else
            log_error "前端服务未运行 (PID文件存在但进程不存在)"
        fi
    else
        log_warning "前端服务未运行 (无PID文件)"
    fi
}

# 检查系统资源
check_system_resources() {
    log_info "检查系统资源..."
    
    # CPU使用率
    if command -v top &> /dev/null; then
        CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
        log_info "CPU使用率: ${CPU_USAGE}%"
    fi
    
    # 内存使用率
    if command -v free &> /dev/null; then
        MEMORY_INFO=$(free -m | grep Mem)
        TOTAL_MEM=$(echo $MEMORY_INFO | awk '{print $2}')
        USED_MEM=$(echo $MEMORY_INFO | awk '{print $3}')
        MEMORY_USAGE=$(echo "scale=1; $USED_MEM * 100 / $TOTAL_MEM" | bc 2>/dev/null || echo "N/A")
        log_info "内存使用: ${USED_MEM}MB / ${TOTAL_MEM}MB (${MEMORY_USAGE}%)"
    fi
    
    # 磁盘使用率
    if command -v df &> /dev/null; then
        DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}')
        log_info "磁盘使用率: $DISK_USAGE"
    fi
}

# 检查端口占用
check_port_usage() {
    log_info "检查端口占用情况..."
    
    # 检查18082端口
    if netstat -tlnp 2>/dev/null | grep -q ":18082"; then
        PORT_INFO=$(netstat -tlnp 2>/dev/null | grep ":18082")
        log_info "端口18082: $PORT_INFO"
    else
        log_warning "端口18082: 未监听"
    fi
    
    # 检查13000端口
    if netstat -tlnp 2>/dev/null | grep -q ":13000"; then
        PORT_INFO=$(netstat -tlnp 2>/dev/null | grep ":13000")
        log_info "端口13000: $PORT_INFO"
    else
        log_warning "端口13000: 未监听"
    fi
}

    # 显示日志文件信息
    show_log_info() {
        log_info "日志文件信息..."
        
        # 后端日志
        if [ -f "$APP_HOME/logs/backend/backend.log" ]; then
            BACKEND_LOG_SIZE=$(du -h "$APP_HOME/logs/backend/backend.log" | cut -f1)
            log_info "后端日志: $APP_HOME/logs/backend/backend.log (大小: $BACKEND_LOG_SIZE)"
        else
            log_warning "后端日志文件不存在"
        fi
        
        # 后端错误日志
        if [ -f "$APP_HOME/logs/backend/backend-error.log" ]; then
            BACKEND_ERROR_LOG_SIZE=$(du -h "$APP_HOME/logs/backend/backend-error.log" | cut -f1)
            log_info "后端错误日志: $APP_HOME/logs/backend/backend-error.log (大小: $BACKEND_ERROR_LOG_SIZE)"
        fi
        
        # 前端日志
        if [ -f "$APP_HOME/logs/frontend/frontend.log" ]; then
            FRONTEND_LOG_SIZE=$(du -h "$APP_HOME/logs/frontend/frontend.log" | cut -f1)
            log_info "前端日志: $APP_HOME/logs/frontend/frontend.log (大小: $FRONTEND_LOG_SIZE)"
        else
            log_warning "前端日志文件不存在"
        fi
        
        # 显示日志文件列表
        log_info "后端日志文件列表:"
        if [ -d "$APP_HOME/logs/backend" ]; then
            ls -la "$APP_HOME/logs/backend/" | grep -E "\.(log|gz)$" | head -10
        fi
        
        log_info "前端日志文件列表:"
        if [ -d "$APP_HOME/logs/frontend" ]; then
            ls -la "$APP_HOME/logs/frontend/" | grep -E "\.(log|gz)$" | head -10
        fi
    }

# 主函数
main() {
    echo "========================================"
    echo "    UnidataX 平台状态检查"
    echo "========================================"
    echo
    
    cd "$APP_HOME"
    
    # 检查后端状态
    check_backend_status
    
    echo
    
    # 检查前端状态
    check_frontend_status
    
    echo
    
    # 检查端口占用
    check_port_usage
    
    echo
    
    # 检查系统资源
    check_system_resources
    
    echo
    
    # 显示日志信息
    show_log_info
    
    echo
    echo "========================================"
    echo "服务地址:"
    echo "  前端: http://localhost:13000"
    echo "  后端: http://localhost:18082"
    echo "  健康检查: http://localhost:18082/actuator/health"
    echo "========================================"
}

# 执行主函数
main "$@" 