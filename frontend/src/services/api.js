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
export const getDashboard = () => api.get('/dashboard');

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

// Pods
export const getPodsList = (namespace = '') => {
  const params = namespace ? { namespace } : {};
  return api.get('/pods', { params });
};

export const getPodReports = (namespace, podName) =>
  api.get(`/pods/${namespace}/${podName}`);

// Categories
export const getReportsByCategory = (severity) =>
  api.get(`/category/${severity}`);

// Namespaces
export const getNamespaces = () => api.get('/namespaces');

// Health check
export const healthCheck = () => api.get('/health');

export default api;
