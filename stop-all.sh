#!/bin/bash

echo "========================================"
echo "    停止 UnidataX 平台服务"
echo "========================================"
echo

# 停止前端服务
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "正在停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        sleep 3
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo "强制停止前端服务..."
            kill -9 $FRONTEND_PID
        fi
        echo "✅ 前端服务已停止"
    else
        echo "前端服务未运行"
    fi
    rm -f logs/frontend.pid
else
    echo "前端服务未运行"
fi

echo

# 停止后端服务
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "正在停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        sleep 5
        if kill -0 $BACKEND_PID 2>/dev/null; then
            echo "强制停止后端服务..."
            kill -9 $BACKEND_PID
        fi
        echo "✅ 后端服务已停止"
    else
        echo "后端服务未运行"
    fi
    rm -f logs/backend.pid
else
    echo "后端服务未运行"
fi

echo

# 清理Node.js进程（备用方案）
NODE_PIDS=$(pgrep -f "node.*npm")
if [ ! -z "$NODE_PIDS" ]; then
    echo "清理残留的Node.js进程..."
    echo $NODE_PIDS | xargs kill -9
fi

# 清理Java进程（备用方案）
JAVA_PIDS=$(pgrep -f "spring-boot:run")
if [ ! -z "$JAVA_PIDS" ]; then
    echo "清理残留的Java进程..."
    echo $JAVA_PIDS | xargs kill -9
fi

echo
echo "所有服务已停止！" 