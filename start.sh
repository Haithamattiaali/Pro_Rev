#!/bin/bash

echo "Starting Proceed Revenue Dashboard..."

# Kill any existing processes on our ports
echo "Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Navigate to backend directory
cd backend

# Install backend dependencies
echo "Installing backend dependencies..."
npm install

# Initialize database with existing data
echo "Initializing database..."
npm run init-db

# Start backend server in background
echo "Starting backend server on port 3001..."
npm start &
BACKEND_PID=$!

# Give backend time to start
sleep 3

# Navigate back to root directory
cd ..

# Start frontend server
echo "Starting frontend server on port 5173..."
npm run dev

# If frontend exits, kill backend
kill $BACKEND_PID 2>/dev/null