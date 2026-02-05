# Atera MCP Server Dockerfile
# Multi-stage build for minimal production image

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install dependencies
RUN npm ci

# Copy source files
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S mcp && \
    adduser -S mcp -u 1001 -G mcp

# Copy built artifacts and production dependencies
COPY --from=builder --chown=mcp:mcp /app/dist ./dist
COPY --from=builder --chown=mcp:mcp /app/node_modules ./node_modules
COPY --from=builder --chown=mcp:mcp /app/package.json ./

# Switch to non-root user
USER mcp

# Set environment variables
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('healthy')" || exit 1

# Run the MCP server
CMD ["node", "dist/index.js"]
