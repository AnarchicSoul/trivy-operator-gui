#!/bin/sh
set -e

# Generate nginx config from template with BACKEND_SERVICE_NAME substitution
echo "Generating nginx configuration with BACKEND_SERVICE_NAME=${BACKEND_SERVICE_NAME}"

# Use sed to replace only ${BACKEND_SERVICE_NAME}, leaving nginx $ variables untouched
sed "s/\${BACKEND_SERVICE_NAME}/${BACKEND_SERVICE_NAME}/g" /tmp/nginx-template.conf > /etc/nginx/conf.d/default.conf

echo "Nginx configuration generated successfully"
cat /etc/nginx/conf.d/default.conf
