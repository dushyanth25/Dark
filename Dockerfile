# Multi-stage Dockerfile for MERN stack application
# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# Copy frontend package files first for Docker layer caching
COPY client/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY client/ .

# Build React application for production
RUN npm run build


# Stage 2: Production image with backend + built frontend
FROM node:18-slim

WORKDIR /app

# Copy built frontend from builder stage to public directory
# Express will serve these static files
COPY --from=frontend-builder /app/client/build ./public

# Copy backend package files first for optimal Docker layer caching
COPY server/package*.json ./

# Install backend dependencies in production mode only
# This excludes devDependencies and minimizes final image size
RUN npm ci --only=production && npm cache clean --force

# Copy backend source code
COPY server/ .

# Expose backend server port
EXPOSE 5000

# Health check to verify container is running and healthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the backend server
CMD ["node", "index.js"]
