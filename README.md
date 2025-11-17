# Trivy Operator GUI

A comprehensive Kubernetes dashboard for visualizing and analyzing [Trivy Operator](https://github.com/aquasecurity/trivy-operator) security reports. This application provides an intuitive web interface to monitor vulnerabilities, configuration issues, and security compliance across your Kubernetes cluster.

## Features

- **Dashboard Overview**: Real-time visualization of security metrics across your cluster
- **Vulnerability Reports**: View and filter vulnerability reports by severity (Critical, High, Medium, Low, Unknown)
- **Pod-Level Analysis**: Detailed security reports for individual pods and containers
- **Category Views**: Group and analyze vulnerabilities by severity categories
- **Dynamic Updates**: Fresh data on every page refresh (F5)
- **Multi-Namespace Support**: View reports across all namespaces or filter by specific namespace
- **Security-First**: Built with security best practices, non-root containers, RBAC, and read-only file systems

## Architecture

### Backend
- **Language**: Go 1.21
- **Framework**: Gin HTTP framework
- **Kubernetes Client**: Official client-go library
- **API**: RESTful API for querying Trivy CRDs

### Frontend
- **Framework**: React 18
- **UI Library**: Material-UI (MUI)
- **Charts**: Recharts
- **Build Tool**: Vite

### Deployment
- **Container Runtime**: Docker
- **Orchestration**: Kubernetes
- **Package Manager**: Helm 3

## Prerequisites

- Kubernetes cluster (v1.24+)
- [Trivy Operator](https://github.com/aquasecurity/trivy-operator) installed and running
- Helm 3.x
- kubectl configured to access your cluster

## Installation

### Option 1: Using Helm (Recommended)

1. **Clone the repository**:
```bash
git clone https://github.com/trivy-operator-gui/trivy-operator-gui.git
cd trivy-operator-gui
```

2. **Build Docker images**:
```bash
# Build backend
docker build -f docker/backend.Dockerfile -t trivy-operator-gui-backend:latest .

# Build frontend
docker build -f docker/frontend.Dockerfile -t trivy-operator-gui-frontend:latest .
```

3. **Push images to your registry** (optional):
```bash
docker tag trivy-operator-gui-backend:latest your-registry/trivy-operator-gui-backend:latest
docker push your-registry/trivy-operator-gui-backend:latest

docker tag trivy-operator-gui-frontend:latest your-registry/trivy-operator-gui-frontend:latest
docker push your-registry/trivy-operator-gui-frontend:latest
```

4. **Install with Helm**:
```bash
# Create namespace
kubectl create namespace trivy-operator-gui

# Install the chart
helm install trivy-operator-gui ./helm/trivy-operator-gui \
  --namespace trivy-operator-gui \
  --set backend.image.repository=your-registry/trivy-operator-gui-backend \
  --set backend.image.tag=latest \
  --set frontend.image.repository=your-registry/trivy-operator-gui-frontend \
  --set frontend.image.tag=latest
```

5. **Access the application**:
```bash
# Port forward to access locally
kubectl port-forward -n trivy-operator-gui svc/trivy-operator-gui-frontend 8080:80
```

Open your browser to `http://localhost:8080`

### Option 2: Using Ingress

Enable ingress in `values.yaml`:

```yaml
ingress:
  enabled: true
  className: "nginx"
  hosts:
    - host: trivy-gui.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: trivy-gui-tls
      hosts:
        - trivy-gui.example.com
```

Then install:
```bash
helm install trivy-operator-gui ./helm/trivy-operator-gui \
  --namespace trivy-operator-gui \
  --values custom-values.yaml
```

## Configuration

### Helm Values

The chart supports extensive customization through `values.yaml`:

#### Backend Configuration
```yaml
backend:
  replicas: 2
  image:
    repository: trivy-operator-gui-backend
    tag: "latest"
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
  nodeSelector:
    kubernetes.io/os: linux  # Preset for Linux nodes
```

#### Frontend Configuration
```yaml
frontend:
  replicas: 2
  image:
    repository: trivy-operator-gui-frontend
    tag: "latest"
  resources:
    limits:
      cpu: 200m
      memory: 256Mi
  nodeSelector:
    kubernetes.io/os: linux  # Preset for Linux nodes
```

#### RBAC Configuration
The application requires read access to Trivy CRDs:
```yaml
rbac:
  create: true
  rules:
    - apiGroups: ["aquasecurity.github.io"]
      resources:
        - vulnerabilityreports
        - configauditreports
        - exposedsecretreports
      verbs: ["get", "list", "watch"]
```

### Windows Node Support

By default, the application is configured to run only on Linux nodes using `nodeSelector`. If you have a mixed cluster with Windows nodes, this prevents scheduling on incompatible nodes.

To modify this behavior, update `values.yaml`:
```yaml
backend:
  nodeSelector: {}  # Remove Linux restriction

frontend:
  nodeSelector: {}  # Remove Linux restriction
```

## API Endpoints

The backend exposes the following REST API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/dashboard` | GET | Dashboard summary data |
| `/api/reports` | GET | All reports (vulnerability + config audit) |
| `/api/reports/vulnerability` | GET | Vulnerability reports only |
| `/api/reports/config-audit` | GET | Config audit reports only |
| `/api/pods` | GET | List of all pods with reports |
| `/api/pods/:namespace/:pod` | GET | Reports for specific pod |
| `/api/category/:severity` | GET | Vulnerabilities by severity category |
| `/api/namespaces` | GET | List of all namespaces |

Query Parameters:
- `namespace`: Filter results by namespace (optional)

## Development

### Backend Development

```bash
cd backend

# Install dependencies
go mod download

# Run locally (requires kubeconfig)
go run main.go

# Build
go build -o trivy-operator-gui-backend
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Security Features

- **Non-root containers**: Both backend and frontend run as non-root user (UID 1000)
- **Read-only root filesystem**: Containers use read-only root filesystems
- **Minimal capabilities**: All Linux capabilities dropped
- **RBAC**: Least-privilege access to Kubernetes API
- **Security headers**: CSP, X-Frame-Options, X-Content-Type-Options
- **Image scanning**: Recommended to scan images with Trivy before deployment

## Troubleshooting

### No reports showing up

1. **Verify Trivy Operator is running**:
```bash
kubectl get pods -n trivy-system
```

2. **Check if vulnerability reports exist**:
```bash
kubectl get vulnerabilityreports --all-namespaces
```

3. **Verify RBAC permissions**:
```bash
kubectl auth can-i list vulnerabilityreports --as=system:serviceaccount:trivy-operator-gui:trivy-operator-gui
```

### Backend pod not starting

1. **Check logs**:
```bash
kubectl logs -n trivy-operator-gui -l app.kubernetes.io/component=backend
```

2. **Verify service account**:
```bash
kubectl get serviceaccount -n trivy-operator-gui
kubectl get clusterrolebinding trivy-operator-gui
```

### Frontend cannot connect to backend

1. **Verify backend service**:
```bash
kubectl get svc -n trivy-operator-gui
```

2. **Check nginx configuration** (in frontend pod):
```bash
kubectl exec -n trivy-operator-gui -it <frontend-pod> -- cat /etc/nginx/conf.d/default.conf
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/trivy-operator-gui/trivy-operator-gui/issues
- Documentation: https://github.com/trivy-operator-gui/trivy-operator-gui/wiki

## Acknowledgments

- [Aqua Security](https://www.aquasec.com/) for Trivy and Trivy Operator
- The Kubernetes community
- All contributors to this project
