package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/trivy-operator-gui/backend/models"
)

// GetReportsByCategory returns vulnerabilities grouped by severity category
func (h *Handler) GetReportsByCategory(c *gin.Context) {
	severity := c.Param("severity")

	if severity == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "severity is required"})
		return
	}

	// Normalize severity to uppercase
	severity = strings.ToUpper(severity)

	// Validate severity
	validSeverities := map[string]bool{
		"CRITICAL": true,
		"HIGH":     true,
		"MEDIUM":   true,
		"LOW":      true,
		"UNKNOWN":  true,
	}

	if !validSeverities[severity] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid severity. Must be one of: CRITICAL, HIGH, MEDIUM, LOW, UNKNOWN"})
		return
	}

	ctx := context.Background()

	// Get all vulnerability reports
	vulnReports, err := h.K8sClient.GetAllVulnerabilityReports(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Build category report
	categoryReport := models.CategoryReport{
		Severity:        severity,
		Count:           0,
		Vulnerabilities: []models.VulnerabilityDetail{},
	}

	// Collect vulnerabilities matching the severity
	for _, report := range vulnReports.Items {
		podName := extractPodName(report.Name)
		containerName := extractContainerName(report.Name)
		imageName := report.Report.Artifact.Repository
		if report.Report.Artifact.Tag != "" {
			imageName += ":" + report.Report.Artifact.Tag
		}

		for _, vuln := range report.Report.Vulnerabilities {
			if strings.ToUpper(vuln.Severity) == severity {
				categoryReport.Count++
				categoryReport.Vulnerabilities = append(categoryReport.Vulnerabilities, models.VulnerabilityDetail{
					Vulnerability: vuln,
					PodName:       podName,
					Namespace:     report.Namespace,
					ContainerName: containerName,
					ImageName:     imageName,
				})
			}
		}
	}

	c.JSON(http.StatusOK, categoryReport)
}

// GetVulnerabilityReports returns all vulnerability reports
// Supports optional 'limit' query parameter for pagination
func (h *Handler) GetVulnerabilityReports(c *gin.Context) {
	namespace := c.Query("namespace")
	limitStr := c.Query("limit")

	ctx := context.Background()

	var reports *models.VulnerabilityReportList
	var err error

	// If limit is specified, use limited method
	if limitStr != "" {
		var limit int64
		if _, err := fmt.Sscanf(limitStr, "%d", &limit); err == nil && limit > 0 {
			reports, err = h.K8sClient.GetVulnerabilityReportsLimited(ctx, namespace, limit)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, reports)
			return
		}
	}

	// Default behavior without limit
	if namespace != "" {
		reports, err = h.K8sClient.GetVulnerabilityReports(ctx, namespace)
	} else {
		reports, err = h.K8sClient.GetAllVulnerabilityReports(ctx)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}

// GetConfigAuditReports returns all config audit reports
// Supports optional 'limit' query parameter for pagination
func (h *Handler) GetConfigAuditReports(c *gin.Context) {
	namespace := c.Query("namespace")
	limitStr := c.Query("limit")

	ctx := context.Background()

	var reports *models.ConfigAuditReportList
	var err error

	// If limit is specified, use limited method
	if limitStr != "" {
		var limit int64
		if _, err := fmt.Sscanf(limitStr, "%d", &limit); err == nil && limit > 0 {
			reports, err = h.K8sClient.GetConfigAuditReportsLimited(ctx, namespace, limit)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, reports)
			return
		}
	}

	// Default behavior without limit
	if namespace != "" {
		reports, err = h.K8sClient.GetConfigAuditReports(ctx, namespace)
	} else {
		reports, err = h.K8sClient.GetAllConfigAuditReports(ctx)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}

// GetExposedSecretReports returns all exposed secret reports
// Supports optional 'limit' query parameter for pagination
func (h *Handler) GetExposedSecretReports(c *gin.Context) {
	namespace := c.Query("namespace")
	limitStr := c.Query("limit")

	ctx := context.Background()

	var reports *models.ExposedSecretReportList
	var err error

	// If limit is specified, use limited method
	if limitStr != "" {
		var limit int64
		if _, err := fmt.Sscanf(limitStr, "%d", &limit); err == nil && limit > 0 {
			reports, err = h.K8sClient.GetExposedSecretReportsLimited(ctx, namespace, limit)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, reports)
			return
		}
	}

	// Default behavior without limit
	if namespace != "" {
		reports, err = h.K8sClient.GetExposedSecretReports(ctx, namespace)
	} else {
		reports, err = h.K8sClient.GetAllExposedSecretReports(ctx)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}

// GetRbacAssessmentReports returns all RBAC assessment reports
// Supports optional 'limit' query parameter for pagination
func (h *Handler) GetRbacAssessmentReports(c *gin.Context) {
	namespace := c.Query("namespace")
	limitStr := c.Query("limit")

	ctx := context.Background()

	var reports *models.RbacAssessmentReportList
	var err error

	// If limit is specified, use limited method
	if limitStr != "" {
		var limit int64
		if _, err := fmt.Sscanf(limitStr, "%d", &limit); err == nil && limit > 0 {
			reports, err = h.K8sClient.GetRbacAssessmentReportsLimited(ctx, namespace, limit)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, reports)
			return
		}
	}

	// Default behavior without limit
	if namespace != "" {
		reports, err = h.K8sClient.GetRbacAssessmentReports(ctx, namespace)
	} else {
		reports, err = h.K8sClient.GetAllRbacAssessmentReports(ctx)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}

// GetInfraAssessmentReports returns all infrastructure assessment reports
// Supports optional 'limit' query parameter for pagination
func (h *Handler) GetInfraAssessmentReports(c *gin.Context) {
	limitStr := c.Query("limit")
	ctx := context.Background()

	var reports *models.InfraAssessmentReportList
	var err error

	// If limit is specified, use limited method
	if limitStr != "" {
		var limit int64
		if _, err := fmt.Sscanf(limitStr, "%d", &limit); err == nil && limit > 0 {
			reports, err = h.K8sClient.GetInfraAssessmentReportsLimited(ctx, limit)
			if err != nil {
				c.Error(err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, reports)
			return
		}
	}

	// Default behavior without limit
	reports, err = h.K8sClient.GetInfraAssessmentReports(ctx)
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}

// GetSBOMReports returns all SBOM reports
func (h *Handler) GetSBOMReports(c *gin.Context) {
	namespace := c.Query("namespace")

	ctx := context.Background()

	var reports *models.SBOMReportList
	var err error

	if namespace != "" {
		reports, err = h.K8sClient.GetSBOMReports(ctx, namespace)
	} else {
		reports, err = h.K8sClient.GetAllSBOMReports(ctx)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}

// GetClusterSBOMReports returns all ClusterSBOM reports (KBOM)
func (h *Handler) GetClusterSBOMReports(c *gin.Context) {
	ctx := context.Background()

	reports, err := h.K8sClient.GetClusterSBOMReports(ctx)
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}

// GetComplianceReports returns all compliance reports
func (h *Handler) GetComplianceReports(c *gin.Context) {
	ctx := context.Background()

	reports, err := h.K8sClient.GetComplianceReports(ctx)
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}
