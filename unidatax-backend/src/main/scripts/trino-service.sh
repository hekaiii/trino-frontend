#!/bin/bash

# UnidataX 项目管理脚本
# 作者: Claude Code Assistant
# 版本: 1.0.0
# 描述: 提供启动、停止、重启、状态查看功能

# 设置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_DIR="$PROJECT_DIR/config"
LOG_DIR="$PROJECT_DIR/logs"
LIB_DIR="$PROJECT_DIR/lib"
PID_FILE="$PROJECT_DIR/unidatax.pid"
LOG_FILE="$LOG_DIR/unidatax.log"

# 应用配置
APP_NAME="UnidataX"
APP_MAIN_CLASS="com.queryu.trino.TrinoBackendApplication"
JAVA_OPTS="-Xms512m -Xmx1024m -server"
SPRING_PROFILES_ACTIVE="prod"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] ${message}${NC}"
}

# 检查Java环境
check_java() {
    if [ -z "$JAVA_HOME" ]; then
        JAVA_CMD="java"
    else
        JAVA_CMD="$JAVA_HOME/bin/java"
    fi
    
    if ! command -v $JAVA_CMD &> /dev/null; then
        print_message $RED "错误: 未找到Java运行环境，请安装Java 8或更高版本"
        exit 1
    fi
    
    JAVA_VERSION=$($JAVA_CMD -version 2>&1 | grep version | cut -d'"' -f2 | cut -d'.' -f1-2)
    print_message $BLUE "使用Java版本: $JAVA_VERSION"
}

# 创建必要的目录
create_dirs() {
    mkdir -p "$LOG_DIR"
    mkdir -p "$CONFIG_DIR"
}

# 获取应用PID
get_pid() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
            echo "$PID"
        else
            rm -f "$PID_FILE"
            echo ""
        fi
    else
        echo ""
    fi
}

# 检查应用状态
is_running() {
    local pid=$(get_pid)
    [ -n "$pid" ]
}

# 启动应用
start() {
    print_message $BLUE "正在启动 $APP_NAME..."
    
    if is_running; then
        print_message $YELLOW "$APP_NAME 已经在运行中 (PID: $(get_pid))"
        return 0
    fi
    
    check_java
    create_dirs
    
    # 构建classpath
    CLASSPATH="$CONFIG_DIR:$LIB_DIR/*"
    
    # 启动命令
    START_CMD="$JAVA_CMD $JAVA_OPTS \
        -Dspring.profiles.active=$SPRING_PROFILES_ACTIVE \
        -Dspring.config.location=classpath:/,file:$CONFIG_DIR/ \
        -Dlogging.config=file:$CONFIG_DIR/logback-spring.xml \
        -Dfile.encoding=UTF-8 \
        -Djava.awt.headless=true \
        -Djava.security.egd=file:/dev/./urandom \
        -cp $CLASSPATH \
        $APP_MAIN_CLASS"
    
    print_message $BLUE "启动命令: $START_CMD"
    
    # 后台启动应用
    nohup $START_CMD > "$LOG_FILE" 2>&1 &
    local pid=$!
    
    # 保存PID
    echo $pid > "$PID_FILE"
    
    # 等待启动
    sleep 3
    
    if is_running; then
        print_message $GREEN "$APP_NAME 启动成功! (PID: $pid)"
        print_message $BLUE "日志文件: $LOG_FILE"
        print_message $BLUE "配置目录: $CONFIG_DIR"
    else
        print_message $RED "$APP_NAME 启动失败，请查看日志: $LOG_FILE"
        rm -f "$PID_FILE"
        return 1
    fi
}

# 停止应用
stop() {
    print_message $BLUE "正在停止 $APP_NAME..."
    
    local pid=$(get_pid)
    if [ -z "$pid" ]; then
        print_message $YELLOW "$APP_NAME 没有运行"
        return 0
    fi
    
    # 优雅停止
    kill -TERM "$pid"
    
    # 等待进程结束
    local count=0
    while [ $count -lt 30 ] && kill -0 "$pid" 2>/dev/null; do
        sleep 1
        count=$((count + 1))
    done
    
    # 检查是否还在运行
    if kill -0 "$pid" 2>/dev/null; then
        print_message $YELLOW "优雅停止超时，强制终止进程..."
        kill -KILL "$pid"
        sleep 2
    fi
    
    # 清理PID文件
    rm -f "$PID_FILE"
    
    if kill -0 "$pid" 2>/dev/null; then
        print_message $RED "$APP_NAME 停止失败"
        return 1
    else
        print_message $GREEN "$APP_NAME 已停止"
        return 0
    fi
}

# 重启应用
restart() {
    print_message $BLUE "正在重启 $APP_NAME..."
    stop
    sleep 2
    start
}

# 查看状态
status() {
    local pid=$(get_pid)
    if [ -n "$pid" ]; then
        print_message $GREEN "$APP_NAME 正在运行 (PID: $pid)"
        
        # 显示进程信息
        if command -v ps &> /dev/null; then
            echo ""
            print_message $BLUE "进程信息:"
            ps -p "$pid" -o pid,ppid,pcpu,pmem,time,cmd
        fi
        
        # 显示端口占用
        if command -v netstat &> /dev/null; then
            echo ""
            print_message $BLUE "端口占用情况:"
            netstat -tlnp 2>/dev/null | grep "$pid" || echo "未找到端口信息"
        fi
        
        return 0
    else
        print_message $RED "$APP_NAME 没有运行"
        return 1
    fi
}

# 查看日志
logs() {
    if [ -f "$LOG_FILE" ]; then
        print_message $BLUE "显示最新日志 (按Ctrl+C退出):"
        tail -f "$LOG_FILE"
    else
        print_message $YELLOW "日志文件不存在: $LOG_FILE"
    fi
}

# 显示帮助信息
usage() {
    echo "用法: $0 {start|stop|restart|status|logs|help}"
    echo ""
    echo "命令说明:"
    echo "  start   - 启动应用"
    echo "  stop    - 停止应用"
    echo "  restart - 重启应用"
    echo "  status  - 查看运行状态"
    echo "  logs    - 查看实时日志"
    echo "  help    - 显示帮助信息"
    echo ""
    echo "配置文件位置: $CONFIG_DIR"
    echo "日志文件位置: $LOG_FILE"
    echo "PID文件位置: $PID_FILE"
}

# 主函数
main() {
    case "$1" in
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        status)
            status
            ;;
        logs)
            logs
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            print_message $RED "未知命令: $1"
            usage
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"