package handlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/trivy-operator-gui/backend/models"
)

// GetPodReports returns all reports for a specific pod
func (h *Handler) GetPodReports(c *gin.Context) {
	namespace := c.Param("namespace")
	podName := c.Param("pod")

	if namespace == "" || podName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "namespace and pod name are required"})
		return
	}

	ctx := context.Background()

	// Get all vulnerability reports for the namespace
	vulnReports, err := h.K8sClient.GetVulnerabilityReports(ctx, namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get all config audit reports for the namespace
	configReports, err := h.K8sClient.GetConfigAuditReports(ctx, namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Filter reports for the specific pod
	podReports := models.PodReports{
		PodName:              podName,
		Namespace:            namespace,
		VulnerabilityReports: []models.VulnerabilityReport{},
		ConfigAuditReports:   []models.ConfigAuditReport{},
	}

	// Filter vulnerability reports
	for _, report := range vulnReports.Items {
		reportPodName := extractPodName(report.Name)
		if reportPodName == podName || strings.HasPrefix(report.Name, podName+"-") {
			podReports.VulnerabilityReports = append(podReports.VulnerabilityReports, report)
			podReports.TotalVulnerabilities += len(report.Report.Vulnerabilities)
			podReports.VulnerabilitySummary.CriticalCount += report.Report.Summary.CriticalCount
			podReports.VulnerabilitySummary.HighCount += report.Report.Summary.HighCount
			podReports.VulnerabilitySummary.MediumCount += report.Report.Summary.MediumCount
			podReports.VulnerabilitySummary.LowCount += report.Report.Summary.LowCount
			podReports.VulnerabilitySummary.UnknownCount += report.Report.Summary.UnknownCount
		}
	}

	// Filter config audit reports
	for _, report := range configReports.Items {
		reportPodName := extractPodName(report.Name)
		if reportPodName == podName || strings.HasPrefix(report.Name, podName+"-") {
			podReports.ConfigAuditReports = append(podReports.ConfigAuditReports, report)
			for _, check := range report.Report.Checks {
				if !check.Success {
					podReports.TotalConfigIssues++
					// Aggregate config issue counts by severity
					switch strings.ToUpper(check.Severity) {
					case "CRITICAL":
						podReports.ConfigIssueSummary.CriticalCount++
					case "HIGH":
						podReports.ConfigIssueSummary.HighCount++
					case "MEDIUM":
						podReports.ConfigIssueSummary.MediumCount++
					case "LOW":
						podReports.ConfigIssueSummary.LowCount++
					}
				}
			}
		}
	}

	c.JSON(http.StatusOK, podReports)
}

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

// GetPodsList returns a list of all pods with vulnerability reports and configuration issues
func (h *Handler) GetPodsList(c *gin.Context) {
	namespace := c.Query("namespace")
	ctx := context.Background()

	// Get vulnerability reports (filtered by namespace if provided)
	var vulnReports *models.VulnerabilityReportList
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

	// Get config audit reports (filtered by namespace if provided)
	var configReports *models.ConfigAuditReportList
	if namespace != "" {
		configReports, err = h.K8sClient.GetConfigAuditReports(ctx, namespace)
	} else {
		configReports, err = h.K8sClient.GetAllConfigAuditReports(ctx)
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Track unique pods and their summaries
	podMap := make(map[string]*models.PodReports)

	// Process vulnerability reports
	for _, report := range vulnReports.Items {
		podName := extractPodName(report.Name)
		podKey := report.Namespace + "/" + podName

		if _, exists := podMap[podKey]; !exists {
			podMap[podKey] = &models.PodReports{
				PodName:              podName,
				Namespace:            report.Namespace,
				VulnerabilityReports: []models.VulnerabilityReport{},
				ConfigAuditReports:   []models.ConfigAuditReport{},
			}
		}

		podMap[podKey].VulnerabilityReports = append(podMap[podKey].VulnerabilityReports, report)
		podMap[podKey].TotalVulnerabilities += len(report.Report.Vulnerabilities)
		podMap[podKey].VulnerabilitySummary.CriticalCount += report.Report.Summary.CriticalCount
		podMap[podKey].VulnerabilitySummary.HighCount += report.Report.Summary.HighCount
		podMap[podKey].VulnerabilitySummary.MediumCount += report.Report.Summary.MediumCount
		podMap[podKey].VulnerabilitySummary.LowCount += report.Report.Summary.LowCount
		podMap[podKey].VulnerabilitySummary.UnknownCount += report.Report.Summary.UnknownCount
	}

	// Process config audit reports
	for _, report := range configReports.Items {
		podName := extractPodName(report.Name)
		podKey := report.Namespace + "/" + podName

		if _, exists := podMap[podKey]; !exists {
			podMap[podKey] = &models.PodReports{
				PodName:              podName,
				Namespace:            report.Namespace,
				VulnerabilityReports: []models.VulnerabilityReport{},
				ConfigAuditReports:   []models.ConfigAuditReport{},
			}
		}

		podMap[podKey].ConfigAuditReports = append(podMap[podKey].ConfigAuditReports, report)
		for _, check := range report.Report.Checks {
			if !check.Success {
				podMap[podKey].TotalConfigIssues++
				// Aggregate config issue counts by severity
				switch strings.ToUpper(check.Severity) {
				case "CRITICAL":
					podMap[podKey].ConfigIssueSummary.CriticalCount++
				case "HIGH":
					podMap[podKey].ConfigIssueSummary.HighCount++
				case "MEDIUM":
					podMap[podKey].ConfigIssueSummary.MediumCount++
				case "LOW":
					podMap[podKey].ConfigIssueSummary.LowCount++
				}
			}
		}
	}

	// Convert map to slice
	pods := make([]models.PodReports, 0, len(podMap))
	for _, pod := range podMap {
		pods = append(pods, *pod)
	}

	c.JSON(http.StatusOK, gin.H{
		"pods": pods,
	})
}

// GetVulnerabilityReports returns all vulnerability reports
func (h *Handler) GetVulnerabilityReports(c *gin.Context) {
	namespace := c.Query("namespace")

	ctx := context.Background()

	var reports *models.VulnerabilityReportList
	var err error

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
func (h *Handler) GetConfigAuditReports(c *gin.Context) {
	namespace := c.Query("namespace")

	ctx := context.Background()

	var reports *models.ConfigAuditReportList
	var err error

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
