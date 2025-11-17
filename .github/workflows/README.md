# GitHub Actions Workflows

Ce dossier contient les workflows GitHub Actions pour automatiser le build, le push et la publication du projet.

## Workflows Disponibles

### 1. 🐋 Build and Push Docker Images (`docker-build-push.yml`)

Automatise le build et le push des images Docker vers Docker Hub.

#### Déclencheurs

- **Push sur branches** : `main`, `develop`
- **Tags** : `v*` (ex: `v1.0.0`, `v1.2.3`)
- **Pull Requests** : vers `main`
- **Manuel** : via workflow_dispatch

#### Fonctionnalités

- ✅ Build multi-architecture (amd64, arm64)
- ✅ Cache des layers Docker (GitHub Actions cache)
- ✅ Push automatique vers Docker Hub
- ✅ Tags automatiques basés sur les branches/tags Git
- ✅ Build séparé backend et frontend

#### Tags Générés

| Événement | Exemples de tags |
|-----------|------------------|
| Push sur `main` | `latest`, `main` |
| Push sur `develop` | `develop` |
| Tag `v1.2.3` | `v1.2.3`, `1.2`, `1`, `latest` |
| Pull Request #42 | `pr-42` |

#### Secrets Requis

Configurez ces secrets dans **Settings → Secrets and variables → Actions** :

- `DOCKERHUB_USERNAME` : Votre nom d'utilisateur Docker Hub (ex: `johan91`)
- `DOCKERHUB_TOKEN` : Token d'accès Docker Hub (créé dans Account Settings → Security)

#### Utilisation Manuelle

```bash
# Déclencher manuellement depuis GitHub
Actions → Build and Push Docker Images → Run workflow

# Ou créer un tag pour release
git tag v1.0.0
git push origin v1.0.0
```

---

### 2. 📦 Package and Publish Helm Chart (`helm-package-push.yml`)

Package le chart Helm et le publie sur GitHub Pages.

#### Déclencheurs

- **Push sur `main`** avec modifications dans `helm/**`
- **Tags** : `v*` (crée aussi une GitHub Release)
- **Manuel** : via workflow_dispatch

#### Fonctionnalités

- ✅ Package automatique du chart Helm
- ✅ Publication sur GitHub Pages
- ✅ Génération d'index Helm automatique
- ✅ Page HTML d'accueil pour le repository
- ✅ GitHub Release avec chart en pièce jointe (pour tags)

#### URL du Repository Helm

Une fois publié, le repository sera accessible à :

```
https://anarchicsoul.github.io/trivy-operator-gui/charts
```

#### Utilisation du Chart Publié

```bash
# Ajouter le repository
helm repo add trivy-operator-gui https://anarchicsoul.github.io/trivy-operator-gui/charts
helm repo update

# Installer
helm install trivy-operator-gui trivy-operator-gui/trivy-operator-gui \
  --namespace trivy-system \
  --create-namespace
```

#### Configuration GitHub Pages

1. Aller dans **Settings → Pages**
2. Source : **Deploy from a branch**
3. Branch : **gh-pages** / `/(root)`
4. Save

Le workflow créera automatiquement la branche `gh-pages` lors de la première exécution.

---

## Configuration Initiale

### 1. Secrets Docker Hub

Créer un token Docker Hub :

1. Se connecter à [Docker Hub](https://hub.docker.com/)
2. Account Settings → Security → New Access Token
3. Nom : `github-actions`
4. Permissions : Read, Write, Delete
5. Copier le token généré

Ajouter les secrets dans GitHub :

1. Aller dans **Settings → Secrets and variables → Actions**
2. Cliquer **New repository secret**
3. Ajouter `DOCKERHUB_USERNAME` : votre nom d'utilisateur
4. Ajouter `DOCKERHUB_TOKEN` : le token copié

### 2. Activer GitHub Pages

1. **Settings → Pages**
2. Source : **Deploy from a branch**
3. Branch : **gh-pages** / `/(root)`
4. Save

### 3. Permissions des Workflows

Vérifier que les workflows ont les bonnes permissions :

1. **Settings → Actions → General**
2. **Workflow permissions** : Read and write permissions
3. ✅ Allow GitHub Actions to create and approve pull requests
4. Save

---

## Exemples d'Utilisation

### Publier une Nouvelle Version

```bash
# 1. Mettre à jour la version dans helm/trivy-operator-gui/Chart.yaml
version: 1.2.0
appVersion: "1.2.0"

# 2. Commit et push
git add helm/trivy-operator-gui/Chart.yaml
git commit -m "chore: bump version to 1.2.0"
git push origin main

# 3. Créer un tag (déclenche build Docker + Helm + GitHub Release)
git tag v1.2.0
git push origin v1.2.0
```

Les workflows vont :
- ✅ Builder et pusher `johan91/trivy-operator-gui-backend:1.2.0`
- ✅ Builder et pusher `johan91/trivy-operator-gui-frontend:1.2.0`
- ✅ Packager et publier le chart Helm version 1.2.0
- ✅ Créer une GitHub Release avec le chart en pièce jointe

### Build de Développement

```bash
# Push sur develop pour tester
git checkout develop
git push origin develop

# Les images seront taguées avec "develop"
# johan91/trivy-operator-gui-backend:develop
# johan91/trivy-operator-gui-frontend:develop
```

### Build Manuel

Depuis l'interface GitHub :

1. Aller dans **Actions**
2. Sélectionner le workflow
3. Cliquer **Run workflow**
4. Choisir la branche
5. Run

---

## Monitoring des Workflows

### Voir l'Exécution

1. Aller dans l'onglet **Actions**
2. Cliquer sur un workflow pour voir l'historique
3. Cliquer sur une exécution pour voir les détails

### Notifications

Les workflows envoient des notifications :
- ✅ Success : visible dans Actions
- ❌ Failure : notification par email (si activé dans Settings)

### Artifacts et Résumés

Les workflows génèrent :
- **Summary** : résumé visible dans chaque exécution
- **Artifacts** : charts Helm disponibles en téléchargement

---

## Troubleshooting

### Erreur : "failed to push to Docker Hub"

**Solution** :
- Vérifier que `DOCKERHUB_USERNAME` et `DOCKERHUB_TOKEN` sont corrects
- Vérifier que le token a les permissions Read/Write
- Vérifier que le repository Docker Hub existe

### Erreur : "Permission denied" pour GitHub Pages

**Solution** :
- Settings → Actions → General → Workflow permissions
- Sélectionner "Read and write permissions"
- Save

### Chart Helm non publié

**Solution** :
- Vérifier que GitHub Pages est activé
- Vérifier la branche `gh-pages` existe
- Attendre quelques minutes (GitHub Pages peut prendre du temps)
- Vérifier les logs du workflow

### Images Docker ne se mettent pas à jour

**Solution** :
- Utiliser `pullPolicy: Always` dans values.yaml
- Redéployer avec un nouveau tag au lieu de `latest`
- Purger le cache : delete pods pour forcer pull

---

## Optimisations

### Cache Docker

Les workflows utilisent le cache GitHub Actions pour accélérer les builds :

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

### Build Multi-Architecture

Les images supportent AMD64 et ARM64 :

```yaml
platforms: linux/amd64,linux/arm64
```

Désactiver ARM64 si non nécessaire pour accélérer :

```yaml
platforms: linux/amd64
```

---

## Personnalisation

### Changer le Registry Docker

Pour utiliser un autre registry (GHCR, quay.io, etc.) :

```yaml
# Dans docker-build-push.yml
env:
  REGISTRY: ghcr.io
  # Au lieu de docker.io
```

### Ajouter des Tests

Ajouter un job de tests avant build :

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: make test

  build:
    needs: test
    # ... reste du build
```

### Notifications Slack/Discord

Ajouter une step de notification :

```yaml
- name: Slack Notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Helm Documentation](https://helm.sh/docs/)
- [GitHub Pages](https://docs.github.com/en/pages)
