#!/bin/bash

# Redeploy script for trivy-operator-gui
# This script deletes the existing deployment and redeploys using Docker Hub images

set -e  # Exit on error

# Configuration
DOCKER_REGISTRY="johan91"
RELEASE_NAME="my-trivy-gui"
NAMESPACE="trivy-operator-gui"
IMAGE_TAG="${1:-latest}"  # Allow custom tag, default to latest

echo "========================================"
echo "Trivy Operator GUI - Redeploy"
echo "========================================"
echo ""
echo "Docker Registry: ${DOCKER_REGISTRY}"
echo "Release Name: ${RELEASE_NAME}"
echo "Namespace: ${NAMESPACE}"
echo "Image Tag: ${IMAGE_TAG}"
echo ""

# Step 1: Check if release exists and delete it
echo "Step 1/3: Checking for existing deployment..."
if helm list -n ${NAMESPACE} 2>/dev/null | grep -q ${RELEASE_NAME}; then
  echo "⚠️  Existing release found. Uninstalling..."
  helm uninstall ${RELEASE_NAME} -n ${NAMESPACE}
  echo "✓ Release uninstalled successfully"

  # Wait for pods to terminate
  echo "Waiting for pods to terminate..."
  kubectl wait --for=delete pod \
    -l app.kubernetes.io/instance=${RELEASE_NAME} \
    -n ${NAMESPACE} \
    --timeout=60s 2>/dev/null || echo "No pods to wait for"
else
  echo "ℹ️  No existing release found"
fi
echo ""

# Step 2: Pull latest images from Docker Hub
echo "Step 2/3: Pulling latest images from Docker Hub..."
echo "Pulling backend image..."
docker pull ${DOCKER_REGISTRY}/trivy-operator-gui-backend:${IMAGE_TAG}
echo "Pulling frontend image..."
docker pull ${DOCKER_REGISTRY}/trivy-operator-gui-frontend:${IMAGE_TAG}
echo "✓ Images pulled successfully"
echo ""

# Step 3: Install fresh deployment
echo "Step 3/3: Installing fresh deployment..."
helm install ${RELEASE_NAME} ./helm/trivy-operator-gui \
  --namespace ${NAMESPACE} \
  --create-namespace \
  --set backend.image.repository=${DOCKER_REGISTRY}/trivy-operator-gui-backend \
  --set backend.image.tag=${IMAGE_TAG} \
  --set backend.image.pullPolicy=Always \
  --set frontend.image.repository=${DOCKER_REGISTRY}/trivy-operator-gui-frontend \
  --set frontend.image.tag=${IMAGE_TAG} \
  --set frontend.image.pullPolicy=Always

echo "✓ Fresh deployment installed successfully"
echo ""

# Step 4: Wait for pods to be ready
echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod \
  -l app.kubernetes.io/instance=${RELEASE_NAME} \
  -n ${NAMESPACE} \
  --timeout=180s || {
    echo "⚠️  Warning: Pods did not become ready within timeout"
    echo "Check pod status manually:"
    kubectl get pods -n ${NAMESPACE}
    kubectl describe pods -n ${NAMESPACE} -l app.kubernetes.io/instance=${RELEASE_NAME}
  }

echo ""
echo "========================================"
echo "Deployment Status"
echo "========================================"
kubectl get pods -n ${NAMESPACE} -o wide

echo ""
echo "Services:"
kubectl get svc -n ${NAMESPACE}

echo ""
echo "========================================"
echo "✅ Redeploy Complete!"
echo "========================================"
echo ""
echo "Useful commands:"
echo ""
echo "📊 View pod status:"
echo "  kubectl get pods -n ${NAMESPACE} -w"
echo ""
echo "📝 View logs:"
echo "  Backend:  kubectl logs -n ${NAMESPACE} -l app.kubernetes.io/component=backend -f"
echo "  Frontend: kubectl logs -n ${NAMESPACE} -l app.kubernetes.io/component=frontend -f"
echo ""
echo "🔍 Describe pods (for troubleshooting):"
echo "  kubectl describe pods -n ${NAMESPACE}"
echo ""
echo "🌐 Port-forward to access GUI:"
echo "  kubectl port-forward -n ${NAMESPACE} svc/${RELEASE_NAME}-frontend 8080:80"
echo "  Then open: http://localhost:8080"
echo ""
echo "🗑️  Uninstall:"
echo "  helm uninstall ${RELEASE_NAME} -n ${NAMESPACE}"
echo ""
