#!/usr/bin/env python3
import json

def create_dashboard_export(dashboard_id, title, description, panels, time_from="now-7d"):
    """Create a Kibana dashboard NDJSON export"""

    # Build references from panels
    references = []
    for i, panel in enumerate(panels, 1):
        references.append({
            "id": "trivy-reports",
            "name": f"panel-{i}:indexpattern-datasource-layer-layer1",
            "type": "index-pattern"
        })

    dashboard = {
        "attributes": {
            "controlGroupInput": {
                "chainingSystem": "HIERARCHICAL",
                "controlStyle": "oneLine",
                "ignoreParentSettingsJSON": json.dumps({
                    "ignoreFilters": False,
                    "ignoreQuery": False,
                    "ignoreTimerange": False,
                    "ignoreValidations": False
                }),
                "panelsJSON": "{}"
            },
            "description": description,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": json.dumps({
                    "query": {"query": "", "language": "kuery"},
                    "filter": []
                })
            },
            "optionsJSON": json.dumps({
                "useMargins": True,
                "syncColors": False,
                "syncCursor": True,
                "syncTooltips": False,
                "hidePanelTitles": False
            }),
            "panelsJSON": json.dumps(panels),
            "timeRestore": True,
            "timeFrom": time_from,
            "timeTo": "now",
            "title": title,
            "version": 1
        },
        "coreMigrationVersion": "8.8.0",
        "created_at": "2025-11-19T18:30:00.000Z",
        "id": dashboard_id,
        "managed": False,
        "references": references,
        "type": "dashboard",
        "typeMigrationVersion": "8.8.0",
        "updated_at": "2025-11-19T18:30:00.000Z",
        "version": "WzEsMV0="
    }

    summary = {
        "excludedObjects": [],
        "excludedObjectsCount": 0,
        "exportedCount": 1,
        "missingRefCount": 0,
        "missingReferences": []
    }

    return json.dumps(dashboard) + "\n" + json.dumps(summary) + "\n"


def create_lens_panel(panel_id, x, y, w, h, title, vis_type, layer_config, query_filter=""):
    """Create a Lens visualization panel"""
    return {
        "version": "8.8.0",
        "type": "lens",
        "gridData": {"x": x, "y": y, "w": w, "h": h, "i": f"panel-{panel_id}"},
        "panelIndex": f"panel-{panel_id}",
        "embeddableConfig": {
            "attributes": {
                "title": title,
                "type": "lens",
                "visualizationType": vis_type,
                "state": layer_config,
                "references": [{
                    "type": "index-pattern",
                    "id": "trivy-reports",
                    "name": "indexpattern-datasource-layer-layer1"
                }]
            },
            "enhancements": {}
        },
        "title": title
    }


# Dashboard 1: Security Overview
def create_security_overview():
    # Panel 1: Vulnerabilities by Severity (Donut)
    panel1_state = {
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
        "query": {"query": "event.dataset : \"trivy.vulnerability\"", "language": "kuery"},
        "filters": []
    }

    # Panel 2: Security Issues Over Time (Area Stacked)
    panel2_state = {
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
                                "label": "Dataset",
                                "dataType": "string",
                                "operationType": "terms",
                                "scale": "ordinal",
                                "sourceField": "event.dataset",
                                "isBucketed": True,
                                "params": {
                                    "size": 5,
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
    }

    # Panel 3: Top Vulnerable Namespaces (Horizontal Bar)
    panel3_state = {
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
        "query": {"query": "event.dataset : \"trivy.vulnerability\"", "language": "kuery"},
        "filters": []
    }

    panels = [
        create_lens_panel(1, 0, 0, 24, 15, "Vulnerabilities by Severity", "lnsPie", panel1_state),
        create_lens_panel(2, 24, 0, 24, 15, "Security Issues Over Time", "lnsXY", panel2_state),
        create_lens_panel(3, 0, 15, 48, 15, "Top Vulnerable Namespaces", "lnsXY", panel3_state)
    ]

    return create_dashboard_export(
        "trivy-security-overview",
        "Trivy Security Overview",
        "Overview dashboard for Trivy security reports",
        panels
    )


# Dashboard 2: Vulnerability Deep Dive
def create_vulnerability_deep_dive():
    # Panel 1: Top CVEs
    panel1_state = {
        "datasourceStates": {
            "formBased": {
                "layers": {
                    "layer1": {
                        "columnOrder": ["col1", "col2"],
                        "columns": {
                            "col1": {
                                "label": "Top 15 CVEs",
                                "dataType": "string",
                                "operationType": "terms",
                                "scale": "ordinal",
                                "sourceField": "vulnerability.id",
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
        "query": {"query": "event.dataset : \"trivy.vulnerability\"", "language": "kuery"},
        "filters": []
    }

    # Panel 2: Vulnerabilities Over Time by Severity
    panel2_state = {
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
        "query": {"query": "event.dataset : \"trivy.vulnerability\"", "language": "kuery"},
        "filters": []
    }

    # Panel 3: Vulnerable Resources by Namespace
    panel3_state = {
        "datasourceStates": {
            "formBased": {
                "layers": {
                    "layer1": {
                        "columnOrder": ["col1", "col3", "col2"],
                        "columns": {
                            "col1": {
                                "label": "Namespace",
                                "dataType": "string",
                                "operationType": "terms",
                                "scale": "ordinal",
                                "sourceField": "kubernetes.namespace",
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
                            },
                            "col3": {
                                "label": "Severity",
                                "dataType": "string",
                                "operationType": "terms",
                                "scale": "ordinal",
                                "sourceField": "vulnerability.severity",
                                "isBucketed": True,
                                "params": {
                                    "size": 5,
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
            "preferredSeriesType": "bar_horizontal_stacked",
            "layers": [{
                "layerId": "layer1",
                "accessors": ["col2"],
                "position": "top",
                "seriesType": "bar_horizontal_stacked",
                "showGridlines": False,
                "layerType": "data",
                "xAccessor": "col1",
                "splitAccessor": "col3"
            }]
        },
        "query": {"query": "event.dataset : \"trivy.vulnerability\"", "language": "kuery"},
        "filters": []
    }

    panels = [
        create_lens_panel(1, 0, 0, 24, 20, "Top CVEs", "lnsXY", panel1_state),
        create_lens_panel(2, 24, 0, 24, 20, "Vulnerabilities Over Time by Severity", "lnsXY", panel2_state),
        create_lens_panel(3, 0, 20, 48, 15, "Vulnerable Resources by Namespace", "lnsXY", panel3_state)
    ]

    return create_dashboard_export(
        "trivy-vulnerability-deep-dive",
        "Trivy Vulnerability Deep Dive",
        "Detailed vulnerability analysis with CVE and severity information",
        panels
    )


# Dashboard 3: Compliance Dashboard
def create_compliance_dashboard():
    # Panel 1: All Security Issues Timeline
    panel1_state = {
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
                                "label": "Dataset",
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
    }

    # Panel 2: Config Audit by Category
    panel2_state = {
        "datasourceStates": {
            "formBased": {
                "layers": {
                    "layer1": {
                        "columnOrder": ["col1", "col2"],
                        "columns": {
                            "col1": {
                                "label": "Category",
                                "dataType": "string",
                                "operationType": "terms",
                                "scale": "ordinal",
                                "sourceField": "metadata.category",
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
        "query": {"query": "event.dataset : \"trivy.config-audit\"", "language": "kuery"},
        "filters": []
    }

    # Panel 3: Config Issues by Severity
    panel3_state = {
        "datasourceStates": {
            "formBased": {
                "layers": {
                    "layer1": {
                        "columnOrder": ["col1", "col2"],
                        "columns": {
                            "col1": {
                                "label": "Severity",
                                "dataType": "number",
                                "operationType": "terms",
                                "scale": "ordinal",
                                "sourceField": "event.severity",
                                "isBucketed": True,
                                "params": {
                                    "size": 5,
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
            "legend": {"isVisible": True, "position": "right"},
            "valueLabels": "hide",
            "fittingFunction": "Linear",
            "axisTitlesVisibilitySettings": {"x": True, "yLeft": True, "yRight": True},
            "tickLabelsVisibilitySettings": {"x": True, "yLeft": True, "yRight": True},
            "gridlinesVisibilitySettings": {"x": True, "yLeft": True, "yRight": True},
            "preferredSeriesType": "bar_stacked",
            "layers": [{
                "layerId": "layer1",
                "accessors": ["col2"],
                "position": "top",
                "seriesType": "bar_stacked",
                "showGridlines": False,
                "layerType": "data",
                "xAccessor": "col1"
            }]
        },
        "query": {"query": "event.dataset : \"trivy.config-audit\"", "language": "kuery"},
        "filters": []
    }

    # Panel 4: Exposed Secrets by Type
    panel4_state = {
        "datasourceStates": {
            "formBased": {
                "layers": {
                    "layer1": {
                        "columnOrder": ["col1", "col2"],
                        "columns": {
                            "col1": {
                                "label": "Secret Type",
                                "dataType": "string",
                                "operationType": "terms",
                                "scale": "ordinal",
                                "sourceField": "metadata.category",
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
        "query": {"query": "event.dataset : \"trivy.exposed-secret\"", "language": "kuery"},
        "filters": []
    }

    panels = [
        create_lens_panel(1, 0, 0, 48, 15, "All Security Issues Timeline", "lnsXY", panel1_state),
        create_lens_panel(2, 0, 15, 16, 15, "Config Audit by Category", "lnsPie", panel2_state),
        create_lens_panel(3, 16, 15, 16, 15, "Config Issues by Severity", "lnsXY", panel3_state),
        create_lens_panel(4, 32, 15, 16, 15, "Exposed Secrets by Type", "lnsPie", panel4_state)
    ]

    return create_dashboard_export(
        "trivy-compliance",
        "Trivy Compliance Dashboard",
        "Compliance dashboard showing config audits, secrets, and infrastructure assessments",
        panels
    )


# Generate and write the dashboards
if __name__ == "__main__":
    with open("trivy-security-overview.ndjson", "w") as f:
        f.write(create_security_overview())
    print("✓ Generated trivy-security-overview.ndjson")

    with open("trivy-vulnerability-deep-dive.ndjson", "w") as f:
        f.write(create_vulnerability_deep_dive())
    print("✓ Generated trivy-vulnerability-deep-dive.ndjson")

    with open("trivy-compliance.ndjson", "w") as f:
        f.write(create_compliance_dashboard())
    print("✓ Generated trivy-compliance.ndjson")
