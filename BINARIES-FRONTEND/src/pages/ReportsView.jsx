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
  TablePagination,
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
  Link,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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

const DEFAULT_ROWS_PER_PAGE = 50;

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

  // Pagination states for each tab
  const [vulnPage, setVulnPage] = useState(0);
  const [vulnRowsPerPage, setVulnRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [configPage, setConfigPage] = useState(0);
  const [configRowsPerPage, setConfigRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [secretPage, setSecretPage] = useState(0);
  const [secretRowsPerPage, setSecretRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [rbacPage, setRbacPage] = useState(0);
  const [rbacRowsPerPage, setRbacRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [infraPage, setInfraPage] = useState(0);
  const [infraRowsPerPage, setInfraRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

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

      // Reset pagination when data changes
      setVulnPage(0);
      setConfigPage(0);
      setSecretPage(0);
      setRbacPage(0);
      setInfraPage(0);
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

  // PDF Export function
  const exportToPDF = (report, reportType, event) => {
    event.stopPropagation(); // Prevent row click

    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(33, 37, 41);
    doc.text('Trivy Security Report', 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Report: ${report.metadata.name}`, 14, 30);
    doc.text(`Namespace: ${report.metadata.namespace || 'N/A'}`, 14, 37);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 44);
    doc.text(`Report Type: ${reportType}`, 14, 51);

    // Summary
    const summary = report.report.summary;
    doc.setFontSize(11);
    doc.setTextColor(33, 37, 41);
    doc.text('Summary:', 14, 62);
    doc.setFontSize(10);
    doc.text(`Critical: ${summary.criticalCount || 0}  |  High: ${summary.highCount || 0}  |  Medium: ${summary.mediumCount || 0}  |  Low: ${summary.lowCount || 0}`, 14, 69);

    let startY = 78;

    // Define severity color mapping for PDF
    const getSeverityColor = (severity) => {
      const colors = {
        CRITICAL: [211, 47, 47],
        HIGH: [245, 124, 0],
        MEDIUM: [251, 192, 45],
        LOW: [56, 142, 60],
        UNKNOWN: [117, 117, 117],
      };
      return colors[severity?.toUpperCase()] || colors.UNKNOWN;
    };

    if (report.report.vulnerabilities) {
      // Vulnerability Report
      const tableData = report.report.vulnerabilities.map(vuln => [
        vuln.vulnerabilityID || 'N/A',
        vuln.resource || 'N/A',
        vuln.installedVersion || 'N/A',
        vuln.fixedVersion || 'N/A',
        vuln.severity || 'N/A',
        vuln.title || 'N/A',
      ]);

      doc.autoTable({
        startY: startY,
        head: [['CVE ID', 'Package', 'Installed', 'Fixed', 'Severity', 'Title']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [63, 81, 181], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 25 },
          5: { cellWidth: 'auto' },
        },
        styles: { fontSize: 8, cellPadding: 2 },
        didParseCell: (data) => {
          if (data.column.index === 4 && data.section === 'body') {
            const color = getSeverityColor(data.cell.raw);
            data.cell.styles.fillColor = color;
            data.cell.styles.textColor = 255;
          }
        },
      });
    } else if (report.report.secrets) {
      // Secret Report
      const tableData = report.report.secrets.map(secret => [
        secret.ruleID || 'N/A',
        secret.category || 'N/A',
        secret.severity || 'N/A',
        secret.title || 'N/A',
        secret.target || 'N/A',
        secret.match || 'N/A',
      ]);

      doc.autoTable({
        startY: startY,
        head: [['Rule ID', 'Category', 'Severity', 'Title', 'Target', 'Match']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [63, 81, 181], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2 },
        didParseCell: (data) => {
          if (data.column.index === 2 && data.section === 'body') {
            const color = getSeverityColor(data.cell.raw);
            data.cell.styles.fillColor = color;
            data.cell.styles.textColor = 255;
          }
        },
      });
    } else if (report.report.checks) {
      // Config/RBAC/Infra Report
      const failedChecks = report.report.checks.filter(check => !check.success);
      const tableData = failedChecks.map(check => [
        check.checkID || 'N/A',
        check.title || 'N/A',
        check.category || 'N/A',
        check.severity || 'N/A',
        'Failed',
        check.description || 'N/A',
        check.messages?.join('\n') || 'N/A',
      ]);

      doc.autoTable({
        startY: startY,
        head: [['Check ID', 'Title', 'Category', 'Severity', 'Status', 'Description', 'Message']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [63, 81, 181], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 35 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 18 },
          5: { cellWidth: 50 },
          6: { cellWidth: 'auto' },
        },
        styles: { fontSize: 7, cellPadding: 2 },
        didParseCell: (data) => {
          if (data.column.index === 3 && data.section === 'body') {
            const color = getSeverityColor(data.cell.raw);
            data.cell.styles.fillColor = color;
            data.cell.styles.textColor = 255;
          }
          if (data.column.index === 4 && data.section === 'body') {
            data.cell.styles.fillColor = [211, 47, 47];
            data.cell.styles.textColor = 255;
          }
        },
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount} - Trivy Operator GUI`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    const fileName = `trivy-report-${report.metadata.name}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
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
        <Paper>
          <TableContainer>
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
                  <TableCell align="center"><strong>PDF</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vulnReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                        No vulnerability reports found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  vulnReports
                    .slice(vulnPage * vulnRowsPerPage, vulnPage * vulnRowsPerPage + vulnRowsPerPage)
                    .map((report, index) => (
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
                        <TableCell align="center">
                          <Tooltip title="Download PDF">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => exportToPDF(report, 'Vulnerability Report', e)}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={vulnReports.length}
            page={vulnPage}
            onPageChange={(e, newPage) => setVulnPage(newPage)}
            rowsPerPage={vulnRowsPerPage}
            onRowsPerPageChange={(e) => {
              setVulnRowsPerPage(parseInt(e.target.value, 10));
              setVulnPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Reports per page:"
          />
        </Paper>
      )}

      {/* Config Audit Reports Table */}
      {tabValue === 1 && (
        <Paper>
          <TableContainer>
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
                  <TableCell align="center"><strong>PDF</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {configReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                        No config audit reports found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  configReports
                    .slice(configPage * configRowsPerPage, configPage * configRowsPerPage + configRowsPerPage)
                    .map((report, index) => (
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
                        <TableCell align="center">
                          <Tooltip title="Download PDF">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => exportToPDF(report, 'Config Audit Report', e)}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={configReports.length}
            page={configPage}
            onPageChange={(e, newPage) => setConfigPage(newPage)}
            rowsPerPage={configRowsPerPage}
            onRowsPerPageChange={(e) => {
              setConfigRowsPerPage(parseInt(e.target.value, 10));
              setConfigPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Reports per page:"
          />
        </Paper>
      )}

      {/* Exposed Secret Reports Table */}
      {tabValue === 2 && (
        <Paper>
          <TableContainer>
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
                  <TableCell align="center"><strong>PDF</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {secretReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                        No exposed secret reports found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  secretReports
                    .slice(secretPage * secretRowsPerPage, secretPage * secretRowsPerPage + secretRowsPerPage)
                    .map((report, index) => (
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
                        <TableCell align="center">
                          <Tooltip title="Download PDF">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => exportToPDF(report, 'Exposed Secret Report', e)}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={secretReports.length}
            page={secretPage}
            onPageChange={(e, newPage) => setSecretPage(newPage)}
            rowsPerPage={secretRowsPerPage}
            onRowsPerPageChange={(e) => {
              setSecretRowsPerPage(parseInt(e.target.value, 10));
              setSecretPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Reports per page:"
          />
        </Paper>
      )}

      {/* RBAC Assessment Reports Table */}
      {tabValue === 3 && (
        <Paper>
          <TableContainer>
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
                  <TableCell align="center"><strong>PDF</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rbacReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                        No RBAC assessment reports found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rbacReports
                    .slice(rbacPage * rbacRowsPerPage, rbacPage * rbacRowsPerPage + rbacRowsPerPage)
                    .map((report, index) => (
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
                        <TableCell align="center">
                          <Tooltip title="Download PDF">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => exportToPDF(report, 'RBAC Assessment Report', e)}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={rbacReports.length}
            page={rbacPage}
            onPageChange={(e, newPage) => setRbacPage(newPage)}
            rowsPerPage={rbacRowsPerPage}
            onRowsPerPageChange={(e) => {
              setRbacRowsPerPage(parseInt(e.target.value, 10));
              setRbacPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Reports per page:"
          />
        </Paper>
      )}

      {/* Infrastructure Assessment Reports Table */}
      {tabValue === 4 && (
        <Paper>
          <TableContainer>
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
                  <TableCell align="center"><strong>PDF</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {infraReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                        No infrastructure assessment reports found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  infraReports
                    .slice(infraPage * infraRowsPerPage, infraPage * infraRowsPerPage + infraRowsPerPage)
                    .map((report, index) => (
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
                        <TableCell align="center">
                          <Tooltip title="Download PDF">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => exportToPDF(report, 'Infrastructure Assessment Report', e)}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={infraReports.length}
            page={infraPage}
            onPageChange={(e, newPage) => setInfraPage(newPage)}
            rowsPerPage={infraRowsPerPage}
            onRowsPerPageChange={(e) => {
              setInfraRowsPerPage(parseInt(e.target.value, 10));
              setInfraPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Reports per page:"
          />
        </Paper>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetail}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedReport?.metadata.name}
            </Typography>
            <Box>
              {selectedReport && (
                <Tooltip title="Download PDF">
                  <IconButton
                    color="primary"
                    onClick={(e) => {
                      const reportType = selectedReport.report.vulnerabilities
                        ? 'Vulnerability Report'
                        : selectedReport.report.secrets
                        ? 'Exposed Secret Report'
                        : 'Config/RBAC/Infra Report';
                      exportToPDF(selectedReport, reportType, e);
                    }}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              )}
              <IconButton onClick={handleCloseDetail} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
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
                        <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {vuln.title || 'N/A'}
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
                        <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {secret.match || 'N/A'}
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
                    <TableCell><strong>Message</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedReport.report.checks.filter(check => !check.success).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
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
                        <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {check.description || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {check.messages && check.messages.length > 0
                            ? check.messages.join('\n')
                            : 'N/A'}
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
