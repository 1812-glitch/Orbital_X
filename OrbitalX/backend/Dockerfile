# Production Dockerfile for OrbitalX Backend
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build tools for native addons (e.g. bcrypt)
RUN apk add --no-cache python3 make g++

# Copy package definitions
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Expose API port
EXPOSE 4000

# Environment defaults
ENV NODE_ENV=production
ENV PORT=4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/api/health || exit 1

# Start backend server
CMD ["node", "server.js"]
