#!/bin/bash

echo "启动 UnidataX 后端服务..."
cd "$(dirname "$0")/unidatax-backend"

echo "当前目录: $(pwd)"
echo "正在启动后端服务，端口: 18082"

# 检查Java环境
if ! command -v java &> /dev/null; then
    echo "错误: 未找到Java环境，请先安装Java 8或更高版本"
    exit 1
fi

# 检查Maven环境
if ! command -v mvn &> /dev/null; then
    echo "错误: 未找到Maven环境，请先安装Maven 3.6+"
    exit 1
fi

# 启动后端服务
nohup mvn spring-boot:run > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

echo "后端服务启动中，PID: $BACKEND_PID"
echo "日志文件: logs/backend.log"

# 等待服务启动
sleep 15

# 检查服务是否启动成功
if curl -s http://localhost:18082/actuator/health > /dev/null 2>&1; then
    echo "✅ 后端服务已启动在 http://localhost:18082"
else
    echo "⚠️  后端服务可能还在启动中，请检查日志: logs/backend.log"
fi

echo $BACKEND_PID > ../logs/backend.pid 