# Kibana Dashboards for Trivy Operator Reports

This directory contains pre-built Kibana dashboards for visualizing Trivy Operator security reports exported to Elasticsearch.

## 🎯 Recommended: Unified Dashboard (NEW!)

**File:** `trivy-unified-dashboard.ndjson`

A single, comprehensive dashboard that **reproduces exactly the frontend application experience**!

### What's included:
- **Summary Metrics** - 6 metric cards showing totals for each report type
- **Vulnerabilities by Severity** - Pie chart breakdown
- **Security Issues Timeline** - Trend analysis over time
- **Top Vulnerable Namespaces** - Bar chart
- **Namespace Filter** - Interactive filter at the top
- **Frontend-Style Tables** - Top pods with severity breakdown (Critical, High, Medium, Low)

### Table Features (v4):
📊 **Pod + Namespace + Critical + High + Medium + Low + Total**
🔽 **Sorted by Critical count (descending)**
🎯 **Just like the React/MUI frontend tables!**

Example table row:
```
Pod Name              | Namespace  | Critical | High | Medium | Low | Total
nginx-deployment-abc  | production |    5     |  12  |   8    |  3  |  28
redis-master-xyz      | production |    3     |   7  |  15    |  9  |  34
```

### Why use the unified dashboard?
✅ One dashboard instead of 15 separate ones
✅ Uses correct ECS field mappings
✅ **Reproduces frontend tables exactly**
✅ **Top pods by Critical severity**
✅ Interactive namespace filter
✅ All information at a glance
✅ Easier to maintain and share

**See `SOLUTION.md` for detailed information about field mappings and troubleshooting.**

---

## Dashboard Overview (Individual Dashboards)

### 1. Trivy Security Overview Dashboard
**File:** `trivy-security-overview.ndjson`

A comprehensive dashboard showing:
- **Vulnerabilities by Severity** (Pie Chart) - Distribution of critical/high/medium/low vulnerabilities
- **Security Issues Over Time** (Area Chart) - Trend of all security issues across different report types
- **Top Vulnerable Namespaces** (Horizontal Bar) - Namespaces with most vulnerabilities
- **Critical Vulnerabilities Table** - Detailed list of critical CVEs with package and location info

**Best for:** Quick security overview and executive summary

### 2. Vulnerability Deep Dive Dashboard
**File:** `trivy-vulnerability-deep-dive.ndjson`

Detailed vulnerability analysis:
- **CVSS Score Distribution** (Histogram) - Distribution of vulnerability scores
- **Top Vulnerable Packages** (Horizontal Bar) - Packages appearing most in vulnerability reports
- **Top CVEs** (Horizontal Bar) - Most common CVEs across your cluster
- **Vulnerabilities by Image** (Table) - Which container images have the most issues

**Best for:** Vulnerability remediation and package management

### 3. Compliance Dashboard
**File:** `trivy-compliance.ndjson`

Configuration and compliance view:
- **All Security Issues Timeline** (Area Chart) - Trends for vulnerabilities, config audits, secrets, RBAC, and infrastructure
- **Config Audit by Category** (Pie Chart) - Distribution of configuration issues
- **Config Issues by Severity** (Bar Chart) - Severity levels of configuration problems
- **Exposed Secrets by Type** (Pie Chart) - Types of secrets found
- **Critical Config Issues Table** - Detailed list of high-severity configuration problems

**Best for:** Compliance monitoring and configuration hardening

### 4. Navigation Dashboards (New!)
**Files:** Multiple interconnected dashboards with drilldown navigation

A complete hierarchical navigation system that reproduces the frontend application experience:

#### Main Navigation Dashboard
**File:** `trivy-navigation-main.ndjson`
- Entry point showing all report types with severity counts
- Click on any report type to drill down

#### Level 2: Reports by Pod/Resource
- **Vulnerabilities:** `trivy-vulnerability-pods.ndjson` - Pods with vulnerabilities
- **Config Audit:** `trivy-configaudit-pods.ndjson` - Pods with config issues
- **Exposed Secrets:** `trivy-secrets-pods.ndjson` - Pods with exposed secrets
- **RBAC:** `trivy-rbac-resources.ndjson` - RBAC resources with issues
- **Infrastructure:** `trivy-infra-resources.ndjson` - Infrastructure resources with issues

Each shows pods/resources grouped by namespace with severity breakdown. Click on any row to see details.

#### Level 3: Alert Details
- **Vulnerability Details:** `trivy-vulnerability-details.ndjson` - CVE details with descriptions
- **Config Audit Details:** `trivy-configaudit-details.ndjson` - Configuration check details
- **Secret Details:** `trivy-secrets-details.ndjson` - Exposed secret details with matches
- **RBAC Details:** `trivy-rbac-details.ndjson` - RBAC check details
- **Infrastructure Details:** `trivy-infra-details.ndjson` - Infrastructure check details

Each shows complete alert information including title, description, remediation, and context.

**Navigation Flow:**
```
Main Dashboard (Report Types)
    ↓ (click on report type)
Pods/Resources with Alerts
    ↓ (click on pod/resource)
Alert Details with Messages
```

**Best for:** Interactive exploration and detailed investigation (like the frontend app!)

## Prerequisites

1. Elasticsearch with Trivy reports indexed (using `trivy-operator-ecs-exporter`)
2. Kibana instance connected to the same Elasticsearch cluster
3. Data in Elasticsearch (run the exporter at least once to have data to visualize)

## Quick Start - Import All Dashboards

### Import via Kibana UI (Recommended)

1. **Open Kibana** in your browser
2. Navigate to **Stack Management** > **Saved Objects**
3. Click **Import** button
4. **Drag and drop or select files** - Choose ALL `.ndjson` files from this directory:
   - `data-view.ndjson` (creates the data view automatically)
   - `trivy-security-overview.ndjson`
   - `trivy-vulnerability-deep-dive.ndjson`
   - `trivy-compliance.ndjson`
   - **Navigation dashboards** (NEW - import all for full navigation experience):
     - `trivy-navigation-main.ndjson` (start here!)
     - `trivy-vulnerability-pods.ndjson` + `trivy-vulnerability-details.ndjson`
     - `trivy-configaudit-pods.ndjson` + `trivy-configaudit-details.ndjson`
     - `trivy-secrets-pods.ndjson` + `trivy-secrets-details.ndjson`
     - `trivy-rbac-resources.ndjson` + `trivy-rbac-details.ndjson`
     - `trivy-infra-resources.ndjson` + `trivy-infra-details.ndjson`
5. Click **Import**
6. If prompted about conflicts, select **Create new objects with random IDs**

### View Your Dashboards

1. Navigate to **Analytics** > **Dashboard**
2. You should see multiple dashboards:
   - **Trivy Security Overview**
   - **Trivy Vulnerability Deep Dive**
   - **Trivy Compliance Dashboard**
   - **Trivy Reports - Main Navigation** (NEW - start here for interactive exploration!)
   - Plus all the detail dashboards for navigation
3. Click on any dashboard to start visualizing your security data!

**Recommended Starting Points:**
- **Quick Overview:** Start with "Trivy Security Overview"
- **Interactive Exploration:** Start with "Trivy Reports - Main Navigation" and drill down

### Import via API (Alternative)

```bash
# Navigate to the KIBANA-DASHBOARD directory
cd KIBANA-DASHBOARD

# Import all dashboards
for file in *.ndjson; do
  curl -X POST "http://localhost:5601/api/saved_objects/_import?overwrite=true" \
    -H "kbn-xsrf: true" \
    --form file=@"$file"
done
```

## Manual Data View Creation (if needed)

If the data view wasn't created automatically during import:

1. Navigate to **Stack Management** > **Data Views**
2. Click **Create data view**
3. Configure:
   - **Name:** `Trivy Reports`
   - **Index pattern:** `trivy-reports-*`
   - **Timestamp field:** `@timestamp`
4. Click **Save data view**

## Dashboard Customization

All dashboards can be customized:

1. Open a dashboard
2. Click **Edit** in the top-right corner
3. Modify visualizations, add new panels, or adjust filters
4. Click **Save** to persist changes

## Data Refresh

Dashboards automatically refresh based on the Kibana refresh interval settings. You can:

- Set auto-refresh interval (e.g., 5 minutes, 1 hour)
- Manually refresh using the refresh button
- Adjust the time range picker to view historical data

## Troubleshooting

### No Data Showing

1. **Check data view:** Ensure `trivy-reports-*` data view exists
2. **Verify data:** Run a search in Discover: `GET trivy-reports-*/_search`
3. **Check time range:** Adjust the time picker to include your data
4. **Verify exporter:** Ensure the BINARIES-ECS_EXPORTER CronJob ran successfully

### Missing Fields

If visualizations show "Missing field" errors:

1. Refresh the data view field list:
   - Go to **Stack Management** > **Data Views**
   - Select `Trivy Reports`
   - Click the refresh icon

2. Verify the exporter is sending all required fields

### Performance Issues

For large datasets:

1. Adjust the time range to a smaller window
2. Consider using sampling in visualizations
3. Implement ILM policies for data retention
4. Use filters to narrow down the data

## Index Lifecycle Management

Consider setting up ILM policies to manage data retention:

```json
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_size": "50GB",
            "max_age": "7d"
          }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

Apply to the trivy-reports index template.

## Support

For issues or questions:
- Check the main project README
- Review Elasticsearch/Kibana logs
- Verify the BINARIES-ECS_EXPORTER logs: `kubectl logs -n trivy-system <cronjob-pod>`
