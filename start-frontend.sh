#!/bin/bash

echo "启动 UnidataX 前端服务..."
cd "$(dirname "$0")/unidatax-web"

echo "当前目录: $(pwd)"
echo "正在启动前端服务，端口: 13000"

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js环境，请先安装Node.js 14+"
    exit 1
fi

# 检查npm环境
if ! command -v npm &> /dev/null; then
    echo "错误: 未找到npm环境，请先安装npm"
    exit 1
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi

# 启动前端服务
nohup npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo "前端服务启动中，PID: $FRONTEND_PID"
echo "日志文件: logs/frontend.log"

# 等待服务启动
sleep 20

# 检查服务是否启动成功
if curl -s http://localhost:13000 > /dev/null 2>&1; then
    echo "✅ 前端服务已启动在 http://localhost:13000"
else
    echo "⚠️  前端服务可能还在启动中，请检查日志: logs/frontend.log"
fi

echo $FRONTEND_PID > ../logs/frontend.pid 