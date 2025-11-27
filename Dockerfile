# Multi-stage build for production
FROM node:18-alpine AS builder

# Install dependencies required for native modules and Playwright
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies for Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dumb-init

# Tell Playwright to use installed Chromium
ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S chronoautotee -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Install production dependencies only
COPY --from=builder --chown=chronoautotee:nodejs /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder --chown=chronoautotee:nodejs /app/dist ./dist
COPY --from=builder --chown=chronoautotee:nodejs /app/public ./public

# Create logs directory
RUN mkdir -p logs && chown chronoautotee:nodejs logs

# Switch to app user
USER chronoautotee

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT:-3000}/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
