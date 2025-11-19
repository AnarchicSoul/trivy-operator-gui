package ecs

import (
	"fmt"
	"strings"
	"time"
)

// ECSDocument represents an Elastic Common Schema document
type ECSDocument struct {
	Timestamp   string                 `json:"@timestamp"`
	Event       Event                  `json:"event"`
	Kubernetes  Kubernetes             `json:"kubernetes,omitempty"`
	Vulnerability *Vulnerability       `json:"vulnerability,omitempty"`
	Observer    Observer               `json:"observer"`
	Labels      map[string]string      `json:"labels,omitempty"`
	Tags        []string               `json:"tags,omitempty"`
	Message     string                 `json:"message,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// Event represents ECS event fields
type Event struct {
	Kind     string `json:"kind"`
	Category string `json:"category"`
	Type     string `json:"type"`
	Dataset  string `json:"dataset"`
	Module   string `json:"module"`
	Outcome  string `json:"outcome,omitempty"`
	Severity int    `json:"severity,omitempty"`
}

// Kubernetes represents ECS kubernetes fields
type Kubernetes struct {
	Namespace string            `json:"namespace,omitempty"`
	Pod       *Pod              `json:"pod,omitempty"`
	Node      *Node             `json:"node,omitempty"`
	Labels    map[string]string `json:"labels,omitempty"`
}

// Pod represents Kubernetes pod information
type Pod struct {
	Name string `json:"name,omitempty"`
	UID  string `json:"uid,omitempty"`
}

// Node represents Kubernetes node information
type Node struct {
	Name string `json:"name,omitempty"`
}

// Vulnerability represents ECS vulnerability fields
type Vulnerability struct {
	ID          string   `json:"id,omitempty"`
	Category    []string `json:"category,omitempty"`
	Description string   `json:"description,omitempty"`
	Severity    string   `json:"severity,omitempty"`
	Score       *Score   `json:"score,omitempty"`
	Reference   string   `json:"reference,omitempty"`
	Package     *Package `json:"package,omitempty"`
}

// Score represents vulnerability scoring
type Score struct {
	Base    float64 `json:"base,omitempty"`
	Version string  `json:"version,omitempty"`
}

// Package represents affected package information
type Package struct {
	Name             string `json:"name,omitempty"`
	Version          string `json:"version,omitempty"`
	FixedVersion     string `json:"fixed_version,omitempty"`
	PackageType      string `json:"type,omitempty"`
	Architecture     string `json:"architecture,omitempty"`
}

// Observer represents the scanner/observer information
type Observer struct {
	Type    string `json:"type"`
	Vendor  string `json:"vendor"`
	Name    string `json:"name,omitempty"`
	Version string `json:"version,omitempty"`
}

// TransformToECS transforms a Trivy report to ECS format
func TransformToECS(report map[string]interface{}) ([]ECSDocument, error) {
	reportType, ok := report["reportType"].(string)
	if !ok {
		return nil, fmt.Errorf("missing reportType in report")
	}

	switch reportType {
	case "vulnerability":
		return transformVulnerabilityReport(report)
	case "config-audit":
		return transformConfigAuditReport(report)
	case "exposed-secret":
		return transformExposedSecretReport(report)
	case "rbac-assessment":
		return transformRbacAssessmentReport(report)
	case "infra-assessment":
		return transformInfraAssessmentReport(report)
	default:
		return nil, fmt.Errorf("unknown report type: %s", reportType)
	}
}

// transformVulnerabilityReport transforms a vulnerability report to ECS documents
func transformVulnerabilityReport(report map[string]interface{}) ([]ECSDocument, error) {
	var docs []ECSDocument

	metadata := getMetadata(report)
	reportData, ok := report["report"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid report data")
	}

	scanner := getScanner(reportData)
	k8s := getKubernetesInfo(metadata)

	// Get vulnerabilities
	vulnerabilities, ok := reportData["vulnerabilities"].([]interface{})
	if !ok || len(vulnerabilities) == 0 {
		// No vulnerabilities, create a single document
		doc := ECSDocument{
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Event: Event{
				Kind:     "event",
				Category: "vulnerability",
				Type:     "info",
				Dataset:  "trivy.vulnerability",
				Module:   "trivy",
				Outcome:  "success",
			},
			Kubernetes: k8s,
			Observer:   scanner,
			Labels:     metadata.Labels,
			Tags:       []string{"trivy", "vulnerability", "kubernetes"},
			Message:    "No vulnerabilities found",
		}
		docs = append(docs, doc)
		return docs, nil
	}

	// Create one document per vulnerability
	for _, vuln := range vulnerabilities {
		v, ok := vuln.(map[string]interface{})
		if !ok {
			continue
		}

		severity := getString(v, "severity")
		doc := ECSDocument{
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Event: Event{
				Kind:     "alert",
				Category: "vulnerability",
				Type:     "indicator",
				Dataset:  "trivy.vulnerability",
				Module:   "trivy",
				Severity: getSeverityNumber(severity),
			},
			Kubernetes: k8s,
			Vulnerability: &Vulnerability{
				ID:          getString(v, "vulnerabilityID"),
				Description: getString(v, "description"),
				Severity:    strings.ToLower(severity),
				Score:       getScore(v),
				Reference:   getString(v, "primaryLink"),
				Package:     getPackageInfo(v),
			},
			Observer: scanner,
			Labels:   metadata.Labels,
			Tags:     []string{"trivy", "vulnerability", "kubernetes", strings.ToLower(severity)},
			Message:  fmt.Sprintf("Vulnerability %s found in package %s", getString(v, "vulnerabilityID"), getString(v, "pkgName")),
		}
		docs = append(docs, doc)
	}

	return docs, nil
}

// transformConfigAuditReport transforms a config audit report to ECS documents
func transformConfigAuditReport(report map[string]interface{}) ([]ECSDocument, error) {
	var docs []ECSDocument

	metadata := getMetadata(report)
	reportData, ok := report["report"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid report data")
	}

	scanner := getScanner(reportData)
	k8s := getKubernetesInfo(metadata)

	// Get checks
	checks, ok := reportData["checks"].([]interface{})
	if !ok || len(checks) == 0 {
		return docs, nil
	}

	for _, check := range checks {
		c, ok := check.(map[string]interface{})
		if !ok {
			continue
		}

		if !getBool(c, "success") {
			severity := getString(c, "severity")
			doc := ECSDocument{
				Timestamp: time.Now().UTC().Format(time.RFC3339),
				Event: Event{
					Kind:     "alert",
					Category: "configuration",
					Type:     "info",
					Dataset:  "trivy.config-audit",
					Module:   "trivy",
					Outcome:  "failure",
					Severity: getSeverityNumber(severity),
				},
				Kubernetes: k8s,
				Observer:   scanner,
				Labels:     metadata.Labels,
				Tags:       []string{"trivy", "config-audit", "kubernetes", strings.ToLower(severity)},
				Message:    fmt.Sprintf("Config audit failed: %s - %s", getString(c, "checkID"), getString(c, "title")),
				Metadata: map[string]interface{}{
					"check_id":    getString(c, "checkID"),
					"title":       getString(c, "title"),
					"description": getString(c, "description"),
					"category":    getString(c, "category"),
				},
			}
			docs = append(docs, doc)
		}
	}

	return docs, nil
}

// transformExposedSecretReport transforms an exposed secret report to ECS documents
func transformExposedSecretReport(report map[string]interface{}) ([]ECSDocument, error) {
	var docs []ECSDocument

	metadata := getMetadata(report)
	reportData, ok := report["report"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid report data")
	}

	scanner := getScanner(reportData)
	k8s := getKubernetesInfo(metadata)

	// Get secrets
	secrets, ok := reportData["secrets"].([]interface{})
	if !ok || len(secrets) == 0 {
		return docs, nil
	}

	for _, secret := range secrets {
		s, ok := secret.(map[string]interface{})
		if !ok {
			continue
		}

		severity := getString(s, "severity")
		doc := ECSDocument{
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Event: Event{
				Kind:     "alert",
				Category: "threat",
				Type:     "indicator",
				Dataset:  "trivy.exposed-secret",
				Module:   "trivy",
				Outcome:  "failure",
				Severity: getSeverityNumber(severity),
			},
			Kubernetes: k8s,
			Observer:   scanner,
			Labels:     metadata.Labels,
			Tags:       []string{"trivy", "exposed-secret", "kubernetes", strings.ToLower(severity)},
			Message:    fmt.Sprintf("Exposed secret detected: %s in %s", getString(s, "title"), getString(s, "target")),
			Metadata: map[string]interface{}{
				"rule_id":  getString(s, "ruleID"),
				"title":    getString(s, "title"),
				"category": getString(s, "category"),
				"target":   getString(s, "target"),
				"match":    getString(s, "match"),
			},
		}
		docs = append(docs, doc)
	}

	return docs, nil
}

// transformRbacAssessmentReport transforms an RBAC assessment report to ECS documents
func transformRbacAssessmentReport(report map[string]interface{}) ([]ECSDocument, error) {
	var docs []ECSDocument

	metadata := getMetadata(report)
	reportData, ok := report["report"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid report data")
	}

	scanner := getScanner(reportData)
	k8s := getKubernetesInfo(metadata)

	// Get checks
	checks, ok := reportData["checks"].([]interface{})
	if !ok || len(checks) == 0 {
		return docs, nil
	}

	for _, check := range checks {
		c, ok := check.(map[string]interface{})
		if !ok {
			continue
		}

		if !getBool(c, "success") {
			severity := getString(c, "severity")
			doc := ECSDocument{
				Timestamp: time.Now().UTC().Format(time.RFC3339),
				Event: Event{
					Kind:     "alert",
					Category: "iam",
					Type:     "info",
					Dataset:  "trivy.rbac-assessment",
					Module:   "trivy",
					Outcome:  "failure",
					Severity: getSeverityNumber(severity),
				},
				Kubernetes: k8s,
				Observer:   scanner,
				Labels:     metadata.Labels,
				Tags:       []string{"trivy", "rbac-assessment", "kubernetes", strings.ToLower(severity)},
				Message:    fmt.Sprintf("RBAC issue detected: %s - %s", getString(c, "checkID"), getString(c, "title")),
				Metadata: map[string]interface{}{
					"check_id":    getString(c, "checkID"),
					"title":       getString(c, "title"),
					"description": getString(c, "description"),
					"category":    getString(c, "category"),
				},
			}
			docs = append(docs, doc)
		}
	}

	return docs, nil
}

// transformInfraAssessmentReport transforms an infrastructure assessment report to ECS documents
func transformInfraAssessmentReport(report map[string]interface{}) ([]ECSDocument, error) {
	var docs []ECSDocument

	metadata := getMetadata(report)
	reportData, ok := report["report"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid report data")
	}

	scanner := getScanner(reportData)

	// For infrastructure reports, use node info instead of pod
	k8s := Kubernetes{
		Node: &Node{
			Name: metadata.Name,
		},
		Labels: metadata.Labels,
	}

	// Get checks
	checks, ok := reportData["checks"].([]interface{})
	if !ok || len(checks) == 0 {
		return docs, nil
	}

	for _, check := range checks {
		c, ok := check.(map[string]interface{})
		if !ok {
			continue
		}

		if !getBool(c, "success") {
			severity := getString(c, "severity")
			doc := ECSDocument{
				Timestamp: time.Now().UTC().Format(time.RFC3339),
				Event: Event{
					Kind:     "alert",
					Category: "configuration",
					Type:     "info",
					Dataset:  "trivy.infra-assessment",
					Module:   "trivy",
					Outcome:  "failure",
					Severity: getSeverityNumber(severity),
				},
				Kubernetes: k8s,
				Observer:   scanner,
				Labels:     metadata.Labels,
				Tags:       []string{"trivy", "infra-assessment", "kubernetes", strings.ToLower(severity)},
				Message:    fmt.Sprintf("Infrastructure issue detected: %s - %s", getString(c, "checkID"), getString(c, "title")),
				Metadata: map[string]interface{}{
					"check_id":    getString(c, "checkID"),
					"title":       getString(c, "title"),
					"description": getString(c, "description"),
					"category":    getString(c, "category"),
				},
			}
			docs = append(docs, doc)
		}
	}

	return docs, nil
}

// Helper functions

type Metadata struct {
	Name      string
	Namespace string
	Labels    map[string]string
}

func getMetadata(report map[string]interface{}) Metadata {
	metadata := Metadata{
		Labels: make(map[string]string),
	}

	if meta, ok := report["metadata"].(map[string]interface{}); ok {
		metadata.Name = getString(meta, "name")
		metadata.Namespace = getString(meta, "namespace")

		if labels, ok := meta["labels"].(map[string]interface{}); ok {
			for k, v := range labels {
				if str, ok := v.(string); ok {
					metadata.Labels[k] = str
				}
			}
		}
	}

	return metadata
}

func getKubernetesInfo(metadata Metadata) Kubernetes {
	k8s := Kubernetes{
		Namespace: metadata.Namespace,
		Labels:    metadata.Labels,
	}

	if metadata.Name != "" {
		// Extract pod name from report name (usually in format: <pod>-<container>-<hash>)
		parts := strings.Split(metadata.Name, "-")
		if len(parts) >= 2 {
			k8s.Pod = &Pod{
				Name: strings.Join(parts[:len(parts)-1], "-"),
			}
		}
	}

	return k8s
}

func getScanner(reportData map[string]interface{}) Observer {
	observer := Observer{
		Type:   "scanner",
		Vendor: "Aqua Security",
		Name:   "Trivy",
	}

	if scanner, ok := reportData["scanner"].(map[string]interface{}); ok {
		observer.Name = getString(scanner, "name")
		observer.Vendor = getString(scanner, "vendor")
		observer.Version = getString(scanner, "version")
	}

	return observer
}

func getScore(vuln map[string]interface{}) *Score {
	if cvss, ok := vuln["cvss"].(map[string]interface{}); ok {
		for _, v := range cvss {
			if scoreData, ok := v.(map[string]interface{}); ok {
				if v3Score, ok := scoreData["V3Score"].(float64); ok {
					return &Score{
						Base:    v3Score,
						Version: "3.0",
					}
				}
			}
		}
	}
	return nil
}

func getPackageInfo(vuln map[string]interface{}) *Package {
	return &Package{
		Name:         getString(vuln, "pkgName"),
		Version:      getString(vuln, "installedVersion"),
		FixedVersion: getString(vuln, "fixedVersion"),
		PackageType:  getString(vuln, "pkgType"),
	}
}

func getSeverityNumber(severity string) int {
	switch strings.ToUpper(severity) {
	case "CRITICAL":
		return 4
	case "HIGH":
		return 3
	case "MEDIUM":
		return 2
	case "LOW":
		return 1
	default:
		return 0
	}
}

func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}

func getBool(m map[string]interface{}, key string) bool {
	if v, ok := m[key].(bool); ok {
		return v
	}
	return false
}
