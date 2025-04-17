#!/bin/bash

# Start the FastAPI backend in the background
echo "Starting FastAPI backend..."
cd /app && python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --no-access-log &
BACKEND_PID=$!

# Wait for backend to start up
echo "Waiting for backend to be ready..."
sleep 5

# Start the Next.js frontend
echo "Starting Next.js frontend..."
cd /app/frontend && npm run start

# If the frontend stops, also stop the backend
kill $BACKEND_PID 