{{/*
Expand the name of the chart.
*/}}
{{- define "trivy-operator-ecs-exporter.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "trivy-operator-ecs-exporter.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "trivy-operator-ecs-exporter.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "trivy-operator-ecs-exporter.labels" -}}
helm.sh/chart: {{ include "trivy-operator-ecs-exporter.chart" . }}
{{ include "trivy-operator-ecs-exporter.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "trivy-operator-ecs-exporter.selectorLabels" -}}
app.kubernetes.io/name: {{ include "trivy-operator-ecs-exporter.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "trivy-operator-ecs-exporter.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "trivy-operator-ecs-exporter.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the secret to use
*/}}
{{- define "trivy-operator-ecs-exporter.secretName" -}}
{{- if .Values.elasticsearch.existingSecret }}
{{- .Values.elasticsearch.existingSecret }}
{{- else }}
{{- include "trivy-operator-ecs-exporter.fullname" . }}
{{- end }}
{{- end }}
