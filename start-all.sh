#!/bin/bash

echo "========================================"
echo "    UnidataX 平台启动脚本 (Linux)"
echo "========================================"
echo

# 创建日志目录
mkdir -p logs

echo "1. 启动后端服务..."
./start-backend.sh

echo
echo "2. 启动前端服务..."
./start-frontend.sh

echo
echo "========================================"
echo "     服务启动完成！"
echo "========================================"
echo "前端地址: http://localhost:13000"
echo "后端地址: http://localhost:18082"
echo
echo "查看日志:"
echo "  后端日志: tail -f logs/backend.log"
echo "  前端日志: tail -f logs/frontend.log"
echo
echo "停止服务: ./stop-all.sh" 