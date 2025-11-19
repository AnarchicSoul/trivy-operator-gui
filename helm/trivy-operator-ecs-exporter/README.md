# Trivy Operator Elastic Exporter Helm Chart

Helm chart for deploying the Trivy Operator Elastic Exporter as a Kubernetes CronJob.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- Trivy Operator installed and running
- Elasticsearch 7.x or 8.x cluster

## Installation

### Option 1: Install from Docker Hub OCI Registry (Recommended)

The chart is available on Docker Hub as an OCI artifact. This is the recommended installation method:

```bash
# Install directly from Docker Hub OCI (Helm 3.8+)
helm install trivy-ecs-exporter \
  oci://registry-1.docker.io/johan91/trivy-operator-ecs-exporter \
  --version 1.0.0 \
  --namespace trivy-system \
  --create-namespace \
  --set elasticsearch.addresses[0]="https://elasticsearch.example.com:9200" \
  --set elasticsearch.username="elastic" \
  --set elasticsearch.password="changeme"
```

**Alternative**: Download and customize the chart before installation

```bash
# Download the chart from Docker Hub OCI
helm pull oci://registry-1.docker.io/johan91/trivy-operator-ecs-exporter --version 1.0.0
tar -xzf trivy-operator-ecs-exporter-1.0.0.tgz

# Modify values.yaml as needed
# Then install
helm install trivy-ecs-exporter ./trivy-operator-ecs-exporter \
  --namespace trivy-system \
  --create-namespace
```

### Option 2: Install from Local Chart

```bash
helm install trivy-ecs-exporter \
  ./trivy-operator-ecs-exporter \
  -n trivy-system \
  --create-namespace
```

### Install with Custom Values

```bash
# Create values file
cat > my-values.yaml <<EOF
elasticsearch:
  addresses:
    - "https://elasticsearch.example.com:9200"
  username: "elastic"
  password: "changeme"
  indexName: "trivy-reports"
  retentionDays: 30

schedule: "0 2 * * *"
EOF

# Install
helm install trivy-BINARIES-ECS_EXPORTER \
  ./trivy-operator-BINARIES-ECS_EXPORTER \
  -n trivy-system \
  -f my-values.yaml
```

## Configuration

### Elasticsearch Options

#### Option 1: Direct Connection with Username/Password

```yaml
elasticsearch:
  addresses:
    - "https://elasticsearch:9200"
  username: "elastic"
  password: "changeme"
  indexName: "trivy-reports"
```

#### Option 2: Elastic Cloud with API Key

```yaml
elasticsearch:
  cloudId: "deployment:dXMtZWFzdC0xLmF3cy5mb3VuZC5pbyQ..."
  apiKey: "VnVhQ2ZHY0JDZGJrU..."
  indexName: "trivy-reports"
```

#### Option 3: Using Existing Secret

```yaml
elasticsearch:
  existingSecret: "my-elastic-secret"
  addresses:
    - "https://elasticsearch:9200"
  indexName: "trivy-reports"
```

Secret format:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-elastic-secret
  namespace: trivy-system
type: Opaque
stringData:
  username: "elastic"
  password: "changeme"
  # Or use API key
  # apiKey: "your-api-key"
  # cloudId: "your-cloud-id"
```

#### Option 4: Self-Signed Certificates (insecureTLS)

If your Elasticsearch uses self-signed certificates or you encounter TLS certificate validation issues, you can skip TLS verification:

```yaml
elasticsearch:
  addresses:
    - "https://elasticsearch.internal:9200"
  username: "elastic"
  password: "changeme"
  indexName: "trivy-reports"
  # Skip TLS certificate verification (equivalent to curl -k)
  insecureTLS: true
```

**Warning**: The `insecureTLS: true` option disables TLS certificate validation (similar to `curl -k` or `--insecure`). Use this only in:
- Development environments
- Testing with self-signed certificates
- Internal networks where certificate validation is not critical

**Never use this option in production environments with public or sensitive data.**

You can also set this via command line:

```bash
helm install trivy-ecs-exporter \
  oci://registry-1.docker.io/johan91/trivy-operator-ecs-exporter \
  --version 1.0.0 \
  --namespace trivy-system \
  --set elasticsearch.addresses[0]="https://elasticsearch.internal:9200" \
  --set elasticsearch.username="elastic" \
  --set elasticsearch.password="changeme" \
  --set elasticsearch.insecureTLS=true
```

### Schedule Configuration

```yaml
# Daily at 2 AM
schedule: "0 2 * * *"

# Every 6 hours
schedule: "0 */6 * * *"

# Every day at noon
schedule: "0 12 * * *"

# Weekly on Sunday at midnight
schedule: "0 0 * * 0"
```

### Resource Limits

```yaml
job:
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi
```

### RBAC Configuration

By default, the chart creates a ClusterRole with read access to all Trivy CRDs:

```yaml
rbac:
  create: true
  rules:
    - apiGroups:
        - "aquasecurity.github.io"
      resources:
        - vulnerabilityreports
        - configauditreports
        - exposedsecretreports
        - rbacassessmentreports
        - clusterinfraassessmentreports
      verbs:
        - get
        - list
        - watch
```

## Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `schedule` | Cron schedule | `"0 2 * * *"` |
| `image.repository` | Image repository | `johan91/trivy-operator-BINARIES-ECS_EXPORTER` |
| `image.tag` | Image tag | `latest` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `elasticsearch.addresses` | Elasticsearch URLs | `[]` |
| `elasticsearch.cloudId` | Elastic Cloud ID | `""` |
| `elasticsearch.username` | Username | `""` |
| `elasticsearch.password` | Password | `""` |
| `elasticsearch.apiKey` | API Key | `""` |
| `elasticsearch.indexName` | Index name prefix | `trivy-reports` |
| `elasticsearch.createIndexTemplate` | Create index template | `true` |
| `elasticsearch.retentionDays` | Retention in days | `30` |
| `elasticsearch.insecureTLS` | Skip TLS verification (insecure) | `false` |
| `elasticsearch.existingSecret` | Existing secret name | `""` |
| `job.successfulJobsHistoryLimit` | Successful jobs to keep | `3` |
| `job.failedJobsHistoryLimit` | Failed jobs to keep | `1` |
| `job.backoffLimit` | Retry limit | `2` |
| `job.activeDeadlineSeconds` | Max runtime | `600` |
| `job.resources` | Resource requests/limits | See values.yaml |
| `serviceAccount.create` | Create service account | `true` |
| `serviceAccount.name` | Service account name | `""` |
| `rbac.create` | Create RBAC resources | `true` |

## Upgrading

### To 0.2.0 (Example)

```bash
helm upgrade trivy-BINARIES-ECS_EXPORTER \
  ./trivy-operator-BINARIES-ECS_EXPORTER \
  -n trivy-system \
  -f my-values.yaml
```

## Uninstallation

```bash
helm uninstall trivy-BINARIES-ECS_EXPORTER -n trivy-system
```

This will remove all resources created by the chart. Elasticsearch indices are **not** automatically deleted.

## Manual Operations

### Trigger Manual Run

```bash
kubectl create job --from=cronjob/trivy-BINARIES-ECS_EXPORTER manual-run-1 \
  -n trivy-system
```

### Check Job Status

```bash
kubectl get jobs -n trivy-system
kubectl get pods -n trivy-system -l app.kubernetes.io/name=trivy-operator-BINARIES-ECS_EXPORTER
```

### View Logs

```bash
kubectl logs -n trivy-system -l job-name=trivy-BINARIES-ECS_EXPORTER-<timestamp>
```

### Suspend CronJob

```bash
kubectl patch cronjob trivy-BINARIES-ECS_EXPORTER \
  -n trivy-system \
  -p '{"spec":{"suspend":true}}'
```

### Resume CronJob

```bash
kubectl patch cronjob trivy-BINARIES-ECS_EXPORTER \
  -n trivy-system \
  -p '{"spec":{"suspend":false}}'
```

## Troubleshooting

### Job Fails Immediately

1. Check logs:
   ```bash
   kubectl logs -n trivy-system <pod-name>
   ```

2. Common issues:
   - Invalid Elasticsearch credentials
   - Network connectivity issues
   - Insufficient RBAC permissions

### No Data in Elasticsearch

1. Verify job completed successfully:
   ```bash
   kubectl get jobs -n trivy-system
   ```

2. Check if Trivy reports exist:
   ```bash
   kubectl get vulnerabilityreports -A
   kubectl get configauditreports -A
   ```

### Authentication Errors

1. Test credentials:
   ```bash
   kubectl get secret <secret-name> -n trivy-system -o yaml
   ```

2. Verify Elasticsearch is accessible:
   ```bash
   kubectl run curl --rm -i --tty --image=curlimages/curl -- \
     curl -u elastic:password https://elasticsearch:9200
   ```

## Examples

### Minimal Configuration

```yaml
elasticsearch:
  addresses:
    - "http://elasticsearch:9200"
  username: "elastic"
  password: "changeme"
```

### Production Configuration

```yaml
elasticsearch:
  cloudId: "production:dXMt..."
  apiKey: "VnVhQ2ZHY0..."
  indexName: "trivy-security-reports"
  createIndexTemplate: true
  retentionDays: 90

schedule: "0 3 * * *"

job:
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 1Gi
  activeDeadlineSeconds: 1200

  nodeSelector:
    workload-type: monitoring

  tolerations:
    - key: monitoring
      operator: Equal
      value: "true"
      effect: NoSchedule
```

### High-Security Configuration

```yaml
elasticsearch:
  existingSecret: "elastic-credentials-sealed"
  addresses:
    - "https://elasticsearch.internal:9200"

serviceAccount:
  create: true
  annotations:
    # For workload identity
    iam.gke.io/gcp-service-account: BINARIES-ECS_EXPORTER@project.iam

job:
  securityContext:
    runAsNonRoot: true
    runAsUser: 65532
    fsGroup: 65532
    seccompProfile:
      type: RuntimeDefault

  containerSecurityContext:
    allowPrivilegeEscalation: false
    readOnlyRootFilesystem: true
    capabilities:
      drop:
        - ALL
```

## Support

- Main docs: See [BINARIES-ECS_EXPORTER/README.md](../../BINARIES-ECS_EXPORTER/README.md)
- Kibana setup: See [KIBANA-DASHBOARD/README.md](../../KIBANA-DASHBOARD/README.md)
- Issues: GitHub Issues

## License

Part of trivy-operator-gui project.
