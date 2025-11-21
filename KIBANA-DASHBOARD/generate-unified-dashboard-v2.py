#!/usr/bin/env python3
"""
Generate a unified Trivy dashboard (v2) with simplified, working tables.
This version uses simpler aggregations that are guaranteed to work.
"""

import json
from datetime import datetime

def create_simple_table(panel_id, title, query, grid_x, grid_y, grid_w, grid_h):
    """Create a simple table showing the most important fields"""

    # For vulnerabilities
    if "vulnerability" in query:
        columns = {
            "col1": {
                "label": "Namespace",
                "dataType": "string",
                "operationType": "terms",
                "scale": "ordinal",
                "sourceField": "kubernetes.namespace",
                "isBucketed": True,
                "params": {
                    "size": 50,
                    "orderBy": {"type": "column", "columnId": "col3"},
                    "orderDirection": "desc"
                }
            },
            "col2": {
                "label": "Severity",
                "dataType": "string",
                "operationType": "terms",
                "scale": "ordinal",
                "sourceField": "vulnerability.severity",
                "isBucketed": True,
                "params": {
                    "size": 10,
                    "orderBy": {"type": "column", "columnId": "col3"},
                    "orderDirection": "desc"
                }
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
    # For other report types (config, secrets, rbac, infra)
    else:
        columns = {
            "col1": {
                "label": "Namespace",
                "dataType": "string",
                "operationType": "terms",
                "scale": "ordinal",
                "sourceField": "kubernetes.namespace",
                "isBucketed": True,
                "params": {
                    "size": 50,
                    "orderBy": {"type": "column", "columnId": "col2"},
                    "orderDirection": "desc"
                }
            },
            "col2": {
                "label": "Count",
                "dataType": "number",
                "operationType": "count",
                "isBucketed": False,
                "scale": "ratio",
                "sourceField": "___records___"
            }
        }

    return {
        "version": "8.8.0",
        "type": "lens",
        "gridData": {"x": grid_x, "y": grid_y, "w": grid_w, "h": grid_h, "i": panel_id},
        "panelIndex": panel_id,
        "embeddableConfig": {
            "attributes": {
                "title": title,
                "type": "lens",
                "visualizationType": "lnsDatatable",
                "state": {
                    "datasourceStates": {
                        "formBased": {
                            "layers": {
                                "layer1": {
                                    "columnOrder": list(columns.keys()),
                                    "columns": columns
                                }
                            }
                        }
                    },
                    "visualization": {
                        "layerId": "layer1",
                        "layerType": "data",
                        "columns": [{"columnId": col_id} for col_id in columns.keys()]
                    },
                    "query": {"query": query, "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    }

def create_severity_breakdown_table(panel_id, title, query, grid_x, grid_y, grid_w, grid_h, severity_field="vulnerability.severity"):
    """Create a table with severity breakdown"""

    columns = {
        "col1": {
            "label": "Severity",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": severity_field,
            "isBucketed": True,
            "params": {
                "size": 10,
                "orderBy": {"type": "column", "columnId": "col2"},
                "orderDirection": "desc",
                "otherBucket": False,
                "missingBucket": False
            }
        },
        "col2": {
            "label": "Count",
            "dataType": "number",
            "operationType": "count",
            "isBucketed": False,
            "scale": "ratio",
            "sourceField": "___records___"
        }
    }

    return {
        "version": "8.8.0",
        "type": "lens",
        "gridData": {"x": grid_x, "y": grid_y, "w": grid_w, "h": grid_h, "i": panel_id},
        "panelIndex": panel_id,
        "embeddableConfig": {
            "attributes": {
                "title": title,
                "type": "lens",
                "visualizationType": "lnsDatatable",
                "state": {
                    "datasourceStates": {
                        "formBased": {
                            "layers": {
                                "layer1": {
                                    "columnOrder": list(columns.keys()),
                                    "columns": columns
                                }
                            }
                        }
                    },
                    "visualization": {
                        "layerId": "layer1",
                        "layerType": "data",
                        "columns": [{"columnId": col_id} for col_id in columns.keys()]
                    },
                    "query": {"query": query, "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    }

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

    # Dashboard panels
    panels = []

    # ROW 1: Summary Cards (Metric visualizations)
    metric_configs = [
        ("metric-vuln", "Total Vulnerabilities", 'event.dataset: "trivy.vulnerability"', 0, 0),
        ("metric-config", "Config Issues", 'event.dataset: "trivy.config-audit"', 8, 0),
        ("metric-secrets", "Exposed Secrets", 'event.dataset: "trivy.exposed-secret"', 16, 0),
        ("metric-rbac", "RBAC Issues", 'event.dataset: "trivy.rbac-assessment"', 24, 0),
        ("metric-infra", "Infra Issues", 'event.dataset: "trivy.infra-assessment"', 32, 0),
        ("metric-total", "Total Reports", "", 40, 0)
    ]

    for panel_id, title, query, x, y in metric_configs:
        panels.append({
            "version": "8.8.0",
            "type": "lens",
            "gridData": {"x": x, "y": y, "w": 8, "h": 8, "i": panel_id},
            "panelIndex": panel_id,
            "embeddableConfig": {
                "attributes": {
                    "title": title,
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
                                                "label": title,
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
                        "query": {"query": query, "language": "kuery"},
                        "filters": []
                    },
                    "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
                }
            }
        })

    # ROW 2: Charts
    # Vulnerabilities by Severity (Pie Chart)
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
                    "query": {"query": 'event.dataset: "trivy.vulnerability"', "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    })

    # Security Issues Timeline
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
                    "query": {"query": 'event.dataset: "trivy.vulnerability"', "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    })

    # ROW 4-8: Simplified Tables
    y_offset = 38

    # Vulnerability Reports Table
    panels.append(create_simple_table(
        "vuln-table",
        "Vulnerability Reports by Namespace & Severity",
        'event.dataset: "trivy.vulnerability"',
        0, y_offset, 48, 15
    ))
    y_offset += 15

    # Config Audit Table
    panels.append(create_simple_table(
        "config-table",
        "Config Audit Reports by Namespace",
        'event.dataset: "trivy.config-audit"',
        0, y_offset, 24, 15
    ))

    # Config Severity Breakdown
    panels.append(create_severity_breakdown_table(
        "config-severity",
        "Config Audit Severity Breakdown",
        'event.dataset: "trivy.config-audit"',
        24, y_offset, 24, 15,
        severity_field="tags"
    ))
    y_offset += 15

    # Secrets Table
    panels.append(create_simple_table(
        "secrets-table",
        "Exposed Secrets by Namespace",
        'event.dataset: "trivy.exposed-secret"',
        0, y_offset, 24, 15
    ))

    # Secrets Severity Breakdown
    panels.append(create_severity_breakdown_table(
        "secrets-severity",
        "Secrets Severity Breakdown",
        'event.dataset: "trivy.exposed-secret"',
        24, y_offset, 24, 15,
        severity_field="tags"
    ))
    y_offset += 15

    # RBAC Table
    panels.append(create_simple_table(
        "rbac-table",
        "RBAC Assessment by Namespace",
        'event.dataset: "trivy.rbac-assessment"',
        0, y_offset, 24, 15
    ))

    # Infra Table
    panels.append(create_simple_table(
        "infra-table",
        "Infrastructure Assessment",
        'event.dataset: "trivy.infra-assessment"',
        24, y_offset, 24, 15
    ))

    # Create dashboard object
    dashboard = {
        "attributes": {
            "title": "Trivy - Unified Security Dashboard",
            "description": "Complete Trivy security dashboard with all report types - simplified tables that work!",
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

    print(f"✅ Generated unified dashboard (v2): {output_file}")
    print("\n🔧 Changes in v2:")
    print("  - Simplified tables with only 2-3 columns")
    print("  - Tables show: Namespace + Count (or Namespace + Severity + Count for vulns)")
    print("  - Removed complex multi-field aggregations that may fail")
    print("  - Added severity breakdown tables for config/secrets")
    print("\nTo import:")
    print("1. Open Kibana > Stack Management > Saved Objects")
    print("2. Click 'Import'")
    print(f"3. Select '{output_file}'")
    print("4. If dashboard exists, choose 'Overwrite' or create new")
    print("5. Click 'Import'")

if __name__ == "__main__":
    main()
