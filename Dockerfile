# Multi-stage build for Contendo Business Management Platform
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /app

# Copy backend package files
COPY package*.json ./

# Install backend dependencies (including dev dependencies for build)
RUN npm ci

# Create frontend directory and install frontend dependencies
RUN mkdir -p src/client
WORKDIR /app/src/client
COPY src/client/package*.json ./
RUN npm ci
WORKDIR /app

# Copy source code (after dependencies are installed)
COPY . .

# Build frontend first (needs node_modules)
WORKDIR /app/src/client
RUN echo "=== Building frontend ===" && \
    echo "Current directory: $(pwd)" && \
    echo "Contents before build:" && ls -la . && \
    npm run build && \
    echo "=== Build complete, checking output ===" && \
    echo "Current directory: $(pwd)" && \
    echo "Contents after build:" && ls -la . && \
    echo "Checking parent directory:" && ls -la .. && \
    echo "Checking /app/public:" && (ls -la /app/public/ 2>/dev/null || echo "public directory does not exist") && \
    echo "Checking /app/public/client:" && (ls -la /app/public/client/ 2>/dev/null || echo "public/client directory does not exist") && \
    echo "Checking /app/public/client/dist:" && (ls -la /app/public/client/dist/ 2>/dev/null || echo "public/client/dist directory does not exist") && \
    (test -d /app/public/client/dist && echo "✅ Found at /app/public/client/dist" && ls -la /app/public/client/dist/ | head -10) || \
    (echo "❌ Not found at /app/public/client/dist, checking alternatives..." && \
     find /app -name "index.html" -type f 2>/dev/null | head -10 || \
     echo "No index.html found anywhere")

# Build TypeScript backend (excludes client directory)
WORKDIR /app
RUN npm run build

# Production stage
FROM node:20-alpine AS production

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

# Create public directory structure
RUN mkdir -p ./public/client

# Copy frontend build - copy the entire public directory if it exists
# First check if it exists in builder stage
RUN --mount=from=builder,source=/app,target=/check \
    echo "=== Checking builder stage for public directory ===" && \
    (test -d /check/public && echo "✅ Found /app/public in builder" && ls -la /check/public/ | head -10) || \
    (echo "❌ /app/public not found in builder, checking /check:" && ls -la /check/ | head -20)

# Copy frontend build
COPY --from=builder --chown=contendo:nodejs /app/public ./public

# Verify frontend files were copied
RUN echo "=== Verifying frontend files in production stage ===" && \
    echo "Contents of ./public:" && (ls -la ./public/ 2>/dev/null || echo "public directory does not exist") && \
    echo "Contents of ./public/client:" && (ls -la ./public/client/ 2>/dev/null || echo "public/client directory does not exist") && \
    echo "Contents of ./public/client/dist:" && (ls -la ./public/client/dist/ 2>/dev/null || echo "public/client/dist directory does not exist") && \
    (test -f ./public/client/dist/index.html && echo "✅ index.html found!") || \
    (echo "❌ index.html NOT found!" && find ./public -name "*.html" 2>/dev/null || echo "No HTML files found")

# Create logs and uploads directories
RUN mkdir -p logs uploads && chown -R contendo:nodejs logs uploads

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
