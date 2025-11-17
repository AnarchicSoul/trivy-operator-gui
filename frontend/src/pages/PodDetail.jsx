import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Breadcrumbs,
  Link,
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getPodReports } from '../services/api';

const SEVERITY_COLORS = {
  CRITICAL: '#d32f2f',
  HIGH: '#f57c00',
  MEDIUM: '#fbc02d',
  LOW: '#388e3c',
  UNKNOWN: '#757575',
};

const PodDetail = () => {
  const { namespace, podName } = useParams();
  const navigate = useNavigate();
  const [podReports, setPodReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const fetchPodReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPodReports(namespace, podName);
      setPodReports(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch pod reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPodReports();
  }, [namespace, podName]);

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
        <Alert severity="error" onClose={() => navigate('/pods')}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!podReports) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
            <Link
              underline="hover"
              color="inherit"
              onClick={() => navigate('/pods')}
              sx={{ cursor: 'pointer' }}
            >
              Pods
            </Link>
            <Typography color="text.primary">{podName}</Typography>
          </Breadcrumbs>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/pods')} color="primary">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4">Pod Details: {podName}</Typography>
          </Box>
        </Box>
        <IconButton onClick={fetchPodReports} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>Total Vulnerabilities</Typography>
              <Typography variant="h4">{podReports.totalVulnerabilities}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>Total Config Issues</Typography>
              <Typography variant="h4">{podReports.totalConfigIssues || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: SEVERITY_COLORS.CRITICAL, color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>Critical</Typography>
              <Typography variant="h4">
                {podReports.vulnerabilitySummary.criticalCount + (podReports.configIssueSummary?.criticalCount || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: SEVERITY_COLORS.HIGH, color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>High</Typography>
              <Typography variant="h4">
                {podReports.vulnerabilitySummary.highCount + (podReports.configIssueSummary?.highCount || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`Vulnerabilities (${podReports.vulnerabilityReports.length})`} />
          <Tab label={`Configuration Issues (${podReports.configAuditReports?.length || 0})`} />
        </Tabs>
      </Paper>

      {/* Vulnerability Reports by Container */}
      {tabValue === 0 && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            Container Vulnerabilities
          </Typography>
          {podReports.vulnerabilityReports.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                No vulnerability reports found
              </Typography>
            </Paper>
          ) : (
            podReports.vulnerabilityReports.map((report, index) => (
              <Accordion key={index} defaultExpanded={index === 0} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" justifyContent="space-between" width="100%" alignItems="center" pr={2}>
                    <Typography variant="h6">
                      Container: {report.metadata.name.split('-').pop()} - {report.report.artifact.repository}
                      {report.report.artifact.tag && `:${report.report.artifact.tag}`}
                    </Typography>
                    <Box display="flex" gap={1}>
                      {report.report.summary.criticalCount > 0 && (
                        <Chip
                          label={`C: ${report.report.summary.criticalCount}`}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.CRITICAL, color: 'white' }}
                        />
                      )}
                      {report.report.summary.highCount > 0 && (
                        <Chip
                          label={`H: ${report.report.summary.highCount}`}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.HIGH, color: 'white' }}
                        />
                      )}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>CVE ID</strong></TableCell>
                          <TableCell><strong>Package</strong></TableCell>
                          <TableCell><strong>Installed Version</strong></TableCell>
                          <TableCell><strong>Fixed Version</strong></TableCell>
                          <TableCell><strong>Severity</strong></TableCell>
                          <TableCell><strong>Title</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {report.report.vulnerabilities.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                                No vulnerabilities found
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          report.report.vulnerabilities.map((vuln, vIndex) => (
                            <TableRow key={vIndex}>
                              <TableCell>
                                {vuln.primaryLink ? (
                                  <Link href={vuln.primaryLink} target="_blank" rel="noopener">
                                    {vuln.vulnerabilityID}
                                  </Link>
                                ) : (
                                  vuln.vulnerabilityID
                                )}
                              </TableCell>
                              <TableCell>{vuln.resource}</TableCell>
                              <TableCell>{vuln.installedVersion}</TableCell>
                              <TableCell>{vuln.fixedVersion || 'N/A'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={vuln.severity}
                                  size="small"
                                  sx={{
                                    bgcolor: SEVERITY_COLORS[vuln.severity.toUpperCase()] || SEVERITY_COLORS.UNKNOWN,
                                    color: 'white',
                                  }}
                                />
                              </TableCell>
                              <TableCell>{vuln.title || 'N/A'}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </>
      )}

      {/* Configuration Audit Reports */}
      {tabValue === 1 && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            Configuration Issues
          </Typography>
          {!podReports.configAuditReports || podReports.configAuditReports.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                No configuration audit reports found
              </Typography>
            </Paper>
          ) : (
            podReports.configAuditReports.map((report, index) => {
              const failedChecks = report.report.checks?.filter(check => !check.success) || [];
              return (
                <Accordion key={index} defaultExpanded={index === 0} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" justifyContent="space-between" width="100%" alignItems="center" pr={2}>
                      <Typography variant="h6">
                        Resource: {report.metadata.name}
                      </Typography>
                      <Box display="flex" gap={1}>
                        {report.report.summary.criticalCount > 0 && (
                          <Chip
                            label={`C: ${report.report.summary.criticalCount}`}
                            size="small"
                            sx={{ bgcolor: SEVERITY_COLORS.CRITICAL, color: 'white' }}
                          />
                        )}
                        {report.report.summary.highCount > 0 && (
                          <Chip
                            label={`H: ${report.report.summary.highCount}`}
                            size="small"
                            sx={{ bgcolor: SEVERITY_COLORS.HIGH, color: 'white' }}
                          />
                        )}
                        {report.report.summary.mediumCount > 0 && (
                          <Chip
                            label={`M: ${report.report.summary.mediumCount}`}
                            size="small"
                            sx={{ bgcolor: SEVERITY_COLORS.MEDIUM, color: 'white' }}
                          />
                        )}
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Check ID</strong></TableCell>
                            <TableCell><strong>Title</strong></TableCell>
                            <TableCell><strong>Category</strong></TableCell>
                            <TableCell><strong>Severity</strong></TableCell>
                            <TableCell><strong>Description</strong></TableCell>
                            <TableCell><strong>Remediation</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {failedChecks.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} align="center">
                                <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                                  All checks passed
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            failedChecks.map((check, cIndex) => (
                              <TableRow key={cIndex}>
                                <TableCell>{check.checkID}</TableCell>
                                <TableCell>{check.title}</TableCell>
                                <TableCell>{check.category}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={check.severity}
                                    size="small"
                                    sx={{
                                      bgcolor: SEVERITY_COLORS[check.severity.toUpperCase()] || SEVERITY_COLORS.UNKNOWN,
                                      color: 'white',
                                    }}
                                  />
                                </TableCell>
                                <TableCell sx={{ maxWidth: 300 }}>{check.description || 'N/A'}</TableCell>
                                <TableCell sx={{ maxWidth: 300 }}>{check.remediation || 'N/A'}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              );
            })
          )}
        </>
      )}
    </Container>
  );
};

export default PodDetail;
