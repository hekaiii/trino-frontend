#!/bin/bash

echo "Starting Trino Frontend Server without proxy..."
echo "Project directory: $(pwd)"

# 停止现有服务器
echo "Stopping any existing servers..."
pkill -f 'python3 -m http.server 3001' || true
pkill -f 'react-scripts start' || true

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

# 重新构建项目
echo "Building React project without proxy..."
npm run build

# 获取WSL IP
WSL_IP=$(hostname -I | awk '{print $1}')
echo "WSL IP Address: $WSL_IP"

# 启动Python HTTP服务器
echo "Starting Python HTTP server on port 3001..."
cd build
python3 -m http.server 3001 > ../server.log 2>&1 &

echo "✅ Server started successfully!"
echo "🌐 Access from Windows: http://$WSL_IP:3001"
echo "📝 Server logs: $(pwd)/../server.log"
echo ""
echo "To stop the server, run: pkill -f 'python3 -m http.server 3001'"