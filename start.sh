#!/bin/bash

# ============================================
# AI Elder Care Companion - Start Script
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════╗"
echo "║     AI Elder Care Companion                  ║"
echo "║     Starting Application...                  ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found. Please create one.${NC}"
  exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# Function to kill process on a port
kill_port() {
  local port=$1
  local pid=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo -e "${YELLOW}  Killing process on port $port (PID: $pid)${NC}"
    kill -9 $pid 2>/dev/null || true
    sleep 1
  fi
}

# Clean up ports
echo -e "\n${BLUE}[1/6] Cleaning up ports...${NC}"
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT
echo -e "${GREEN}✓ Ports $BACKEND_PORT and $FRONTEND_PORT are free${NC}"

# Check PostgreSQL
echo -e "\n${BLUE}[2/6] Checking PostgreSQL...${NC}"
if command -v pg_isready &> /dev/null; then
  if pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
  else
    echo -e "${YELLOW}! PostgreSQL not ready, attempting to start...${NC}"
    if command -v brew &> /dev/null; then
      brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    fi
    sleep 2
    if pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} &> /dev/null; then
      echo -e "${GREEN}✓ PostgreSQL started${NC}"
    else
      echo -e "${RED}✗ Could not start PostgreSQL. Please start it manually.${NC}"
      exit 1
    fi
  fi
else
  echo -e "${YELLOW}! pg_isready not found. Assuming PostgreSQL is running.${NC}"
fi

# Create database if not exists
echo -e "\n${BLUE}[3/6] Setting up database...${NC}"
PGPASSWORD=${DB_PASSWORD:-postgres} psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME:-eldercare}'" 2>/dev/null | grep -q 1 || \
PGPASSWORD=${DB_PASSWORD:-postgres} psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -c "CREATE DATABASE ${DB_NAME:-eldercare}" 2>/dev/null || true
echo -e "${GREEN}✓ Database '${DB_NAME:-eldercare}' ready${NC}"

# Install backend dependencies
echo -e "\n${BLUE}[4/6] Installing backend dependencies...${NC}"
cd backend
if [ ! -d node_modules ]; then
  npm install
else
  echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi

# Seed database
echo -e "\n${BLUE}[5/6] Seeding database...${NC}"
node seed.js
cd ..

# Install frontend dependencies
echo -e "\n${BLUE}[6/6] Installing frontend dependencies...${NC}"
cd frontend
if [ ! -d node_modules ]; then
  npm install
else
  echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi
cd ..

echo -e "\n${CYAN}"
echo "╔══════════════════════════════════════════════╗"
echo "║     Starting Services with Hot Reload        ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Cleanup function
cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  kill_port $BACKEND_PORT
  kill_port $FRONTEND_PORT
  echo -e "${GREEN}✓ All services stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend with nodemon (hot reload)
echo -e "${GREEN}Starting backend on port $BACKEND_PORT with hot reload (nodemon)...${NC}"
cd backend
npx nodemon server.js &
BACKEND_PID=$!
cd ..

sleep 2

# Start frontend with hot reload (built into react-scripts)
echo -e "${GREEN}Starting frontend on port $FRONTEND_PORT with hot reload...${NC}"
cd frontend
BROWSER=none PORT=$FRONTEND_PORT npm start &
FRONTEND_PID=$!
cd ..

sleep 3

echo -e "\n${CYAN}"
echo "╔══════════════════════════════════════════════╗"
echo "║     Application Started Successfully!        ║"
echo "║                                              ║"
echo "║  Frontend:  http://localhost:$FRONTEND_PORT          ║"
echo "║  Backend:   http://localhost:$BACKEND_PORT          ║"
echo "║                                              ║"
echo "║  Login Credentials:                          ║"
echo "║  Admin:     admin@eldercare.com / password123║"
echo "║  Nurse:     nurse@eldercare.com / password123║"
echo "║  Caregiver: caregiver@eldercare.com          ║"
echo "║             password123                      ║"
echo "║                                              ║"
echo "║  Hot reload enabled for both services        ║"
echo "║  Press Ctrl+C to stop                        ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
