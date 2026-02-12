#!/bin/bash

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=========================================="
echo "Work Order Dashboard - Local Preview"
echo "=========================================="
echo ""
echo "Starting server on http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""
echo "Opening browser..."
echo ""

# Start the server in the background
python3 -m http.server 8000 &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Open browser
open http://localhost:8000 2>/dev/null || xdg-open http://localhost:8000 2>/dev/null || echo "Please open http://localhost:8000 in your browser"

# Wait for user to stop
echo ""
echo "Server is running. Press Ctrl+C to stop..."
wait $SERVER_PID



