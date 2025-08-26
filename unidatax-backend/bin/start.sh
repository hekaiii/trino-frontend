#!/bin/bash

# UnidataX 平台启动脚本
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

# 检查环境
check_environment() {
    log_info "检查运行环境..."
    
    # 检查Java
    if ! command -v java &> /dev/null; then
        log_error "未找到Java环境，请先安装Java 8或更高版本"
        exit 1
    fi
    
    # 检查Java版本
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | awk -F'"' '{print $2}')
    case "$JAVA_VERSION" in
        1.8*|9*|1[0-9]*|[2-9][0-9]*) 
            log_success "Java版本检查通过: $JAVA_VERSION" ;;
        *)
            log_error "Java版本过低，需要Java 8或更高版本，当前版本: $JAVA_VERSION"
            exit 1 ;;
    esac
    
    # 检查端口占用
    if netstat -tlnp 2>/dev/null | grep -q ":18082"; then
        log_warning "端口18082已被占用，请先停止相关服务"
        exit 1
    fi
    
    if netstat -tlnp 2>/dev/null | grep -q ":13000"; then
        log_warning "端口13000已被占用，请先停止相关服务"
        exit 1
    fi
}

# 启动后端服务
start_backend() {
    log_info "启动后端服务..."
    
    cd "$APP_HOME"
    
    # 检查JAR文件是否存在
    if [ ! -f "unidatax-backend.jar" ]; then
        log_error "未找到unidatax-backend.jar文件"
        exit 1
    fi
    
    # 创建日志目录
    mkdir -p logs
    
    # 启动后端服务
    nohup java -jar unidatax-backend.jar > logs/backend.log 2>&1 &
    BACKEND_PID=$!
    
    echo $BACKEND_PID > logs/backend.pid
    
    log_info "后端服务启动中，PID: $BACKEND_PID"
    log_info "后端日志: logs/backend.log"
    
    # 等待服务启动
    sleep 10
    
    # 检查服务是否启动成功
    if curl -s http://localhost:18082/actuator/health > /dev/null 2>&1; then
        log_success "后端服务启动成功: http://localhost:18082"
    else
        log_warning "后端服务可能还在启动中，请检查日志: logs/backend.log"
    fi
}

# 启动前端服务
start_frontend() {
    log_info "启动前端服务..."
    
    cd "$APP_HOME/web"
    
    # 检查前端文件是否存在
    if [ ! -f "index.html" ]; then
        log_error "未找到前端文件，请确保前端已正确构建"
        exit 1
    fi
    
    # 创建前端日志目录
    mkdir -p ../logs/frontend
    
    # 启动前端服务（使用Python或Node.js的http-server）
    if command -v python3 &> /dev/null; then
        nohup python3 -m http.server 13000 > ../logs/frontend/frontend.log 2>&1 &
        FRONTEND_PID=$!
    elif command -v python &> /dev/null; then
        nohup python -m SimpleHTTPServer 13000 > ../logs/frontend/frontend.log 2>&1 &
        FRONTEND_PID=$!
    elif command -v npx &> /dev/null; then
        nohup npx http-server -p 13000 > ../logs/frontend/frontend.log 2>&1 &
        FRONTEND_PID=$!
    else
        log_error "未找到可用的HTTP服务器，请安装Python或Node.js"
        exit 1
    fi
    
    echo $FRONTEND_PID > ../logs/frontend.pid
    
    log_info "前端服务启动中，PID: $FRONTEND_PID"
    log_info "前端日志: logs/frontend/frontend.log"
    
    # 等待服务启动
    sleep 5
    
    # 检查服务是否启动成功
    if curl -s http://localhost:13000 > /dev/null 2>&1; then
        log_success "前端服务启动成功: http://localhost:13000"
    else
        log_warning "前端服务可能还在启动中，请检查日志: logs/frontend/frontend.log"
    fi
}

# 主函数
main() {
    echo "========================================"
    echo "    UnidataX 平台启动脚本"
    echo "========================================"
    echo
    
    # 检查环境
    check_environment
    
    # 启动后端
    start_backend
    
    # 启动前端
    start_frontend
    
    echo
    echo "========================================"
    echo "     服务启动完成！"
    echo "========================================"
    echo "前端地址: http://localhost:13000"
    echo "后端地址: http://localhost:18082"
    echo "健康检查: http://localhost:18082/actuator/health"
    echo
    echo "查看日志:"
    echo "  后端日志: tail -f logs/backend.log"
    echo "  前端日志: tail -f logs/frontend.log"
    echo
    echo "停止服务: ./stop.sh"
    echo "查看状态: ./status.sh"
    echo "重启服务: ./restart.sh"
}

# 执行主函数
main "$@" 