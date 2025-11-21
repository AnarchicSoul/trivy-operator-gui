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

## Files in this Directory

This directory contains only the essential files for the unified dashboard:

- **`trivy-unified-dashboard.ndjson`** - The complete unified dashboard (ready to import)
- **`generate-unified-dashboard-v4-frontend.py`** - Python script to regenerate the dashboard
- **`data-view.ndjson`** - Index pattern definition (automatically included in the unified dashboard)
- **`README.md`** - This documentation file
- **`SOLUTION.md`** - Technical details, field mappings, and troubleshooting

All old individual dashboards have been removed as they are superseded by the unified dashboard.

---

## Prerequisites

1. Elasticsearch with Trivy reports indexed (using `trivy-operator-ecs-exporter`)
2. Kibana instance connected to the same Elasticsearch cluster
3. Data in Elasticsearch (run the exporter at least once to have data to visualize)

## Quick Start - Import the Unified Dashboard

### Import via Kibana UI (Recommended)

1. **Open Kibana** in your browser
2. Navigate to **Stack Management** > **Saved Objects**
3. Click **Import** button
4. **Select the file** `trivy-unified-dashboard.ndjson`
5. Click **Import**
6. If prompted about conflicts, select **Overwrite existing objects**

### View Your Dashboard

1. Navigate to **Analytics** > **Dashboard**
2. Look for **"Trivy - Unified Security Dashboard"**
3. Click to open it
4. Use the **namespace filter** at the top to filter by namespace
5. Explore the metrics, charts, and pod tables!

**Dashboard Sections:**
- **Top Row:** Summary metrics (6 cards)
- **Second Row:** Charts (Pie chart + Timeline)
- **Third Row:** Top vulnerable namespaces
- **Bottom Rows:** Pod tables sorted by Critical severity

### Import via API (Alternative)

```bash
cd KIBANA-DASHBOARD

curl -X POST "http://localhost:5601/api/saved_objects/_import?overwrite=true" \
  -H "kbn-xsrf: true" \
  --form file=@trivy-unified-dashboard.ndjson
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
