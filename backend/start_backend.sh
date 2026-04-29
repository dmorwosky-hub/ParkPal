#!/bin/bash

# Ensure MongoDB data directory exists
mkdir -p /tmp/mongodb/data /tmp/mongodb/logs

# Check if mongod is running and start if not
mongosh --quiet --eval "db.runCommand({ping:1})" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    mongod --dbpath /tmp/mongodb/data --logpath /tmp/mongodb/logs/mongod.log --fork --quiet
    echo "MongoDB starting..."
    # Wait for MongoDB to be ready (up to 15 seconds)
    for i in $(seq 1 15); do
        if mongosh --quiet --eval "db.runCommand({ping:1})" > /dev/null 2>&1; then
            echo "MongoDB is ready"
            break
        fi
        sleep 1
    done
else
    echo "MongoDB already running"
fi

# Export environment variables
export MONGO_URL=mongodb://localhost:27017
export DB_NAME=parkpal
export JWT_SECRET=parkpal_dev_secret_key_2024

# Change to backend directory
cd /home/runner/workspace/backend

# Start the FastAPI backend (this must stay in foreground)
exec python -m uvicorn server:app --host localhost --port 8000
