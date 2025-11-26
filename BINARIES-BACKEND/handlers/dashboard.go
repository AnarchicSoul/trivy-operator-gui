package handlers

import (
	"context"
	"net/http"
	"sort"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/trivy-operator-gui/backend/k8s"
	"github.com/trivy-operator-gui/backend/models"
)

// Handler contains the Kubernetes client and handles API requests
type Handler struct {
	K8sClient *k8s.Client
}

// NewHandler creates a new API handler
func NewHandler(client *k8s.Client) *Handler {
	return &Handler{
		K8sClient: client,
	}
}

// GetDashboard returns aggregated dashboard data
// Optimized to load only a limited sample of reports for statistics
func (h *Handler) GetDashboard(c *gin.Context) {
	ctx := context.Background()

	// Limit the number of reports loaded for dashboard statistics
	// This significantly reduces memory usage - only need a small sample for stats
	const dashboardLimit = int64(20)

	// Get limited vulnerability reports for statistics (from all namespaces)
	vulnReports, err := h.K8sClient.GetVulnerabilityReportsLimited(ctx, "", dashboardLimit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get limited config audit reports
	configReports, err := h.K8sClient.GetConfigAuditReportsLimited(ctx, "", dashboardLimit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get limited exposed secret reports
	secretReports, err := h.K8sClient.GetExposedSecretReportsLimited(ctx, "", dashboardLimit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get limited RBAC assessment reports
	rbacReports, err := h.K8sClient.GetRbacAssessmentReportsLimited(ctx, "", dashboardLimit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get limited infrastructure assessment reports
	infraReports, err := h.K8sClient.GetInfraAssessmentReportsLimited(ctx, dashboardLimit)
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Build dashboard summary
	dashboard := h.buildDashboardSummary(vulnReports, configReports, secretReports, rbacReports, infraReports)

	c.JSON(http.StatusOK, dashboard)
}

// buildDashboardSummary aggregates report data into a dashboard summary
func (h *Handler) buildDashboardSummary(vulnReports *models.VulnerabilityReportList, configReports *models.ConfigAuditReportList, secretReports *models.ExposedSecretReportList, rbacReports *models.RbacAssessmentReportList, infraReports *models.InfraAssessmentReportList) models.DashboardSummary {
	dashboard := models.DashboardSummary{
		PodsByNamespace:        make(map[string]int),
		VulnerabilitiesBySeverity: make(map[string]int),
		RecentReports:          []models.ReportSummary{},
	}

	// Track unique pods
	uniquePods := make(map[string]bool)

	// Process vulnerability reports
	totalVulns := 0
	for _, report := range vulnReports.Items {
		// Aggregate summary
		dashboard.VulnerabilitySummary.CriticalCount += report.Report.Summary.CriticalCount
		dashboard.VulnerabilitySummary.HighCount += report.Report.Summary.HighCount
		dashboard.VulnerabilitySummary.MediumCount += report.Report.Summary.MediumCount
		dashboard.VulnerabilitySummary.LowCount += report.Report.Summary.LowCount
		dashboard.VulnerabilitySummary.UnknownCount += report.Report.Summary.UnknownCount

		// Count total vulnerabilities from summary instead of iterating
		totalVulns += report.Report.Summary.CriticalCount +
			report.Report.Summary.HighCount +
			report.Report.Summary.MediumCount +
			report.Report.Summary.LowCount +
			report.Report.Summary.UnknownCount

		// Track pods by namespace
		podName := extractPodName(report.Name)
		podKey := report.Namespace + "/" + podName
		if !uniquePods[podKey] {
			uniquePods[podKey] = true
			dashboard.PodsByNamespace[report.Namespace]++
		}

		// Use summary counts for vulnerabilities by severity (no need to iterate)
		dashboard.VulnerabilitiesBySeverity["CRITICAL"] += report.Report.Summary.CriticalCount
		dashboard.VulnerabilitiesBySeverity["HIGH"] += report.Report.Summary.HighCount
		dashboard.VulnerabilitiesBySeverity["MEDIUM"] += report.Report.Summary.MediumCount
		dashboard.VulnerabilitiesBySeverity["LOW"] += report.Report.Summary.LowCount
		dashboard.VulnerabilitiesBySeverity["UNKNOWN"] += report.Report.Summary.UnknownCount

		// Only add to recent reports if we have less than 100 (to limit memory)
		if len(dashboard.RecentReports) < 100 {
			imageName := report.Report.Artifact.Repository
			if report.Report.Artifact.Tag != "" {
				imageName += ":" + report.Report.Artifact.Tag
			}

			dashboard.RecentReports = append(dashboard.RecentReports, models.ReportSummary{
				Name:            report.Name,
				Namespace:       report.Namespace,
				Kind:            "VulnerabilityReport",
				ContainerName:   extractContainerName(report.Name),
				UpdateTimestamp: report.Report.UpdateTimestamp,
				Summary:         report.Report.Summary,
				ImageName:       imageName,
			})
		}
	}

	// Process config audit reports
	totalConfigIssues := 0
	for _, report := range configReports.Items {
		// Aggregate summary
		dashboard.ConfigIssueSummary.CriticalCount += report.Report.Summary.CriticalCount
		dashboard.ConfigIssueSummary.HighCount += report.Report.Summary.HighCount
		dashboard.ConfigIssueSummary.MediumCount += report.Report.Summary.MediumCount
		dashboard.ConfigIssueSummary.LowCount += report.Report.Summary.LowCount

		// Count total config issues
		for _, check := range report.Report.Checks {
			if !check.Success {
				totalConfigIssues++
			}
		}
	}

	// Process exposed secret reports
	totalSecrets := 0
	for _, report := range secretReports.Items {
		// Aggregate summary
		dashboard.ExposedSecretSummary.CriticalCount += report.Report.Summary.CriticalCount
		dashboard.ExposedSecretSummary.HighCount += report.Report.Summary.HighCount
		dashboard.ExposedSecretSummary.MediumCount += report.Report.Summary.MediumCount
		dashboard.ExposedSecretSummary.LowCount += report.Report.Summary.LowCount

		// Count total secrets
		totalSecrets += len(report.Report.Secrets)
	}

	// Process RBAC assessment reports
	totalRbacIssues := 0
	for _, report := range rbacReports.Items {
		// Aggregate summary
		dashboard.RbacIssueSummary.CriticalCount += report.Report.Summary.CriticalCount
		dashboard.RbacIssueSummary.HighCount += report.Report.Summary.HighCount
		dashboard.RbacIssueSummary.MediumCount += report.Report.Summary.MediumCount
		dashboard.RbacIssueSummary.LowCount += report.Report.Summary.LowCount

		// Count total RBAC issues
		for _, check := range report.Report.Checks {
			if !check.Success {
				totalRbacIssues++
			}
		}
	}

	// Process infrastructure assessment reports
	totalInfraIssues := 0
	for _, report := range infraReports.Items {
		// Aggregate summary
		dashboard.InfraIssueSummary.CriticalCount += report.Report.Summary.CriticalCount
		dashboard.InfraIssueSummary.HighCount += report.Report.Summary.HighCount
		dashboard.InfraIssueSummary.MediumCount += report.Report.Summary.MediumCount
		dashboard.InfraIssueSummary.LowCount += report.Report.Summary.LowCount

		// Count total infrastructure issues
		for _, check := range report.Report.Checks {
			if !check.Success {
				totalInfraIssues++
			}
		}
	}

	dashboard.TotalPods = len(uniquePods)
	dashboard.TotalVulnerabilities = totalVulns
	dashboard.TotalConfigIssues = totalConfigIssues
	dashboard.TotalExposedSecrets = totalSecrets
	dashboard.TotalRbacIssues = totalRbacIssues
	dashboard.TotalInfraIssues = totalInfraIssues

	// Sort recent reports by update timestamp (newest first)
	sort.Slice(dashboard.RecentReports, func(i, j int) bool {
		return dashboard.RecentReports[i].UpdateTimestamp.After(dashboard.RecentReports[j].UpdateTimestamp.Time)
	})

	// Limit to 10 most recent
	if len(dashboard.RecentReports) > 10 {
		dashboard.RecentReports = dashboard.RecentReports[:10]
	}

	return dashboard
}

// extractPodName extracts the pod name from report name
// Report naming convention: <workload-kind>-<workload-name>-<container-name>
func extractPodName(reportName string) string {
	parts := strings.Split(reportName, "-")
	if len(parts) >= 2 {
		// Remove the last part (container name) and rejoin
		return strings.Join(parts[:len(parts)-1], "-")
	}
	return reportName
}

// extractContainerName extracts the container name from report name
func extractContainerName(reportName string) string {
	parts := strings.Split(reportName, "-")
	if len(parts) > 0 {
		return parts[len(parts)-1]
	}
	return ""
}

// GetAllReports returns all vulnerability and config audit reports
func (h *Handler) GetAllReports(c *gin.Context) {
	ctx := context.Background()

	namespace := c.Query("namespace")

	var vulnReports *models.VulnerabilityReportList
	var configReports *models.ConfigAuditReportList
	var err error

	if namespace != "" {
		vulnReports, err = h.K8sClient.GetVulnerabilityReports(ctx, namespace)
	} else {
		vulnReports, err = h.K8sClient.GetAllVulnerabilityReports(ctx)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if namespace != "" {
		configReports, err = h.K8sClient.GetConfigAuditReports(ctx, namespace)
	} else {
		configReports, err = h.K8sClient.GetAllConfigAuditReports(ctx)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"vulnerabilityReports": vulnReports.Items,
		"configAuditReports":   configReports.Items,
	})
}

// GetNamespaces returns all namespaces
func (h *Handler) GetNamespaces(c *gin.Context) {
	ctx := context.Background()

	namespaces, err := h.K8sClient.GetNamespaces(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"namespaces": namespaces,
	})
}

// HealthCheck returns the health status of the API
func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "healthy",
	})
}
