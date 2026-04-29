#!/bin/bash
set -e

# Start MongoDB if not running
if ! pgrep -x mongod > /dev/null; then
    mkdir -p /tmp/mongodb/data /tmp/mongodb/logs
    mongod --dbpath /tmp/mongodb/data --logpath /tmp/mongodb/logs/mongod.log --fork --quiet
    echo "MongoDB started"
fi

# Start backend — serves API routes + compiled React frontend
cd /home/runner/workspace/backend
python -m uvicorn server:app --host 0.0.0.0 --port 8000
