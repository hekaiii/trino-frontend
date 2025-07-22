#!/bin/bash

echo "Starting Trino Frontend with CORS Proxy..."
echo "Project directory: $(pwd)"

# 停止现有服务器
echo "Stopping any existing servers..."
pkill -f 'python3 -m http.server 3001' || true
pkill -f 'node proxy-server.js' || true
sleep 2

# 清除代理环境变量
unset http_proxy
unset https_proxy  
unset HTTP_PROXY
unset HTTPS_PROXY
unset all_proxy
unset ALL_PROXY

export http_proxy=""
export https_proxy=""
export HTTP_PROXY=""
export HTTPS_PROXY=""
export all_proxy=""
export ALL_PROXY=""

echo "Proxy variables cleared for this session"

# 启动CORS代理服务器
echo "Starting CORS proxy server on port 3002..."
node proxy-server.js > proxy.log 2>&1 &
PROXY_PID=$!
sleep 3

# 检查代理服务器是否启动成功
if ps -p $PROXY_PID > /dev/null 2>&1; then
    echo "✅ CORS proxy server started (PID: $PROXY_PID)"
else
    echo "❌ Failed to start CORS proxy server"
    exit 1
fi

# 重新构建项目
echo "Building React project..."
npm run build

# 获取WSL IP
WSL_IP=$(hostname -I | awk '{print $1}')
echo "WSL IP Address: $WSL_IP"

# 启动Python HTTP服务器
echo "Starting frontend server on port 3001..."
cd build
python3 -m http.server 3001 > ../server.log 2>&1 &
FRONTEND_PID=$!

# 等待服务器启动
sleep 2

# 检查前端服务器是否启动成功
if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo "✅ Frontend server started (PID: $FRONTEND_PID)"
else
    echo "❌ Failed to start frontend server"
    kill $PROXY_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🚀 All servers started successfully!"
echo "📱 Frontend: http://$WSL_IP:3001"
echo "🔄 CORS Proxy: http://$WSL_IP:3002"
echo "📝 Frontend logs: $(pwd)/../server.log"
echo "📝 Proxy logs: $(pwd)/../proxy.log"
echo ""
echo "To stop all servers:"
echo "  pkill -f 'python3 -m http.server 3001'"
echo "  pkill -f 'node proxy-server.js'"