# Docker - Build et Push des Images

Ce dossier contient les Dockerfiles et configurations pour construire les images du backend et du frontend.

## Structure

```
docker/
├── backend.Dockerfile          # Image Go pour le backend
├── frontend.Dockerfile         # Image Nginx + React pour le frontend
├── nginx-template.conf         # Configuration Nginx
└── 40-generate-config.sh       # Script de génération de config Nginx
```

## Prérequis

- Docker installé (v20.10+)
- Compte Docker Hub (pour push)
- Authentification Docker Hub configurée (`docker login`)

## Build des Images

### Backend

```bash
# Depuis la racine du projet
cd trivy-operator-gui

# Build l'image backend
docker build -f docker/backend.Dockerfile -t johan91/trivy-operator-gui-backend:latest ./backend

# Ou avec une version spécifique
docker build -f docker/backend.Dockerfile -t johan91/trivy-operator-gui-backend:v1.0.0 ./backend
```

### Frontend

```bash
# Depuis la racine du projet
cd trivy-operator-gui

# Build l'image frontend
docker build -f docker/frontend.Dockerfile -t johan91/trivy-operator-gui-frontend:latest ./frontend

# Ou avec une version spécifique
docker build -f docker/frontend.Dockerfile -t johan91/trivy-operator-gui-frontend:v1.0.0 ./frontend
```

## Push vers Docker Hub

### Se connecter à Docker Hub

```bash
docker login
# Entrez votre nom d'utilisateur (johan91) et mot de passe
```

### Push des images

```bash
# Push backend
docker push johan91/trivy-operator-gui-backend:latest
docker push johan91/trivy-operator-gui-backend:v1.0.0

# Push frontend
docker push johan91/trivy-operator-gui-frontend:latest
docker push johan91/trivy-operator-gui-frontend:v1.0.0
```

## Build et Push Multi-Architecture (optionnel)

Pour supporter différentes architectures (amd64, arm64) :

```bash
# Créer un builder multi-plateforme
docker buildx create --name multiarch --use
docker buildx inspect --bootstrap

# Build et push backend multi-arch
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f docker/backend.Dockerfile \
  -t johan91/trivy-operator-gui-backend:latest \
  --push \
  ./backend

# Build et push frontend multi-arch
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f docker/frontend.Dockerfile \
  -t johan91/trivy-operator-gui-frontend:latest \
  --push \
  ./frontend
```

## Tester les Images Localement

### Backend

```bash
# Lancer le backend (nécessite un kubeconfig)
docker run -p 8080:8080 \
  -v ~/.kube/config:/home/appuser/.kube/config:ro \
  johan91/trivy-operator-gui-backend:latest

# Tester l'API
curl http://localhost:8080/health
```

### Frontend

```bash
# Lancer le frontend
docker run -p 8081:80 \
  -e BACKEND_URL=http://localhost:8080 \
  johan91/trivy-operator-gui-frontend:latest

# Ouvrir dans le navigateur
# http://localhost:8081
```

## Variables d'Environnement

### Backend

- `PORT` : Port d'écoute (défaut: 8080)
- Utilise automatiquement le kubeconfig in-cluster en production

### Frontend

- `BACKEND_URL` : URL du backend API (configuré au runtime par nginx)
- Configuration dynamique via `/etc/nginx/conf.d/default.conf`

## Détails Techniques

### Backend Dockerfile

- **Build stage** :
  - Base: `golang:1.21-alpine`
  - Génère `go.sum` automatiquement
  - Compile un binaire statique
- **Runtime stage** :
  - Base: `alpine:3.19`
  - Utilisateur non-root (UID 1000)
  - Health check sur `/health`
  - Expose port 8080

### Frontend Dockerfile

- **Build stage** :
  - Base: `node:20-alpine`
  - Build avec Vite
  - Optimisé pour production
- **Runtime stage** :
  - Base: `nginx:1.25-alpine`
  - Configuration dynamique Nginx
  - Proxy API vers backend
  - Utilisateur non-root
  - Expose port 80

## Sécurité

Les images suivent les bonnes pratiques :

- ✅ Multi-stage builds (images finales légères)
- ✅ Utilisateurs non-root
- ✅ Pas de secrets dans les layers
- ✅ Binaires statiques (backend)
- ✅ Images Alpine minimales
- ✅ Health checks configurés

## Troubleshooting

### Erreur "go.sum missing"

Le backend génère automatiquement `go.sum` lors du build :

```dockerfile
RUN go mod tidy
```

### Erreur de permissions

Les images utilisent des utilisateurs non-root. Assurez-vous que les volumes montés ont les bonnes permissions.

### Problème de proxy Nginx

Le frontend utilise un script d'entrypoint qui génère la config Nginx au runtime. Vérifiez la variable d'environnement `BACKEND_URL`.

## Versionning

Recommandations de versioning :

```bash
# Version patch
docker tag johan91/trivy-operator-gui-backend:latest johan91/trivy-operator-gui-backend:v1.0.1

# Version minor
docker tag johan91/trivy-operator-gui-backend:latest johan91/trivy-operator-gui-backend:v1.1.0

# Version major
docker tag johan91/trivy-operator-gui-backend:latest johan91/trivy-operator-gui-backend:v2.0.0

# Push tous les tags
docker push johan91/trivy-operator-gui-backend --all-tags
```

## Script de Build Automatisé

Créez un script `build-and-push.sh` :

```bash
#!/bin/bash
set -e

VERSION=${1:-latest}
DOCKER_USER=${2:-johan91}

echo "Building version: $VERSION"

# Build backend
docker build -f docker/backend.Dockerfile \
  -t $DOCKER_USER/trivy-operator-gui-backend:$VERSION \
  ./backend

# Build frontend
docker build -f docker/frontend.Dockerfile \
  -t $DOCKER_USER/trivy-operator-gui-frontend:$VERSION \
  ./frontend

# Push
echo "Pushing to Docker Hub..."
docker push $DOCKER_USER/trivy-operator-gui-backend:$VERSION
docker push $DOCKER_USER/trivy-operator-gui-frontend:$VERSION

echo "Done! Images pushed:"
echo "  - $DOCKER_USER/trivy-operator-gui-backend:$VERSION"
echo "  - $DOCKER_USER/trivy-operator-gui-frontend:$VERSION"
```

Usage :

```bash
chmod +x build-and-push.sh
./build-and-push.sh v1.0.0 johan91
```
