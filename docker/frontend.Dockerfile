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

# Create nginx config template
COPY <<'EOF' /tmp/nginx-template.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Main location
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://${BACKEND_SERVICE_NAME}:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Create custom entrypoint script
COPY <<'EOF' /docker-entrypoint.d/40-generate-config.sh
#!/bin/sh
set -e

# Generate nginx config from template with environment variable substitution
echo "Generating nginx configuration with BACKEND_SERVICE_NAME=${BACKEND_SERVICE_NAME}"
envsubst '${BACKEND_SERVICE_NAME}' < /tmp/nginx-template.conf > /etc/nginx/conf.d/default.conf

echo "Nginx configuration generated successfully"
cat /etc/nginx/conf.d/default.conf
EOF

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
