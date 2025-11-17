package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/trivy-operator-gui/backend/handlers"
	"github.com/trivy-operator-gui/backend/k8s"
)

func main() {
	// Create Kubernetes client
	k8sClient, err := k8s.NewClient()
	if err != nil {
		log.Fatalf("Failed to create Kubernetes client: %v", err)
	}

	// Create API handler
	handler := handlers.NewHandler(k8sClient)

	// Setup Gin router
	router := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"*"} // In production, restrict this to your frontend domain
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	router.Use(cors.New(config))

	// Health check endpoint
	router.GET("/health", handler.HealthCheck)

	// API routes
	api := router.Group("/api")
	{
		// Dashboard
		api.GET("/dashboard", handler.GetDashboard)

		// Reports
		api.GET("/reports", handler.GetAllReports)
		api.GET("/reports/vulnerability", handler.GetVulnerabilityReports)
		api.GET("/reports/config-audit", handler.GetConfigAuditReports)

		// Pods
		api.GET("/pods", handler.GetPodsList)
		api.GET("/pods/:namespace/:pod", handler.GetPodReports)

		// Categories (by severity)
		api.GET("/category/:severity", handler.GetReportsByCategory)

		// Namespaces
		api.GET("/namespaces", handler.GetNamespaces)
	}

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server
	log.Printf("Starting Trivy Operator GUI API server on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
