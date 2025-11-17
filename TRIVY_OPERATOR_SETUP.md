# Trivy Operator Setup Guide

This guide explains how to deploy Trivy Operator with builtin security policies enabled.

## Why This Configuration?

By default, Trivy Operator uses **embedded policies** which are limited. This configuration enables **builtin Rego policies** from Aqua Security's official repository, which includes comprehensive Kubernetes security checks.

## Builtin Security Checks Included

When deployed with `trivy-operator-values.yaml`, you'll get these security checks:

### High Severity
- **KSV118**: Default security context configured
- **KSV014**: Root file system is not read-only

### Medium Severity
- **KSV012**: Container runs as root user
- **KSV001**: Container can elevate its own privileges
- **KSV104**: Seccomp policies disabled

### Low Severity
- **KSV015**: CPU requests not specified
- **KSV016**: Memory requests not specified
- **KSV011**: CPU not limited
- **KSV018**: Memory not limited
- **KSV030**: Runtime/Default Seccomp profile not set
- **KSV106**: Container capabilities must only include NET_BIND_SERVICE
- **KSV004**: Default capabilities - some containers do not drop any
- **KSV003**: Default capabilities - some containers do not drop all
- **KSV020**: Container runs with UID <= 10000
- **KSV021**: Container runs with GID <= 10000

And many more!

## Installation on a New Cluster

### Prerequisites

- Kubernetes cluster (k3s, EKS, GKE, AKS, etc.)
- Helm 3.x installed
- `kubectl` configured to access your cluster

### Step 1: Add Aqua Helm Repository

```bash
helm repo add aqua https://aquasecurity.github.io/helm-charts/
helm repo update
```

### Step 2: Create Namespace

```bash
kubectl create namespace trivy-system
```

### Step 3: Install Trivy Operator with Builtin Policies

```bash
helm install trivy-operator aqua/trivy-operator \
  --namespace trivy-system \
  --create-namespace \
  --values trivy-operator-values.yaml
```

### Step 4: Verify Installation

```bash
# Check operator pod is running
kubectl get pods -n trivy-system

# Wait for scan jobs to complete
kubectl get configauditreports -A

# Check a specific report
kubectl get configauditreport -n default replicaset-<your-replicaset-name> -o yaml
```

## Upgrade Existing Installation

If Trivy Operator is already installed without builtin policies:

```bash
helm upgrade trivy-operator aqua/trivy-operator \
  --namespace trivy-system \
  --values trivy-operator-values.yaml
```

After upgrade, **delete existing ConfigAuditReports** to trigger rescans with new policies:

```bash
# Delete all config audit reports
kubectl delete configauditreports --all -A

# Trivy Operator will automatically recreate them with builtin checks
```

## Install Trivy Operator GUI

Once Trivy Operator is running with builtin policies, install the GUI:

```bash
helm install my-trivy-gui ./helm/trivy-operator-gui \
  --namespace trivy-operator-gui \
  --create-namespace \
  --set backend.image.repository=johan91/trivy-operator-gui-backend \
  --set backend.image.tag=latest \
  --set frontend.image.repository=johan91/trivy-operator-gui-frontend \
  --set frontend.image.tag=latest
```

Access the GUI via:
- **Port-forward**: `kubectl port-forward -n trivy-operator-gui svc/my-trivy-gui-trivy-operator-gui-frontend 8080:80`
- **Ingress**: Configure ingress in `helm/trivy-operator-gui/values.yaml`

## Troubleshooting

### No checks in ConfigAuditReports

Check if builtin policies are enabled:

```bash
kubectl get configmap -n trivy-system trivy-operator -o yaml | grep -A 2 "useBuiltinRegoPolicies"
```

Should show:
```yaml
trivy.useBuiltinRegoPolicies: "true"
trivy.useEmbeddedRegoPolicies: "false"
```

If not, upgrade with the values file.

### Policies not downloading

Check operator logs:

```bash
kubectl logs -n trivy-system -l app.kubernetes.io/name=trivy-operator
```

Look for messages about downloading policies from `ghcr.io/aquasecurity/trivy-checks`.

### Empty reports after upgrade

Delete existing reports to trigger rescan:

```bash
kubectl delete configauditreports --all -A
```

Wait 1-2 minutes for Trivy Operator to create new reports with checks.

## Configuration Reference

Key settings in `trivy-operator-values.yaml`:

| Setting | Value | Description |
|---------|-------|-------------|
| `trivy.useBuiltinRegoPolicies` | `"true"` | Enable downloading builtin policies from OCI registry |
| `trivy.useEmbeddedRegoPolicies` | `"false"` | Disable limited embedded policies |
| `trivy.image.registry` | `ghcr.io` | Use GitHub Container Registry (official) |
| `trivy.dbRegistry` | `ghcr.io` | Download vulnerability DB from official source |
| `trivyOperator.reportRecordFailedChecksOnly` | `true` | Only show failed checks (cleaner reports) |
| `operator.configAuditScannerEnabled` | `true` | Enable config audit scanning |
| `operator.scannerReportTTL` | `"24h"` | Keep reports for 24 hours |

## References

- [Trivy Operator Documentation](https://aquasecurity.github.io/trivy-operator/)
- [Trivy Builtin Policies](https://github.com/aquasecurity/trivy-checks)
- [Trivy Operator Helm Chart](https://github.com/aquasecurity/trivy-operator/tree/main/deploy/helm)
- [Custom Policy Guide](https://aquasecurity.github.io/trivy-operator/latest/docs/tutorials/writing-custom-configuration-audit-policies/)
