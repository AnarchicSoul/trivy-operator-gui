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
func (c *Client) GetVulnerabilityReports(ctx context.Context, namespace string) (*models.VulnerabilityReportList, error) {
	unstructuredList, err := c.DynamicClient.Resource(VulnerabilityReportGVR).
		Namespace(namespace).
		List(ctx, metav1.ListOptions{})
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
func (c *Client) GetConfigAuditReports(ctx context.Context, namespace string) (*models.ConfigAuditReportList, error) {
	unstructuredList, err := c.DynamicClient.Resource(ConfigAuditReportGVR).
		Namespace(namespace).
		List(ctx, metav1.ListOptions{})
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
func (c *Client) GetExposedSecretReports(ctx context.Context, namespace string) (*models.ExposedSecretReportList, error) {
	unstructuredList, err := c.DynamicClient.Resource(ExposedSecretReportGVR).
		Namespace(namespace).
		List(ctx, metav1.ListOptions{})
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
func (c *Client) GetRbacAssessmentReports(ctx context.Context, namespace string) (*models.RbacAssessmentReportList, error) {
	unstructuredList, err := c.DynamicClient.Resource(RbacAssessmentReportGVR).
		Namespace(namespace).
		List(ctx, metav1.ListOptions{})
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
func (c *Client) GetInfraAssessmentReports(ctx context.Context) (*models.InfraAssessmentReportList, error) {
	// ClusterInfraAssessmentReports are cluster-scoped, so we don't specify a namespace
	unstructuredList, err := c.DynamicClient.Resource(ClusterInfraAssessmentReportGVR).
		List(ctx, metav1.ListOptions{})
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
		// Log the problematic JSON for debugging
		return nil, fmt.Errorf("failed to unmarshal clusterinfraassessmentreports (data length: %d bytes): %w", len(data), err)
	}

	return &reportList, nil
}
