#!/bin/bash

# UnidataX 平台重启脚本
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

# 主函数
main() {
    echo "========================================"
    echo "    UnidataX 平台重启脚本"
    echo "========================================"
    echo
    
    cd "$APP_HOME"
    
    # 停止服务
    log_info "第一步: 停止现有服务..."
    ./bin/stop.sh
    
    echo
    
    # 等待服务完全停止
    log_info "等待服务完全停止..."
    sleep 5
    
    echo
    
    # 启动服务
    log_info "第二步: 启动服务..."
    ./bin/start.sh
    
    echo
    
    log_success "重启完成！"
    
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