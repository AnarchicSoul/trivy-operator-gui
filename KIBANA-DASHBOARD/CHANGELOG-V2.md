# Trivy Operator GUI - Kibana Dashboard V2 Changelog

## Version 2.0 - 2025-11-24

### 🎯 Overview
Complete overhaul of the ECS transformer and Kibana dashboard to fix critical bugs and add missing fields from Trivy Operator CRDs.

---

## 🔧 ECS Transformer Fixes (`BINARIES-ECS_EXPORTER/pkg/ecs/transformer.go`)

### ❌ Critical Bugs Fixed

#### VulnerabilityReport Issues:

1. **Package Name Missing (Line 500)**
   - **Bug**: Used `getString(vuln, "pkgName")` but CRD field is `resource`
   - **Fix**: Changed to `getString(vuln, "resource")`
   - **Impact**: Package names now properly populated in Elasticsearch

2. **Vulnerability Description Missing (Line 167)**
   - **Bug**: Used `getString(v, "description")` but CRD field is `title`
   - **Fix**: Changed to `getString(v, "title")`
   - **Impact**: Vulnerability descriptions now available in Kibana

3. **CVSS Score Missing (Lines 482-496)**
   - **Bug**: Looked for nested `cvss.V3Score` structure
   - **Fix**: Read direct `score` field from CRD with fallback to old structure
   - **Impact**: CVSS scores now properly indexed

4. **Message Incomplete (Line 176)**
   - **Bug**: Used `getString(v, "pkgName")` in message formatting
   - **Fix**: Changed to `getString(v, "resource")`
   - **Impact**: Alert messages now show correct package names

5. **Package Type (Line 503)**
   - **Bug**: Used `getString(vuln, "pkgType")` (doesn't exist in CRD)
   - **Fix**: Changed to `getString(vuln, "packageType")`
   - **Impact**: Package types properly captured when available

### ✨ New Fields Added

#### VulnerabilityReport Enhancements:
- **`vulnerability.published_date`**: CVE publication date
- **`vulnerability.last_modified_date`**: CVE last modification date

#### ConfigAudit/RBAC/Infra Assessment Enhancements:
- **`metadata.messages`**: Array of detailed check messages
- **`metadata.remediation`**: Remediation instructions for failed checks

#### Universal Severity Field (All Datasets):
- **`event.severity_label`**: String label for severity (critical, high, medium, low)
  - Available for ALL report types (vulnerability, config-audit, exposed-secret, rbac-assessment, infra-assessment)
  - Allows unified filtering and visualization across all security reports
  - Previously only `vulnerability.severity` existed for vulnerability reports

---

## 📊 Kibana Dashboard V2 (`trivy-unified-dashboard-v2.ndjson`)

### 🆕 New Dashboard Features

#### Compatible with Kibana ≤ 10.2.0
- Changed `typeMigrationVersion` from `10.3.0` to `10.2.0`
- New object names to avoid conflicts:
  - Data View: `trivy-reports-v2`
  - Dashboard: `trivy-unified-dashboard-v2`

#### Enhanced Vulnerability Table
The vulnerability reports table now includes:
- **Package Name**: Shows affected package (previously empty)
- **CVE ID**: Displays vulnerability identifier
- **Avg Score**: CVSS average score for quick risk assessment
- **Pod/Namespace**: Kubernetes resource location
- **Severity Counts**: Critical, High, Medium, Low breakdown

#### All Original Features Retained
- 6 metric cards (Vulnerabilities, Config Issues, Secrets, RBAC, Infra, Total)
- Donut chart for vulnerability severity distribution
- Timeline view of security issues
- Top vulnerable namespaces bar chart
- Detailed tables for each report type

---

## 📁 File Structure

```
KIBANA-DASHBOARD/
├── trivy-unified-dashboard.ndjson        # Original (unchanged)
├── trivy-unified-dashboard-v2.ndjson     # New V2 (Kibana ≤ 10.2.0)
└── CHANGELOG-V2.md                       # This file
```

---

## 🚀 Migration Guide

### For New Installations:
1. Import `trivy-unified-dashboard-v2.ndjson` into Kibana
2. Rebuild ECS exporter with the fixed transformer
3. Re-export Trivy reports to populate new fields

### For Existing Installations:
1. **Keep your current dashboard** - V2 uses different object names
2. Build and deploy updated ECS exporter
3. Wait for next report cycle (or trigger manual scan)
4. Import V2 dashboard to see new fields
5. Compare dashboards side-by-side
6. Optionally remove old dashboard once satisfied

---

## 📈 Field Comparison

### VulnerabilityReport Fields

| Field | V1 Status | V2 Status |
|-------|-----------|-----------|
| `vulnerability.id` | ✅ Working | ✅ Working |
| `vulnerability.severity` | ✅ Working | ✅ Working |
| `vulnerability.reference` | ✅ Working | ✅ Working |
| `vulnerability.description` | ❌ Empty | ✅ **Fixed** |
| `vulnerability.package.name` | ❌ **Empty** | ✅ **Fixed** |
| `vulnerability.package.version` | ✅ Working | ✅ Working |
| `vulnerability.package.fixed_version` | ✅ Working | ✅ Working |
| `vulnerability.package.type` | ❌ Empty | ✅ **Fixed** |
| `vulnerability.score.base` | ❌ **Empty** | ✅ **Fixed** |
| `vulnerability.score.version` | ❌ Empty | ✅ **Fixed** |
| `vulnerability.published_date` | ❌ N/A | ✅ **New** |
| `vulnerability.last_modified_date` | ❌ N/A | ✅ **New** |

### Assessment Reports (ConfigAudit, RBAC, Infra)

| Field | V1 Status | V2 Status |
|-------|-----------|-----------|
| `metadata.check_id` | ✅ Working | ✅ Working |
| `metadata.title` | ✅ Working | ✅ Working |
| `metadata.description` | ✅ Working | ✅ Working |
| `metadata.category` | ✅ Working | ✅ Working |
| `metadata.messages` | ❌ N/A | ✅ **New** |
| `metadata.remediation` | ❌ N/A | ✅ **New** |

### Universal Fields (All Report Types)

| Field | V1 Status | V2 Status |
|-------|-----------|-----------|
| `event.severity` | ✅ Working (numeric) | ✅ Working (numeric) |
| `event.severity_label` | ❌ **N/A** | ✅ **New** (string) |
| `tags` | ✅ Working | ✅ Working |

**Note:** `event.severity_label` provides a unified way to filter by severity across all report types without relying on tags or dataset-specific fields.

---

## 🧪 Testing Recommendations

1. **Verify Package Names**: Check that vulnerability reports show package names
2. **Check CVSS Scores**: Ensure scores appear in vulnerability tables
3. **Test Filters**: Verify filtering by package name works
4. **Validate Descriptions**: Confirm CVE descriptions are populated
5. **Check Assessment Messages**: Review remediation instructions in metadata

---

## 🐛 Known Limitations

- **Architecture field**: Not available in Trivy CRD (intentionally omitted)
- **Links field**: Available in CRD but not yet exported to Elasticsearch
- **Target field**: Available but often empty in vulnerability reports

---

## 📝 Technical Details

### Data Flow
```
Trivy Operator CRDs
      ↓
ECS Transformer (transformer.go)
      ↓
Elasticsearch (trivy-reports-*)
      ↓
Kibana Dashboard V2
```

### Key Files Changed
- `BINARIES-ECS_EXPORTER/pkg/ecs/transformer.go`: Fixed field mappings
- `KIBANA-DASHBOARD/trivy-unified-dashboard-v2.ndjson`: New dashboard

### Trivy Operator CRD Versions Tested
- VulnerabilityReport: `aquasecurity.github.io/v1alpha1`
- ConfigAuditReport: `aquasecurity.github.io/v1alpha1`
- ExposedSecretReport: `aquasecurity.github.io/v1alpha1`
- ClusterRbacAssessmentReport: `aquasecurity.github.io/v1alpha1`
- ClusterInfraAssessmentReport: `aquasecurity.github.io/v1alpha1`

---

## 🙏 Credits

Investigation conducted through analysis of:
- Real Trivy Operator CRD YAML exports
- Elasticsearch data samples
- Trivy Operator official documentation
- ECS transformer source code

---

## 📞 Support

For issues or questions about V2:
1. Check that you're using the updated ECS exporter binary
2. Verify Trivy Operator is generating reports with expected fields
3. Check Elasticsearch indices for new field mappings
4. Review Kibana index pattern refresh status
