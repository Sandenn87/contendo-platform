# Multi-stage build for Contendo Business Management Platform
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy backend package files and install dependencies
COPY package*.json ./
RUN npm ci

# Install frontend dependencies
WORKDIR /app/src/client
COPY src/client/package*.json ./
RUN npm ci

# Copy all source code
WORKDIR /app
COPY . .

# Build frontend (outputs to ../public/client/dist relative to src/client)
WORKDIR /app/src/client
RUN npm run build

# Verify frontend build exists
WORKDIR /app
RUN test -d /app/public/client/dist && test -f /app/public/client/dist/index.html && echo "✅ Frontend build verified" || (echo "❌ Frontend build failed" && ls -la /app/public/ 2>&1 || true && exit 1)

# Build TypeScript backend
WORKDIR /app
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S contendo -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Install production dependencies only
COPY --from=builder --chown=contendo:nodejs /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built backend
COPY --from=builder --chown=contendo:nodejs /app/dist ./dist

# Copy frontend build - ensure the directory structure is preserved
COPY --from=builder --chown=contendo:nodejs /app/public/client/dist ./public/client/dist

# Verify frontend files were copied
RUN test -f ./public/client/dist/index.html || (echo "Frontend files missing!" && exit 1)

# Create required directories with proper permissions
RUN mkdir -p logs uploads && \
    chown -R contendo:nodejs logs uploads

# Switch to app user
USER contendo

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT:-3000}/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
