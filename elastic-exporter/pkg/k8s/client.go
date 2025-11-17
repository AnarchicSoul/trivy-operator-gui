package k8s

import (
	"context"
	"encoding/json"
	"fmt"

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
	DynamicClient    dynamic.Interface
	KubernetesClient kubernetes.Interface
}

// NewClient creates a new Kubernetes client
func NewClient() (*Client, error) {
	var config *rest.Config
	var err error

	// Try in-cluster config first
	config, err = rest.InClusterConfig()
	if err != nil {
		// Fall back to kubeconfig
		kubeconfig := clientcmd.NewDefaultClientConfigLoadingRules().GetDefaultFilename()
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			return nil, fmt.Errorf("failed to create kubernetes config: %w", err)
		}
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
		DynamicClient:    dynamicClient,
		KubernetesClient: kubernetesClient,
	}, nil
}

// GetAllReports retrieves all Trivy reports from all namespaces
func (c *Client) GetAllReports(ctx context.Context) ([]map[string]interface{}, error) {
	var allReports []map[string]interface{}

	// Get vulnerability reports
	vulnReports, err := c.getReportsForGVR(ctx, VulnerabilityReportGVR, "", "vulnerability")
	if err != nil {
		return nil, fmt.Errorf("failed to get vulnerability reports: %w", err)
	}
	allReports = append(allReports, vulnReports...)

	// Get config audit reports
	configReports, err := c.getReportsForGVR(ctx, ConfigAuditReportGVR, "", "config-audit")
	if err != nil {
		return nil, fmt.Errorf("failed to get config audit reports: %w", err)
	}
	allReports = append(allReports, configReports...)

	// Get exposed secret reports
	secretReports, err := c.getReportsForGVR(ctx, ExposedSecretReportGVR, "", "exposed-secret")
	if err != nil {
		return nil, fmt.Errorf("failed to get exposed secret reports: %w", err)
	}
	allReports = append(allReports, secretReports...)

	// Get RBAC assessment reports
	rbacReports, err := c.getReportsForGVR(ctx, RbacAssessmentReportGVR, "", "rbac-assessment")
	if err != nil {
		return nil, fmt.Errorf("failed to get RBAC assessment reports: %w", err)
	}
	allReports = append(allReports, rbacReports...)

	// Get infrastructure assessment reports (cluster-scoped)
	infraReports, err := c.getReportsForGVR(ctx, ClusterInfraAssessmentReportGVR, "", "infra-assessment")
	if err != nil {
		return nil, fmt.Errorf("failed to get infrastructure assessment reports: %w", err)
	}
	allReports = append(allReports, infraReports...)

	return allReports, nil
}

// getReportsForGVR retrieves reports for a specific GVR
func (c *Client) getReportsForGVR(ctx context.Context, gvr schema.GroupVersionResource, namespace string, reportType string) ([]map[string]interface{}, error) {
	var listInterface dynamic.ResourceInterface

	if namespace == "" {
		// For cluster-scoped or all namespaces
		listInterface = c.DynamicClient.Resource(gvr)
	} else {
		listInterface = c.DynamicClient.Resource(gvr).Namespace(namespace)
	}

	unstructuredList, err := listInterface.List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list %s: %w", reportType, err)
	}

	var reports []map[string]interface{}
	for _, item := range unstructuredList.Items {
		data, err := item.MarshalJSON()
		if err != nil {
			return nil, fmt.Errorf("failed to marshal %s: %w", reportType, err)
		}

		var report map[string]interface{}
		if err := json.Unmarshal(data, &report); err != nil {
			return nil, fmt.Errorf("failed to unmarshal %s: %w", reportType, err)
		}

		// Add report type for easier processing
		report["reportType"] = reportType

		reports = append(reports, report)
	}

	return reports, nil
}
