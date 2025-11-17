#!/bin/bash

# Rebuild and deploy script for trivy-operator-gui
# This script rebuilds Docker images without cache and redeploys the Helm chart

set -e  # Exit on error

# Configuration
DOCKER_REGISTRY="johan91"
RELEASE_NAME="my-trivy-gui"
NAMESPACE="trivy-operator-gui"

echo "========================================"
echo "Trivy Operator GUI - Rebuild & Deploy"
echo "========================================"
echo ""

# Step 1: Build backend
echo "Step 1/4: Building backend Docker image (without cache)..."
sudo docker build --no-cache \
  -f docker/backend.Dockerfile \
  -t ${DOCKER_REGISTRY}/trivy-operator-gui-backend:latest \
  .
echo "✓ Backend image built successfully"
echo ""

# Step 2: Build frontend
echo "Step 2/4: Building frontend Docker image (without cache)..."
sudo docker build --no-cache \
  -f docker/frontend.Dockerfile \
  -t ${DOCKER_REGISTRY}/trivy-operator-gui-frontend:latest \
  .
echo "✓ Frontend image built successfully"
echo ""

# Step 3: Push images
echo "Step 3/4: Pushing images to Docker Hub..."
sudo docker push ${DOCKER_REGISTRY}/trivy-operator-gui-backend:latest
sudo docker push ${DOCKER_REGISTRY}/trivy-operator-gui-frontend:latest
echo "✓ Images pushed successfully"
echo ""

# Step 4: Deploy/Upgrade Helm chart
echo "Step 4/4: Deploying Helm chart..."

# Check if release exists
if helm list -n ${NAMESPACE} | grep -q ${RELEASE_NAME}; then
  echo "Upgrading existing release..."
  helm upgrade ${RELEASE_NAME} ./helm/trivy-operator-gui \
    --namespace ${NAMESPACE} \
    --set trivy-operator.enabled=true \
    --set backend.image.repository=${DOCKER_REGISTRY}/trivy-operator-gui-backend \
    --set backend.image.tag=latest \
    --set backend.image.pullPolicy=Always \
    --set frontend.image.repository=${DOCKER_REGISTRY}/trivy-operator-gui-frontend \
    --set frontend.image.tag=latest \
    --set frontend.image.pullPolicy=Always
else
  echo "Installing new release..."
  helm install ${RELEASE_NAME} ./helm/trivy-operator-gui \
    --namespace ${NAMESPACE} \
    --create-namespace \
    --set trivy-operator.enabled=true \
    --set backend.image.repository=${DOCKER_REGISTRY}/trivy-operator-gui-backend \
    --set backend.image.tag=latest \
    --set backend.image.pullPolicy=Always \
    --set frontend.image.repository=${DOCKER_REGISTRY}/trivy-operator-gui-frontend \
    --set frontend.image.tag=latest \
    --set frontend.image.pullPolicy=Always
fi

echo "✓ Helm chart deployed successfully"
echo ""

# Step 5: Wait for pods to be ready
echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod \
  -l app.kubernetes.io/instance=${RELEASE_NAME} \
  -n ${NAMESPACE} \
  --timeout=120s || true

echo ""
echo "========================================"
echo "Deployment Status"
echo "========================================"
kubectl get pods -n ${NAMESPACE}

echo ""
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "To view logs:"
echo "  Backend:  kubectl logs -n ${NAMESPACE} -l app.kubernetes.io/component=backend -f"
echo "  Frontend: kubectl logs -n ${NAMESPACE} -l app.kubernetes.io/component=frontend -f"
echo ""
echo "To check pod status:"
echo "  kubectl get pods -n ${NAMESPACE} -w"
echo ""
