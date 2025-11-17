#!/bin/sh
set -e

# Generate nginx config from template with environment variable substitution
echo "Generating nginx configuration with BACKEND_SERVICE_NAME="
envsubst '' < /tmp/nginx-template.conf > /etc/nginx/conf.d/default.conf

echo "Nginx configuration generated successfully"
cat /etc/nginx/conf.d/default.conf
