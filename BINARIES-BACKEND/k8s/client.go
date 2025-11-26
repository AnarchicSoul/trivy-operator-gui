package k8s

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/trivy-operator-gui/backend/models"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

var (
	// VulnerabilityReportGVR is the GroupVersionResource for VulnerabilityReports
	VulnerabilityReportGVR = schema.GroupVersionResource{
		Group:    "aquasecurity.github.io",
		Version:  "v1alpha1",
		Resource: "vulnerabilityreports",
	}

	// ConfigAuditReportGVR is the GroupVersionResource for ConfigAuditReports
	ConfigAuditReportGVR = schema.GroupVersionResource{
		Group:    "aquasecurity.github.io",
		Version:  "v1alpha1",
		Resource: "configauditreports",
	}

	// ExposedSecretReportGVR is the GroupVersionResource for ExposedSecretReports
	ExposedSecretReportGVR = schema.GroupVersionResource{
		Group:    "aquasecurity.github.io",
		Version:  "v1alpha1",
		Resource: "exposedsecretreports",
	}

	// RbacAssessmentReportGVR is the GroupVersionResource for RbacAssessmentReports
	RbacAssessmentReportGVR = schema.GroupVersionResource{
		Group:    "aquasecurity.github.io",
		Version:  "v1alpha1",
		Resource: "rbacassessmentreports",
	}

	// ClusterInfraAssessmentReportGVR is the GroupVersionResource for ClusterInfraAssessmentReports
	ClusterInfraAssessmentReportGVR = schema.GroupVersionResource{
		Group:    "aquasecurity.github.io",
		Version:  "v1alpha1",
		Resource: "clusterinfraassessmentreports",
	}

	// SBOMReportGVR is the GroupVersionResource for SBOM Reports
	SBOMReportGVR = schema.GroupVersionResource{
		Group:    "aquasecurity.github.io",
		Version:  "v1alpha1",
		Resource: "sbomreports",
	}

	// ClusterSBOMReportGVR is the GroupVersionResource for ClusterSBOM Reports (KBOM)
	ClusterSBOMReportGVR = schema.GroupVersionResource{
		Group:    "aquasecurity.github.io",
		Version:  "v1alpha1",
		Resource: "clustersbomreports",
	}

	// ClusterComplianceReportGVR is the GroupVersionResource for ClusterComplianceReports
	ClusterComplianceReportGVR = schema.GroupVersionResource{
		Group:    "aquasecurity.github.io",
		Version:  "v1alpha1",
		Resource: "clustercompliancereports",
	}
)

// Client wraps Kubernetes clients for accessing Trivy reports
type Client struct {
	DynamicClient   dynamic.Interface
	KubernetesClient kubernetes.Interface
	Config          *rest.Config
}

// NewClient creates a new Kubernetes client
func NewClient() (*Client, error) {
	config, err := getConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to get kubernetes config: %w", err)
	}

	dynamicClient, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create dynamic client: %w", err)
	}

	kubernetesClient, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create kubernetes client: %w", err)
	}

	return &Client{
		DynamicClient:   dynamicClient,
		KubernetesClient: kubernetesClient,
		Config:          config,
	}, nil
}

// getConfig returns the Kubernetes client config
// It tries in-cluster config first, then falls back to kubeconfig
func getConfig() (*rest.Config, error) {
	// Try in-cluster config first
	config, err := rest.InClusterConfig()
	if err == nil {
		return config, nil
	}

	// Fall back to kubeconfig
	kubeconfig := os.Getenv("KUBECONFIG")
	if kubeconfig == "" {
		home, err := os.UserHomeDir()
		if err != nil {
			return nil, fmt.Errorf("failed to get home directory: %w", err)
		}
		kubeconfig = filepath.Join(home, ".kube", "config")
	}

	config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("failed to build config from kubeconfig: %w", err)
	}

	return config, nil
}

// GetVulnerabilityReports retrieves all VulnerabilityReports from all namespaces
// IMPORTANT: This method applies a default limit of 50 to prevent OOM issues
func (c *Client) GetVulnerabilityReports(ctx context.Context, namespace string) (*models.VulnerabilityReportList, error) {
	// Apply default limit to prevent loading excessive data
	const defaultLimit = int64(50)

	unstructuredList, err := c.DynamicClient.Resource(VulnerabilityReportGVR).
		Namespace(namespace).
		List(ctx, metav1.ListOptions{Limit: defaultLimit})
	if err != nil {
		return nil, fmt.Errorf("failed to list vulnerability reports: %w", err)
	}

	// Convert unstructured to typed object
	data, err := unstructuredList.MarshalJSON()
	if err != nil {
		return nil, fmt.Errorf("failed to marshal vulnerability reports: %w", err)
	}

	var reportList models.VulnerabilityReportList
	if err := json.Unmarshal(data, &reportList); err != nil {
		return nil, fmt.Errorf("failed to unmarshal vulnerability reports: %w", err)
	}

	return &reportList, nil
}

// GetAllVulnerabilityReports retrieves VulnerabilityReports from all namespaces
func (c *Client) GetAllVulnerabilityReports(ctx context.Context) (*models.VulnerabilityReportList, error) {
	return c.GetVulnerabilityReports(ctx, "")
}

// GetConfigAuditReports retrieves all ConfigAuditReports from a namespace
// IMPORTANT: This method applies a default limit of 50 to prevent OOM issues
func (c *Client) GetConfigAuditReports(ctx context.Context, namespace string) (*models.ConfigAuditReportList, error) {
	const defaultLimit = int64(50)

	unstructuredList, err := c.DynamicClient.Resource(ConfigAuditReportGVR).
		Namespace(namespace).
		List(ctx, metav1.ListOptions{Limit: defaultLimit})
	if err != nil {
		return nil, fmt.Errorf("failed to list config audit reports: %w", err)
	}

	// Convert unstructured to typed object
	data, err := unstructuredList.MarshalJSON()
	if err != nil {
		return nil, fmt.Errorf("failed to marshal config audit reports: %w", err)
	}

	var reportList models.ConfigAuditReportList
	if err := json.Unmarshal(data, &reportList); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config audit reports: %w", err)
	}

	return &reportList, nil
}

// GetAllConfigAuditReports retrieves ConfigAuditReports from all namespaces
func (c *Client) GetAllConfigAuditReports(ctx context.Context) (*models.ConfigAuditReportList, error) {
	return c.GetConfigAuditReports(ctx, "")
}

// GetNamespaces retrieves all namespaces in the cluster
func (c *Client) GetNamespaces(ctx context.Context) ([]string, error) {
	namespaceList, err := c.KubernetesClient.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list namespaces: %w", err)
	}

	namespaces := make([]string, len(namespaceList.Items))
	for i, ns := range namespaceList.Items {
		namespaces[i] = ns.Name
	}

	return namespaces, nil
}

// GetVulnerabilityReportByName retrieves a specific VulnerabilityReport
func (c *Client) GetVulnerabilityReportByName(ctx context.Context, namespace, name string) (*models.VulnerabilityReport, error) {
	unstructured, err := c.DynamicClient.Resource(VulnerabilityReportGVR).
		Namespace(namespace).
		Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get vulnerability report: %w", err)
	}

	// Convert unstructured to typed object
	data, err := unstructured.MarshalJSON()
	if err != nil {
		return nil, fmt.Errorf("failed to marshal vulnerability report: %w", err)
	}

	var report models.VulnerabilityReport
	if err := json.Unmarshal(data, &report); err != nil {
		return nil, fmt.Errorf("failed to unmarshal vulnerability report: %w", err)
	}

	return &report, nil
}

// GetExposedSecretReports retrieves all ExposedSecretReports from a namespace
// IMPORTANT: This method applies a default limit of 50 to prevent OOM issues
func (c *Client) GetExposedSecretReports(ctx context.Context, namespace string) (*models.ExposedSecretReportList, error) {
	const defaultLimit = int64(50)

	unstructuredList, err := c.DynamicClient.Resource(ExposedSecretReportGVR).
		Namespace(namespace).
		List(ctx, metav1.ListOptions{Limit: defaultLimit})
	if err != nil {
		return nil, fmt.Errorf("failed to list exposed secret reports: %w", err)
	}

	// Convert unstructured to typed object
	data, err := unstructuredList.MarshalJSON()
	if err != nil {
		return nil, fmt.Errorf("failed to marshal exposed secret reports: %w", err)
	}

	var reportList models.ExposedSecretReportList
	if err := json.Unmarshal(data, &reportList); err != nil {
		return nil, fmt.Errorf("failed to unmarshal exposed secret reports: %w", err)
	}

	return &reportList, nil
}

// GetAllExposedSecretReports retrieves ExposedSecretReports from all namespaces
func (c *Client) GetAllExposedSecretReports(ctx context.Context) (*models.ExposedSecretReportList, error) {
	return c.GetExposedSecretReports(ctx, "")
}

// GetRbacAssessmentReports retrieves all RbacAssessmentReports from a namespace
// IMPORTANT: This method applies a default limit of 50 to prevent OOM issues
func (c *Client) GetRbacAssessmentReports(ctx context.Context, namespace string) (*models.RbacAssessmentReportList, error) {
	const defaultLimit = int64(50)

	unstructuredList, err := c.DynamicClient.Resource(RbacAssessmentReportGVR).
		Namespace(namespace).
		List(ctx, metav1.ListOptions{Limit: defaultLimit})
	if err != nil {
		return nil, fmt.Errorf("failed to list RBAC assessment reports: %w", err)
	}

	// Convert unstructured to typed object
	data, err := unstructuredList.MarshalJSON()
	if err != nil {
		return nil, fmt.Errorf("failed to marshal RBAC assessment reports: %w", err)
	}

	var reportList models.RbacAssessmentReportList
	if err := json.Unmarshal(data, &reportList); err != nil {
		return nil, fmt.Errorf("failed to unmarshal RBAC assessment reports: %w", err)
	}

	return &reportList, nil
}

// GetAllRbacAssessmentReports retrieves RbacAssessmentReports from all namespaces
func (c *Client) GetAllRbacAssessmentReports(ctx context.Context) (*models.RbacAssessmentReportList, error) {
	return c.GetRbacAssessmentReports(ctx, "")
}

// GetInfraAssessmentReports retrieves all ClusterInfraAssessmentReports (cluster-scoped)
// IMPORTANT: This method applies a default limit of 50 to prevent OOM issues
func (c *Client) GetInfraAssessmentReports(ctx context.Context) (*models.InfraAssessmentReportList, error) {
	const defaultLimit = int64(50)

	// ClusterInfraAssessmentReports are cluster-scoped, so we don't specify a namespace
	unstructuredList, err := c.DynamicClient.Resource(ClusterInfraAssessmentReportGVR).
		List(ctx, metav1.ListOptions{Limit: defaultLimit})
	if err != nil {
		return nil, fmt.Errorf("failed to list clusterinfraassessmentreports (GVR: %v): %w", ClusterInfraAssessmentReportGVR, err)
	}

	// Convert unstructured to typed object
	data, err := unstructuredList.MarshalJSON()
	if err != nil {
		return nil, fmt.Errorf("failed to marshal clusterinfraassessmentreports to JSON: %w", err)
	}

	var reportList models.InfraAssessmentReportList
	if err := json.Unmarshal(data, &reportList); err != nil {
		// Log a sample of the problematic JSON for debugging
		sample := string(data)
		if len(sample) > 500 {
			sample = sample[:500] + "..."
		}
		return nil, fmt.Errorf("failed to unmarshal clusterinfraassessmentreports (data length: %d bytes, sample: %s): %w", len(data), sample, err)
	}

	return &reportList, nil
}

// GetSBOMReports retrieves all SBOM Reports from a namespace
// IMPORTANT: This method applies a default limit of 50 to prevent OOM issues
func (c *Client) GetSBOMReports(ctx context.Context, namespace string) (*models.SBOMReportList, error) {
	const defaultLimit = int64(50)

	unstructuredList, err := c.DynamicClient.Resource(SBOMReportGVR).
		Namespace(namespace).
		List(ctx, metav1.ListOptions{Limit: defaultLimit})
	if err != nil {
		return nil, fmt.Errorf("failed to list SBOM reports: %w", err)
	}

	// Convert unstructured to typed object
	data, err := unstructuredList.MarshalJSON()
	if err != nil {
		return nil, fmt.Errorf("failed to marshal SBOM reports: %w", err)
	}

	var reportList models.SBOMReportList
	if err := json.Unmarshal(data, &reportList); err != nil {
		return nil, fmt.Errorf("failed to unmarshal SBOM reports: %w", err)
	}

	return &reportList, nil
}

// GetAllSBOMReports retrieves SBOM Reports from all namespaces
func (c *Client) GetAllSBOMReports(ctx context.Context) (*models.SBOMReportList, error) {
	return c.GetSBOMReports(ctx, "")
}

// GetClusterSBOMReports retrieves all ClusterSBOM Reports (KBOM - cluster-scoped)
// IMPORTANT: This method applies a default limit of 50 to prevent OOM issues
func (c *Client) GetClusterSBOMReports(ctx context.Context) (*models.ClusterSBOMReportList, error) {
	const defaultLimit = int64(50)

	// ClusterSBOMReports are cluster-scoped, so we don't specify a namespace
	unstructuredList, err := c.DynamicClient.Resource(ClusterSBOMReportGVR).
		List(ctx, metav1.ListOptions{Limit: defaultLimit})
	if err != nil {
		return nil, fmt.Errorf("failed to list clustersbomreports (GVR: %v): %w", ClusterSBOMReportGVR, err)
	}

	// Convert unstructured to typed object
	data, err := unstructuredList.MarshalJSON()
	if err != nil {
		return nil, fmt.Errorf("failed to marshal clustersbomreports to JSON: %w", err)
	}

	var reportList models.ClusterSBOMReportList
	if err := json.Unmarshal(data, &reportList); err != nil {
		return nil, fmt.Errorf("failed to unmarshal clustersbomreports: %w", err)
	}

	return &reportList, nil
}

// GetComplianceReports retrieves all ClusterComplianceReports (cluster-scoped)
// IMPORTANT: This method applies a default limit of 50 to prevent OOM issues
func (c *Client) GetComplianceReports(ctx context.Context) (*models.ComplianceReportList, error) {
	const defaultLimit = int64(50)

	// ClusterComplianceReports are cluster-scoped, so we don't specify a namespace
	unstructuredList, err := c.DynamicClient.Resource(ClusterComplianceReportGVR).
		List(ctx, metav1.ListOptions{Limit: defaultLimit})
	if err != nil {
		return nil, fmt.Errorf("failed to list clustercompliancereports (GVR: %v): %w", ClusterComplianceReportGVR, err)
	}

	// Convert unstructured to typed object
	data, err := unstructuredList.MarshalJSON()
	if err != nil {
		return nil, fmt.Errorf("failed to marshal clustercompliancereports to JSON: %w", err)
	}

	var reportList models.ComplianceReportList
	if err := json.Unmarshal(data, &reportList); err != nil {
		return nil, fmt.Errorf("failed to unmarshal clustercompliancereports: %w", err)
	}

	return &reportList, nil
}

// GetVulnerabilityReportsLimited retrieves a limited number of VulnerabilityReports from specified namespace
// Pass empty string for namespace to query all namespaces
func (c *Client) GetVulnerabilityReportsLimited(ctx context.Context, namespace string, limit int64) (*models.VulnerabilityReportList, error) {
	unstructuredList, err := c.DynamicClient.Resource(VulnerabilityReportGVR).
		Namespace(namespace).
		List(ctx, metav1.ListOptions{Limit: limit})
	if err != nil {
		return nil, fmt.Errorf("failed to list vulnerability reports: %w", err)
	}

	data, err := unstructuredList.MarshalJSON()
	if err != nil {
		return nil, fmt.Errorf("failed to marshal vulnerability reports: %w", err)
	}

	var reportList models.VulnerabilityReportList
	if err := json.Unmarshal(data, &reportList); err != nil {
		return nil, fmt.Errorf("failed to unmarshal vulnerability reports: %w", err)
	}

	return &reportList, nil
}

// GetConfigAuditReportsLimited retrieves a limited number of ConfigAuditReports from specified namespace
func (c *Client) GetConfigAuditReportsLimited(ctx context.Context, namespace string, limit int64) (*models.ConfigAuditReportList, error) {
	unstructuredList, err := c.DynamicClient.Resource(ConfigAuditReportGVR).
		Namespace(namespace).
		List(ctx, metav1.ListOptions{Limit: limit})
	if err != nil {
		return nil, fmt.Errorf("failed to list config audit reports: %w", err)
	}

	data, err := unstructuredList.MarshalJSON()
	if err != nil {
		return nil, fmt.Errorf("failed to marshal config audit reports: %w", err)
	}

	var reportList models.ConfigAuditReportList
	if err := json.Unmarshal(data, &reportList); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config audit reports: %w", err)
	}

	return &reportList, nil
}

// GetExposedSecretReportsLimited retrieves a limited number of ExposedSecretReports from specified namespace
func (c *Client) GetExposedSecretReportsLimited(ctx context.Context, namespace string, limit int64) (*models.ExposedSecretReportList, error) {
	unstructuredList, err := c.DynamicClient.Resource(ExposedSecretReportGVR).
		Namespace(namespace).
		List(ctx, metav1.ListOptions{Limit: limit})
	if err != nil {
		return nil, fmt.Errorf("failed to list exposed secret reports: %w", err)
	}

	data, err := unstructuredList.MarshalJSON()
	if err != nil {
		return nil, fmt.Errorf("failed to marshal exposed secret reports: %w", err)
	}

	var reportList models.ExposedSecretReportList
	if err := json.Unmarshal(data, &reportList); err != nil {
		return nil, fmt.Errorf("failed to unmarshal exposed secret reports: %w", err)
	}

	return &reportList, nil
}

// GetRbacAssessmentReportsLimited retrieves a limited number of RbacAssessmentReports from specified namespace
func (c *Client) GetRbacAssessmentReportsLimited(ctx context.Context, namespace string, limit int64) (*models.RbacAssessmentReportList, error) {
	unstructuredList, err := c.DynamicClient.Resource(RbacAssessmentReportGVR).
		Namespace(namespace).
		List(ctx, metav1.ListOptions{Limit: limit})
	if err != nil {
		return nil, fmt.Errorf("failed to list RBAC assessment reports: %w", err)
	}

	data, err := unstructuredList.MarshalJSON()
	if err != nil {
		return nil, fmt.Errorf("failed to marshal RBAC assessment reports: %w", err)
	}

	var reportList models.RbacAssessmentReportList
	if err := json.Unmarshal(data, &reportList); err != nil {
		return nil, fmt.Errorf("failed to unmarshal RBAC assessment reports: %w", err)
	}

	return &reportList, nil
}

// GetInfraAssessmentReportsLimited retrieves a limited number of InfraAssessmentReports
func (c *Client) GetInfraAssessmentReportsLimited(ctx context.Context, limit int64) (*models.InfraAssessmentReportList, error) {
	unstructuredList, err := c.DynamicClient.Resource(ClusterInfraAssessmentReportGVR).
		List(ctx, metav1.ListOptions{Limit: limit})
	if err != nil {
		return nil, fmt.Errorf("failed to list clusterinfraassessmentreports: %w", err)
	}

	data, err := unstructuredList.MarshalJSON()
	if err != nil {
		return nil, fmt.Errorf("failed to marshal clusterinfraassessmentreports to JSON: %w", err)
	}

	var reportList models.InfraAssessmentReportList
	if err := json.Unmarshal(data, &reportList); err != nil {
		return nil, fmt.Errorf("failed to unmarshal clusterinfraassessmentreports: %w", err)
	}

	return &reportList, nil
}

// GetSBOMReportsLimited retrieves a limited number of SBOM Reports
func (c *Client) GetSBOMReportsLimited(ctx context.Context, namespace string, limit int64) (*models.SBOMReportList, error) {
	unstructuredList, err := c.DynamicClient.Resource(SBOMReportGVR).
		Namespace(namespace).
		List(ctx, metav1.ListOptions{Limit: limit})
	if err != nil {
		return nil, fmt.Errorf("failed to list SBOM reports: %w", err)
	}

	data, err := unstructuredList.MarshalJSON()
	if err != nil {
		return nil, fmt.Errorf("failed to marshal SBOM reports to JSON: %w", err)
	}

	var reportList models.SBOMReportList
	if err := json.Unmarshal(data, &reportList); err != nil {
		return nil, fmt.Errorf("failed to unmarshal SBOM reports: %w", err)
	}

	return &reportList, nil
}

// GetComplianceReportsLimited retrieves a limited number of Compliance Reports
func (c *Client) GetComplianceReportsLimited(ctx context.Context, limit int64) (*models.ComplianceReportList, error) {
	unstructuredList, err := c.DynamicClient.Resource(ClusterComplianceReportGVR).
		List(ctx, metav1.ListOptions{Limit: limit})
	if err != nil {
		return nil, fmt.Errorf("failed to list cluster compliance reports: %w", err)
	}

	data, err := unstructuredList.MarshalJSON()
	if err != nil {
		return nil, fmt.Errorf("failed to marshal cluster compliance reports to JSON: %w", err)
	}

	var reportList models.ComplianceReportList
	if err := json.Unmarshal(data, &reportList); err != nil {
		return nil, fmt.Errorf("failed to unmarshal cluster compliance reports: %w", err)
	}

	return &reportList, nil
}
