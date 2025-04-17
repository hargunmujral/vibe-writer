#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting dependency fixes for Vibe Writer Frontend...${NC}"

# Clean up Next.js build artifacts
echo -e "${YELLOW}Cleaning up Next.js build artifacts...${NC}"
if [ -d ".next" ]; then
  rm -rf .next
  echo -e "${GREEN}Removed .next directory${NC}"
fi

# Clean up node_modules
echo -e "${YELLOW}Cleaning up node_modules...${NC}"
if [ -d "node_modules" ]; then
  rm -rf node_modules
  echo -e "${GREEN}Removed node_modules directory${NC}"
fi

# Check for npm cache issues
echo -e "${YELLOW}Cleaning npm cache...${NC}"
npm cache clean --force
echo -e "${GREEN}Cleaned npm cache${NC}"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to install dependencies. Please check your network connection and try again.${NC}"
  exit 1
fi

# Install specific Babel dependencies
echo -e "${YELLOW}Installing Babel dependencies...${NC}"
npm install --save @babel/runtime
npm install --save-dev @babel/core @babel/plugin-transform-runtime

echo -e "${GREEN}Dependencies installed successfully${NC}"
echo -e "${YELLOW}Now you can run 'npm run dev' to start the development server${NC}" 