# Trivy Operator GUI

## Qu'est-ce que c'est ?

Trivy Operator GUI est une interface web moderne pour visualiser les rapports de sécurité générés par Trivy Operator dans votre cluster Kubernetes. L'application affiche :

- **Vulnérabilités des images** : CVE détectées dans vos conteneurs
- **Problèmes de configuration** : Audit de sécurité de vos ressources Kubernetes
- **Vue par pod** : Analyse détaillée de la sécurité de chaque pod avec filtrage par namespace
- **Tableaux de bord** : Vue d'ensemble de la sécurité de votre cluster

## Architecture

L'application est composée de deux parties :

- **Backend Go** : API REST qui interroge les CRDs de Trivy Operator
- **Frontend React** : Interface web responsive avec Material-UI

Les rapports sont catégorisés par type :
- **Image** : Vulnérabilités dans les images de conteneurs
- **Configuration** : Problèmes de configuration Kubernetes

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

L'application utilise des images pré-construites disponibles sur Docker Hub sous le compte `johan91`.

```bash
# Cloner le dépôt
git clone https://github.com/AnarchicSoul/trivy-operator-gui.git
cd trivy-operator-gui

# Déployer avec Helm
helm install trivy-operator-gui ./helm/trivy-operator-gui \
  --namespace trivy-system \
  --create-namespace

# Vérifier le déploiement
kubectl get pods -n trivy-system -l app.kubernetes.io/name=trivy-operator-gui
```

### Étape 3 : Accéder à l'interface

#### Option 1 : Port-forward (développement)

```bash
kubectl port-forward -n trivy-system svc/trivy-operator-gui-frontend 8080:80
```

Ouvrez votre navigateur à http://localhost:8080

#### Option 2 : Ingress (production)

Si vous avez un contrôleur Ingress (Traefik, Nginx, etc.), activez l'ingress dans le fichier values :

```bash
helm upgrade trivy-operator-gui ./helm/trivy-operator-gui \
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
4. **Reports** : Vue de tous les rapports avec filtrage par namespace
5. **Categories** : Vulnérabilités groupées par sévérité

### Navigation

- Cliquez sur un pod dans la liste pour voir ses détails
- Utilisez les filtres namespace pour cibler un namespace spécifique
- Les onglets dans les détails du pod séparent les vulnérabilités des problèmes de configuration

## Maintenance

### Mettre à jour l'application

```bash
# Mettre à jour Trivy Operator
helm upgrade trivy-operator aqua/trivy-operator \
  --namespace trivy-system \
  --values trivy-operator-values.yaml

# Mettre à jour le GUI
helm upgrade trivy-operator-gui ./helm/trivy-operator-gui \
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

- [`backend/README.md`](backend/README.md) : Développement du backend Go
- [`frontend/README.md`](frontend/README.md) : Développement du frontend React
- [`docker/README.md`](docker/README.md) : Build et push des images Docker
- [`helm/README.md`](helm/README.md) : Package et déploiement Helm

## Support et Contribution

Ce projet est open source. Pour signaler un bug ou proposer une amélioration, ouvrez une issue sur le dépôt GitHub.

## Licence

MIT License - voir le fichier LICENSE pour plus de détails.
