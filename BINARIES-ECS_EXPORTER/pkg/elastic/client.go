package elastic

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/elastic/go-elasticsearch/v8/esapi"
)

// Config holds Elasticsearch configuration
type Config struct {
	Addresses []string
	Username  string
	Password  string
	IndexName string
	CloudID   string
	APIKey    string
}

// Client wraps Elasticsearch client
type Client struct {
	es        *elasticsearch.Client
	indexName string
}

// NewClient creates a new Elasticsearch client
func NewClient(config Config) (*Client, error) {
	cfg := elasticsearch.Config{
		Addresses: config.Addresses,
	}

	// Cloud ID takes precedence
	if config.CloudID != "" {
		cfg.CloudID = config.CloudID
	}

	// API Key authentication
	if config.APIKey != "" {
		cfg.APIKey = config.APIKey
	} else if config.Username != "" && config.Password != "" {
		// Basic authentication
		cfg.Username = config.Username
		cfg.Password = config.Password
	}

	es, err := elasticsearch.NewClient(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create elasticsearch client: %w", err)
	}

	// Test connection
	res, err := es.Info()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to elasticsearch: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		return nil, fmt.Errorf("elasticsearch returned error: %s", res.String())
	}

	return &Client{
		es:        es,
		indexName: config.IndexName,
	}, nil
}

// CreateIndexTemplate creates an index template for Trivy reports
func (c *Client) CreateIndexTemplate(ctx context.Context) error {
	template := map[string]interface{}{
		"index_patterns": []string{c.indexName + "-*"},
		"priority":       500,
		"template": map[string]interface{}{
			"settings": map[string]interface{}{
				"number_of_shards":   1,
				"number_of_replicas": 1,
				"index": map[string]interface{}{
					"lifecycle": map[string]interface{}{
						"name": "trivy-reports-policy",
					},
				},
			},
			"mappings": map[string]interface{}{
				"properties": map[string]interface{}{
					"@timestamp": map[string]interface{}{
						"type": "date",
					},
					"event": map[string]interface{}{
						"properties": map[string]interface{}{
							"kind":     map[string]string{"type": "keyword"},
							"category": map[string]string{"type": "keyword"},
							"type":     map[string]string{"type": "keyword"},
							"dataset":  map[string]string{"type": "keyword"},
							"module":   map[string]string{"type": "keyword"},
							"outcome":  map[string]string{"type": "keyword"},
							"severity": map[string]string{"type": "long"},
						},
					},
					"kubernetes": map[string]interface{}{
						"properties": map[string]interface{}{
							"namespace": map[string]string{"type": "keyword"},
							"pod": map[string]interface{}{
								"properties": map[string]interface{}{
									"name": map[string]string{"type": "keyword"},
									"uid":  map[string]string{"type": "keyword"},
								},
							},
							"node": map[string]interface{}{
								"properties": map[string]interface{}{
									"name": map[string]string{"type": "keyword"},
								},
							},
							"labels": map[string]string{"type": "flattened"},
						},
					},
					"vulnerability": map[string]interface{}{
						"properties": map[string]interface{}{
							"id":          map[string]string{"type": "keyword"},
							"category":    map[string]string{"type": "keyword"},
							"description": map[string]string{"type": "text"},
							"severity":    map[string]string{"type": "keyword"},
							"reference":   map[string]string{"type": "keyword"},
							"score": map[string]interface{}{
								"properties": map[string]interface{}{
									"base":    map[string]string{"type": "float"},
									"version": map[string]string{"type": "keyword"},
								},
							},
							"package": map[string]interface{}{
								"properties": map[string]interface{}{
									"name":          map[string]string{"type": "keyword"},
									"version":       map[string]string{"type": "keyword"},
									"fixed_version": map[string]string{"type": "keyword"},
									"type":          map[string]string{"type": "keyword"},
									"architecture":  map[string]string{"type": "keyword"},
								},
							},
						},
					},
					"observer": map[string]interface{}{
						"properties": map[string]interface{}{
							"type":    map[string]string{"type": "keyword"},
							"vendor":  map[string]string{"type": "keyword"},
							"name":    map[string]string{"type": "keyword"},
							"version": map[string]string{"type": "keyword"},
						},
					},
					"labels":   map[string]string{"type": "flattened"},
					"tags":     map[string]string{"type": "keyword"},
					"message":  map[string]string{"type": "text"},
					"metadata": map[string]string{"type": "flattened"},
				},
			},
		},
	}

	body, err := json.Marshal(template)
	if err != nil {
		return fmt.Errorf("failed to marshal index template: %w", err)
	}

	req := esapi.IndicesPutIndexTemplateRequest{
		Name: "trivy-reports",
		Body: bytes.NewReader(body),
	}

	res, err := req.Do(ctx, c.es)
	if err != nil {
		return fmt.Errorf("failed to create index template: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		return fmt.Errorf("elasticsearch returned error creating template: %s", res.String())
	}

	return nil
}

// BulkIndexDocuments indexes multiple documents using the bulk API
func (c *Client) BulkIndexDocuments(ctx context.Context, documents []interface{}) error {
	if len(documents) == 0 {
		return nil
	}

	// Create index name with current date
	indexName := fmt.Sprintf("%s-%s", c.indexName, time.Now().Format("2006.01.02"))

	var buf bytes.Buffer
	for _, doc := range documents {
		// Bulk index action
		meta := map[string]interface{}{
			"index": map[string]interface{}{
				"_index": indexName,
			},
		}

		metaJSON, err := json.Marshal(meta)
		if err != nil {
			return fmt.Errorf("failed to marshal bulk meta: %w", err)
		}

		docJSON, err := json.Marshal(doc)
		if err != nil {
			return fmt.Errorf("failed to marshal document: %w", err)
		}

		buf.Write(metaJSON)
		buf.WriteByte('\n')
		buf.Write(docJSON)
		buf.WriteByte('\n')
	}

	res, err := c.es.Bulk(bytes.NewReader(buf.Bytes()), c.es.Bulk.WithContext(ctx))
	if err != nil {
		return fmt.Errorf("failed to execute bulk request: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		return fmt.Errorf("elasticsearch bulk request returned error: %s", res.String())
	}

	// Parse response to check for individual item errors
	var bulkResponse struct {
		Errors bool                     `json:"errors"`
		Items  []map[string]interface{} `json:"items"`
	}

	if err := json.NewDecoder(res.Body).Decode(&bulkResponse); err != nil {
		return fmt.Errorf("failed to parse bulk response: %w", err)
	}

	if bulkResponse.Errors {
		var errorMessages []string
		for _, item := range bulkResponse.Items {
			for action, details := range item {
				if detailsMap, ok := details.(map[string]interface{}); ok {
					if errInfo, hasError := detailsMap["error"]; hasError {
						errorMessages = append(errorMessages, fmt.Sprintf("%s: %v", action, errInfo))
					}
				}
			}
		}
		if len(errorMessages) > 0 {
			return fmt.Errorf("bulk indexing had errors: %s", strings.Join(errorMessages, "; "))
		}
	}

	return nil
}

// DeleteOldIndices deletes indices older than the specified number of days
func (c *Client) DeleteOldIndices(ctx context.Context, retentionDays int) error {
	cutoffDate := time.Now().AddDate(0, 0, -retentionDays)
	pattern := fmt.Sprintf("%s-*", c.indexName)

	req := esapi.IndicesGetRequest{
		Index: []string{pattern},
	}

	res, err := req.Do(ctx, c.es)
	if err != nil {
		return fmt.Errorf("failed to get indices: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		// If no indices found, that's OK
		if res.StatusCode == 404 {
			return nil
		}
		return fmt.Errorf("elasticsearch returned error getting indices: %s", res.String())
	}

	var indices map[string]interface{}
	if err := json.NewDecoder(res.Body).Decode(&indices); err != nil {
		return fmt.Errorf("failed to parse indices response: %w", err)
	}

	var indicesToDelete []string
	for indexName := range indices {
		// Extract date from index name (format: trivy-reports-2024.01.02)
		parts := strings.Split(indexName, "-")
		if len(parts) < 3 {
			continue
		}

		dateStr := parts[len(parts)-1]
		indexDate, err := time.Parse("2006.01.02", dateStr)
		if err != nil {
			continue
		}

		if indexDate.Before(cutoffDate) {
			indicesToDelete = append(indicesToDelete, indexName)
		}
	}

	if len(indicesToDelete) == 0 {
		return nil
	}

	delReq := esapi.IndicesDeleteRequest{
		Index: indicesToDelete,
	}

	delRes, err := delReq.Do(ctx, c.es)
	if err != nil {
		return fmt.Errorf("failed to delete indices: %w", err)
	}
	defer delRes.Body.Close()

	if delRes.IsError() {
		return fmt.Errorf("elasticsearch returned error deleting indices: %s", delRes.String())
	}

	return nil
}
