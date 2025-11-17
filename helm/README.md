# Helm Chart - Trivy Operator GUI

Ce dossier contient le Helm chart pour déployer Trivy Operator GUI sur Kubernetes.

## Structure

```
helm/trivy-operator-gui/
├── Chart.yaml              # Métadonnées du chart
├── values.yaml             # Configuration par défaut
└── templates/              # Templates Kubernetes
    ├── _helpers.tpl        # Helpers Helm
    ├── backend-deployment.yaml
    ├── backend-service.yaml
    ├── frontend-deployment.yaml
    ├── frontend-service.yaml
    ├── serviceaccount.yaml
    ├── rbac.yaml
    ├── ingress.yaml
    └── NOTES.txt           # Instructions post-installation
```

## Prérequis

- Kubernetes cluster (v1.24+)
- Helm 3.x installé
- Trivy Operator déjà déployé dans le cluster
- kubectl configuré

## Déploiement Simple

### Installation

```bash
# Depuis la racine du projet
helm install trivy-operator-gui ./helm/trivy-operator-gui \
  --namespace trivy-system \
  --create-namespace

# Vérifier le déploiement
kubectl get pods -n trivy-system
```

### Accès à l'application

```bash
# Port-forward
kubectl port-forward -n trivy-system svc/trivy-operator-gui-frontend 8080:80

# Ouvrir http://localhost:8080
```

## Configuration Personnalisée

### Créer un fichier values personnalisé

Créez `my-values.yaml` :

```yaml
# Images (utiliser vos propres images)
backend:
  image:
    repository: johan91/trivy-operator-gui-backend
    tag: v1.0.0
    pullPolicy: IfNotPresent

  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 128Mi

frontend:
  image:
    repository: johan91/trivy-operator-gui-frontend
    tag: v1.0.0
    pullPolicy: IfNotPresent

  resources:
    limits:
      cpu: 200m
      memory: 256Mi
    requests:
      cpu: 50m
      memory: 64Mi

# Ingress (pour exposition externe)
ingress:
  enabled: true
  className: "traefik"  # ou "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: trivy-gui.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: trivy-gui-tls
      hosts:
        - trivy-gui.example.com

# Réplicas (pour haute disponibilité)
backend:
  replicaCount: 2

frontend:
  replicaCount: 2

# Node affinity (optionnel)
backend:
  nodeSelector:
    workload: monitoring

  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchExpressions:
                - key: app.kubernetes.io/name
                  operator: In
                  values:
                    - trivy-operator-gui
                - key: app.kubernetes.io/component
                  operator: In
                  values:
                    - backend
            topologyKey: kubernetes.io/hostname
```

### Déployer avec configuration personnalisée

```bash
helm install trivy-operator-gui ./helm/trivy-operator-gui \
  --namespace trivy-system \
  --create-namespace \
  --values my-values.yaml
```

## Mise à Jour (Upgrade)

```bash
# Mettre à jour avec de nouvelles valeurs
helm upgrade trivy-operator-gui ./helm/trivy-operator-gui \
  --namespace trivy-system \
  --values my-values.yaml

# Ou modifier une valeur spécifique
helm upgrade trivy-operator-gui ./helm/trivy-operator-gui \
  --namespace trivy-system \
  --set backend.image.tag=v1.1.0 \
  --set frontend.image.tag=v1.1.0

# Forcer le redémarrage des pods
helm upgrade trivy-operator-gui ./helm/trivy-operator-gui \
  --namespace trivy-system \
  --recreate-pods
```

## Package et Distribution

### Package le chart

```bash
# Depuis le dossier helm/
cd helm

# Package le chart
helm package trivy-operator-gui

# Cela crée : trivy-operator-gui-0.1.0.tgz
```

### Publier sur Docker Hub (OCI Registry) - Recommandé

Helm 3 supporte nativement les registries OCI (Docker Hub, GHCR, etc.) :

```bash
# Login
docker login

# Package
helm package trivy-operator-gui

# Push vers Docker Hub (OCI)
helm push trivy-operator-gui-0.1.0.tgz oci://registry-1.docker.io/johan91

# Installation depuis Docker Hub
helm install trivy-operator-gui \
  oci://registry-1.docker.io/johan91/trivy-operator-gui \
  --version 0.1.0 \
  --namespace trivy-system
```

## Vérifications

### Lister les releases

```bash
helm list -n trivy-system
```

### Voir les valeurs utilisées

```bash
helm get values trivy-operator-gui -n trivy-system
```

### Voir le manifest généré

```bash
helm get manifest trivy-operator-gui -n trivy-system
```

### Tester le chart avant installation

```bash
# Dry-run
helm install trivy-operator-gui ./helm/trivy-operator-gui \
  --namespace trivy-system \
  --dry-run --debug

# Template (voir le YAML généré)
helm template trivy-operator-gui ./helm/trivy-operator-gui \
  --namespace trivy-system
```

## Désinstallation

```bash
# Supprimer la release
helm uninstall trivy-operator-gui -n trivy-system

# Vérifier que tout est supprimé
kubectl get all -n trivy-system -l app.kubernetes.io/name=trivy-operator-gui
```

## RBAC et Permissions

Le chart crée automatiquement :

- **ServiceAccount** : `trivy-operator-gui`
- **ClusterRole** : Lecture des CRDs Trivy et des pods/namespaces
- **ClusterRoleBinding** : Lie le ServiceAccount au ClusterRole

Permissions accordées :

```yaml
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

## Ingress

### Exemples de configuration

#### Traefik

```yaml
ingress:
  enabled: true
  className: "traefik"
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
  hosts:
    - host: trivy-gui.local
      paths:
        - path: /
          pathType: Prefix
```

#### Nginx Ingress

```yaml
ingress:
  enabled: true
  className: "nginx"
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
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

## Monitoring et Logs

### Voir les logs

```bash
# Backend
kubectl logs -n trivy-system -l app.kubernetes.io/component=backend -f

# Frontend
kubectl logs -n trivy-system -l app.kubernetes.io/component=frontend -f
```

### Health checks

```bash
# Backend health
kubectl exec -n trivy-system deploy/trivy-operator-gui-backend -- wget -qO- http://localhost:8080/health

# Frontend health
kubectl exec -n trivy-system deploy/trivy-operator-gui-frontend -- wget -qO- http://localhost/health
```

## Personnalisation Avancée

### Modifier le RBAC

Si vous avez besoin de permissions supplémentaires :

```yaml
rbac:
  create: true
  rules:
    - apiGroups: ["aquasecurity.github.io"]
      resources:
        - vulnerabilityreports
        - configauditreports
        - exposedsecretreports
        - clustercompliancereports  # Ajouter
      verbs: ["get", "list", "watch"]
```

### Security Context personnalisé

```yaml
backend:
  podSecurityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault

  securityContext:
    allowPrivilegeEscalation: false
    readOnlyRootFilesystem: true
    capabilities:
      drop:
        - ALL
```

## Troubleshooting

### Les pods ne démarrent pas

```bash
# Vérifier les events
kubectl describe pod -n trivy-system -l app.kubernetes.io/name=trivy-operator-gui

# Vérifier les logs
kubectl logs -n trivy-system -l app.kubernetes.io/component=backend --previous
```

### Erreur RBAC

```bash
# Vérifier que le ServiceAccount existe
kubectl get sa trivy-operator-gui -n trivy-system

# Vérifier les bindings
kubectl get clusterrolebinding -l app.kubernetes.io/name=trivy-operator-gui
```

### Backend ne peut pas lire les CRDs

Vérifiez que Trivy Operator est bien installé :

```bash
kubectl get crd | grep aquasecurity
kubectl get vulnerabilityreports -A
```

## Maintenance

### Backup de la configuration

```bash
# Sauvegarder les valeurs
helm get values trivy-operator-gui -n trivy-system > backup-values.yaml

# Sauvegarder le manifest complet
helm get manifest trivy-operator-gui -n trivy-system > backup-manifest.yaml
```

### Rollback

```bash
# Voir l'historique
helm history trivy-operator-gui -n trivy-system

# Rollback vers une révision précédente
helm rollback trivy-operator-gui 1 -n trivy-system
```

## Développement du Chart

### Valider le chart

```bash
# Lint le chart
helm lint ./helm/trivy-operator-gui

# Test avec différentes valeurs
helm template test ./helm/trivy-operator-gui --values test-values.yaml
```

### Incrémenter la version

Modifier `Chart.yaml` :

```yaml
version: 0.2.0  # Version du chart
appVersion: "1.0.0"  # Version de l'application
```
