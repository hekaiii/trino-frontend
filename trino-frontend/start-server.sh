#!/bin/bash

# Trino Frontend Server Startup Script
# This script starts the Python HTTP server to serve the static files
# for Windows access from WSL environment

PROJECT_DIR="/home/hekai/project/queryu/trino-frontend"
PORT=3001

echo "Starting Trino Frontend Server..."
echo "Project directory: $PROJECT_DIR"
echo "Port: $PORT"

# Navigate to project directory
cd "$PROJECT_DIR" || {
    echo "Error: Cannot navigate to project directory $PROJECT_DIR"
    exit 1
}

# Build the project if build directory doesn't exist or is older than src
if [ ! -d "build" ] || [ "src" -nt "build" ]; then
    echo "Building React project..."
    npm run build
fi

# Navigate to build directory
cd build || {
    echo "Error: Cannot navigate to build directory"
    exit 1
}

# Check if port is already in use
if netstat -tulpn | grep -q ":$PORT "; then
    echo "Port $PORT is already in use. Stopping existing server..."
    pkill -f "python3 -m http.server $PORT" 2>/dev/null || true
    sleep 2
fi

# Get WSL IP address
WSL_IP=$(ip addr show eth0 | grep "inet " | awk '{print $2}' | cut -d/ -f1)
echo "WSL IP Address: $WSL_IP"

# Start Python HTTP server in background
echo "Starting Python HTTP server on port $PORT..."
nohup python3 -m http.server $PORT --bind 0.0.0.0 > server.log 2>&1 &

# Wait a moment for server to start
sleep 2

# Verify server is running
if netstat -tulpn | grep -q ":$PORT "; then
    echo "✅ Server started successfully!"
    echo "🌐 Access from Windows: http://$WSL_IP:$PORT"
    echo "📝 Server logs: $PROJECT_DIR/server.log"
    echo ""
    echo "To stop the server, run: pkill -f 'python3 -m http.server $PORT'"
else
    echo "❌ Failed to start server on port $PORT"
    exit 1
fi