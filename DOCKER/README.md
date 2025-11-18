# Docker Images

This directory contains all Dockerfiles for the Trivy Operator GUI project.

## Available Dockerfiles

### 1. Backend (`dockerfile-backend`)
**Image:** `johan91/trivy-operator-gui-backend`

Builds the Go backend API server.

**Build:**
```bash
docker build -f DOCKER/dockerfile-backend -t johan91/trivy-operator-gui-backend:latest .
```

**Context:** Root directory (needs access to `BINARIES-BACKEND/`)

**Base Image:** golang:1.21-alpine (builder), gcr.io/distroless/static:nonroot (runtime)

**Features:**
- Multi-stage build for minimal image size
- Non-root user for security
- Distroless runtime for reduced attack surface

---

### 2. Frontend (`dockerfile-frontend`)
**Image:** `johan91/trivy-operator-gui-frontend`

Builds the React frontend with Nginx.

**Build:**
```bash
docker build -f DOCKER/dockerfile-frontend -t johan91/trivy-operator-gui-frontend:latest .
```

**Context:** Root directory (needs access to `BINARIES-FRONTEND/` and `DOCKER/`)

**Base Image:** node:20-alpine (builder), nginx:alpine (runtime)

**Features:**
- Vite build for optimized frontend bundle
- Dynamic API configuration via environment variables
- Custom Nginx configuration
- Health endpoint at `/health`
- Non-root user (nginx user, uid 101)

**Runtime Configuration:**
- `BACKEND_URL`: Backend API URL (default: http://localhost:8080)
- Config generated at startup via `40-generate-config.sh`

---

### 3. ECS Exporter (`dockerfile-ecs_exporter`)
**Image:** `johan91/trivy-operator-ecs-exporter`

Builds the Elasticsearch exporter for Trivy reports.

**Build:**
```bash
docker build -f DOCKER/dockerfile-ecs_exporter -t johan91/trivy-operator-ecs-exporter:latest BINARIES-ECS_EXPORTER/
```

**Context:** `BINARIES-ECS_EXPORTER/` directory

**Base Image:** golang:1.21-alpine (builder), gcr.io/distroless/static:nonroot (runtime)

**Features:**
- Multi-stage build
- Minimal distroless runtime
- Non-root user (uid 65532)

---

## Build All Images

```bash
# Backend
docker build -f DOCKER/dockerfile-backend -t johan91/trivy-operator-gui-backend:latest .

# Frontend
docker build -f DOCKER/dockerfile-frontend -t johan91/trivy-operator-gui-frontend:latest .

# ECS Exporter
docker build -f DOCKER/dockerfile-ecs_exporter -t johan91/trivy-operator-ecs-exporter:latest BINARIES-ECS_EXPORTER/
```

## Push All Images

```bash
# Login to Docker Hub
docker login

# Push all images
docker push johan91/trivy-operator-gui-backend:latest
docker push johan91/trivy-operator-gui-frontend:latest
docker push johan91/trivy-operator-ecs-exporter:latest
```

## Multi-Architecture Builds

Use Docker Buildx for multi-architecture support:

```bash
# Create builder if needed
docker buildx create --name multiarch --use

# Build and push backend (AMD64 only for now)
docker buildx build \
  --platform linux/amd64 \
  -f DOCKER/dockerfile-backend \
  -t johan91/trivy-operator-gui-backend:latest \
  --push \
  .

# Build and push frontend (AMD64 only for now)
docker buildx build \
  --platform linux/amd64 \
  -f DOCKER/dockerfile-frontend \
  -t johan91/trivy-operator-gui-frontend:latest \
  --push \
  .

# Build and push ECS exporter (AMD64 + ARM64)
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f DOCKER/dockerfile-ecs_exporter \
  -t johan91/trivy-operator-ecs-exporter:latest \
  --push \
  BINARIES-ECS_EXPORTER/
```

## Helper Files

### `nginx-template.conf`
Nginx configuration template for the frontend. Features:
- Reverse proxy to backend API
- Health check endpoint
- Security headers
- Gzip compression
- SPA routing support

### `40-generate-config.sh`
Entrypoint script for frontend container:
- Generates `config.js` with backend URL
- Runs before Nginx starts
- Allows runtime configuration via environment variables

## CI/CD

Images are automatically built and pushed via GitHub Actions:
- **Workflow:** `.github/workflows/docker-build-push.yml`
- **Trigger:** Push to main/develop or tags
- **Registry:** Docker Hub
- **Tags:** branch name, PR number, semver, latest

See [GitHub Actions documentation](../.github/workflows/README.md) for details.

## Local Development

For local development, you don't need to build images. Use the source code directly:

```bash
# Backend
cd BINARIES-BACKEND
go run main.go

# Frontend
cd BINARIES-FRONTEND
npm install
npm run dev

# ECS Exporter
cd BINARIES-ECS_EXPORTER
go run cmd/exporter/main.go
```

## Image Security

All images follow security best practices:
- ✅ Multi-stage builds to reduce size
- ✅ Non-root users
- ✅ Minimal base images (Alpine, Distroless)
- ✅ No secrets in images
- ✅ Minimal attack surface
- ✅ Regular base image updates

## Troubleshooting

### Build Fails

**Issue:** `COPY failed: no such file or directory`

**Solution:** Ensure you're building from the correct context:
- Backend/Frontend: Build from project root (`.`)
- ECS Exporter: Build from `BINARIES-ECS_EXPORTER/`

### Image Too Large

Check image size:
```bash
docker images | grep trivy-operator
```

Expected sizes:
- Backend: ~20-30 MB
- Frontend: ~25-40 MB
- ECS Exporter: ~20-30 MB

If much larger, verify multi-stage build is working correctly.

### Frontend Can't Connect to Backend

Verify `BACKEND_URL` environment variable:
```bash
docker run -e BACKEND_URL=http://backend:8080 johan91/trivy-operator-gui-frontend
```

Check generated config:
```bash
docker run johan91/trivy-operator-gui-frontend cat /usr/share/nginx/html/config.js
```

## Related Documentation

- [Backend README](../BINARIES-BACKEND/README.md)
- [Frontend README](../BINARIES-FRONTEND/README.md)
- [ECS Exporter README](../BINARIES-ECS_EXPORTER/README.md)
- [Helm Charts](../helm/README.md)
