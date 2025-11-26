import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // 90 seconds for large all-namespaces queries
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dashboard
export const getDashboard = (namespace = '') => {
  return api.get('/dashboard', { params: { namespace } });
};

// Reports
export const getAllReports = (namespace = '') => {
  return api.get('/reports', { params: { namespace } });
};

export const getVulnerabilityReports = (namespace = '') => {
  return api.get('/reports/vulnerability', { params: { namespace } });
};

export const getConfigAuditReports = (namespace = '') => {
  return api.get('/reports/config-audit', { params: { namespace } });
};

export const getExposedSecretReports = (namespace = '') => {
  return api.get('/reports/exposed-secret', { params: { namespace } });
};

export const getRbacAssessmentReports = (namespace = '') => {
  return api.get('/reports/rbac-assessment', { params: { namespace } });
};

export const getInfraAssessmentReports = (namespace = '') => {
  return api.get('/reports/infra-assessment', { params: { namespace } });
};

export const getSBOMReports = (namespace = '') => {
  return api.get('/reports/sbom', { params: { namespace } });
};

export const getKBOMReports = (namespace = '') => {
  return api.get('/reports/kbom', { params: { namespace } });
};

export const getComplianceReports = (namespace = '') => {
  return api.get('/reports/compliance', { params: { namespace } });
};

// Categories
export const getReportsByCategory = (severity) =>
  api.get(`/category/${severity}`);

// Namespaces
export const getNamespaces = () => api.get('/namespaces');

// Health check
export const healthCheck = () => api.get('/health');

export default api;
