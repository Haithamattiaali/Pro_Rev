#!/bin/bash

echo "Starting backend server..."

cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing backend dependencies..."
  npm install
fi

# Initialize database if not exists
if [ ! -f "database/proceed_revenue.db" ]; then
  echo "Initializing database..."
  npm run init-db
fi

# Start server
echo "Starting backend on port 3001..."
node server.js