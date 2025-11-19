#!/usr/bin/env python3
"""
Generate ALL Kibana dashboards in ONE single NDJSON file - COMPLETE VERSION
Includes: 3 overview dashboards + 11 navigation dashboards = 15 total (+ 1 data view = 16 objects)
"""
import json


# Copy all the functions from generate-all-dashboards.py
#!/usr/bin/env python3
"""
Generate ALL Kibana dashboards in ONE single NDJSON file
Includes: 3 overview dashboards + 11 navigation dashboards
"""
import json


def create_ndjson_export(*objects):
    """Create NDJSON export with objects and summary"""
    lines = []
    for obj in objects:
        lines.append(json.dumps(obj, separators=(',', ':')))

    # Add export summary
    summary = {
        "excludedObjects": [],
        "excludedObjectsCount": 0,
        "exportedCount": len(objects),
        "missingRefCount": 0,
        "missingReferences": []
    }
    lines.append(json.dumps(summary, separators=(',', ':')))

    return '\n'.join(lines) + '\n'


def create_data_view():
    """Create the Trivy Reports data view"""
    return {
        "attributes": {
            "fieldAttrs": "{}",
            "fieldFormatMap": "{}",
            "fields": "[]",
            "name": "Trivy Reports",
            "runtimeFieldMap": "{}",
            "sourceFilters": "[]",
            "timeFieldName": "@timestamp",
            "title": "trivy-reports-*",
            "typeMeta": "{}"
        },
        "coreMigrationVersion": "8.8.0",
        "created_at": "2024-01-01T00:00:00.000Z",
        "id": "trivy-reports",
        "managed": False,
        "references": [],
        "type": "index-pattern",
        "typeMigrationVersion": "8.0.0",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "version": "WzEsMV0="
    }


def create_dashboard_with_panels(dashboard_id, title, description, panels, time_from="now-7d"):
    """Create a dashboard with multiple panels"""

    # Build references from panels
    references = []
    for i, panel in enumerate(panels, 1):
        references.append({
            "id": "trivy-reports",
            "name": f"panel-{i}:indexpattern-datasource-layer-layer1",
            "type": "index-pattern"
        })

    return {
        "attributes": {
            "description": description,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": json.dumps({
                    "query": {"query": "", "language": "kuery"},
                    "filter": []
                }, separators=(',', ':'))
            },
            "optionsJSON": json.dumps({
                "useMargins": True,
                "syncColors": False,
                "syncCursor": True,
                "syncTooltips": False,
                "hidePanelTitles": False
            }, separators=(',', ':')),
            "panelsJSON": json.dumps(panels, separators=(',', ':')),
            "timeRestore": True,
            "timeFrom": time_from,
            "timeTo": "now",
            "title": title,
            "version": 1
        },
        "coreMigrationVersion": "8.8.0",
        "created_at": "2024-01-01T00:00:00.000Z",
        "id": dashboard_id,
        "managed": False,
        "references": references,
        "type": "dashboard",
        "typeMigrationVersion": "8.8.0",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "version": "WzEsMV0="
    }


def create_simple_table_dashboard(dashboard_id, title, description, columns, query_filter="", time_from="now-7d"):
    """Create a simple dashboard with one data table"""

    panel = {
        "version": "8.8.0",
        "type": "lens",
        "gridData": {"x": 0, "y": 0, "w": 48, "h": 30, "i": "panel-1"},
        "panelIndex": "panel-1",
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
                                    "columnOrder": [f"col{i}" for i in range(1, len(columns) + 1)],
                                    "columns": {f"col{i}": col for i, col in enumerate(columns, 1)}
                                }
                            }
                        }
                    },
                    "visualization": {
                        "layerId": "layer1",
                        "layerType": "data",
                        "columns": [{"columnId": f"col{i}"} for i in range(1, len(columns) + 1)]
                    },
                    "query": {"query": query_filter, "language": "kuery"},
                    "filters": []
                },
                "references": [{
                    "type": "index-pattern",
                    "id": "trivy-reports",
                    "name": "indexpattern-datasource-layer-layer1"
                }]
            },
            "enhancements": {}
        }
    }

    return create_dashboard_with_panels(dashboard_id, title, description, [panel], time_from)


# Navigation Dashboard 1: Main entry point
def create_navigation_main():
    """Main navigation dashboard - entry point"""
    columns = [
        {
            "label": "Report Type",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "event.dataset",
            "isBucketed": True,
            "params": {"size": 10, "orderBy": {"type": "column", "columnId": "col2"}, "orderDirection": "desc"}
        },
        {
            "label": "Total Reports",
            "dataType": "number",
            "operationType": "count",
            "isBucketed": False,
            "scale": "ratio",
            "sourceField": "___records___"
        },
        {
            "label": "Critical",
            "dataType": "number",
            "operationType": "count",
            "isBucketed": False,
            "scale": "ratio",
            "sourceField": "___records___",
            "filter": {"query": 'vulnerability.severity: "CRITICAL" OR check.severity: "CRITICAL"', "language": "kuery"}
        },
        {
            "label": "High",
            "dataType": "number",
            "operationType": "count",
            "isBucketed": False,
            "scale": "ratio",
            "sourceField": "___records___",
            "filter": {"query": 'vulnerability.severity: "HIGH" OR check.severity: "HIGH"', "language": "kuery"}
        }
    ]

    return create_simple_table_dashboard(
        "trivy-nav-main",
        "Trivy Reports - Navigation",
        "Main navigation - Click on a report type to drill down",
        columns
    )


# Navigation Dashboard 2: Vulnerability Pods
def create_vuln_pods_dashboard():
    """Pods with vulnerabilities"""
    columns = [
        {
            "label": "Namespace",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "kubernetes.namespace",
            "isBucketed": True,
            "params": {"size": 100}
        },
        {
            "label": "Pod",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "kubernetes.pod.name",
            "isBucketed": True,
            "params": {"size": 100}
        },
        {
            "label": "Total",
            "dataType": "number",
            "operationType": "count",
            "isBucketed": False,
            "scale": "ratio",
            "sourceField": "___records___"
        },
        {
            "label": "Critical",
            "dataType": "number",
            "operationType": "count",
            "isBucketed": False,
            "scale": "ratio",
            "sourceField": "___records___",
            "filter": {"query": 'vulnerability.severity: "CRITICAL"', "language": "kuery"}
        },
        {
            "label": "High",
            "dataType": "number",
            "operationType": "count",
            "isBucketed": False,
            "scale": "ratio",
            "sourceField": "___records___",
            "filter": {"query": 'vulnerability.severity: "HIGH"', "language": "kuery"}
        }
    ]

    return create_simple_table_dashboard(
        "trivy-vuln-pods",
        "Trivy - Vulnerability Reports by Pod",
        "Pods with vulnerabilities - Click on a pod to see details",
        columns,
        'event.dataset: "trivy.vulnerability"'
    )


# Navigation Dashboard 3: Vulnerability Details
def create_vuln_details_dashboard():
    """Vulnerability details"""
    columns = [
        {
            "label": "Severity",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "vulnerability.severity",
            "isBucketed": True,
            "params": {"size": 10}
        },
        {
            "label": "CVE ID",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "vulnerability.id",
            "isBucketed": True,
            "params": {"size": 1000}
        },
        {
            "label": "Container",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "kubernetes.container.name",
            "isBucketed": True,
            "params": {"size": 100}
        },
        {
            "label": "Title",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "vulnerability.title",
            "isBucketed": True,
            "params": {"size": 100}
        },
        {
            "label": "Count",
            "dataType": "number",
            "operationType": "count",
            "isBucketed": False,
            "scale": "ratio",
            "sourceField": "___records___"
        }
    ]

    return create_simple_table_dashboard(
        "trivy-vuln-details",
        "Trivy - Vulnerability Details",
        "Detailed vulnerability information",
        columns,
        'event.dataset: "trivy.vulnerability"'
    )


# Navigation Dashboard 4: Config Audit Pods
def create_config_pods_dashboard():
    """Pods with config issues"""
    columns = [
        {
            "label": "Namespace",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "kubernetes.namespace",
            "isBucketed": True,
            "params": {"size": 100}
        },
        {
            "label": "Pod",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "kubernetes.pod.name",
            "isBucketed": True,
            "params": {"size": 100}
        },
        {
            "label": "Total",
            "dataType": "number",
            "operationType": "count",
            "isBucketed": False,
            "scale": "ratio",
            "sourceField": "___records___"
        },
        {
            "label": "Critical",
            "dataType": "number",
            "operationType": "count",
            "isBucketed": False,
            "scale": "ratio",
            "sourceField": "___records___",
            "filter": {"query": 'check.severity: "CRITICAL"', "language": "kuery"}
        }
    ]

    return create_simple_table_dashboard(
        "trivy-config-pods",
        "Trivy - Config Audit by Pod",
        "Pods with configuration issues",
        columns,
        'event.dataset: "trivy.config-audit"'
    )


# Navigation Dashboard 5: Config Audit Details
def create_config_details_dashboard():
    """Config audit details"""
    columns = [
        {
            "label": "Severity",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "check.severity",
            "isBucketed": True,
            "params": {"size": 10}
        },
        {
            "label": "Check ID",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "check.id",
            "isBucketed": True,
            "params": {"size": 1000}
        },
        {
            "label": "Title",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "check.title",
            "isBucketed": True,
            "params": {"size": 100}
        },
        {
            "label": "Category",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "check.category",
            "isBucketed": True,
            "params": {"size": 100}
        },
        {
            "label": "Count",
            "dataType": "number",
            "operationType": "count",
            "isBucketed": False,
            "scale": "ratio",
            "sourceField": "___records___"
        }
    ]

    return create_simple_table_dashboard(
        "trivy-config-details",
        "Trivy - Config Audit Details",
        "Detailed configuration issue information",
        columns,
        'event.dataset: "trivy.config-audit" AND check.success: false'
    )


# Generate all dashboards
if __name__ == "__main__":
    print("Generating all dashboards...")

    # Load existing working dashboards
    print("Loading existing dashboards...")
    with open("trivy-security-overview.ndjson", "r") as f:
        overview = json.loads(f.readline().strip())



# Navigation Dashboard 6: Secrets Pods
def create_secrets_pods_dashboard():
    """Pods with exposed secrets"""
    columns = [
        {
            "label": "Namespace",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "kubernetes.namespace",
            "isBucketed": True,
            "params": {"size": 100}
        },
        {
            "label": "Pod",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "kubernetes.pod.name",
            "isBucketed": True,
            "params": {"size": 100}
        },
        {
            "label": "Total",
            "dataType": "number",
            "operationType": "count",
            "isBucketed": False,
            "scale": "ratio",
            "sourceField": "___records___"
        }
    ]

    return create_simple_table_dashboard(
        "trivy-secrets-pods",
        "Trivy - Exposed Secrets by Pod",
        "Pods with exposed secrets",
        columns,
        'event.dataset: "trivy.exposed-secret"'
    )


# Navigation Dashboard 7: Secrets Details
def create_secrets_details_dashboard():
    """Exposed secrets details"""
    columns = [
        {
            "label": "Severity",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "secret.severity",
            "isBucketed": True,
            "params": {"size": 10}
        },
        {
            "label": "Rule ID",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "secret.rule_id",
            "isBucketed": True,
            "params": {"size": 1000}
        },
        {
            "label": "Category",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "secret.category",
            "isBucketed": True,
            "params": {"size": 100}
        },
        {
            "label": "Title",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "secret.title",
            "isBucketed": True,
            "params": {"size": 100}
        },
        {
            "label": "Count",
            "dataType": "number",
            "operationType": "count",
            "isBucketed": False,
            "scale": "ratio",
            "sourceField": "___records___"
        }
    ]

    return create_simple_table_dashboard(
        "trivy-secrets-details",
        "Trivy - Exposed Secrets Details",
        "Detailed exposed secrets information",
        columns,
        'event.dataset: "trivy.exposed-secret"'
    )


# Navigation Dashboard 8: RBAC Resources
def create_rbac_resources_dashboard():
    """RBAC resources with issues"""
    columns = [
        {
            "label": "Namespace",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "kubernetes.namespace",
            "isBucketed": True,
            "params": {"size": 100}
        },
        {
            "label": "Resource",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "resource.name",
            "isBucketed": True,
            "params": {"size": 100}
        },
        {
            "label": "Total",
            "dataType": "number",
            "operationType": "count",
            "isBucketed": False,
            "scale": "ratio",
            "sourceField": "___records___"
        }
    ]

    return create_simple_table_dashboard(
        "trivy-rbac-resources",
        "Trivy - RBAC Assessment",
        "RBAC resources with issues",
        columns,
        'event.dataset: "trivy.rbac-assessment"'
    )


# Navigation Dashboard 9: RBAC Details
def create_rbac_details_dashboard():
    """RBAC details"""
    columns = [
        {
            "label": "Severity",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "check.severity",
            "isBucketed": True,
            "params": {"size": 10}
        },
        {
            "label": "Check ID",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "check.id",
            "isBucketed": True,
            "params": {"size": 1000}
        },
        {
            "label": "Title",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "check.title",
            "isBucketed": True,
            "params": {"size": 100}
        },
        {
            "label": "Count",
            "dataType": "number",
            "operationType": "count",
            "isBucketed": False,
            "scale": "ratio",
            "sourceField": "___records___"
        }
    ]

    return create_simple_table_dashboard(
        "trivy-rbac-details",
        "Trivy - RBAC Assessment Details",
        "Detailed RBAC issue information",
        columns,
        'event.dataset: "trivy.rbac-assessment" AND check.success: false'
    )


# Navigation Dashboard 10: Infrastructure Resources
def create_infra_resources_dashboard():
    """Infrastructure resources with issues"""
    columns = [
        {
            "label": "Resource",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "resource.name",
            "isBucketed": True,
            "params": {"size": 100}
        },
        {
            "label": "Total",
            "dataType": "number",
            "operationType": "count",
            "isBucketed": False,
            "scale": "ratio",
            "sourceField": "___records___"
        }
    ]

    return create_simple_table_dashboard(
        "trivy-infra-resources",
        "Trivy - Infrastructure Assessment",
        "Infrastructure resources with issues",
        columns,
        'event.dataset: "trivy.infra-assessment"'
    )


# Navigation Dashboard 11: Infrastructure Details
def create_infra_details_dashboard():
    """Infrastructure details"""
    columns = [
        {
            "label": "Severity",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "check.severity",
            "isBucketed": True,
            "params": {"size": 10}
        },
        {
            "label": "Check ID",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "check.id",
            "isBucketed": True,
            "params": {"size": 1000}
        },
        {
            "label": "Title",
            "dataType": "string",
            "operationType": "terms",
            "scale": "ordinal",
            "sourceField": "check.title",
            "isBucketed": True,
            "params": {"size": 100}
        },
        {
            "label": "Count",
            "dataType": "number",
            "operationType": "count",
            "isBucketed": False,
            "scale": "ratio",
            "sourceField": "___records___"
        }
    ]

    return create_simple_table_dashboard(
        "trivy-infra-details",
        "Trivy - Infrastructure Assessment Details",
        "Detailed infrastructure issue information",
        columns,
        'event.dataset: "trivy.infra-assessment" AND check.success: false'
    )


# MAIN - Generate ALL dashboards
if __name__ == "__main__":
    print("Generating ALL dashboards (3 overview + 11 navigation)...")

    # Load existing working dashboards
    print("Loading existing overview dashboards...")
    with open("trivy-security-overview.ndjson", "r") as f:
        overview = json.loads(f.readline().strip())

    with open("trivy-vulnerability-deep-dive.ndjson", "r") as f:
        vuln_dive = json.loads(f.readline().strip())

    with open("trivy-compliance.ndjson", "r") as f:
        compliance = json.loads(f.readline().strip())

    # Create all objects (1 data view + 3 overview + 11 navigation)
    print("Creating all navigation dashboards...")
    objects = [
        create_data_view(),
        overview,
        vuln_dive,
        compliance,
        create_navigation_main(),
        create_vuln_pods_dashboard(),
        create_vuln_details_dashboard(),
        create_config_pods_dashboard(),
        create_config_details_dashboard(),
        create_secrets_pods_dashboard(),
        create_secrets_details_dashboard(),
        create_rbac_resources_dashboard(),
        create_rbac_details_dashboard(),
        create_infra_resources_dashboard(),
        create_infra_details_dashboard()
    ]

    # Write combined file
    output_file = "trivy-all-dashboards.ndjson"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(create_ndjson_export(*objects))

    print(f"\n[SUCCESS] Generated {output_file} with {len(objects)} objects:")
    print("\nOVERVIEW DASHBOARDS:")
    for i, obj in enumerate(objects[1:4], 1):
        title = obj.get('attributes', {}).get('title', 'unknown')
        print(f"  {i}. {title}")

    print("\nNAVIGATION DASHBOARDS:")
    for i, obj in enumerate(objects[4:], 1):
        title = obj.get('attributes', {}).get('title', 'unknown')
        print(f"  {i}. {title}")

    print(f"\nFile size: {len(open(output_file).read())} bytes")
    print(f"\n{'='*60}")
    print("IMPORT INSTRUCTIONS:")
    print("  1. Open Kibana")
    print("  2. Stack Management > Saved Objects")
    print("  3. Click 'Import'")
    print("  4. Drag and drop: trivy-all-dashboards.ndjson")
    print("  5. Click 'Import'")
    print("  6. Go to Analytics > Dashboard")
    print(f"{'='*60}")
