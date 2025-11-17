import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import BugReportIcon from '@mui/icons-material/BugReport';
import StorageIcon from '@mui/icons-material/Storage';
import WarningIcon from '@mui/icons-material/Warning';
import { getDashboard } from '../services/api';

const SEVERITY_COLORS = {
  CRITICAL: '#d32f2f',
  HIGH: '#f57c00',
  MEDIUM: '#fbc02d',
  LOW: '#388e3c',
  UNKNOWN: '#757575',
};

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDashboard();
      setDashboard(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!dashboard) {
    return null;
  }

  // Prepare data for charts
  const vulnerabilityData = [
    { name: 'Critical', value: dashboard.vulnerabilitySummary.criticalCount, color: SEVERITY_COLORS.CRITICAL },
    { name: 'High', value: dashboard.vulnerabilitySummary.highCount, color: SEVERITY_COLORS.HIGH },
    { name: 'Medium', value: dashboard.vulnerabilitySummary.mediumCount, color: SEVERITY_COLORS.MEDIUM },
    { name: 'Low', value: dashboard.vulnerabilitySummary.lowCount, color: SEVERITY_COLORS.LOW },
    { name: 'Unknown', value: dashboard.vulnerabilitySummary.unknownCount, color: SEVERITY_COLORS.UNKNOWN },
  ].filter(item => item.value > 0);

  const configData = [
    { name: 'Critical', value: dashboard.configIssueSummary.criticalCount, color: SEVERITY_COLORS.CRITICAL },
    { name: 'High', value: dashboard.configIssueSummary.highCount, color: SEVERITY_COLORS.HIGH },
    { name: 'Medium', value: dashboard.configIssueSummary.mediumCount, color: SEVERITY_COLORS.MEDIUM },
    { name: 'Low', value: dashboard.configIssueSummary.lowCount, color: SEVERITY_COLORS.LOW },
  ].filter(item => item.value > 0);

  const namespaceData = Object.entries(dashboard.podsByNamespace || {}).map(([name, count]) => ({
    namespace: name,
    pods: count,
  }));

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Security Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#1976d2', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6">Total Pods</Typography>
                  <Typography variant="h3">{dashboard.totalPods}</Typography>
                </Box>
                <StorageIcon sx={{ fontSize: 60, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#d32f2f', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6">Vulnerabilities</Typography>
                  <Typography variant="h3">{dashboard.totalVulnerabilities}</Typography>
                </Box>
                <BugReportIcon sx={{ fontSize: 60, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#f57c00', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6">Config Issues</Typography>
                  <Typography variant="h3">{dashboard.totalConfigIssues}</Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 60, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Vulnerabilities by Severity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Vulnerabilities by Severity
            </Typography>
            {vulnerabilityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={vulnerabilityData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {vulnerabilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                No vulnerability data available
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Config Issues by Severity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Configuration Issues by Severity
            </Typography>
            {configData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={configData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8">
                    {configData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                No configuration issue data available
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Pods by Namespace */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pods by Namespace
            </Typography>
            {namespaceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={namespaceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="namespace" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pods" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                No namespace data available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
