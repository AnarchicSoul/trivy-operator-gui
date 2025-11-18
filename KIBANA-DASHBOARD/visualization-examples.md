# Kibana Visualization Examples for Trivy Reports

This guide provides examples of useful visualizations and queries you can create in Kibana.

## Useful KQL Queries

### Filter by Report Type

```kql
# Vulnerabilities only
event.dataset: "trivy.vulnerability"

# Config audit issues only
event.dataset: "trivy.config-audit"

# Exposed secrets only
event.dataset: "trivy.exposed-secret"

# RBAC issues only
event.dataset: "trivy.rbac-assessment"

# Infrastructure issues only
event.dataset: "trivy.infra-assessment"
```

### Filter by Severity

```kql
# Critical vulnerabilities
vulnerability.severity: "critical"

# High severity issues (all types)
event.severity: 3

# Critical or High
event.severity >= 3
```

### Filter by Namespace

```kql
# Specific namespace
kubernetes.namespace: "production"

# Exclude kube-system
NOT kubernetes.namespace: "kube-system"
```

### Complex Queries

```kql
# Critical vulnerabilities in production namespace
event.dataset: "trivy.vulnerability" AND vulnerability.severity: "critical" AND kubernetes.namespace: "production"

# Config issues that are not low severity
event.dataset: "trivy.config-audit" AND event.severity > 1

# All security issues in the last 24 hours
@timestamp >= now-24h
```

## Visualization Examples

### 1. Vulnerability Count by Severity (Pie Chart)

**Visualization Type:** Pie Chart

**Configuration:**
- **Slice by:** `vulnerability.severity.keyword`
- **Metric:** Count
- **Filter:** `event.dataset: "trivy.vulnerability"`

**Colors:**
- critical → Red (#E74856)
- high → Orange (#FF8C00)
- medium → Yellow (#FFD700)
- low → Blue (#4169E1)

---

### 2. Security Issues Over Time (Area Chart)

**Visualization Type:** Area Chart

**Configuration:**
- **Horizontal axis:** `@timestamp` (Date Histogram, Auto interval)
- **Vertical axis:** Count
- **Break down by:** `event.dataset.keyword`
- **Time range:** Last 30 days

---

### 3. Top 10 Vulnerable Namespaces (Bar Chart)

**Visualization Type:** Horizontal Bar Chart

**Configuration:**
- **Vertical axis:** `kubernetes.namespace.keyword` (Top 10)
- **Horizontal axis:** Count
- **Filter:** `event.dataset: "trivy.vulnerability"`
- **Sort:** By metric descending

---

### 4. Critical Vulnerabilities Table

**Visualization Type:** Data Table

**Configuration:**
- **Rows:**
  - `vulnerability.id.keyword`
  - `vulnerability.package.name.keyword`
  - `vulnerability.package.version.keyword`
  - `vulnerability.package.fixed_version.keyword`
  - `kubernetes.namespace.keyword`
  - `kubernetes.pod.name.keyword`
- **Metrics:** Count
- **Filter:** `vulnerability.severity: "critical"`
- **Sort:** By count descending

---

### 5. CVSS Score Distribution (Histogram)

**Visualization Type:** Vertical Bar Chart

**Configuration:**
- **Horizontal axis:** `vulnerability.score.base` (Histogram, interval: 1)
- **Vertical axis:** Count
- **Filter:** `event.dataset: "trivy.vulnerability" AND vulnerability.score.base: *`

---

### 6. Config Audit Failures by Category (Treemap)

**Visualization Type:** Treemap

**Configuration:**
- **Group by:**
  - Primary: `metadata.category.keyword`
  - Secondary: `metadata.check_id.keyword`
- **Metric:** Count
- **Filter:** `event.dataset: "trivy.config-audit"`

---

### 7. Security Trend Metric (TSVB/Metric)

**Visualization Type:** Metric

**Configuration:**
- **Metric:** Count
- **Group by:** `event.dataset.keyword`
- **Time range:** Last 7 days vs Previous 7 days
- **Display:** Show trend arrow and percentage change

---

### 8. Exposed Secrets by Type (Donut Chart)

**Visualization Type:** Donut Chart

**Configuration:**
- **Slice by:** `metadata.category.keyword`
- **Metric:** Count
- **Filter:** `event.dataset: "trivy.exposed-secret"`

---

### 9. Security Score Gauge

**Visualization Type:** Gauge

**Configuration:**
- **Metric:** Formula: `(count() where event.severity <= 2) / count() * 100`
- **Display:** Percentage
- **Ranges:**
  - 0-50: Red (Poor)
  - 50-75: Yellow (Fair)
  - 75-90: Light Green (Good)
  - 90-100: Dark Green (Excellent)

---

### 10. Recent Security Findings (Data Table)

**Visualization Type:** Data Table

**Configuration:**
- **Columns:**
  - `@timestamp`
  - `event.dataset`
  - `vulnerability.severity` or `event.severity`
  - `message`
  - `kubernetes.namespace`
  - `kubernetes.pod.name`
- **Metrics:** Latest document
- **Sort:** By @timestamp descending
- **Time range:** Last 24 hours
- **Page size:** 20

---

### 11. Vulnerability Remediation Status (Bar Chart)

**Visualization Type:** Horizontal Bar Chart

**Configuration:**
- **Vertical axis:** Terms aggregation
  - `vulnerability.package.fixed_version.keyword`
  - Custom label: "Has Fix" if not empty, "No Fix" if empty
- **Horizontal axis:** Count
- **Filter:** `event.dataset: "trivy.vulnerability"`

---

### 12. Heat Map - Issues by Namespace and Severity

**Visualization Type:** Heat Map

**Configuration:**
- **Horizontal axis:** `kubernetes.namespace.keyword`
- **Vertical axis:** `event.severity` (as ranges: 0-1, 2, 3, 4)
- **Cell value:** Count
- **Color scale:** Sequential (Light Yellow to Dark Red)

---

## Creating a Dashboard

### Step-by-Step Process

1. **Navigate to Dashboard:**
   - Go to Analytics > Dashboard
   - Click "Create dashboard"

2. **Add Visualizations:**
   - Click "Create visualization"
   - Choose visualization type
   - Configure as per examples above
   - Click "Save and return"

3. **Arrange Panels:**
   - Drag panels to desired positions
   - Resize panels as needed
   - Group related visualizations

4. **Add Filters:**
   - Add global filters (e.g., exclude kube-system)
   - Add time range selector
   - Add query bar for ad-hoc searches

5. **Configure Dashboard Settings:**
   - Set default time range (e.g., Last 7 days)
   - Set auto-refresh interval (e.g., 5 minutes)
   - Add description
   - Set dashboard options (hide filter bar, etc.)

6. **Save Dashboard:**
   - Click "Save"
   - Enter name: "Trivy Security Overview"
   - Add description and tags
   - Click "Save"

## Sample Dashboard Layout

```
+---------------------------+---------------------------+
|  Vulnerability Count      |  Security Issues         |
|  by Severity (Pie)        |  Over Time (Area)        |
|  [25% width]              |  [75% width]             |
+---------------------------+---------------------------+
|  Top 10 Vulnerable Namespaces (Bar - Full Width)     |
+-------------------------------------------------------+
|  Critical Vulnerabilities Table (Full Width)          |
+---------------------------+---------------------------+
|  CVSS Score Dist          |  Config Audit by         |
|  (Histogram)              |  Category (Treemap)      |
|  [50% width]              |  [50% width]             |
+---------------------------+---------------------------+
|  Exposed Secrets          |  Security Score          |
|  by Type (Donut)          |  Gauge                   |
|  [50% width]              |  [50% width]             |
+---------------------------+---------------------------+
|  Recent Security Findings (Data Table - Full Width)   |
+-------------------------------------------------------+
```

## Advanced Tips

### 1. Using Controls

Add filter controls to your dashboard:
- Namespace selector (dropdown)
- Severity selector (radio buttons)
- Date range picker
- Report type selector

### 2. Drill-downs

Create drill-down links:
- From summary view to detailed vulnerability list
- From namespace to pods in that namespace
- From vulnerability to CVE details

### 3. Alerts and Watches

Set up Kibana alerts:
- Alert when critical vulnerabilities > 10
- Alert on new exposed secrets
- Alert on compliance failures

### 4. Sharing

Export and share dashboards:
- Export as PDF report
- Share permalink with time range
- Embed dashboard in external tools
- Set up automated email reports

## Example Saved Searches

### Critical and High Vulnerabilities
```json
{
  "query": {
    "bool": {
      "must": [
        { "term": { "event.dataset.keyword": "trivy.vulnerability" } },
        { "range": { "event.severity": { "gte": 3 } } }
      ]
    }
  },
  "sort": [
    { "@timestamp": { "order": "desc" } }
  ]
}
```

### Recent Security Events (Last Hour)
```json
{
  "query": {
    "bool": {
      "must": [
        { "range": { "@timestamp": { "gte": "now-1h" } } },
        { "term": { "event.kind.keyword": "alert" } }
      ]
    }
  }
}
```

These examples should help you build comprehensive dashboards for monitoring your Kubernetes security posture using Trivy Operator reports!
