# Kibana Dashboard Versions

## Available Dashboards

### 1. Original Dashboard (Kibana 10.3.0+)
**File:** `trivy-unified-dashboard.ndjson`
- Compatible with: Kibana 10.3.0 and higher
- Status: Original version, unchanged

### 2. Dashboard V2 Enhanced for Kibana 7.11.0 ⭐ **RECOMMENDED**
**File:** `trivy-unified-dashboard-v2-k7-enhanced.ndjson` ✅ **USE THIS FOR KIBANA 7.11.0**
- Compatible with: Kibana 7.11.0+
- Object names: `trivy-reports-v2-k7-enhanced`, `trivy-unified-dashboard-v2-k7-enhanced`
- Features: Comprehensive security analysis with classic visualizations
- **Includes:**
  - **6 metric cards:** Vulnerabilities, Config Issues, Secrets, RBAC, Infra, Critical Issues
  - **Issues by Severity:** Universal donut chart using `event.severity_label` (works for all report types)
  - **CVSS Score Distribution:** Histogram showing vulnerability score ranges
  - **Issues by Type:** Bar chart showing distribution across datasets
  - **Timeline by Severity:** Area chart with severity breakdowns over time
  - **Top 10 CVEs:** Most common vulnerabilities in your cluster
  - **Top 10 Vulnerable Packages:** Packages with most security issues
  - **Top Namespaces:** Namespaces with highest issue counts

### 3. Dashboard V2 Basic for Kibana 7.11.0
**File:** `trivy-unified-dashboard-v2-k7-basic.ndjson`
- Compatible with: Kibana 7.11.0+
- Object names: `trivy-reports-v2-k7-basic`, `trivy-unified-dashboard-v2-k7-basic`
- Features: Simplified version with essential visualizations only
- **Use case:** If you prefer a minimal dashboard or the enhanced version is too heavy

### 4. Dashboard V2 for Kibana 10.2.0
**File:** `trivy-unified-dashboard-v2.ndjson`
- Compatible with: Kibana 10.2.0+
- For users with Kibana 10.x (not 7.x)
- Object names: `trivy-reports-v2`, `trivy-unified-dashboard-v2`
- Features: Full Lens-based visualizations with advanced features

---

## How to Choose

Check your Kibana version:
- **Kibana 7.11.0** → Use `trivy-unified-dashboard-v2-k7-enhanced.ndjson` ⭐ (recommended, comprehensive analysis)
  - Alternative: `trivy-unified-dashboard-v2-k7-basic.ndjson` (minimal version)
- **Kibana 8.x-10.2** → Use `trivy-unified-dashboard-v2.ndjson` (full Lens features)
- **Kibana 10.3+** → Use `trivy-unified-dashboard.ndjson` (original)

### Important Notes for Kibana 7.11.0 Users:

⚠️ **Lens Incompatibility**: Kibana 7.11.0 does not support the Lens visualization format used in newer dashboards. The error "Cannot read properties of undefined (reading 'layers')" occurs when attempting to import Lens-based dashboards.

✅ **Solution**: Use the basic dashboard (`trivy-unified-dashboard-v2-k7-basic.ndjson`) which uses classic visualization types that are fully compatible with Kibana 7.11.0.

💡 **Recommendation**: For the best experience and full dashboard features, consider upgrading to Kibana 8.x or newer, which has full support for modern Lens visualizations.

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
