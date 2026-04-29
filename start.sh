#!/bin/bash
set -e

# Start MongoDB if not running
if ! pgrep -x mongod > /dev/null; then
    mkdir -p /tmp/mongodb/data /tmp/mongodb/logs
    mongod --dbpath /tmp/mongodb/data --logpath /tmp/mongodb/logs/mongod.log --fork --quiet
    echo "MongoDB started"
fi

# Start backend in background
cd /home/runner/workspace/backend
MONGO_URL=mongodb://localhost:27017 DB_NAME=parkpal JWT_SECRET=parkpal_dev_secret_key_2024 python -m uvicorn server:app --host localhost --port 8000 &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
sleep 3

# Start frontend
cd /home/runner/workspace/frontend
PORT=5000 HOST=0.0.0.0 REACT_APP_BACKEND_URL="" yarn start
