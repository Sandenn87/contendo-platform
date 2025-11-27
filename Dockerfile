# Multi-stage build for Contendo Business Management Platform
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript backend (excludes client directory)
RUN npm run build

# Build frontend
WORKDIR /app/src/client
COPY src/client/package*.json ./
RUN npm ci
COPY src/client/ ./
RUN npm run build
WORKDIR /app

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S contendo -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Install production dependencies only
COPY --from=builder --chown=contendo:nodejs /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder --chown=contendo:nodejs /app/dist ./dist
COPY --from=builder --chown=contendo:nodejs /app/src/client/dist ./public/client/dist

# Create logs directory
RUN mkdir -p logs && chown contendo:nodejs logs

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
