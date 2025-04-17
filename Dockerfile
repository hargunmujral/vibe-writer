# Multi-stage build for Vibe Writer

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy package.json and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source code and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend and Final Image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (for serving Next.js)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && curl -sL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/

# Copy data directory structure (but not the data itself)
RUN mkdir -p data/projects

# Copy startup script
COPY start-container.sh ./
RUN chmod +x start-container.sh

# Expose ports
EXPOSE 3000 8000

# Start both services
CMD ["./start-container.sh"] 