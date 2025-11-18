package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/trivy-operator-gui/elastic-exporter/pkg/ecs"
	"github.com/trivy-operator-gui/elastic-exporter/pkg/elastic"
	"github.com/trivy-operator-gui/elastic-exporter/pkg/k8s"
)

func main() {
	log.Println("Starting Trivy Operator Elastic Exporter...")

	// Load configuration from environment
	config := loadConfig()

	// Validate configuration
	if err := validateConfig(config); err != nil {
		log.Fatalf("Invalid configuration: %v", err)
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	// Create Kubernetes client
	log.Println("Connecting to Kubernetes...")
	k8sClient, err := k8s.NewClient()
	if err != nil {
		log.Fatalf("Failed to create Kubernetes client: %v", err)
	}

	// Create Elasticsearch client
	log.Println("Connecting to Elasticsearch...")
	esClient, err := elastic.NewClient(config)
	if err != nil {
		log.Fatalf("Failed to create Elasticsearch client: %v", err)
	}

	// Create index template
	if os.Getenv("CREATE_INDEX_TEMPLATE") == "true" {
		log.Println("Creating Elasticsearch index template...")
		if err := esClient.CreateIndexTemplate(ctx); err != nil {
			log.Printf("Warning: Failed to create index template: %v", err)
		} else {
			log.Println("Index template created successfully")
		}
	}

	// Get all Trivy reports
	log.Println("Fetching Trivy reports from Kubernetes...")
	reports, err := k8sClient.GetAllReports(ctx)
	if err != nil {
		log.Fatalf("Failed to get Trivy reports: %v", err)
	}
	log.Printf("Found %d reports", len(reports))

	// Transform reports to ECS format
	log.Println("Transforming reports to ECS format...")
	var allDocuments []interface{}
	var transformErrors []error

	for _, report := range reports {
		docs, err := ecs.TransformToECS(report)
		if err != nil {
			transformErrors = append(transformErrors, err)
			continue
		}

		for _, doc := range docs {
			allDocuments = append(allDocuments, doc)
		}
	}

	if len(transformErrors) > 0 {
		log.Printf("Warning: Failed to transform %d reports", len(transformErrors))
		for i, err := range transformErrors {
			if i < 10 { // Only log first 10 errors
				log.Printf("  - %v", err)
			}
		}
	}

	log.Printf("Transformed %d documents", len(allDocuments))

	if len(allDocuments) == 0 {
		log.Println("No documents to index")
		return
	}

	// Index documents in Elasticsearch
	log.Println("Indexing documents to Elasticsearch...")
	if err := esClient.BulkIndexDocuments(ctx, allDocuments); err != nil {
		log.Fatalf("Failed to index documents: %v", err)
	}

	log.Printf("Successfully indexed %d documents", len(allDocuments))

	// Delete old indices if retention is configured
	if retentionDays := getRetentionDays(); retentionDays > 0 {
		log.Printf("Deleting indices older than %d days...", retentionDays)
		if err := esClient.DeleteOldIndices(ctx, retentionDays); err != nil {
			log.Printf("Warning: Failed to delete old indices: %v", err)
		} else {
			log.Println("Old indices deleted successfully")
		}
	}

	log.Println("Export completed successfully!")
}

// loadConfig loads Elasticsearch configuration from environment variables
func loadConfig() elastic.Config {
	config := elastic.Config{
		IndexName: getEnvOrDefault("ES_INDEX_NAME", "trivy-reports"),
		Username:  os.Getenv("ES_USERNAME"),
		Password:  os.Getenv("ES_PASSWORD"),
		CloudID:   os.Getenv("ES_CLOUD_ID"),
		APIKey:    os.Getenv("ES_API_KEY"),
	}

	// Parse addresses
	if addresses := os.Getenv("ES_ADDRESSES"); addresses != "" {
		config.Addresses = strings.Split(addresses, ",")
	} else if address := os.Getenv("ES_ADDRESS"); address != "" {
		config.Addresses = []string{address}
	}

	return config
}

// validateConfig validates the Elasticsearch configuration
func validateConfig(config elastic.Config) error {
	// Either CloudID or Addresses must be provided
	if config.CloudID == "" && len(config.Addresses) == 0 {
		return fmt.Errorf("either ES_CLOUD_ID or ES_ADDRESS/ES_ADDRESSES must be provided")
	}

	// Either APIKey or Username/Password must be provided
	if config.APIKey == "" && (config.Username == "" || config.Password == "") {
		return fmt.Errorf("either ES_API_KEY or ES_USERNAME/ES_PASSWORD must be provided")
	}

	return nil
}

// getEnvOrDefault returns environment variable value or default
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getRetentionDays returns the retention period in days
func getRetentionDays() int {
	if retention := os.Getenv("ES_RETENTION_DAYS"); retention != "" {
		if days, err := strconv.Atoi(retention); err == nil && days > 0 {
			return days
		}
	}
	return 0
}
