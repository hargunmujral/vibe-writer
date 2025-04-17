#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Vibe Writer Application...${NC}"

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3.8 or higher.${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
REQUIRED_VERSION="3.8"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo -e "${RED}Python version $PYTHON_VERSION is too old. Please install Python 3.8 or higher.${NC}"
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 16 or higher.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}Node.js version is too old. Please install Node.js 16 or higher.${NC}"
    exit 1
fi

# Check if the virtual environment exists, create if it doesn't
if [ ! -d "venv" ]; then
    echo -e "${BLUE}Creating virtual environment...${NC}"
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to create virtual environment. Please install the python3-venv package.${NC}"
        exit 1
    fi
fi

# Activate the virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to activate virtual environment.${NC}"
    exit 1
fi

# Install backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
pip install -r backend/requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install backend dependencies.${NC}"
    exit 1
fi

# Clean up any previous Next.js build artifacts
echo -e "${BLUE}Cleaning up previous frontend builds...${NC}"
if [ -d "frontend/.next" ]; then
    rm -rf frontend/.next
fi

# Install frontend dependencies
echo -e "${BLUE}Installing frontend dependencies...${NC}"
cd frontend && npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install frontend dependencies.${NC}"
    cd ..
    exit 1
fi
cd ..

# Create necessary directories
echo -e "${BLUE}Creating necessary directories...${NC}"
mkdir -p data/projects

# Start the backend in the background
echo -e "${GREEN}Starting backend server...${NC}"
(cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000) &
BACKEND_PID=$!

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend to start...${NC}"
sleep 3

# Start the frontend
echo -e "${GREEN}Starting frontend server...${NC}"
cd frontend && npm run dev

# When the frontend server is stopped, stop the backend server as well
kill $BACKEND_PID

echo -e "${GREEN}Vibe Writer application stopped${NC}" 