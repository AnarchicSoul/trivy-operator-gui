# Backend - API Go pour Trivy Operator GUI

API REST en Go qui interroge les CRDs de Trivy Operator dans un cluster Kubernetes.

## Architecture

- **Langage** : Go 1.21
- **Framework HTTP** : Gin
- **Client Kubernetes** : client-go (officiel)
- **Port** : 8080

## Structure du Projet

```
backend/
├── go.mod                  # Dépendances Go
├── main.go                 # Point d'entrée, routes API
├── handlers/               # Gestionnaires HTTP
│   ├── dashboard.go        # Agrégation pour le dashboard
│   └── reports.go          # Endpoints pour rapports et pods
├── k8s/                    # Client Kubernetes
│   └── client.go           # Interaction avec l'API K8s
└── models/                 # Modèles de données
    └── vulnerability.go    # Structures pour CRDs Trivy
```

## Prérequis

- Go 1.21 ou supérieur
- Accès à un cluster Kubernetes avec Trivy Operator installé
- kubectl configuré (pour développement local)

## Installation des Dépendances

```bash
cd backend

# Télécharger les dépendances
go mod download

# Générer go.sum si nécessaire
go mod tidy
```

## Développement Local

### Lancer le serveur

```bash
# Depuis le dossier backend
cd backend

# Lancer avec auto-reload (nécessite air)
# Installation de air: go install github.com/cosmtrek/air@latest
air

# Ou lancer directement
go run main.go
```

Le serveur démarre sur `http://localhost:8080`

### Configuration

Le backend utilise automatiquement :

- **En développement** : `~/.kube/config` (kubeconfig local)
- **En production** : ServiceAccount in-cluster

Pas de variable d'environnement requise pour le démarrage de base.

### Variables d'environnement optionnelles

```bash
# Changer le port (défaut: 8080)
export PORT=9090

# Activer le mode debug Gin
export GIN_MODE=debug  # ou release

# Spécifier un kubeconfig custom
export KUBECONFIG=/path/to/custom/config
```

## Endpoints API

### Health Check

```bash
GET /health
```

Retourne le statut de santé du backend.

**Réponse** :
```json
{
  "status": "healthy"
}
```

### Dashboard

```bash
GET /api/dashboard
```

Agrège tous les rapports pour le dashboard.

**Réponse** :
```json
{
  "totalPods": 42,
  "totalVulnerabilities": 156,
  "totalConfigIssues": 23,
  "vulnerabilitySummary": {
    "criticalCount": 5,
    "highCount": 12,
    "mediumCount": 45,
    "lowCount": 94
  },
  "configIssueSummary": {
    "criticalCount": 2,
    "highCount": 8,
    "mediumCount": 10,
    "lowCount": 3
  },
  "podsByNamespace": {
    "default": 10,
    "kube-system": 15,
    "production": 17
  }
}
```

### Rapports

#### Tous les rapports de vulnérabilités

```bash
GET /api/reports/vulnerability?namespace=<namespace>
```

**Paramètres** :
- `namespace` (optionnel) : Filtrer par namespace

#### Tous les rapports de configuration

```bash
GET /api/reports/config-audit?namespace=<namespace>
```

### Pods

#### Liste des pods

```bash
GET /api/pods?namespace=<namespace>
```

Retourne la liste des pods avec leurs rapports agrégés.

**Paramètres** :
- `namespace` (optionnel) : Filtrer par namespace

**Réponse** :
```json
{
  "pods": [
    {
      "podName": "nginx-deployment-abc123",
      "namespace": "default",
      "totalVulnerabilities": 15,
      "totalConfigIssues": 3,
      "vulnerabilitySummary": {
        "criticalCount": 2,
        "highCount": 5,
        "mediumCount": 6,
        "lowCount": 2
      },
      "configIssueSummary": {
        "criticalCount": 0,
        "highCount": 1,
        "mediumCount": 2,
        "lowCount": 0
      }
    }
  ]
}
```

#### Détails d'un pod

```bash
GET /api/pods/:namespace/:podName
```

Retourne tous les rapports (vulnérabilités et config) pour un pod spécifique.

### Catégories

```bash
GET /api/category/:severity
```

Retourne toutes les vulnérabilités d'une sévérité donnée.

**Paramètres** :
- `severity` : CRITICAL, HIGH, MEDIUM, LOW, UNKNOWN

### Namespaces

```bash
GET /api/namespaces
```

Retourne la liste de tous les namespaces du cluster.

## Tests

### Tests manuels avec curl

```bash
# Health check
curl http://localhost:8080/health

# Dashboard
curl http://localhost:8080/api/dashboard | jq

# Pods (tous)
curl http://localhost:8080/api/pods | jq

# Pods (namespace spécifique)
curl http://localhost:8080/api/pods?namespace=default | jq

# Détail d'un pod
curl http://localhost:8080/api/pods/default/nginx-abc123 | jq

# Vulnérabilités critiques
curl http://localhost:8080/api/category/CRITICAL | jq

# Namespaces
curl http://localhost:8080/api/namespaces | jq
```

### Tests unitaires (à implémenter)

```bash
# Lancer les tests
go test ./...

# Avec couverture
go test -cover ./...

# Générer rapport de couverture
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

## Build

### Build local

```bash
cd backend

# Build binaire
go build -o trivy-operator-gui-backend main.go

# Lancer le binaire
./trivy-operator-gui-backend
```

### Build avec optimisations

```bash
# Build statique (pour Alpine Linux)
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
  -ldflags="-w -s" \
  -o trivy-operator-gui-backend \
  main.go

# Vérifier le binaire
file trivy-operator-gui-backend
./trivy-operator-gui-backend
```

## Développement

### Ajouter un nouveau endpoint

1. Créer le handler dans `handlers/` :

```go
// handlers/myhandler.go
package handlers

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func (h *Handler) GetMyData(c *gin.Context) {
    // Logique ici
    c.JSON(http.StatusOK, gin.H{
        "data": "my data",
    })
}
```

2. Enregistrer la route dans `main.go` :

```go
api := r.Group("/api")
{
    api.GET("/mydata", handler.GetMyData)
}
```

### Ajouter un nouveau modèle

Modifier `models/vulnerability.go` :

```go
type MyNewModel struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`
    Data              MyData `json:"data"`
}

type MyData struct {
    Field1 string `json:"field1"`
    Field2 int    `json:"field2"`
}
```

### Interroger un nouveau CRD

Dans `k8s/client.go` :

```go
func (c *Client) GetMyNewReports(ctx context.Context, namespace string) (*models.MyNewReportList, error) {
    gvr := schema.GroupVersionResource{
        Group:    "aquasecurity.github.io",
        Version:  "v1alpha1",
        Resource: "mynewreports",
    }

    var result *models.MyNewReportList
    err := c.DynamicClient.Resource(gvr).
        Namespace(namespace).
        List(ctx, metav1.ListOptions{}).
        Into(result)

    return result, err
}
```

## Debugging

### Logs détaillés

```bash
# Mode debug Gin
export GIN_MODE=debug
go run main.go
```

### Profiling

Ajouter le profiler :

```go
import _ "net/http/pprof"

// Dans main()
go func() {
    log.Println(http.ListenAndServe("localhost:6060", nil))
}()
```

Accéder au profiler :

```bash
# CPU profile
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# Memory profile
go tool pprof http://localhost:6060/debug/pprof/heap

# Goroutines
curl http://localhost:6060/debug/pprof/goroutine?debug=1
```

## Dépendances Principales

```go
require (
    github.com/gin-gonic/gin v1.9.1           // Framework HTTP
    k8s.io/client-go v0.28.4                   // Client Kubernetes
    k8s.io/apimachinery v0.28.4                // Types K8s
    k8s.io/api v0.28.4                         // API K8s
)
```

## CORS

Le backend autorise toutes les origines en développement. Pour la production, modifiez `main.go` :

```go
// Production : restreindre les origines
config := cors.DefaultConfig()
config.AllowOrigins = []string{"https://trivy-gui.example.com"}
r.Use(cors.New(config))
```

## Sécurité

### Bonnes pratiques implémentées

- ✅ Utilisation de client-go officiel
- ✅ Contexte pour toutes les requêtes K8s
- ✅ Pas de secrets en dur
- ✅ RBAC minimal (lecture seule)
- ✅ Health checks
- ✅ Timeouts configurés

### RBAC requis

Le ServiceAccount doit avoir ces permissions :

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: trivy-operator-gui
rules:
  - apiGroups: ["aquasecurity.github.io"]
    resources:
      - vulnerabilityreports
      - configauditreports
      - exposedsecretreports
    verbs: ["get", "list", "watch"]

  - apiGroups: [""]
    resources:
      - namespaces
      - pods
    verbs: ["get", "list"]
```

## Troubleshooting

### Erreur "unable to load in-cluster configuration"

Le backend essaie d'abord la config in-cluster, puis le kubeconfig local. En développement :

```bash
# Vérifier kubectl fonctionne
kubectl get pods

# Vérifier KUBECONFIG
echo $KUBECONFIG
```

### Erreur "forbidden: User cannot list resource"

Problème de RBAC. Vérifier que le ServiceAccount a les bonnes permissions :

```bash
kubectl auth can-i list vulnerabilityreports.aquasecurity.github.io \
  --as=system:serviceaccount:trivy-system:trivy-operator-gui
```

### go.sum manquant

```bash
go mod tidy
```

## Performance

### Optimisations

- Utiliser des caches pour les requêtes fréquentes
- Pagination pour les grandes listes
- Connexion persistante au cluster K8s
- Limiter les requêtes concurrentes

### Metrics (à implémenter)

Ajouter Prometheus metrics :

```go
import "github.com/prometheus/client_golang/prometheus"

// Définir metrics
var httpRequestsTotal = prometheus.NewCounterVec(
    prometheus.CounterOpts{
        Name: "http_requests_total",
        Help: "Total HTTP requests",
    },
    []string{"method", "endpoint", "status"},
)
```

## Contribution

1. Créer une branche pour votre feature
2. Écrire des tests
3. Vérifier le linting : `golangci-lint run`
4. Commit et push
5. Créer une Pull Request
