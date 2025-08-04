#!/bin/bash

# UnidataX 平台日志清理脚本
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

# 清理后端日志
clean_backend_logs() {
    log_info "清理后端日志..."
    
    if [ -d "$APP_HOME/logs/backend" ]; then
        # 删除30天前的日志文件
        find "$APP_HOME/logs/backend" -name "*.gz" -type f -mtime +30 -delete 2>/dev/null
        find "$APP_HOME/logs/backend" -name "*.log" -type f -mtime +30 -delete 2>/dev/null
        
        # 统计清理结果
        BACKEND_LOG_COUNT=$(find "$APP_HOME/logs/backend" -name "*.gz" -o -name "*.log" | wc -l)
        log_success "后端日志清理完成，剩余文件数: $BACKEND_LOG_COUNT"
    else
        log_warning "后端日志目录不存在"
    fi
}

# 清理前端日志
clean_frontend_logs() {
    log_info "清理前端日志..."
    
    if [ -d "$APP_HOME/logs/frontend" ]; then
        # 删除30天前的日志文件
        find "$APP_HOME/logs/frontend" -name "*.gz" -type f -mtime +30 -delete 2>/dev/null
        find "$APP_HOME/logs/frontend" -name "*.log" -type f -mtime +30 -delete 2>/dev/null
        
        # 统计清理结果
        FRONTEND_LOG_COUNT=$(find "$APP_HOME/logs/frontend" -name "*.gz" -o -name "*.log" | wc -l)
        log_success "前端日志清理完成，剩余文件数: $FRONTEND_LOG_COUNT"
    else
        log_warning "前端日志目录不存在"
    fi
}

# 清理空目录
clean_empty_dirs() {
    log_info "清理空目录..."
    
    # 清理后端空目录
    if [ -d "$APP_HOME/logs/backend" ]; then
        find "$APP_HOME/logs/backend" -type d -empty -delete 2>/dev/null
    fi
    
    # 清理前端空目录
    if [ -d "$APP_HOME/logs/frontend" ]; then
        find "$APP_HOME/logs/frontend" -type d -empty -delete 2>/dev/null
    fi
    
    log_success "空目录清理完成"
}

# 显示日志统计信息
show_log_stats() {
    log_info "日志统计信息..."
    
    # 后端日志统计
    if [ -d "$APP_HOME/logs/backend" ]; then
        BACKEND_TOTAL_SIZE=$(du -sh "$APP_HOME/logs/backend" 2>/dev/null | cut -f1)
        BACKEND_FILE_COUNT=$(find "$APP_HOME/logs/backend" -type f | wc -l)
        log_info "后端日志总大小: $BACKEND_TOTAL_SIZE, 文件数: $BACKEND_FILE_COUNT"
    fi
    
    # 前端日志统计
    if [ -d "$APP_HOME/logs/frontend" ]; then
        FRONTEND_TOTAL_SIZE=$(du -sh "$APP_HOME/logs/frontend" 2>/dev/null | cut -f1)
        FRONTEND_FILE_COUNT=$(find "$APP_HOME/logs/frontend" -type f | wc -l)
        log_info "前端日志总大小: $FRONTEND_TOTAL_SIZE, 文件数: $FRONTEND_FILE_COUNT"
    fi
}

# 强制清理所有日志（危险操作）
force_clean_all() {
    log_warning "警告：这将删除所有日志文件！"
    read -p "确认要删除所有日志文件吗？(y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "强制清理所有日志..."
        
        # 删除后端日志
        if [ -d "$APP_HOME/logs/backend" ]; then
            rm -rf "$APP_HOME/logs/backend"/*
            log_success "后端日志已全部删除"
        fi
        
        # 删除前端日志
        if [ -d "$APP_HOME/logs/frontend" ]; then
            rm -rf "$APP_HOME/logs/frontend"/*
            log_success "前端日志已全部删除"
        fi
        
        log_success "所有日志文件已清理完成"
    else
        log_info "操作已取消"
    fi
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo
    echo "选项:"
    echo "  -a, --all        清理所有30天前的日志（默认）"
    echo "  -b, --backend    仅清理后端日志"
    echo "  -f, --frontend   仅清理前端日志"
    echo "  -s, --stats      显示日志统计信息"
    echo "  -F, --force      强制清理所有日志（危险操作）"
    echo "  -h, --help       显示此帮助信息"
    echo
    echo "示例:"
    echo "  $0                # 清理所有30天前的日志"
    echo "  $0 -b             # 仅清理后端日志"
    echo "  $0 -s             # 显示统计信息"
    echo "  $0 -F             # 强制清理所有日志"
}

# 主函数
main() {
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        -s|--stats)
            show_log_stats
            exit 0
            ;;
        -F|--force)
            force_clean_all
            exit 0
            ;;
        -b|--backend)
            clean_backend_logs
            clean_empty_dirs
            ;;
        -f|--frontend)
            clean_frontend_logs
            clean_empty_dirs
            ;;
        -a|--all|"")
            clean_backend_logs
            clean_frontend_logs
            clean_empty_dirs
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
    
    echo
    show_log_stats
    log_success "日志清理完成！"
}

# 执行主函数
main "$@" 