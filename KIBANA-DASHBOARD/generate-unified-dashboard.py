#!/usr/bin/env python3
"""
Generate a unified Trivy dashboard that mimics the frontend application.
This creates a single dashboard with all report types organized in sections.
"""

import json
from datetime import datetime

def create_unified_dashboard():
    """Create a unified dashboard with all Trivy reports in one view"""

    # Index pattern
    index_pattern = {
        "attributes": {
            "title": "trivy-reports-*",
            "timeFieldName": "@timestamp",
            "fields": "[]",
            "fieldFormatMap": "{}",
            "runtimeFieldMap": "{}",
            "fieldAttrs": "{}",
            "name": "Trivy Reports",
            "sourceFilters": "[]",
            "typeMeta": "{}"
        },
        "id": "trivy-reports",
        "type": "index-pattern",
        "references": [],
        "managed": False,
        "coreMigrationVersion": "8.8.0",
        "typeMigrationVersion": "8.0.0",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "version": "WzEsMV0="
    }

    # Dashboard panels - organized like the frontend
    panels = []

    # ROW 1: Summary Cards (simulated with metric visualizations)
    # Metric 1: Total Vulnerabilities
    panels.append({
        "version": "8.8.0",
        "type": "lens",
        "gridData": {"x": 0, "y": 0, "w": 8, "h": 8, "i": "metric-vuln"},
        "panelIndex": "metric-vuln",
        "embeddableConfig": {
            "attributes": {
                "title": "Total Vulnerabilities",
                "type": "lens",
                "visualizationType": "lnsMetric",
                "state": {
                    "datasourceStates": {
                        "formBased": {
                            "layers": {
                                "layer1": {
                                    "columnOrder": ["col1"],
                                    "columns": {
                                        "col1": {
                                            "label": "Vulnerabilities",
                                            "dataType": "number",
                                            "operationType": "count",
                                            "isBucketed": False,
                                            "scale": "ratio",
                                            "sourceField": "___records___"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "visualization": {
                        "layerId": "layer1",
                        "layerType": "data",
                        "metricAccessor": "col1"
                    },
                    "query": {"query": "event.dataset: \"trivy.vulnerability\"", "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    })

    # Metric 2: Config Issues
    panels.append({
        "version": "8.8.0",
        "type": "lens",
        "gridData": {"x": 8, "y": 0, "w": 8, "h": 8, "i": "metric-config"},
        "panelIndex": "metric-config",
        "embeddableConfig": {
            "attributes": {
                "title": "Config Issues",
                "type": "lens",
                "visualizationType": "lnsMetric",
                "state": {
                    "datasourceStates": {
                        "formBased": {
                            "layers": {
                                "layer1": {
                                    "columnOrder": ["col1"],
                                    "columns": {
                                        "col1": {
                                            "label": "Config Issues",
                                            "dataType": "number",
                                            "operationType": "count",
                                            "isBucketed": False,
                                            "scale": "ratio",
                                            "sourceField": "___records___"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "visualization": {
                        "layerId": "layer1",
                        "layerType": "data",
                        "metricAccessor": "col1"
                    },
                    "query": {"query": "event.dataset: \"trivy.config-audit\"", "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    })

    # Metric 3: Exposed Secrets
    panels.append({
        "version": "8.8.0",
        "type": "lens",
        "gridData": {"x": 16, "y": 0, "w": 8, "h": 8, "i": "metric-secrets"},
        "panelIndex": "metric-secrets",
        "embeddableConfig": {
            "attributes": {
                "title": "Exposed Secrets",
                "type": "lens",
                "visualizationType": "lnsMetric",
                "state": {
                    "datasourceStates": {
                        "formBased": {
                            "layers": {
                                "layer1": {
                                    "columnOrder": ["col1"],
                                    "columns": {
                                        "col1": {
                                            "label": "Secrets",
                                            "dataType": "number",
                                            "operationType": "count",
                                            "isBucketed": False,
                                            "scale": "ratio",
                                            "sourceField": "___records___"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "visualization": {
                        "layerId": "layer1",
                        "layerType": "data",
                        "metricAccessor": "col1"
                    },
                    "query": {"query": "event.dataset: \"trivy.exposed-secret\"", "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    })

    # Metric 4: RBAC Issues
    panels.append({
        "version": "8.8.0",
        "type": "lens",
        "gridData": {"x": 24, "y": 0, "w": 8, "h": 8, "i": "metric-rbac"},
        "panelIndex": "metric-rbac",
        "embeddableConfig": {
            "attributes": {
                "title": "RBAC Issues",
                "type": "lens",
                "visualizationType": "lnsMetric",
                "state": {
                    "datasourceStates": {
                        "formBased": {
                            "layers": {
                                "layer1": {
                                    "columnOrder": ["col1"],
                                    "columns": {
                                        "col1": {
                                            "label": "RBAC Issues",
                                            "dataType": "number",
                                            "operationType": "count",
                                            "isBucketed": False,
                                            "scale": "ratio",
                                            "sourceField": "___records___"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "visualization": {
                        "layerId": "layer1",
                        "layerType": "data",
                        "metricAccessor": "col1"
                    },
                    "query": {"query": "event.dataset: \"trivy.rbac-assessment\"", "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    })

    # Metric 5: Infra Issues
    panels.append({
        "version": "8.8.0",
        "type": "lens",
        "gridData": {"x": 32, "y": 0, "w": 8, "h": 8, "i": "metric-infra"},
        "panelIndex": "metric-infra",
        "embeddableConfig": {
            "attributes": {
                "title": "Infra Issues",
                "type": "lens",
                "visualizationType": "lnsMetric",
                "state": {
                    "datasourceStates": {
                        "formBased": {
                            "layers": {
                                "layer1": {
                                    "columnOrder": ["col1"],
                                    "columns": {
                                        "col1": {
                                            "label": "Infra Issues",
                                            "dataType": "number",
                                            "operationType": "count",
                                            "isBucketed": False,
                                            "scale": "ratio",
                                            "sourceField": "___records___"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "visualization": {
                        "layerId": "layer1",
                        "layerType": "data",
                        "metricAccessor": "col1"
                    },
                    "query": {"query": "event.dataset: \"trivy.infra-assessment\"", "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    })

    # Metric 6: All Report Types
    panels.append({
        "version": "8.8.0",
        "type": "lens",
        "gridData": {"x": 40, "y": 0, "w": 8, "h": 8, "i": "metric-total"},
        "panelIndex": "metric-total",
        "embeddableConfig": {
            "attributes": {
                "title": "Total Reports",
                "type": "lens",
                "visualizationType": "lnsMetric",
                "state": {
                    "datasourceStates": {
                        "formBased": {
                            "layers": {
                                "layer1": {
                                    "columnOrder": ["col1"],
                                    "columns": {
                                        "col1": {
                                            "label": "Total",
                                            "dataType": "number",
                                            "operationType": "count",
                                            "isBucketed": False,
                                            "scale": "ratio",
                                            "sourceField": "___records___"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "visualization": {
                        "layerId": "layer1",
                        "layerType": "data",
                        "metricAccessor": "col1"
                    },
                    "query": {"query": "", "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    })

    # ROW 2: Vulnerabilities by Severity (Pie Chart)
    panels.append({
        "version": "8.8.0",
        "type": "lens",
        "gridData": {"x": 0, "y": 8, "w": 24, "h": 15, "i": "vuln-severity"},
        "panelIndex": "vuln-severity",
        "embeddableConfig": {
            "attributes": {
                "title": "Vulnerabilities by Severity",
                "type": "lens",
                "visualizationType": "lnsPie",
                "state": {
                    "datasourceStates": {
                        "formBased": {
                            "layers": {
                                "layer1": {
                                    "columnOrder": ["col1", "col2"],
                                    "columns": {
                                        "col1": {
                                            "label": "Severity",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "vulnerability.severity",
                                            "isBucketed": True,
                                            "params": {
                                                "size": 10,
                                                "orderBy": {"type": "column", "columnId": "col2"},
                                                "orderDirection": "desc",
                                                "otherBucket": False,
                                                "missingBucket": False,
                                                "parentFormat": {"id": "terms"}
                                            }
                                        },
                                        "col2": {
                                            "label": "Count",
                                            "dataType": "number",
                                            "operationType": "count",
                                            "isBucketed": False,
                                            "scale": "ratio",
                                            "sourceField": "___records___",
                                            "params": {"emptyAsNull": True}
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "visualization": {
                        "shape": "donut",
                        "layers": [{
                            "layerId": "layer1",
                            "primaryGroups": ["col1"],
                            "metrics": ["col2"],
                            "numberDisplay": "percent",
                            "categoryDisplay": "default",
                            "legendDisplay": "default",
                            "nestedLegend": False,
                            "layerType": "data"
                        }]
                    },
                    "query": {"query": "event.dataset: \"trivy.vulnerability\"", "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    })

    # Issues Timeline
    panels.append({
        "version": "8.8.0",
        "type": "lens",
        "gridData": {"x": 24, "y": 8, "w": 24, "h": 15, "i": "timeline"},
        "panelIndex": "timeline",
        "embeddableConfig": {
            "attributes": {
                "title": "Security Issues Over Time",
                "type": "lens",
                "visualizationType": "lnsXY",
                "state": {
                    "datasourceStates": {
                        "formBased": {
                            "layers": {
                                "layer1": {
                                    "columnOrder": ["col1", "col3", "col2"],
                                    "columns": {
                                        "col1": {
                                            "label": "@timestamp",
                                            "dataType": "date",
                                            "operationType": "date_histogram",
                                            "sourceField": "@timestamp",
                                            "isBucketed": True,
                                            "scale": "interval",
                                            "params": {
                                                "interval": "auto",
                                                "includeEmptyRows": True,
                                                "dropPartials": False
                                            }
                                        },
                                        "col2": {
                                            "label": "Count",
                                            "dataType": "number",
                                            "operationType": "count",
                                            "isBucketed": False,
                                            "scale": "ratio",
                                            "sourceField": "___records___",
                                            "params": {"emptyAsNull": True}
                                        },
                                        "col3": {
                                            "label": "Report Type",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "event.dataset",
                                            "isBucketed": True,
                                            "params": {
                                                "size": 10,
                                                "orderBy": {"type": "column", "columnId": "col2"},
                                                "orderDirection": "desc",
                                                "otherBucket": False,
                                                "missingBucket": False,
                                                "parentFormat": {"id": "terms"}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "visualization": {
                        "legend": {"isVisible": True, "position": "right"},
                        "valueLabels": "hide",
                        "fittingFunction": "Linear",
                        "axisTitlesVisibilitySettings": {"x": True, "yLeft": True, "yRight": True},
                        "tickLabelsVisibilitySettings": {"x": True, "yLeft": True, "yRight": True},
                        "gridlinesVisibilitySettings": {"x": True, "yLeft": True, "yRight": True},
                        "preferredSeriesType": "area_stacked",
                        "layers": [{
                            "layerId": "layer1",
                            "accessors": ["col2"],
                            "position": "top",
                            "seriesType": "area_stacked",
                            "showGridlines": False,
                            "layerType": "data",
                            "xAccessor": "col1",
                            "splitAccessor": "col3"
                        }]
                    },
                    "query": {"query": "", "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    })

    # ROW 3: Top Vulnerable Namespaces
    panels.append({
        "version": "8.8.0",
        "type": "lens",
        "gridData": {"x": 0, "y": 23, "w": 48, "h": 15, "i": "namespaces"},
        "panelIndex": "namespaces",
        "embeddableConfig": {
            "attributes": {
                "title": "Top Vulnerable Namespaces",
                "type": "lens",
                "visualizationType": "lnsXY",
                "state": {
                    "datasourceStates": {
                        "formBased": {
                            "layers": {
                                "layer1": {
                                    "columnOrder": ["col1", "col2"],
                                    "columns": {
                                        "col1": {
                                            "label": "Namespace",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "kubernetes.namespace",
                                            "isBucketed": True,
                                            "params": {
                                                "size": 15,
                                                "orderBy": {"type": "column", "columnId": "col2"},
                                                "orderDirection": "desc",
                                                "otherBucket": False,
                                                "missingBucket": False,
                                                "parentFormat": {"id": "terms"}
                                            }
                                        },
                                        "col2": {
                                            "label": "Issues",
                                            "dataType": "number",
                                            "operationType": "count",
                                            "isBucketed": False,
                                            "scale": "ratio",
                                            "sourceField": "___records___",
                                            "params": {"emptyAsNull": True}
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "visualization": {
                        "legend": {"isVisible": True, "position": "right"},
                        "valueLabels": "hide",
                        "fittingFunction": "Linear",
                        "axisTitlesVisibilitySettings": {"x": True, "yLeft": True, "yRight": True},
                        "tickLabelsVisibilitySettings": {"x": True, "yLeft": True, "yRight": True},
                        "gridlinesVisibilitySettings": {"x": True, "yLeft": True, "yRight": True},
                        "preferredSeriesType": "bar_horizontal",
                        "layers": [{
                            "layerId": "layer1",
                            "accessors": ["col2"],
                            "position": "top",
                            "seriesType": "bar_horizontal",
                            "showGridlines": False,
                            "layerType": "data",
                            "xAccessor": "col1"
                        }]
                    },
                    "query": {"query": "event.dataset: \"trivy.vulnerability\"", "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    })

    # ROW 4: Vulnerability Details Table (similar to frontend tabs)
    panels.append({
        "version": "8.8.0",
        "type": "lens",
        "gridData": {"x": 0, "y": 38, "w": 48, "h": 20, "i": "vuln-table"},
        "panelIndex": "vuln-table",
        "embeddableConfig": {
            "attributes": {
                "title": "Vulnerability Reports",
                "type": "lens",
                "visualizationType": "lnsDatatable",
                "state": {
                    "datasourceStates": {
                        "formBased": {
                            "layers": {
                                "layer1": {
                                    "columnOrder": ["col1", "col2", "col3", "col4", "col5"],
                                    "columns": {
                                        "col1": {
                                            "label": "Namespace",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "kubernetes.namespace",
                                            "isBucketed": True,
                                            "params": {"size": 100}
                                        },
                                        "col2": {
                                            "label": "Pod",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "kubernetes.pod.name",
                                            "isBucketed": True,
                                            "params": {"size": 100}
                                        },
                                        "col3": {
                                            "label": "CVE ID",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "vulnerability.id",
                                            "isBucketed": True,
                                            "params": {"size": 100}
                                        },
                                        "col4": {
                                            "label": "Severity",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "vulnerability.severity",
                                            "isBucketed": True,
                                            "params": {"size": 10}
                                        },
                                        "col5": {
                                            "label": "Count",
                                            "dataType": "number",
                                            "operationType": "count",
                                            "isBucketed": False,
                                            "scale": "ratio",
                                            "sourceField": "___records___"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "visualization": {
                        "layerId": "layer1",
                        "layerType": "data",
                        "columns": [
                            {"columnId": "col1"},
                            {"columnId": "col2"},
                            {"columnId": "col3"},
                            {"columnId": "col4"},
                            {"columnId": "col5"}
                        ]
                    },
                    "query": {"query": "event.dataset: \"trivy.vulnerability\"", "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    })

    # ROW 5: Config Audit Table
    panels.append({
        "version": "8.8.0",
        "type": "lens",
        "gridData": {"x": 0, "y": 58, "w": 48, "h": 20, "i": "config-table"},
        "panelIndex": "config-table",
        "embeddableConfig": {
            "attributes": {
                "title": "Configuration Audit Reports",
                "type": "lens",
                "visualizationType": "lnsDatatable",
                "state": {
                    "datasourceStates": {
                        "formBased": {
                            "layers": {
                                "layer1": {
                                    "columnOrder": ["col1", "col2", "col3", "col4", "col5"],
                                    "columns": {
                                        "col1": {
                                            "label": "Namespace",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "kubernetes.namespace",
                                            "isBucketed": True,
                                            "params": {"size": 100}
                                        },
                                        "col2": {
                                            "label": "Pod",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "kubernetes.pod.name",
                                            "isBucketed": True,
                                            "params": {"size": 100}
                                        },
                                        "col3": {
                                            "label": "Check ID",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "metadata.check_id",
                                            "isBucketed": True,
                                            "params": {"size": 100}
                                        },
                                        "col4": {
                                            "label": "Category",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "metadata.category",
                                            "isBucketed": True,
                                            "params": {"size": 50}
                                        },
                                        "col5": {
                                            "label": "Count",
                                            "dataType": "number",
                                            "operationType": "count",
                                            "isBucketed": False,
                                            "scale": "ratio",
                                            "sourceField": "___records___"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "visualization": {
                        "layerId": "layer1",
                        "layerType": "data",
                        "columns": [
                            {"columnId": "col1"},
                            {"columnId": "col2"},
                            {"columnId": "col3"},
                            {"columnId": "col4"},
                            {"columnId": "col5"}
                        ]
                    },
                    "query": {"query": "event.dataset: \"trivy.config-audit\"", "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    })

    # ROW 6: Secrets Table
    panels.append({
        "version": "8.8.0",
        "type": "lens",
        "gridData": {"x": 0, "y": 78, "w": 48, "h": 20, "i": "secrets-table"},
        "panelIndex": "secrets-table",
        "embeddableConfig": {
            "attributes": {
                "title": "Exposed Secrets Reports",
                "type": "lens",
                "visualizationType": "lnsDatatable",
                "state": {
                    "datasourceStates": {
                        "formBased": {
                            "layers": {
                                "layer1": {
                                    "columnOrder": ["col1", "col2", "col3", "col4", "col5"],
                                    "columns": {
                                        "col1": {
                                            "label": "Namespace",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "kubernetes.namespace",
                                            "isBucketed": True,
                                            "params": {"size": 100}
                                        },
                                        "col2": {
                                            "label": "Pod",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "kubernetes.pod.name",
                                            "isBucketed": True,
                                            "params": {"size": 100}
                                        },
                                        "col3": {
                                            "label": "Rule ID",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "metadata.rule_id",
                                            "isBucketed": True,
                                            "params": {"size": 100}
                                        },
                                        "col4": {
                                            "label": "Category",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "metadata.category",
                                            "isBucketed": True,
                                            "params": {"size": 50}
                                        },
                                        "col5": {
                                            "label": "Count",
                                            "dataType": "number",
                                            "operationType": "count",
                                            "isBucketed": False,
                                            "scale": "ratio",
                                            "sourceField": "___records___"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "visualization": {
                        "layerId": "layer1",
                        "layerType": "data",
                        "columns": [
                            {"columnId": "col1"},
                            {"columnId": "col2"},
                            {"columnId": "col3"},
                            {"columnId": "col4"},
                            {"columnId": "col5"}
                        ]
                    },
                    "query": {"query": "event.dataset: \"trivy.exposed-secret\"", "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    })

    # ROW 7: RBAC + Infra Tables side by side
    panels.append({
        "version": "8.8.0",
        "type": "lens",
        "gridData": {"x": 0, "y": 98, "w": 24, "h": 20, "i": "rbac-table"},
        "panelIndex": "rbac-table",
        "embeddableConfig": {
            "attributes": {
                "title": "RBAC Assessment Reports",
                "type": "lens",
                "visualizationType": "lnsDatatable",
                "state": {
                    "datasourceStates": {
                        "formBased": {
                            "layers": {
                                "layer1": {
                                    "columnOrder": ["col1", "col2", "col3", "col4"],
                                    "columns": {
                                        "col1": {
                                            "label": "Namespace",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "kubernetes.namespace",
                                            "isBucketed": True,
                                            "params": {"size": 100}
                                        },
                                        "col2": {
                                            "label": "Check ID",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "metadata.check_id",
                                            "isBucketed": True,
                                            "params": {"size": 100}
                                        },
                                        "col3": {
                                            "label": "Title",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "metadata.title",
                                            "isBucketed": True,
                                            "params": {"size": 100}
                                        },
                                        "col4": {
                                            "label": "Count",
                                            "dataType": "number",
                                            "operationType": "count",
                                            "isBucketed": False,
                                            "scale": "ratio",
                                            "sourceField": "___records___"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "visualization": {
                        "layerId": "layer1",
                        "layerType": "data",
                        "columns": [
                            {"columnId": "col1"},
                            {"columnId": "col2"},
                            {"columnId": "col3"},
                            {"columnId": "col4"}
                        ]
                    },
                    "query": {"query": "event.dataset: \"trivy.rbac-assessment\"", "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    })

    panels.append({
        "version": "8.8.0",
        "type": "lens",
        "gridData": {"x": 24, "y": 98, "w": 24, "h": 20, "i": "infra-table"},
        "panelIndex": "infra-table",
        "embeddableConfig": {
            "attributes": {
                "title": "Infrastructure Assessment Reports",
                "type": "lens",
                "visualizationType": "lnsDatatable",
                "state": {
                    "datasourceStates": {
                        "formBased": {
                            "layers": {
                                "layer1": {
                                    "columnOrder": ["col1", "col2", "col3"],
                                    "columns": {
                                        "col1": {
                                            "label": "Check ID",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "metadata.check_id",
                                            "isBucketed": True,
                                            "params": {"size": 100}
                                        },
                                        "col2": {
                                            "label": "Title",
                                            "dataType": "string",
                                            "operationType": "terms",
                                            "scale": "ordinal",
                                            "sourceField": "metadata.title",
                                            "isBucketed": True,
                                            "params": {"size": 100}
                                        },
                                        "col3": {
                                            "label": "Count",
                                            "dataType": "number",
                                            "operationType": "count",
                                            "isBucketed": False,
                                            "scale": "ratio",
                                            "sourceField": "___records___"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "visualization": {
                        "layerId": "layer1",
                        "layerType": "data",
                        "columns": [
                            {"columnId": "col1"},
                            {"columnId": "col2"},
                            {"columnId": "col3"}
                        ]
                    },
                    "query": {"query": "event.dataset: \"trivy.infra-assessment\"", "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    })

    # Create dashboard object
    dashboard = {
        "attributes": {
            "title": "Trivy - Unified Security Dashboard",
            "description": "Complete Trivy security dashboard with all report types - mimics frontend application",
            "panelsJSON": json.dumps(panels),
            "optionsJSON": json.dumps({
                "useMargins": True,
                "syncColors": False,
                "syncCursor": True,
                "syncTooltips": False,
                "hidePanelTitles": False
            }),
            "timeRestore": True,
            "timeFrom": "now-7d",
            "timeTo": "now",
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": json.dumps({
                    "query": {"query": "", "language": "kuery"},
                    "filter": []
                })
            },
            "controlGroupInput": {
                "chainingSystem": "HIERARCHICAL",
                "controlStyle": "oneLine",
                "ignoreParentSettingsJSON": json.dumps({
                    "ignoreFilters": False,
                    "ignoreQuery": False,
                    "ignoreTimerange": False,
                    "ignoreValidations": False
                }),
                "panelsJSON": json.dumps({})
            },
            "version": 1
        },
        "id": "trivy-unified-dashboard",
        "type": "dashboard",
        "references": [
            {"id": "trivy-reports", "name": f"panel-{i}:indexpattern-datasource-layer-layer1", "type": "index-pattern"}
            for i in range(len(panels))
        ],
        "managed": False,
        "coreMigrationVersion": "8.8.0",
        "typeMigrationVersion": "8.8.0",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "updated_at": datetime.utcnow().isoformat() + "Z",
        "version": "WzEsMV0="
    }

    # Export metadata
    export_metadata = {
        "excludedObjects": [],
        "excludedObjectsCount": 0,
        "exportedCount": 2,
        "missingRefCount": 0,
        "missingReferences": []
    }

    return [index_pattern, dashboard, export_metadata]

def main():
    """Generate the unified dashboard and save to file"""
    objects = create_unified_dashboard()

    output_file = "trivy-unified-dashboard.ndjson"
    with open(output_file, 'w') as f:
        for obj in objects:
            f.write(json.dumps(obj) + '\n')

    print(f"✅ Generated unified dashboard: {output_file}")
    print("\nTo import:")
    print("1. Open Kibana > Stack Management > Saved Objects")
    print("2. Click 'Import'")
    print(f"3. Select '{output_file}'")
    print("4. Click 'Import'")
    print("\nThe dashboard includes:")
    print("  - Summary metrics for all report types")
    print("  - Vulnerabilities by severity (pie chart)")
    print("  - Security issues timeline")
    print("  - Top vulnerable namespaces")
    print("  - Detailed tables for each report type")

if __name__ == "__main__":
    main()
