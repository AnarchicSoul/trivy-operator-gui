# Trivy Operator GUI

## Qu'est-ce que c'est ?

Trivy Operator GUI est une interface web moderne pour visualiser les rapports de sécurité générés par Trivy Operator dans votre cluster Kubernetes. L'application affiche :

- **Vulnérabilités des images** : CVE détectées dans vos conteneurs
- **Problèmes de configuration** : Audit de sécurité de vos ressources Kubernetes
- **Secrets exposés** : Détection de credentials et clés API hardcodées dans les images
- **RBAC Assessment** : Analyse des permissions et rôles Kubernetes
- **Infrastructure Assessment** : Évaluation de la sécurité au niveau cluster
- **Vue par pod** : Analyse détaillée de la sécurité de chaque pod avec filtrage par namespace
- **Tableaux de bord** : Vue d'ensemble de la sécurité de votre cluster

## Architecture

L'application est composée de deux parties :

- **Backend Go** : API REST qui interroge les CRDs de Trivy Operator
- **Frontend React** : Interface web responsive avec Material-UI

Les rapports sont catégorisés par type :
- **Vulnerability** : Vulnérabilités (CVE) dans les images de conteneurs
- **Config Audit** : Problèmes de configuration Kubernetes (sécurité des workloads)
- **Exposed Secrets** : Credentials exposés (tokens, clés API, passwords)
- **RBAC Assessment** : Problèmes de contrôle d'accès basé sur les rôles
- **Infrastructure** : Problèmes de sécurité au niveau infrastructure cluster

## Prérequis

- Cluster Kubernetes (v1.24+)
- Helm 3.x
- kubectl configuré pour accéder à votre cluster

## Installation

### Étape 1 : Installer Trivy Operator

D'abord, installez Trivy Operator avec les politiques de sécurité builtin activées :

```bash
# Ajouter le dépôt Helm d'Aqua Security
helm repo add aqua https://aquasecurity.github.io/helm-charts/
helm repo update

# Installer Trivy Operator avec le fichier de configuration
helm install trivy-operator aqua/trivy-operator \
  --namespace trivy-system \
  --create-namespace \
  --values trivy-operator-values.yaml

# Vérifier l'installation
kubectl get pods -n trivy-system
kubectl get crd | grep aquasecurity
```

Le fichier `trivy-operator-values.yaml` à la racine du projet active les scans de configuration avec les politiques de sécurité builtin.

### Étape 2 : Déployer Trivy Operator GUI

L'application est disponible sur Docker Hub (images et chart Helm) sous le compte `johan91`.

```bash
# Déployer directement depuis Docker Hub OCI (Helm 3.8+)
helm install trivy-operator-gui \
  oci://registry-1.docker.io/johan91/trivy-operator-gui \
  --version 1.0.0 \
  --namespace trivy-system \
  --create-namespace

# Vérifier le déploiement
kubectl get pods -n trivy-system -l app.kubernetes.io/name=trivy-operator-gui
```

**Alternative** : Si vous souhaitez personnaliser les valeurs avant l'installation :

```bash
# Télécharger le chart
helm pull oci://registry-1.docker.io/johan91/trivy-operator-gui --version 1.0.0
tar -xzf trivy-operator-gui-1.0.0.tgz

# Modifier values.yaml selon vos besoins
# Puis installer
helm install trivy-operator-gui ./trivy-operator-gui \
  --namespace trivy-system \
  --create-namespace
```

### Étape 3 : Accéder à l'interface

#### Option 1 : Port-forward (développement)

```bash
kubectl port-forward -n trivy-system svc/trivy-operator-gui-frontend 8080:80
```

Ouvrez votre navigateur à http://localhost:8080

#### Option 2 : Ingress (production)

Si vous avez un contrôleur Ingress (Traefik, Nginx, etc.), activez l'ingress :

```bash
helm upgrade trivy-operator-gui \
  oci://registry-1.docker.io/johan91/trivy-operator-gui \
  --version 1.0.0 \
  --namespace trivy-system \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=trivy-gui.votredomaine.com \
  --set ingress.hosts[0].paths[0].path=/ \
  --set ingress.hosts[0].paths[0].pathType=Prefix
```

## Configuration

### Personnaliser les images Docker

Par défaut, le chart Helm utilise les images de `johan91` sur Docker Hub. Pour utiliser vos propres images :

```yaml
# Dans helm/trivy-operator-gui/values.yaml
backend:
  image:
    repository: votre-compte/trivy-operator-gui-backend
    tag: latest

frontend:
  image:
    repository: votre-compte/trivy-operator-gui-frontend
    tag: latest
```

### Configurer les ressources

Ajustez les ressources selon vos besoins dans `values.yaml` :

```yaml
backend:
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 128Mi
```

## Utilisation

### Fonctionnalités principales

1. **Dashboard** : Vue d'ensemble avec graphiques des vulnérabilités et problèmes de configuration
2. **Pods** : Liste de tous les pods avec :
   - Filtrage par namespace
   - Compteurs de vulnérabilités par sévérité
   - Compteurs de problèmes de configuration par sévérité
3. **Détail d'un pod** :
   - Onglet "Vulnerabilities" : CVE par conteneur
   - Onglet "Configuration Issues" : Problèmes de configuration avec remédiation
4. **Reports** : Vue de tous les rapports avec filtrage par namespace et 5 onglets :
   - **Vulnerability Reports** : Rapports de vulnérabilités CVE
   - **Config Audit** : Rapports d'audit de configuration
   - **Exposed Secrets** : Rapports de secrets exposés
   - **RBAC Assessment** : Rapports d'évaluation RBAC
   - **Infra Assessment** : Rapports d'évaluation d'infrastructure
   - Cliquez sur un rapport pour voir les détails complets
5. **Categories** : Vulnérabilités groupées par sévérité

### Navigation

- Cliquez sur un pod dans la liste pour voir ses détails
- Utilisez les filtres namespace pour cibler un namespace spécifique
- Les onglets dans les détails du pod séparent les vulnérabilités des problèmes de configuration

## Export vers Elasticsearch (Optionnel)

Pour une analyse avancée et des dashboards personnalisés dans Kibana, vous pouvez utiliser l'**Elastic Exporter** pour exporter automatiquement tous les rapports Trivy vers Elasticsearch en format ECS.

### Fonctionnalités

- Export automatique quotidien (configurable via CronJob)
- Format ECS (Elastic Common Schema) compatible
- Support de tous les types de rapports Trivy
- Dashboards Kibana pré-configurés
- Gestion automatique de la rétention des données
- Alertes et visualisations avancées

### Installation

#### Option 1 : Installation depuis le code source

```bash
# Créer un fichier de configuration
cat > elastic-values.yaml <<EOF
elasticsearch:
  addresses:
    - "https://elasticsearch.example.com:9200"
  username: "elastic"
  password: "changeme"
  indexName: "trivy-reports"
  retentionDays: 30

schedule: "0 2 * * *"  # Tous les jours à 2h du matin
EOF

# Installer l'exporter
helm install trivy-ecs-exporter \
  ./helm/trivy-operator-ecs-exporter \
  -n trivy-system \
  -f elastic-values.yaml
```

#### Option 2 : Installation directe depuis Docker Hub OCI (Recommandé)

```bash
# Déployer directement depuis Docker Hub OCI (Helm 3.8+)
helm install trivy-ecs-exporter \
  oci://registry-1.docker.io/johan91/trivy-operator-ecs-exporter \
  --version 1.0.0 \
  --namespace trivy-system \
  --set elasticsearch.addresses[0]="https://elasticsearch.example.com:9200" \
  --set elasticsearch.username="elastic" \
  --set elasticsearch.password="changeme"
```

**Alternative** : Télécharger le chart pour personnalisation

```bash
# Télécharger le chart
helm pull oci://registry-1.docker.io/johan91/trivy-operator-ecs-exporter --version 1.0.0
tar -xzf trivy-operator-ecs-exporter-1.0.0.tgz

# Modifier values.yaml selon vos besoins
# Puis installer
helm install trivy-ecs-exporter ./trivy-operator-ecs-exporter \
  --namespace trivy-system \
  -f elastic-values.yaml
```

#### Configuration avancée pour Elasticsearch avec certificats auto-signés

Si votre Elasticsearch utilise des certificats auto-signés ou que vous avez des problèmes de certificats TLS, utilisez l'option `insecureTLS` :

```yaml
elasticsearch:
  addresses:
    - "https://elasticsearch.example.com:9200"
  username: "elastic"
  password: "changeme"
  indexName: "trivy-reports"
  retentionDays: 30
  # Skip TLS certificate verification (similaire à curl -k)
  insecureTLS: true

schedule: "0 2 * * *"
```

**Note** : L'option `insecureTLS: true` désactive la vérification des certificats TLS (équivalent à `curl -k`). À utiliser uniquement dans les environnements de développement ou avec des certificats auto-signés.

### Import des dashboards Kibana

1. Créez une Data View dans Kibana : `trivy-reports-*`
2. Importez les dashboards depuis le dossier `KIBANA-DASHBOARD/`
3. Consultez les visualisations pré-configurées

Pour plus de détails, consultez :
- [`BINARIES-ECS_EXPORTER/README.md`](BINARIES-ECS_EXPORTER/README.md) : Configuration de l'exporter
- [`KIBANA-DASHBOARD/README.md`](KIBANA-DASHBOARD/README.md) : Import et utilisation des dashboards

## Maintenance

### Mettre à jour l'application

```bash
# Mettre à jour Trivy Operator
helm upgrade trivy-operator aqua/trivy-operator \
  --namespace trivy-system \
  --values trivy-operator-values.yaml

# Mettre à jour le GUI vers une nouvelle version
helm upgrade trivy-operator-gui \
  oci://registry-1.docker.io/johan91/trivy-operator-gui \
  --version 1.0.0 \
  --namespace trivy-system
```

### Désinstallation

```bash
# Supprimer le GUI
helm uninstall trivy-operator-gui -n trivy-system

# Supprimer Trivy Operator (optionnel)
helm uninstall trivy-operator -n trivy-system
```

## Développement

Pour contribuer ou modifier l'application, consultez les README dans chaque dossier :

- [`BINARIES-BACKEND/README.md`](BINARIES-BACKEND/README.md) : Développement du backend Go
- [`BINARIES-FRONTEND/README.md`](BINARIES-FRONTEND/README.md) : Développement du frontend React
- [`DOCKER/README.md`](DOCKER/README.md) : Build et push des images Docker
- [`helm/README.md`](helm/README.md) : Package et déploiement Helm
- [`BINARIES-ECS_EXPORTER/README.md`](BINARIES-ECS_EXPORTER/README.md) : Export vers Elasticsearch
- [`KIBANA-DASHBOARD/README.md`](KIBANA-DASHBOARD/README.md) : Dashboards Kibana

## Support et Contribution

Ce projet est open source. Pour signaler un bug ou proposer une amélioration, ouvrez une issue sur le dépôt GitHub.

## Licence

MIT License - voir le fichier LICENSE pour plus de détails.
