# Frontend - Interface React pour Trivy Operator GUI

Interface web moderne construite avec React, Material-UI et Vite pour visualiser les rapports de sécurité de Trivy Operator.

## Architecture

- **Framework** : React 18
- **UI Library** : Material-UI (MUI) v5
- **Charts** : Recharts
- **Build Tool** : Vite
- **Router** : React Router v6
- **HTTP Client** : Axios

## Structure du Projet

```
frontend/
├── package.json            # Dépendances npm
├── vite.config.js          # Configuration Vite
├── index.html              # Template HTML
└── src/
    ├── main.jsx            # Point d'entrée React
    ├── App.jsx             # Composant principal avec routes
    ├── index.css           # Styles globaux
    ├── components/         # Composants réutilisables
    │   └── Navbar.jsx      # Barre de navigation
    ├── pages/              # Pages/vues
    │   ├── Dashboard.jsx   # Dashboard principal
    │   ├── PodsView.jsx    # Liste des pods avec filtrage
    │   ├── PodDetail.jsx   # Détails d'un pod (onglets)
    │   ├── ReportsView.jsx # Tous les rapports
    │   └── CategoryView.jsx # Vulnérabilités par sévérité
    └── services/           # Services API
        └── api.js          # Client Axios
```

## Prérequis

- Node.js 18+ et npm
- Backend API en cours d'exécution

## Installation

```bash
cd frontend

# Installer les dépendances
npm install
```

## Développement Local

### Lancer le serveur de développement

```bash
cd frontend

# Démarrer Vite dev server
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

### Configuration de l'API

Par défaut, le frontend se connecte à `http://localhost:8080/api` en développement.

Pour changer l'URL de l'API :

```bash
# Créer un fichier .env.local
echo "VITE_API_URL=http://localhost:9090/api" > .env.local

# Relancer le serveur
npm run dev
```

### Hot Module Replacement (HMR)

Vite supporte le HMR par défaut. Les modifications sont appliquées instantanément sans rechargement complet de la page.

## Build pour Production

### Build

```bash
cd frontend

# Créer le build de production
npm run build
```

Les fichiers optimisés sont générés dans `dist/`.

### Prévisualiser le build

```bash
npm run preview
```

Ouvre une prévisualisation du build de production sur `http://localhost:4173`.

## Pages et Fonctionnalités

### 1. Dashboard (`/`)

Vue d'ensemble de la sécurité du cluster :

- Cartes de statistiques (total pods, vulnérabilités, config issues)
- Graphiques :
  - Vulnérabilités par sévérité (pie chart)
  - Configuration issues par sévérité (bar chart)
  - Pods par namespace (bar chart)

**Composants utilisés** :
- `Card`, `CardContent` (MUI)
- `PieChart`, `BarChart` (Recharts)

### 2. Pods View (`/pods`)

Liste de tous les pods avec leurs rapports de sécurité :

- **Filtrage par namespace** : Dropdown pour sélectionner un namespace
- **Tableau détaillé** avec colonnes :
  - Namespace
  - Pod Name
  - Total Vulnerabilities
  - Vulnerability Severity (Critical, High, Medium, Low)
  - Total Config Issues
  - Config Issue Severity (Critical, High, Medium, Low)
- **Actions** : Bouton pour voir les détails

**Fonctionnalités** :
- ✅ Tri par namespace
- ✅ Refresh manuel
- ✅ Chips colorés par sévérité
- ✅ Navigation vers détails du pod

### 3. Pod Detail (`/pods/:namespace/:podName`)

Vue détaillée d'un pod spécifique avec onglets :

**Onglet 1 : Vulnerabilities**
- Accordions par conteneur
- Table des CVE avec :
  - CVE ID (lien cliquable)
  - Package
  - Version installée/fixée
  - Sévérité
  - Titre

**Onglet 2 : Configuration Issues**
- Accordions par ressource
- Table des problèmes de configuration avec :
  - Check ID
  - Titre
  - Catégorie (Network, Security, Reliability, etc.)
  - Sévérité
  - Description
  - Remédiation

**Cartes de résumé** :
- Total Vulnerabilities
- Total Config Issues
- Critical count (combiné)
- High count (combiné)

### 4. Reports View (`/reports`)

Tous les rapports bruts avec onglets :

**Onglet 1 : Vulnerability Reports**
- Liste complète des VulnerabilityReports
- Filtrage par namespace
- Colonnes : Name, Namespace, Image, Scanner, Severity counts

**Onglet 2 : Config Audit Reports**
- Liste complète des ConfigAuditReports
- Filtrage par namespace
- Colonnes : Name, Namespace, Scanner, Severity counts

### 5. Category View (`/category/:severity`)

Toutes les vulnérabilités d'une sévérité spécifique :

- Boutons de sélection de sévérité (CRITICAL, HIGH, MEDIUM, LOW)
- Table avec :
  - CVE ID
  - Namespace
  - Pod (cliquable)
  - Conteneur
  - Package
  - Versions
  - Titre

## Composants Réutilisables

### Navbar

Barre de navigation avec liens vers toutes les pages :

```jsx
<Navbar />
```

### Severity Chips

Chips colorés pour afficher les sévérités :

```jsx
<Chip
  label="CRITICAL"
  sx={{ bgcolor: '#d32f2f', color: 'white' }}
  size="small"
/>
```

**Couleurs** :
- CRITICAL: `#d32f2f` (rouge foncé)
- HIGH: `#f57c00` (orange)
- MEDIUM: `#fbc02d` (jaune)
- LOW: `#388e3c` (vert)
- UNKNOWN: `#757575` (gris)

## Services API

Le fichier `src/services/api.js` centralise tous les appels API :

```javascript
import { getDashboard, getPodsList, getPodReports } from './services/api';

// Utilisation
const dashboard = await getDashboard();
const pods = await getPodsList('default');  // namespace optionnel
const podDetails = await getPodReports('default', 'nginx-abc123');
```

### Endpoints disponibles

```javascript
// Dashboard
getDashboard()

// Rapports
getAllReports(namespace)
getVulnerabilityReports(namespace)
getConfigAuditReports(namespace)

// Pods
getPodsList(namespace)
getPodReports(namespace, podName)

// Catégories
getReportsByCategory(severity)

// Namespaces
getNamespaces()

// Health
healthCheck()
```

## Thème et Styles

### Palette de couleurs

```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    severity: {
      CRITICAL: '#d32f2f',
      HIGH: '#f57c00',
      MEDIUM: '#fbc02d',
      LOW: '#388e3c',
      UNKNOWN: '#757575',
    },
  },
});
```

### Styles personnalisés

Les styles utilisent principalement le système `sx` de MUI :

```jsx
<Box sx={{ mt: 4, mb: 2, display: 'flex' }}>
  {/* Content */}
</Box>
```

## Gestion d'État

L'application utilise les hooks React pour la gestion d'état :

- `useState` : État local des composants
- `useEffect` : Chargement des données
- `useNavigate` : Navigation programmatique
- `useParams` : Paramètres d'URL

Pas de Redux/Context API pour garder l'application simple.

## Bonnes Pratiques

### Chargement des données

```jsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getData();
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [dependency]);
```

### Affichage conditionnel

```jsx
if (loading) {
  return <CircularProgress />;
}

if (error) {
  return <Alert severity="error">{error}</Alert>;
}

return <YourComponent data={data} />;
```

## Tests (à implémenter)

### Installer les dépendances de test

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

### Exemple de test

```javascript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Dashboard from './pages/Dashboard';

describe('Dashboard', () => {
  it('renders dashboard title', () => {
    render(<Dashboard />);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});
```

### Lancer les tests

```bash
npm run test
```

## Linting et Formatage

### ESLint

```bash
# Installer ESLint
npm install --save-dev eslint

# Vérifier le code
npm run lint
```

### Prettier

```bash
# Installer Prettier
npm install --save-dev prettier

# Formater le code
npm run format
```

## Build Docker

Le Dockerfile génère une image optimisée avec Nginx :

```bash
# Depuis la racine du projet
docker build -f docker/frontend.Dockerfile -t trivy-operator-gui-frontend .

# Lancer le conteneur
docker run -p 8080:80 \
  -e BACKEND_URL=http://backend:8080 \
  trivy-operator-gui-frontend
```

## Variables d'Environnement

### Développement

```bash
# .env.local
VITE_API_URL=http://localhost:8080/api
```

### Production

En production, l'URL de l'API est configurée via Nginx au runtime avec la variable `BACKEND_URL`.

Le script d'entrypoint (`40-generate-config.sh`) génère la configuration Nginx dynamiquement.

## Performance

### Optimisations Vite

- **Code splitting** : Automatique par route
- **Tree shaking** : Suppression du code non utilisé
- **Minification** : Terser pour JS, esbuild pour CSS
- **Lazy loading** : Routes chargées à la demande

### Optimisations React

```jsx
// Lazy loading des pages
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Dans App.jsx
<Suspense fallback={<CircularProgress />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
  </Routes>
</Suspense>
```

## Debugging

### React Developer Tools

Installer l'extension React DevTools pour Chrome/Firefox.

### Network Inspection

Utiliser les DevTools du navigateur (onglet Network) pour inspecter les requêtes API.

### Console Logs

```javascript
// En développement uniquement
if (import.meta.env.DEV) {
  console.log('Debug data:', data);
}
```

## Accessibilité

### Bonnes pratiques implémentées

- ✅ Labels appropriés pour les formulaires
- ✅ Contraste des couleurs suffisant
- ✅ Navigation au clavier
- ✅ ARIA labels sur les boutons d'action
- ✅ Feedback visuel pour les états de chargement

### Améliorer l'accessibilité

```jsx
// Ajouter des aria-labels
<IconButton aria-label="refresh data" onClick={handleRefresh}>
  <RefreshIcon />
</IconButton>

// Utiliser des titres sémantiques
<Typography variant="h1" component="h1">
  Dashboard
</Typography>
```

## Dépendances Principales

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "axios": "^1.6.0",
    "recharts": "^2.10.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

## Troubleshooting

### Erreur "Failed to fetch"

Le backend n'est pas accessible. Vérifier :

```bash
# Backend en cours d'exécution ?
curl http://localhost:8080/health

# CORS activé sur le backend ?
# Vérifier dans backend/main.go
```

### Build échoue

```bash
# Nettoyer node_modules
rm -rf node_modules package-lock.json
npm install

# Nettoyer le cache Vite
rm -rf node_modules/.vite
npm run build
```

### Hot reload ne fonctionne pas

```bash
# Vérifier les limites de fichiers (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Contribution

1. Créer une branche feature
2. Suivre les conventions de nommage :
   - Components : PascalCase
   - Files : camelCase
   - CSS : kebab-case
3. Ajouter des tests si possible
4. Vérifier le linting : `npm run lint`
5. Créer une Pull Request

## Roadmap

Fonctionnalités à venir :

- [ ] Thème sombre/clair
- [ ] Graphiques interactifs avancés
- [ ] Export PDF/CSV des rapports
- [ ] Notifications en temps réel
- [ ] Recherche globale
- [ ] Favoris/bookmarks
- [ ] Multi-cluster support
