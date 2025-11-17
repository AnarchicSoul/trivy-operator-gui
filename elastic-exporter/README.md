# Trivy Operator Elastic Exporter

Export Trivy Operator security reports to Elasticsearch in ECS (Elastic Common Schema) format.

## Overview

The Trivy Operator Elastic Exporter is a Kubernetes CronJob that:
- Collects all Trivy Operator reports from your cluster
- Transforms them into ECS-compliant format
- Indexes them into Elasticsearch
- Manages data retention automatically

This enables you to:
- Visualize security findings in Kibana dashboards
- Create alerts for critical vulnerabilities
- Track security trends over time
- Integrate with your existing ELK/Elastic Stack

## Features

- **ECS Compliance**: All reports are transformed to Elastic Common Schema format
- **Comprehensive Coverage**: Supports all Trivy report types:
  - Vulnerability Reports
  - Configuration Audit Reports
  - Exposed Secret Reports
  - RBAC Assessment Reports
  - Infrastructure Assessment Reports
- **Automated Scheduling**: Runs as a Kubernetes CronJob (default: daily at 2 AM)
- **Data Retention**: Automatically deletes old indices based on configured retention
- **Index Templates**: Automatically creates optimized index templates
- **Bulk Indexing**: Efficient bulk API usage for large datasets
- **Security**: Runs with minimal privileges, non-root container

## Architecture

```
┌─────────────────────┐
│  Kubernetes Cluster │
│                     │
│  ┌──────────────┐  │
│  │ Trivy CRDs   │  │
│  │ - VulnReports│  │
│  │ - ConfigAudit│  │
│  │ - Secrets    │  │
│  │ - RBAC       │  │
│  │ - Infra      │  │
│  └──────┬───────┘  │
│         │          │
│  ┌──────▼───────┐  │
│  │   CronJob    │  │
│  │   Exporter   │  │
│  └──────┬───────┘  │
│         │          │
└─────────┼──────────┘
          │
          │ ECS Format
          ▼
┌─────────────────────┐
│   Elasticsearch     │
│  trivy-reports-*    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│      Kibana         │
│   Dashboards &      │
│     Alerts          │
└─────────────────────┘
```

## Installation

### Prerequisites

1. Kubernetes cluster with Trivy Operator installed
2. Elasticsearch cluster (version 7.x or 8.x)
3. Helm 3.x

### Quick Start

#### 1. Add Helm Repository (if published)

```bash
helm repo add trivy-operator-gui https://your-helm-repo.com
helm repo update
```

#### 2. Create Values File

Create `values.yaml`:

```yaml
# Elasticsearch connection
elasticsearch:
  # Option 1: Direct connection
  addresses:
    - "https://elasticsearch.example.com:9200"
  username: "elastic"
  password: "your-password"

  # Option 2: Elastic Cloud
  # cloudId: "your-cloud-id"
  # apiKey: "your-api-key"

  # Index configuration
  indexName: "trivy-reports"
  createIndexTemplate: true
  retentionDays: 30

# Schedule (daily at 2 AM)
schedule: "0 2 * * *"
```

#### 3. Install with Helm

```bash
helm install trivy-elastic-exporter \
  ./helm/trivy-operator-elastic-exporter \
  -n trivy-system \
  -f values.yaml
```

### Using Existing Secret

For better security, store credentials in a Kubernetes secret:

```bash
kubectl create secret generic elastic-credentials \
  -n trivy-system \
  --from-literal=username=elastic \
  --from-literal=password=your-password
```

Then reference it in values:

```yaml
elasticsearch:
  existingSecret: "elastic-credentials"
  addresses:
    - "https://elasticsearch.example.com:9200"
```

## Configuration

### Elasticsearch Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `elasticsearch.addresses` | List of Elasticsearch URLs | `[]` |
| `elasticsearch.cloudId` | Elastic Cloud deployment ID | `""` |
| `elasticsearch.username` | Basic auth username | `""` |
| `elasticsearch.password` | Basic auth password | `""` |
| `elasticsearch.apiKey` | API key for authentication | `""` |
| `elasticsearch.indexName` | Base name for indices | `trivy-reports` |
| `elasticsearch.createIndexTemplate` | Create index template on first run | `true` |
| `elasticsearch.retentionDays` | Days to keep indices (0=disabled) | `30` |
| `elasticsearch.existingSecret` | Use existing secret for credentials | `""` |

### CronJob Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `schedule` | Cron schedule expression | `"0 2 * * *"` |
| `job.successfulJobsHistoryLimit` | Jobs to keep on success | `3` |
| `job.failedJobsHistoryLimit` | Jobs to keep on failure | `1` |
| `job.backoffLimit` | Retry limit | `2` |
| `job.activeDeadlineSeconds` | Max runtime in seconds | `600` |

### Resource Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `job.resources.requests.cpu` | CPU request | `100m` |
| `job.resources.requests.memory` | Memory request | `128Mi` |
| `job.resources.limits.cpu` | CPU limit | `500m` |
| `job.resources.limits.memory` | Memory limit | `512Mi` |

### Image Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `image.repository` | Image repository | `johan91/trivy-operator-elastic-exporter` |
| `image.tag` | Image tag | `latest` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |

## Usage

### Manual Run

Trigger a manual export without waiting for the schedule:

```bash
kubectl create job --from=cronjob/trivy-elastic-exporter manual-export-1 \
  -n trivy-system
```

### View Logs

```bash
# List jobs
kubectl get jobs -n trivy-system

# View logs from latest job
kubectl logs -n trivy-system \
  $(kubectl get pods -n trivy-system \
    -l job-name --sort-by=.metadata.creationTimestamp \
    -o jsonpath='{.items[-1].metadata.name}')
```

### Check CronJob Status

```bash
kubectl get cronjob -n trivy-system
kubectl describe cronjob trivy-elastic-exporter -n trivy-system
```

## ECS Mapping

### Vulnerability Reports

```json
{
  "@timestamp": "2024-01-15T10:30:00Z",
  "event": {
    "kind": "alert",
    "category": "vulnerability",
    "type": "indicator",
    "dataset": "trivy.vulnerability",
    "severity": 4
  },
  "vulnerability": {
    "id": "CVE-2024-1234",
    "severity": "critical",
    "description": "...",
    "score": {
      "base": 9.8,
      "version": "3.0"
    },
    "package": {
      "name": "openssl",
      "version": "1.1.1",
      "fixed_version": "1.1.1u"
    }
  },
  "kubernetes": {
    "namespace": "production",
    "pod": {
      "name": "webapp-123"
    }
  }
}
```

### Configuration Audit Reports

```json
{
  "@timestamp": "2024-01-15T10:30:00Z",
  "event": {
    "kind": "alert",
    "category": "configuration",
    "type": "info",
    "dataset": "trivy.config-audit",
    "outcome": "failure",
    "severity": 3
  },
  "metadata": {
    "check_id": "KSV001",
    "title": "Process can elevate its own privileges",
    "category": "Security"
  },
  "kubernetes": {
    "namespace": "default",
    "pod": {
      "name": "nginx"
    }
  }
}
```

## Kibana Integration

### Import Dashboards

1. Navigate to `kibana-dashboards/` directory
2. Follow instructions in [`kibana-dashboards/README.md`](../kibana-dashboards/README.md)
3. Import dashboard templates
4. View pre-built visualizations

### Create Data View

1. Go to Stack Management > Data Views
2. Create new data view:
   - **Name**: Trivy Reports
   - **Index pattern**: `trivy-reports-*`
   - **Time field**: `@timestamp`

### Example Queries

```kql
# Critical vulnerabilities in production
vulnerability.severity: "critical" AND kubernetes.namespace: "production"

# All security issues in the last 24 hours
@timestamp >= now-24h AND event.kind: "alert"

# Exposed secrets
event.dataset: "trivy.exposed-secret"

# Config audit failures
event.dataset: "trivy.config-audit" AND event.outcome: "failure"
```

## Troubleshooting

### No Data in Elasticsearch

1. **Check CronJob executed:**
   ```bash
   kubectl get jobs -n trivy-system
   ```

2. **Check job logs:**
   ```bash
   kubectl logs -n trivy-system job/trivy-elastic-exporter-<timestamp>
   ```

3. **Verify Elasticsearch connection:**
   ```bash
   # Check if exporter can reach Elasticsearch
   kubectl exec -n trivy-system job/trivy-elastic-exporter-<timestamp> -- \
     wget -O- https://your-elasticsearch:9200
   ```

### Connection Refused

Check that Elasticsearch is accessible from the cluster:

```bash
# Test from a pod in the cluster
kubectl run curl --image=curlimages/curl -i --tty --rm -- \
  curl -u elastic:password https://elasticsearch:9200
```

### Authentication Failed

1. Verify credentials in secret:
   ```bash
   kubectl get secret elastic-credentials -n trivy-system -o yaml
   ```

2. Test credentials manually:
   ```bash
   curl -u username:password https://elasticsearch:9200
   ```

### Index Not Created

1. Check if template was created:
   ```bash
   curl -u user:pass https://elasticsearch:9200/_index_template/trivy-reports
   ```

2. Manually trigger template creation:
   ```bash
   # Set CREATE_INDEX_TEMPLATE=true in the job
   kubectl set env cronjob/trivy-elastic-exporter \
     CREATE_INDEX_TEMPLATE=true -n trivy-system
   ```

### Job Timeout

If the job times out (default 10 minutes):

```yaml
job:
  activeDeadlineSeconds: 1200  # 20 minutes
```

## Development

### Build Locally

```bash
cd elastic-exporter
go build -o exporter ./cmd/exporter
```

### Run Locally

```bash
# Set environment variables
export ES_ADDRESS=https://localhost:9200
export ES_USERNAME=elastic
export ES_PASSWORD=changeme
export ES_INDEX_NAME=trivy-reports
export CREATE_INDEX_TEMPLATE=true

# Run
./exporter
```

### Build Docker Image

```bash
cd elastic-exporter
docker build -t trivy-operator-elastic-exporter:dev .
```

### Run Tests

```bash
cd elastic-exporter
go test -v ./...
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is part of trivy-operator-gui and shares the same license.

## Support

- Documentation: See `kibana-dashboards/README.md` for Kibana setup
- Issues: Report on GitHub Issues
- Logs: Check CronJob logs for debugging

## Roadmap

- [ ] Support for custom index mappings
- [ ] Webhook notifications on export completion
- [ ] Support for multiple Elasticsearch clusters
- [ ] Prometheus metrics export
- [ ] Incremental exports (only changed reports)
- [ ] Support for OpenSearch
