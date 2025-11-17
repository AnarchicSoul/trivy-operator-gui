#!/bin/sh
set -e

# Generate nginx config from template with BACKEND_SERVICE_NAME substitution
echo "Generating nginx configuration with BACKEND_SERVICE_NAME=${BACKEND_SERVICE_NAME}"

# Use sed with explicit variable to replace ${BACKEND_SERVICE_NAME}
BACKEND_NAME="${BACKEND_SERVICE_NAME}"
sed "s/\${BACKEND_SERVICE_NAME}/${BACKEND_NAME}/g" /tmp/nginx-template.conf > /etc/nginx/conf.d/default.conf

echo "Nginx configuration generated successfully"
cat /etc/nginx/conf.d/default.conf
