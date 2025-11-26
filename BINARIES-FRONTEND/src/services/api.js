import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dashboard
export const getDashboard = (namespace = '') => {
  const params = namespace ? { namespace } : {};
  return api.get('/dashboard', { params });
};

// Reports
export const getAllReports = (namespace = '') => {
  const params = namespace ? { namespace } : {};
  return api.get('/reports', { params });
};

export const getVulnerabilityReports = (namespace = '') => {
  const params = namespace ? { namespace } : {};
  return api.get('/reports/vulnerability', { params });
};

export const getConfigAuditReports = (namespace = '') => {
  const params = namespace ? { namespace } : {};
  return api.get('/reports/config-audit', { params });
};

export const getExposedSecretReports = (namespace = '') => {
  const params = namespace ? { namespace } : {};
  return api.get('/reports/exposed-secret', { params });
};

export const getRbacAssessmentReports = (namespace = '') => {
  const params = namespace ? { namespace } : {};
  return api.get('/reports/rbac-assessment', { params });
};

export const getInfraAssessmentReports = (namespace = '') => {
  const params = namespace ? { namespace } : {};
  return api.get('/reports/infra-assessment', { params });
};

export const getSBOMReports = (namespace = '') => {
  const params = namespace ? { namespace } : {};
  return api.get('/reports/sbom', { params });
};

export const getKBOMReports = (namespace = '') => {
  const params = namespace ? { namespace } : {};
  return api.get('/reports/kbom', { params });
};

export const getComplianceReports = (namespace = '') => {
  const params = namespace ? { namespace } : {};
  return api.get('/reports/compliance', { params });
};

// Categories
export const getReportsByCategory = (severity) =>
  api.get(`/category/${severity}`);

// Namespaces
export const getNamespaces = () => api.get('/namespaces');

// Health check
export const healthCheck = () => api.get('/health');

export default api;
