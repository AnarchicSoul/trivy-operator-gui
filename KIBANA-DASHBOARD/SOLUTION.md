# Solution: Dashboard Kibana Unifié pour Trivy

## Problème identifié

### Dashboards qui fonctionnent ✅
- **Security Overview**
- **Vulnerability Deep Dive**
- **Compliance Dashboard**
- **Main Navigation**

### Dashboards qui ne fonctionnent PAS ❌
- Tous les autres dashboards (vuln-pods, vuln-details, config-pods, config-details, secrets-pods, secrets-details, rbac-resources, rbac-details, infra-resources, infra-details)

### Cause du problème

Les dashboards qui ne fonctionnent pas utilisent des **champs incorrects** qui n'existent pas dans la structure ECS des données exportées par le `trivy-operator-ecs-exporter`.

**Champs incorrects utilisés** :
- `check.severity` ❌
- `check.id` ❌
- `check.title` ❌
- `secret.severity` ❌
- `secret.rule_id` ❌

**Champs corrects selon le format ECS** :
- `event.severity` ✅ (pour tous les types de rapports)
- `event.dataset` ✅ (pour filtrer par type de rapport)
- `metadata.check_id` ✅ (pour config-audit, rbac, infra)
- `metadata.title` ✅
- `metadata.category` ✅
- `metadata.rule_id` ✅ (pour secrets)
- `vulnerability.severity` ✅ (pour les vulnérabilités)
- `vulnerability.id` ✅

## Solution implémentée

### Dashboard unifié : `trivy-unified-dashboard.ndjson`

Un dashboard unique nommé **"Trivy - Unified Security Dashboard"** qui reproduit l'expérience de l'application frontend.

#### Structure du dashboard

**Ligne 1 : Métriques de synthèse (6 métriques)**
- Total Vulnerabilities
- Config Issues
- Exposed Secrets
- RBAC Issues
- Infra Issues
- Total Reports

**Ligne 2 : Visualisations graphiques**
- Vulnerabilities by Severity (Pie Chart)
- Security Issues Over Time (Area Chart - timeline par type de rapport)

**Ligne 3 : Analyse par namespace**
- Top Vulnerable Namespaces (Bar Chart horizontal)

**Lignes 4-7 : Tables détaillées par type de rapport** (similaire aux onglets du frontend)
- Vulnerability Reports Table
- Configuration Audit Reports Table
- Exposed Secrets Reports Table
- RBAC Assessment Reports Table (à gauche)
- Infrastructure Assessment Reports Table (à droite)

### Avantages de cette approche

1. **Un seul dashboard** - Plus besoin de naviguer entre plusieurs dashboards
2. **Vue d'ensemble complète** - Toutes les informations importantes en un coup d'œil
3. **Organisé comme le frontend** - Structure familière avec des sections pour chaque type de rapport
4. **Utilise les bons champs** - Toutes les visualisations utilisent les champs ECS corrects
5. **Performant** - Un seul dashboard à charger

## Mapping des champs ECS

| Type de rapport | Dataset | Champs disponibles |
|----------------|---------|-------------------|
| Vulnérabilités | `trivy.vulnerability` | `vulnerability.id`, `vulnerability.severity`, `vulnerability.description`, `vulnerability.package.name` |
| Config Audit | `trivy.config-audit` | `event.severity`, `metadata.check_id`, `metadata.title`, `metadata.category`, `metadata.description` |
| Secrets exposés | `trivy.exposed-secret` | `event.severity`, `metadata.rule_id`, `metadata.title`, `metadata.category`, `metadata.target`, `metadata.match` |
| RBAC | `trivy.rbac-assessment` | `event.severity`, `metadata.check_id`, `metadata.title`, `metadata.description`, `metadata.category` |
| Infrastructure | `trivy.infra-assessment` | `event.severity`, `metadata.check_id`, `metadata.title`, `metadata.description`, `metadata.category` |

Tous les rapports partagent aussi :
- `@timestamp` : Timestamp de l'événement
- `event.dataset` : Type de rapport
- `kubernetes.namespace` : Namespace Kubernetes
- `kubernetes.pod.name` : Nom du pod
- `observer.name` : Scanner utilisé (Trivy)

## Instructions d'importation

### Méthode 1 : Via l'interface Kibana (Recommandée)

1. Ouvrez **Kibana** dans votre navigateur
2. Naviguez vers **Stack Management** > **Saved Objects**
3. Cliquez sur **Import**
4. Sélectionnez le fichier `trivy-unified-dashboard.ndjson`
5. Cliquez sur **Import**
6. Allez dans **Analytics** > **Dashboard**
7. Recherchez **"Trivy - Unified Security Dashboard"**

### Méthode 2 : Via API

```bash
cd KIBANA-DASHBOARD

curl -X POST "http://localhost:5601/api/saved_objects/_import?overwrite=true" \
  -H "kbn-xsrf: true" \
  --form file=@trivy-unified-dashboard.ndjson
```

## Comparaison : Frontend vs Dashboard Kibana

### Frontend (React/MUI)
```
┌─────────────────────────────────────┐
│ Tabs Navigation                     │
├─────────────────────────────────────┤
│ [Vulnerabilities] [Config] [Secrets]│
│ [RBAC] [Infra]                      │
├─────────────────────────────────────┤
│ Table with current tab data         │
└─────────────────────────────────────┘
```

### Dashboard Kibana Unifié
```
┌─────────────────────────────────────┐
│ 📊 Metrics (6 cards)                │
├─────────────────────────────────────┤
│ 📈 Charts (Pie + Timeline)          │
├─────────────────────────────────────┤
│ 📊 Top Namespaces                   │
├─────────────────────────────────────┤
│ 📋 Vulnerability Reports Table      │
├─────────────────────────────────────┤
│ 📋 Config Audit Reports Table       │
├─────────────────────────────────────┤
│ 📋 Secrets Reports Table            │
├─────────────────────────────────────┤
│ 📋 RBAC + Infra Tables (side by side)│
└─────────────────────────────────────┘
```

## Génération du dashboard

Le dashboard est généré par le script Python `generate-unified-dashboard.py` :

```bash
python3 generate-unified-dashboard.py
```

Ce script crée :
- L'index pattern `trivy-reports-*`
- Le dashboard unifié avec toutes les visualisations
- Les références correctes entre les objets

## Version finale (v4 - Frontend Style)

La version finale du dashboard reproduit **exactement l'expérience du frontend** React/MUI :

### Tables style frontend :

Toutes les tables affichent maintenant les **TOP PODS** avec leurs compteurs de sévérité, triés par **CRITICAL décroissant** :

**Structure des tables** :
- **Colonne 1** : Pod Name
- **Colonne 2** : Namespace
- **Colonne 3** : Critical (count) - **TRI PAR DÉFAUT ↓**
- **Colonne 4** : High (count)
- **Colonne 5** : Medium (count)
- **Colonne 6** : Low (count)
- **Colonne 7** : Total (count)

**Filtre interactif** :
- **Filtre de namespace** en haut du dashboard pour filtrer tous les panneaux

**Champs utilisés** :
- `kubernetes.pod.name` - Nom du pod
- `kubernetes.namespace` - Namespace Kubernetes
- Compteurs avec filtres sur `tags: critical/high/medium/low` ou `vulnerability.severity`

### Pourquoi cette approche ?

Cette version utilise des **filtered metrics** dans Kibana Lens :
- Chaque colonne de sévérité est un `count` avec un filtre KQL
- Le tri se fait sur la colonne Critical en ordre décroissant
- Reproduction fidèle des tables du frontend (BINARIES-FRONTEND/src/pages/ReportsView.jsx)

## Historique des versions

### v3 (Simplifiée)
- Tables avec Timestamp + Namespace + Count
- Garantie de fonctionnement mais peu de détails

### v4 (Frontend Style) - VERSION ACTUELLE ⭐
- Tables avec Pod + Namespace + Critical + High + Medium + Low + Total
- Tri par Critical décroissant
- Filtre de namespace en haut
- **Reproduction exacte du frontend**

### Comment voir plus de détails ?

Pour voir les détails complets de chaque alerte, utilisez **Kibana Discover** :
1. Allez dans Analytics > Discover
2. Sélectionnez l'index pattern `trivy-reports-*`
3. Filtrez par `event.dataset: "trivy.config-audit"` (ou autre type)
4. Vous verrez tous les champs disponibles dans la sidebar
5. Ajoutez les colonnes que vous voulez voir (message, metadata.*, etc.)

## Prochaines étapes possibles

1. **Ajouter des filtres interactifs** - Utiliser Kibana Controls pour filtrer par namespace, severity, etc.
2. **Drilldowns** - Ajouter des drilldowns pour naviguer vers des détails spécifiques
3. **Alertes** - Configurer des alertes basées sur les seuils de sévérité
4. **Export PDF** - Permettre l'export du dashboard en PDF pour les rapports
5. **Saved Searches** - Créer des recherches sauvegardées pour chaque type de rapport avec tous les champs visibles

## Troubleshooting

### Pas de données dans le dashboard

1. Vérifiez que l'exporter ECS fonctionne :
   ```bash
   kubectl logs -n trivy-system <exporter-pod>
   ```

2. Vérifiez que les données sont dans Elasticsearch :
   ```bash
   curl -X GET "localhost:9200/trivy-reports-*/_search?size=1"
   ```

3. Vérifiez l'index pattern dans Kibana :
   - Stack Management > Data Views
   - Recherchez "Trivy Reports"
   - Cliquez sur "Refresh field list"

### Certaines visualisations sont vides

- Vérifiez que vous avez des données pour le type de rapport correspondant
- Ajustez la période de temps (Time picker) pour inclure vos données
- Vérifiez les filtres appliqués sur le dashboard

## Conclusion

Le dashboard unifié `trivy-unified-dashboard.ndjson` résout les problèmes des dashboards individuels en :
1. ✅ Utilisant les bons champs ECS
2. ✅ Regroupant toutes les informations en un seul endroit
3. ✅ Reproduisant l'expérience du frontend
4. ✅ Étant plus facile à maintenir (1 fichier au lieu de 15)
