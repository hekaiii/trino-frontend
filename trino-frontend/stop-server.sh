#!/bin/bash

# Trino Frontend Server Stop Script
# This script stops the Python HTTP server

PORT=3000

echo "Stopping Trino Frontend Server on port $PORT..."

# Stop the server
pkill -f "python3 -m http.server $PORT" 2>/dev/null

# Wait a moment
sleep 2

# Verify server is stopped
if netstat -tulpn | grep -q ":$PORT "; then
    echo "❌ Server may still be running on port $PORT"
    echo "You may need to manually kill the process"
else
    echo "✅ Server stopped successfully!"
fi