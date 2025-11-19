#!/bin/bash
# Combine the working dashboards into one file

OUTPUT="trivy-all-dashboards.ndjson"

# Start with data view
cat data-view.ndjson > "$OUTPUT"

# Add the 3 working dashboards (skip their export summary lines)
for file in trivy-security-overview.ndjson trivy-vulnerability-deep-dive.ndjson trivy-compliance.ndjson; do
    head -1 "$file" >> "$OUTPUT"
done

# Add final export summary
echo '{"excludedObjects":[],"excludedObjectsCount":0,"exportedCount":4,"missingRefCount":0,"missingReferences":[]}' >> "$OUTPUT"

echo "[SUCCESS] Created $OUTPUT"
ls -lh "$OUTPUT"
