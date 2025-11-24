# Kibana Dashboard Versions

## Available Dashboards

### 1. Original Dashboard (Kibana 10.3.0+)
**File:** `trivy-unified-dashboard.ndjson`
- Compatible with: Kibana 10.3.0 and higher
- Status: Original version, unchanged

### 2. Dashboard V2 for Kibana 7.11.0
**File:** `trivy-unified-dashboard-v2-k7.ndjson` ✅ **USE THIS ONE**
- Compatible with: Kibana 7.11.0+
- Object names: `trivy-reports-v2`, `trivy-unified-dashboard-v2`
- Features: Same as original but with compatibility fixes

### 3. Dashboard V2 for Kibana 10.2.0
**File:** `trivy-unified-dashboard-v2.ndjson`
- Compatible with: Kibana 10.2.0+
- For users with Kibana 10.x (not 7.x)

---

## How to Choose

Check your Kibana version:
- **Kibana 7.x** → Use `trivy-unified-dashboard-v2-k7.ndjson`
- **Kibana 8.x-10.2** → Use `trivy-unified-dashboard-v2.ndjson`
- **Kibana 10.3+** → Use `trivy-unified-dashboard.ndjson` (original)

---

## Import Instructions

1. Go to Kibana → Management → Stack Management → Saved Objects
2. Click "Import"
3. Select the appropriate NDJSON file for your Kibana version
4. Click "Import"

---

## New Fields Available (After Rebuilding Exporter)

Once you rebuild and redeploy the ECS exporter with the updated `transformer.go`, you'll see:

### Universal Field (All Report Types)
- **`event.severity_label`**: String severity (critical, high, medium, low)
  - Available for ALL datasets
  - Better than using tags for filtering

### Vulnerability Reports
- **`vulnerability.package.name`**: Package name (was empty before)
- **`vulnerability.description`**: CVE description (was empty before)
- **`vulnerability.score.base`**: CVSS score (was empty before)
- **`vulnerability.published_date`**: CVE publication date
- **`vulnerability.last_modified_date`**: CVE last modification date

### Assessment Reports (Config/RBAC/Infra)
- **`metadata.messages`**: Array of detailed check messages
- **`metadata.remediation`**: Remediation instructions

---

## Current Data Status

The report you showed me (`2025-11-24T18:49:05Z`) does NOT have `event.severity_label` yet.

This is **normal** because:
1. ✅ Code is fixed in `transformer.go`
2. ❌ Exporter not yet rebuilt/redeployed
3. ❌ New data not yet exported

**Next steps:**
1. Rebuild the exporter: `cd BINARIES-ECS_EXPORTER && go build`
2. Redeploy the exporter
3. Wait for next scan or trigger manually
4. Check new data has `event.severity_label`

---

## Verification Commands

After redeploying, check in Kibana Discover:

```kql
# Should show data with new field
event.severity_label: *

# Filter by severity across all report types
event.severity_label: (high OR critical)

# Check package names are populated
vulnerability.package.name: *
```
