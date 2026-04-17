# =========================
# Stage 1: Frontend build
# =========================
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ .

# Vite builds to dist/
RUN npm run build


# =========================
# Stage 2: Backend runtime
# =========================
FROM node:18-slim

WORKDIR /app

# Copy backend dependencies first
COPY server/package*.json ./server/
WORKDIR /app/server

RUN npm ci --only=production && npm cache clean --force

# Copy backend source
COPY server/ .

# =========================
# Copy frontend build (FIXED)
# =========================
WORKDIR /app

COPY --from=frontend-builder /app/client/dist ./server/public

# Expose backend port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000', (r) => { if (r.statusCode !== 200) process.exit(1) })"

# Start backend
CMD ["node", "server/index.js"]