#!/usr/bin/env python3
"""
Generate a unified Trivy dashboard (v4 - Frontend Style).
This version mimics the frontend application exactly:
- Top pods by severity (not namespace)
- Columns: Pod + Namespace + Critical + High + Medium + Low counts
- Sorted by Critical descending
- Namespace filter at the top
"""

import json
from datetime import datetime

def create_pod_severity_table(panel_id, title, query, grid_x, grid_y, grid_w, grid_h,
                               show_namespace=True, resource_field="kubernetes.pod.name"):
    """
    Create a table showing pods/resources with severity breakdown.
    Similar to frontend tables with Critical, High, Medium, Low columns.
    """

    columns = {}
    col_order = []

    # Pod/Resource name
    col_order.append("col_pod")
    columns["col_pod"] = {
        "label": "Pod" if resource_field == "kubernetes.pod.name" else "Resource",
        "dataType": "string",
        "operationType": "terms",
        "scale": "ordinal",
        "sourceField": resource_field,
        "isBucketed": True,
        "params": {
            "size": 100,
            "orderBy": {"type": "column", "columnId": "col_critical"},
            "orderDirection": "desc",
            "otherBucket": False,
            "missingBucket": False
        }
    }

    # Namespace
    if show_namespace:
        col_order.append("col_namespace")
        columns["col_namespace"] = {
            "label": "Namespace",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "kubernetes.namespace",
            "isBucketed": True,
            "params": {
                "size": 100,
                "orderBy": {"type": "column", "columnId": "col_critical"},
                "orderDirection": "desc",
                "otherBucket": False,
                "missingBucket": False
            }
        }

    # Critical count (filtered metric)
    col_order.append("col_critical")
    columns["col_critical"] = {
        "label": "Critical",
        "dataType": "number",
        "operationType": "count",
        "isBucketed": False,
        "scale": "ratio",
        "sourceField": "___records___",
        "filter": {
            "query": "tags: critical OR vulnerability.severity: critical",
            "language": "kuery"
        }
    }

    # High count
    col_order.append("col_high")
    columns["col_high"] = {
        "label": "High",
        "dataType": "number",
        "operationType": "count",
        "isBucketed": False,
        "scale": "ratio",
        "sourceField": "___records___",
        "filter": {
            "query": "tags: high OR vulnerability.severity: high",
            "language": "kuery"
        }
    }

    # Medium count
    col_order.append("col_medium")
    columns["col_medium"] = {
        "label": "Medium",
        "dataType": "number",
        "operationType": "count",
        "isBucketed": False,
        "scale": "ratio",
        "sourceField": "___records___",
        "filter": {
            "query": "tags: medium OR vulnerability.severity: medium",
            "language": "kuery"
        }
    }

    # Low count
    col_order.append("col_low")
    columns["col_low"] = {
        "label": "Low",
        "dataType": "number",
        "operationType": "count",
        "isBucketed": False,
        "scale": "ratio",
        "sourceField": "___records___",
        "filter": {
            "query": "tags: low OR vulnerability.severity: low",
            "language": "kuery"
        }
    }

    # Total count
    col_order.append("col_total")
    columns["col_total"] = {
        "label": "Total",
        "dataType": "number",
        "operationType": "count",
        "isBucketed": False,
        "scale": "ratio",
        "sourceField": "___records___"
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
                                    "columnOrder": col_order,
                                    "columns": columns
                                }
                            }
                        }
                    },
                    "visualization": {
                        "layerId": "layer1",
                        "layerType": "data",
                        "columns": [{"columnId": col_id} for col_id in col_order]
                    },
                    "query": {"query": query, "language": "kuery"},
                    "filters": []
                },
                "references": [{"type": "index-pattern", "id": "trivy-reports", "name": "indexpattern-datasource-layer-layer1"}]
            }
        }
    }

def create_unified_dashboard():
    """Create a unified dashboard matching the frontend application"""

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

    panels = []

    # ROW 1: Summary Cards
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

    # Report Tables (Frontend Style - Top Pods by Critical)
    y_offset = 38

    # Vulnerability Reports
    panels.append(create_pod_severity_table(
        "vuln-table",
        "Vulnerability Reports - Top Pods by Critical",
        'event.dataset: "trivy.vulnerability"',
        0, y_offset, 48, 18,
        show_namespace=True,
        resource_field="kubernetes.pod.name"
    ))
    y_offset += 18

    # Config Audit Reports
    panels.append(create_pod_severity_table(
        "config-table",
        "Config Audit Reports - Top Pods by Critical",
        'event.dataset: "trivy.config-audit"',
        0, y_offset, 48, 15,
        show_namespace=True,
        resource_field="kubernetes.pod.name"
    ))
    y_offset += 15

    # Exposed Secrets Reports
    panels.append(create_pod_severity_table(
        "secrets-table",
        "Exposed Secrets Reports - Top Pods by Critical",
        'event.dataset: "trivy.exposed-secret"',
        0, y_offset, 48, 15,
        show_namespace=True,
        resource_field="kubernetes.pod.name"
    ))
    y_offset += 15

    # RBAC Reports
    panels.append(create_pod_severity_table(
        "rbac-table",
        "RBAC Assessment Reports - Top Resources by Critical",
        'event.dataset: "trivy.rbac-assessment"',
        0, y_offset, 24, 15,
        show_namespace=True,
        resource_field="kubernetes.pod.name"
    ))

    # Infra Reports
    panels.append(create_pod_severity_table(
        "infra-table",
        "Infrastructure Assessment Reports - Top Resources by Critical",
        'event.dataset: "trivy.infra-assessment"',
        24, y_offset, 24, 15,
        show_namespace=False,
        resource_field="kubernetes.pod.name"
    ))

    # Create Controls for Namespace Filter
    controls = {
        "control_namespace": {
            "order": 0,
            "width": "medium",
            "grow": True,
            "type": "optionsListControl",
            "explicitInput": {
                "id": "control_namespace",
                "fieldName": "kubernetes.namespace",
                "title": "Namespace",
                "selectedOptions": [],
                "existsSelected": False,
                "exclude": False,
                "placeholder": "All namespaces"
            }
        }
    }

    # Dashboard object
    dashboard = {
        "attributes": {
            "title": "Trivy - Unified Security Dashboard",
            "description": "Complete Trivy security dashboard - Frontend style with top pods by severity",
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
                "panelsJSON": json.dumps(controls)
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

    print(f"✅ Generated unified dashboard (v4 - Frontend Style): {output_file}")
    print("\n🎯 Features:")
    print("  - Namespace filter at the top of the dashboard")
    print("  - Tables show TOP PODS (not namespaces)")
    print("  - Columns: Pod + Namespace + Critical + High + Medium + Low + Total")
    print("  - Sorted by CRITICAL count (descending)")
    print("  - Just like the frontend application!")
    print("\nTo import:")
    print("1. Open Kibana > Stack Management > Saved Objects")
    print("2. Click 'Import'")
    print(f"3. Select '{output_file}'")
    print("4. Choose 'Overwrite' if dashboard already exists")
    print("5. Click 'Import'")
    print("\n📊 Tables included:")
    print("  - Vulnerability Reports (top pods by critical)")
    print("  - Config Audit Reports (top pods by critical)")
    print("  - Exposed Secrets Reports (top pods by critical)")
    print("  - RBAC Assessment Reports (top resources)")
    print("  - Infrastructure Assessment Reports (top resources)")

if __name__ == "__main__":
    main()
