# =============================================================================
# Multi-Stage Build für Immobilien-App
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev deps for build)
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Production
# -----------------------------------------------------------------------------
FROM nginx:1.25-alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

# Expose port
EXPOSE 80

# Labels for metadata
LABEL org.opencontainers.image.title="Immobilien-App"
LABEL org.opencontainers.image.description="OVM-Checklisten für Immobilien-Besichtigung"
LABEL org.opencontainers.image.vendor="Robin"
LABEL org.opencontainers.image.source="https://github.com/OWNER/REPO"

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
