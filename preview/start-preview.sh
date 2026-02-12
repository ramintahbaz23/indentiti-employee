#!/bin/bash

# Start Local Preview Server
echo "Starting preview server on http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""
cd "$(dirname "$0")"
python3 -m http.server 8000



