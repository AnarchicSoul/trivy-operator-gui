# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
# Using npm install instead of npm ci since package-lock.json may not exist
RUN npm install --omit=dev

# Copy source code
COPY frontend/ ./

# Install dev dependencies for build (vite, etc.)
RUN npm install

# Build the application
RUN npm run build

# Production stage - serve with nginx
FROM nginx:1.25-alpine

# Install envsubst (part of gettext package)
RUN apk add --no-cache gettext

# Copy nginx config template and entrypoint script
COPY docker/nginx-template.conf /tmp/nginx-template.conf
COPY docker/40-generate-config.sh /docker-entrypoint.d/40-generate-config.sh

# Copy built application from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Setup permissions for nginx to run properly
# Nginx needs write access to these directories
RUN chmod +x /docker-entrypoint.d/40-generate-config.sh && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
