import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  Link,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import {
  getVulnerabilityReports,
  getConfigAuditReports,
  getExposedSecretReports,
  getRbacAssessmentReports,
  getInfraAssessmentReports,
  getNamespaces,
} from '../services/api';

const SEVERITY_COLORS = {
  CRITICAL: '#d32f2f',
  HIGH: '#f57c00',
  MEDIUM: '#fbc02d',
  LOW: '#388e3c',
  UNKNOWN: '#757575',
};

const ReportsView = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [vulnReports, setVulnReports] = useState([]);
  const [configReports, setConfigReports] = useState([]);
  const [secretReports, setSecretReports] = useState([]);
  const [rbacReports, setRbacReports] = useState([]);
  const [infraReports, setInfraReports] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const fetchNamespaces = async () => {
    try {
      const response = await getNamespaces();
      setNamespaces(response.data.namespaces || []);
    } catch (err) {
      console.error('Failed to fetch namespaces:', err);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const vulnResponse = await getVulnerabilityReports(selectedNamespace);
      setVulnReports(vulnResponse.data.items || []);

      const configResponse = await getConfigAuditReports(selectedNamespace);
      setConfigReports(configResponse.data.items || []);

      const secretResponse = await getExposedSecretReports(selectedNamespace);
      setSecretReports(secretResponse.data.items || []);

      const rbacResponse = await getRbacAssessmentReports(selectedNamespace);
      setRbacReports(rbacResponse.data.items || []);

      const infraResponse = await getInfraAssessmentReports();
      setInfraReports(infraResponse.data.items || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNamespaces();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedNamespace]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDetail = (report) => {
    setSelectedReport(report);
    setDetailDialogOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedReport(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">All Reports</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Namespace</InputLabel>
            <Select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              label="Namespace"
            >
              <MenuItem value="">All Namespaces</MenuItem>
              {namespaces.map((ns) => (
                <MenuItem key={ns} value={ns}>
                  {ns}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton onClick={fetchReports} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label={`Vulnerability Reports (${vulnReports.length})`} />
          <Tab label={`Config Audit (${configReports.length})`} />
          <Tab label={`Exposed Secrets (${secretReports.length})`} />
          <Tab label={`RBAC Assessment (${rbacReports.length})`} />
          <Tab label={`Infra Assessment (${infraReports.length})`} />
        </Tabs>
      </Paper>

      {/* Vulnerability Reports Table */}
      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Namespace</strong></TableCell>
                <TableCell><strong>Image</strong></TableCell>
                <TableCell><strong>Scanner</strong></TableCell>
                <TableCell align="center"><strong>Critical</strong></TableCell>
                <TableCell align="center"><strong>High</strong></TableCell>
                <TableCell align="center"><strong>Medium</strong></TableCell>
                <TableCell align="center"><strong>Low</strong></TableCell>
                <TableCell><strong>Updated</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vulnReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                      No vulnerability reports found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                vulnReports.map((report, index) => (
                  <TableRow
                    key={index}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleOpenDetail(report)}
                  >
                    <TableCell>{report.metadata.name}</TableCell>
                    <TableCell>{report.metadata.namespace}</TableCell>
                    <TableCell>
                      {report.report.artifact.repository}
                      {report.report.artifact.tag && `:${report.report.artifact.tag}`}
                    </TableCell>
                    <TableCell>{report.report.scanner.name} {report.report.scanner.version}</TableCell>
                    <TableCell align="center">
                      {report.report.summary.criticalCount > 0 ? (
                        <Chip
                          label={report.report.summary.criticalCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.CRITICAL, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {report.report.summary.highCount > 0 ? (
                        <Chip
                          label={report.report.summary.highCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.HIGH, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {report.report.summary.mediumCount > 0 ? (
                        <Chip
                          label={report.report.summary.mediumCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.MEDIUM, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {report.report.summary.lowCount > 0 ? (
                        <Chip
                          label={report.report.summary.lowCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.LOW, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{formatDate(report.report.updateTimestamp)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Config Audit Reports Table */}
      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Namespace</strong></TableCell>
                <TableCell><strong>Scanner</strong></TableCell>
                <TableCell align="center"><strong>Critical</strong></TableCell>
                <TableCell align="center"><strong>High</strong></TableCell>
                <TableCell align="center"><strong>Medium</strong></TableCell>
                <TableCell align="center"><strong>Low</strong></TableCell>
                <TableCell><strong>Updated</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                      No config audit reports found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                configReports.map((report, index) => (
                  <TableRow
                    key={index}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleOpenDetail(report)}
                  >
                    <TableCell>{report.metadata.name}</TableCell>
                    <TableCell>{report.metadata.namespace}</TableCell>
                    <TableCell>{report.report.scanner.name} {report.report.scanner.version}</TableCell>
                    <TableCell align="center">
                      {report.report.summary.criticalCount > 0 ? (
                        <Chip
                          label={report.report.summary.criticalCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.CRITICAL, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {report.report.summary.highCount > 0 ? (
                        <Chip
                          label={report.report.summary.highCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.HIGH, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {report.report.summary.mediumCount > 0 ? (
                        <Chip
                          label={report.report.summary.mediumCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.MEDIUM, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {report.report.summary.lowCount > 0 ? (
                        <Chip
                          label={report.report.summary.lowCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.LOW, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{formatDate(report.report.updateTimestamp)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Exposed Secret Reports Table */}
      {tabValue === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Namespace</strong></TableCell>
                <TableCell><strong>Image</strong></TableCell>
                <TableCell><strong>Scanner</strong></TableCell>
                <TableCell align="center"><strong>Critical</strong></TableCell>
                <TableCell align="center"><strong>High</strong></TableCell>
                <TableCell align="center"><strong>Medium</strong></TableCell>
                <TableCell align="center"><strong>Low</strong></TableCell>
                <TableCell><strong>Updated</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {secretReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                      No exposed secret reports found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                secretReports.map((report, index) => (
                  <TableRow
                    key={index}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleOpenDetail(report)}
                  >
                    <TableCell>{report.metadata.name}</TableCell>
                    <TableCell>{report.metadata.namespace}</TableCell>
                    <TableCell>
                      {report.report.artifact?.repository || 'N/A'}
                      {report.report.artifact?.tag && `:${report.report.artifact.tag}`}
                    </TableCell>
                    <TableCell>{report.report.scanner.name} {report.report.scanner.version}</TableCell>
                    <TableCell align="center">
                      {report.report.summary.criticalCount > 0 ? (
                        <Chip
                          label={report.report.summary.criticalCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.CRITICAL, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {report.report.summary.highCount > 0 ? (
                        <Chip
                          label={report.report.summary.highCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.HIGH, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {report.report.summary.mediumCount > 0 ? (
                        <Chip
                          label={report.report.summary.mediumCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.MEDIUM, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {report.report.summary.lowCount > 0 ? (
                        <Chip
                          label={report.report.summary.lowCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.LOW, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{formatDate(report.report.updateTimestamp)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* RBAC Assessment Reports Table */}
      {tabValue === 3 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Namespace</strong></TableCell>
                <TableCell><strong>Scanner</strong></TableCell>
                <TableCell align="center"><strong>Critical</strong></TableCell>
                <TableCell align="center"><strong>High</strong></TableCell>
                <TableCell align="center"><strong>Medium</strong></TableCell>
                <TableCell align="center"><strong>Low</strong></TableCell>
                <TableCell><strong>Updated</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rbacReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                      No RBAC assessment reports found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rbacReports.map((report, index) => (
                  <TableRow
                    key={index}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleOpenDetail(report)}
                  >
                    <TableCell>{report.metadata.name}</TableCell>
                    <TableCell>{report.metadata.namespace}</TableCell>
                    <TableCell>{report.report.scanner.name} {report.report.scanner.version}</TableCell>
                    <TableCell align="center">
                      {report.report.summary.criticalCount > 0 ? (
                        <Chip
                          label={report.report.summary.criticalCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.CRITICAL, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {report.report.summary.highCount > 0 ? (
                        <Chip
                          label={report.report.summary.highCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.HIGH, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {report.report.summary.mediumCount > 0 ? (
                        <Chip
                          label={report.report.summary.mediumCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.MEDIUM, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {report.report.summary.lowCount > 0 ? (
                        <Chip
                          label={report.report.summary.lowCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.LOW, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{formatDate(report.report.updateTimestamp)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Infrastructure Assessment Reports Table */}
      {tabValue === 4 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Scanner</strong></TableCell>
                <TableCell align="center"><strong>Critical</strong></TableCell>
                <TableCell align="center"><strong>High</strong></TableCell>
                <TableCell align="center"><strong>Medium</strong></TableCell>
                <TableCell align="center"><strong>Low</strong></TableCell>
                <TableCell><strong>Updated</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {infraReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                      No infrastructure assessment reports found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                infraReports.map((report, index) => (
                  <TableRow
                    key={index}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleOpenDetail(report)}
                  >
                    <TableCell>{report.metadata.name}</TableCell>
                    <TableCell>{report.report.scanner.name} {report.report.scanner.version}</TableCell>
                    <TableCell align="center">
                      {report.report.summary.criticalCount > 0 ? (
                        <Chip
                          label={report.report.summary.criticalCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.CRITICAL, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {report.report.summary.highCount > 0 ? (
                        <Chip
                          label={report.report.summary.highCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.HIGH, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {report.report.summary.mediumCount > 0 ? (
                        <Chip
                          label={report.report.summary.mediumCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.MEDIUM, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {report.report.summary.lowCount > 0 ? (
                        <Chip
                          label={report.report.summary.lowCount}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLORS.LOW, color: 'white' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{formatDate(report.report.updateTimestamp)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetail}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedReport?.metadata.name}
            </Typography>
            <IconButton onClick={handleCloseDetail} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedReport && selectedReport.report.vulnerabilities && (
            /* Vulnerability Report Details */
            <TableContainer>
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
                  {selectedReport.report.vulnerabilities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                          No vulnerabilities found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedReport.report.vulnerabilities.map((vuln, index) => (
                      <TableRow key={index}>
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
                              bgcolor: SEVERITY_COLORS[vuln.severity?.toUpperCase()] || SEVERITY_COLORS.UNKNOWN,
                              color: 'white',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 400 }}>
                          <Tooltip title={vuln.title || 'N/A'} placement="top">
                            <Box
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {vuln.title || 'N/A'}
                            </Box>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {selectedReport && selectedReport.report.secrets && (
            /* Exposed Secret Report Details */
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Rule ID</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Severity</strong></TableCell>
                    <TableCell><strong>Title</strong></TableCell>
                    <TableCell><strong>Target</strong></TableCell>
                    <TableCell><strong>Match</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedReport.report.secrets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                          No secrets found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedReport.report.secrets.map((secret, index) => (
                      <TableRow key={index}>
                        <TableCell>{secret.ruleID}</TableCell>
                        <TableCell>{secret.category}</TableCell>
                        <TableCell>
                          <Chip
                            label={secret.severity}
                            size="small"
                            sx={{
                              bgcolor: SEVERITY_COLORS[secret.severity?.toUpperCase()] || SEVERITY_COLORS.UNKNOWN,
                              color: 'white',
                            }}
                          />
                        </TableCell>
                        <TableCell>{secret.title || 'N/A'}</TableCell>
                        <TableCell>{secret.target || 'N/A'}</TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>
                          <Tooltip title={secret.match || 'N/A'} placement="top">
                            <Box
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {secret.match || 'N/A'}
                            </Box>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {selectedReport && selectedReport.report.checks && (
            /* Config Audit / RBAC / Infra Report Details */
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Check ID</strong></TableCell>
                    <TableCell><strong>Title</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Severity</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedReport.report.checks.filter(check => !check.success).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="success.main" sx={{ py: 2 }}>
                          All checks passed!
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedReport.report.checks.filter(check => !check.success).map((check, index) => (
                      <TableRow key={index}>
                        <TableCell>{check.checkID}</TableCell>
                        <TableCell>{check.title}</TableCell>
                        <TableCell>{check.category}</TableCell>
                        <TableCell>
                          <Chip
                            label={check.severity}
                            size="small"
                            sx={{
                              bgcolor: SEVERITY_COLORS[check.severity?.toUpperCase()] || SEVERITY_COLORS.UNKNOWN,
                              color: 'white',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label="Failed"
                            size="small"
                            color="error"
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 400 }}>
                          <Tooltip title={check.description || 'N/A'} placement="top">
                            <Box
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {check.description || 'N/A'}
                            </Box>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReportsView;
