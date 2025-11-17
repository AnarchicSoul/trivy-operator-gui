# Kibana Dashboards for Trivy Operator Reports

This directory contains pre-built Kibana dashboards for visualizing Trivy Operator security reports exported to Elasticsearch.

## Dashboard Overview

### 1. Trivy Security Overview Dashboard
**File:** `trivy-security-overview.ndjson`

A comprehensive dashboard showing:
- Total vulnerabilities by severity
- Security issues over time
- Top vulnerable namespaces and pods
- Exposed secrets trends
- RBAC and infrastructure issues
- Recent security findings

### 2. Vulnerability Deep Dive Dashboard
**File:** `trivy-vulnerability-dashboard.ndjson`

Detailed vulnerability analysis:
- CVE distribution and trends
- Packages with most vulnerabilities
- CVSS score analysis
- Fix availability tracking
- Vulnerability age analysis

### 3. Compliance Dashboard
**File:** `trivy-compliance-dashboard.ndjson`

Configuration and compliance view:
- Config audit findings
- RBAC assessment results
- Infrastructure security checks
- Compliance trends over time
- Critical compliance issues

## Prerequisites

1. Elasticsearch with Trivy reports indexed (using `trivy-operator-elastic-exporter`)
2. Kibana instance connected to the same Elasticsearch cluster
3. Data view (index pattern) created for `trivy-reports-*`

## Import Instructions

### Step 1: Create Data View

1. Navigate to **Stack Management** > **Data Views** in Kibana
2. Click **Create data view**
3. Configure:
   - **Name:** `Trivy Reports`
   - **Index pattern:** `trivy-reports-*`
   - **Timestamp field:** `@timestamp`
4. Click **Save data view to Kibana**

### Step 2: Import Dashboards

#### Method 1: Using Kibana UI

1. Navigate to **Stack Management** > **Saved Objects**
2. Click **Import**
3. Select one or more `.ndjson` files from this directory
4. Click **Import**
5. If prompted about conflicts, choose to overwrite or create new objects

#### Method 2: Using API

```bash
# Import all dashboards at once
for file in kibana-dashboards/*.ndjson; do
  curl -X POST "http://localhost:5601/api/saved_objects/_import" \
    -H "kbn-xsrf: true" \
    --form file=@"$file"
done
```

### Step 3: View Dashboards

1. Navigate to **Analytics** > **Dashboard** in Kibana
2. Search for "Trivy" to find the imported dashboards
3. Click on a dashboard to view

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
4. **Verify exporter:** Ensure the elastic-exporter CronJob ran successfully

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
- Verify the elastic-exporter logs: `kubectl logs -n trivy-system <cronjob-pod>`
