import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  DialogContentText,
  DialogActions,
  Button,
  Link,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import TableViewIcon from '@mui/icons-material/TableView';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  getVulnerabilityReports,
  getConfigAuditReports,
  getExposedSecretReports,
  getRbacAssessmentReports,
  getInfraAssessmentReports,
  getSBOMReports,
  getKBOMReports,
  getComplianceReports,
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
  const [searchParams] = useSearchParams();
  const initialTab = parseInt(searchParams.get('tab') || '0', 10);
  const [tabValue, setTabValue] = useState(initialTab);
  const [vulnReports, setVulnReports] = useState([]);
  const [configReports, setConfigReports] = useState([]);
  const [secretReports, setSecretReports] = useState([]);
  const [rbacReports, setRbacReports] = useState([]);
  const [infraReports, setInfraReports] = useState([]);
  const [sbomReports, setSbomReports] = useState([]);
  const [kbomReports, setKbomReports] = useState([]);
  const [complianceReports, setComplianceReports] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [showAllNamespacesWarning, setShowAllNamespacesWarning] = useState(false);
  const [pendingNamespace, setPendingNamespace] = useState('');

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
  const [sbomPage, setSbomPage] = useState(0);
  const [sbomRowsPerPage, setSbomRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [kbomPage, setKbomPage] = useState(0);
  const [kbomRowsPerPage, setKbomRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [compliancePage, setCompliancePage] = useState(0);
  const [complianceRowsPerPage, setComplianceRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const fetchNamespaces = async () => {
    try {
      const response = await getNamespaces();
      const nsList = response.data.namespaces || [];
      setNamespaces(nsList);

      // Set first namespace as default for better performance
      if (nsList.length > 0 && selectedNamespace === '') {
        setSelectedNamespace(nsList[0]);
      }
    } catch (err) {
      console.error('Failed to fetch namespaces:', err);
    }
  };

  // Lazy loading: Only fetch data for the active tab
  // forceReload: if true, reload data even if already loaded (used when namespace changes)
  const fetchTabData = async (tabIndex, forceReload = false) => {
    try {
      setLoading(true);
      setError(null);

      switch (tabIndex) {
        case 0: // Vulnerability Reports
          if (forceReload || vulnReports.length === 0) {
            const vulnResponse = await getVulnerabilityReports(selectedNamespace);
            setVulnReports(vulnResponse.data.items || []);
            setVulnPage(0);
          }
          break;
        case 1: // Config Audit Reports
          if (forceReload || configReports.length === 0) {
            const configResponse = await getConfigAuditReports(selectedNamespace);
            setConfigReports(configResponse.data.items || []);
            setConfigPage(0);
          }
          break;
        case 2: // Exposed Secret Reports
          if (forceReload || secretReports.length === 0) {
            const secretResponse = await getExposedSecretReports(selectedNamespace);
            setSecretReports(secretResponse.data.items || []);
            setSecretPage(0);
          }
          break;
        case 3: // RBAC Assessment Reports
          if (forceReload || rbacReports.length === 0) {
            const rbacResponse = await getRbacAssessmentReports(selectedNamespace);
            setRbacReports(rbacResponse.data.items || []);
            setRbacPage(0);
          }
          break;
        case 4: // Infra Assessment Reports
          if (forceReload || infraReports.length === 0) {
            const infraResponse = await getInfraAssessmentReports(selectedNamespace);
            setInfraReports(infraResponse.data.items || []);
            setInfraPage(0);
          }
          break;
        case 5: // SBOM Reports
          if (forceReload || sbomReports.length === 0) {
            const sbomResponse = await getSBOMReports(selectedNamespace);
            setSbomReports(sbomResponse.data.items || []);
            setSbomPage(0);
          }
          break;
        case 6: // KBOM Reports
          if (forceReload || kbomReports.length === 0) {
            const kbomResponse = await getKBOMReports(selectedNamespace);
            setKbomReports(kbomResponse.data.items || []);
            setKbomPage(0);
          }
          break;
        case 7: // Compliance Reports
          if (forceReload || complianceReports.length === 0) {
            const complianceResponse = await getComplianceReports(selectedNamespace);
            setComplianceReports(complianceResponse.data.items || []);
            setCompliancePage(0);
          }
          break;
        default:
          break;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  // Refresh all data for current tab
  const refreshTabData = async () => {
    // Clear current tab data to force reload
    switch (tabValue) {
      case 0:
        setVulnReports([]);
        break;
      case 1:
        setConfigReports([]);
        break;
      case 2:
        setSecretReports([]);
        break;
      case 3:
        setRbacReports([]);
        break;
      case 4:
        setInfraReports([]);
        break;
      case 5:
        setSbomReports([]);
        break;
      case 6:
        setKbomReports([]);
        break;
      case 7:
        setComplianceReports([]);
        break;
      default:
        break;
    }
    // Fetch data for current tab
    await fetchTabData(tabValue);
  };

  useEffect(() => {
    // On mount, fetch namespaces and initial data
    fetchNamespaces();
    // Load initial tab data with "All Namespaces" (empty string is the default)
    fetchTabData(tabValue);
  }, []);

  useEffect(() => {
    // When namespace changes, force reload current tab
    // Force reload current tab data with new namespace
    fetchTabData(tabValue, true);
  }, [selectedNamespace]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Load data for the new tab
    fetchTabData(newValue);
  };

  const handleOpenDetail = (report) => {
    setSelectedReport(report);
    setDetailDialogOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedReport(null);
  };

  const handleNamespaceChange = (newNamespace) => {
    // If user selects "All Namespaces", show warning
    if (newNamespace === '') {
      setPendingNamespace(newNamespace);
      setShowAllNamespacesWarning(true);
    } else {
      setSelectedNamespace(newNamespace);
    }
  };

  const confirmAllNamespaces = () => {
    setSelectedNamespace(pendingNamespace);
    setShowAllNamespacesWarning(false);
  };

  const cancelAllNamespaces = () => {
    setShowAllNamespacesWarning(false);
    setPendingNamespace('');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  // Helper function to escape CSV values
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
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

      autoTable(doc, {
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

      autoTable(doc, {
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

      autoTable(doc, {
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

  // CSV Export function
  const exportToCSV = (report, reportType, event) => {
    event.stopPropagation();

    let headers = [];
    let rows = [];

    if (report.report.vulnerabilities) {
      headers = ['CVE ID', 'Package', 'Installed Version', 'Fixed Version', 'Severity', 'Title', 'Primary Link'];
      rows = report.report.vulnerabilities.map(vuln => [
        vuln.vulnerabilityID || '',
        vuln.resource || '',
        vuln.installedVersion || '',
        vuln.fixedVersion || '',
        vuln.severity || '',
        vuln.title || '',
        vuln.primaryLink || '',
      ]);
    } else if (report.report.secrets) {
      headers = ['Rule ID', 'Category', 'Severity', 'Title', 'Target', 'Match'];
      rows = report.report.secrets.map(secret => [
        secret.ruleID || '',
        secret.category || '',
        secret.severity || '',
        secret.title || '',
        secret.target || '',
        secret.match || '',
      ]);
    } else if (report.report.checks) {
      headers = ['Check ID', 'Title', 'Category', 'Severity', 'Status', 'Description', 'Message', 'Remediation'];
      rows = report.report.checks.filter(check => !check.success).map(check => [
        check.checkID || '',
        check.title || '',
        check.category || '',
        check.severity || '',
        'Failed',
        check.description || '',
        check.messages?.join(' | ') || '',
        check.remediation || '',
      ]);
    }

    // Build CSV content
    const csvContent = [
      `# Trivy Security Report - ${reportType}`,
      `# Report: ${report.metadata.name}`,
      `# Namespace: ${report.metadata.namespace || 'N/A'}`,
      `# Generated: ${new Date().toISOString()}`,
      `# Summary: Critical=${report.report.summary.criticalCount || 0}, High=${report.report.summary.highCount || 0}, Medium=${report.report.summary.mediumCount || 0}, Low=${report.report.summary.lowCount || 0}`,
      '',
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `trivy-report-${report.metadata.name}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Export all reports with FULL DETAILS to PDF
  const exportAllToPDF = () => {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const namespace = selectedNamespace || 'All Namespaces';
      let yPosition = 20;

      // Determine which category to export based on current tab
      const tabNames = [
        'Vulnerability Reports',
        'Configuration Audit Reports',
        'Exposed Secrets Reports',
        'RBAC Assessment Reports',
        'Infrastructure Assessment Reports',
        'SBOM Reports',
        'KBOM Reports',
        'Compliance Reports'
      ];

      // Title Page
      doc.setFontSize(20);
      doc.setTextColor(33, 37, 41);
      doc.text(`Trivy Operator - ${tabNames[tabValue]}`, 14, yPosition);

      yPosition += 10;
      doc.setFontSize(12);
      doc.text(`Namespace: ${namespace}`, 14, yPosition);

      yPosition += 7;
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);

      // Export only the current tab's data
      switch (tabValue) {
        case 0: // Vulnerability Reports
          if (vulnReports.length > 0) {
            doc.addPage();
            yPosition = 20;
            doc.setFontSize(16);
            doc.setTextColor(211, 47, 47);
            doc.text('VULNERABILITY REPORTS', 14, yPosition);
            yPosition += 10;

            vulnReports.forEach((report, idx) => {
              const vulns = report.report?.vulnerabilities || [];
              const tableData = vulns.length === 0
                ? [['No vulnerabilities found', '', '', '', '']]
                : vulns.map(v => [
                    (v.vulnerabilityID || '').substring(0, 20),
                    (v.resource || v.pkgName || '').substring(0, 30),
                    (v.installedVersion || '').substring(0, 15),
                    (v.fixedVersion || '').substring(0, 15),
                    v.severity || ''
                  ]);

              autoTable(doc, {
                startY: yPosition,
                head: [[`Report: ${report.metadata?.name || 'Unknown'} (${report.metadata?.namespace || 'N/A'})`]],
                headStyles: { fillColor: [211, 47, 47], fontSize: 10 },
                margin: { left: 14 },
                styles: { fontSize: 8 }
              });

              autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 2,
                head: [['CVE ID', 'Package', 'Installed', 'Fixed', 'Severity']],
                body: tableData,
                headStyles: { fillColor: [100, 100, 100], fontSize: 8 },
                styles: { fontSize: 7 },
                margin: { left: 14 }
              });

              yPosition = doc.lastAutoTable.finalY + 10;
              if (yPosition > 180 && idx < vulnReports.length - 1) {
                doc.addPage();
                yPosition = 20;
              }
            });

            // Save PDF with category-specific filename
            const categoryName = tabNames[tabValue].replace(/\s+/g, '-').toLowerCase();
            doc.save(`trivy-${categoryName}-${namespace.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
          } else {
            alert('Aucun rapport de vulnérabilité à exporter');
          }
          break;

        case 1: // Config Audit Reports
          if (configReports.length > 0) {
            doc.addPage();
            yPosition = 20;
            doc.setFontSize(16);
            doc.setTextColor(245, 124, 0);
            doc.text('CONFIGURATION AUDIT REPORTS', 14, yPosition);
            yPosition += 10;

            configReports.forEach((report, idx) => {
              const checks = report.report?.checks || [];
              const tableData = checks.length === 0
                ? [['No issues found', '', '', '']]
                : checks.filter(c => !c.success).map(c => [
                    (c.checkID || '').substring(0, 15),
                    (c.title || '').substring(0, 50),
                    c.severity || '',
                    c.success ? 'PASS' : 'FAIL'
                  ]);

              autoTable(doc, {
                startY: yPosition,
                head: [[`Report: ${report.metadata?.name || 'Unknown'} (${report.metadata?.namespace || 'N/A'})`]],
                headStyles: { fillColor: [245, 124, 0], fontSize: 10 },
                margin: { left: 14 }
              });

              autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 2,
                head: [['Check ID', 'Title', 'Severity', 'Status']],
                body: tableData,
                headStyles: { fillColor: [100, 100, 100], fontSize: 8 },
                styles: { fontSize: 7 },
                margin: { left: 14 }
              });

              yPosition = doc.lastAutoTable.finalY + 10;
              if (yPosition > 180 && idx < configReports.length - 1) {
                doc.addPage();
                yPosition = 20;
              }
            });

            // Save PDF with category-specific filename
            const categoryName = tabNames[tabValue].replace(/\s+/g, '-').toLowerCase();
            doc.save(`trivy-${categoryName}-${namespace.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
          } else {
            alert('Aucun rapport de configuration à exporter');
          }
          break;

        case 2: // Exposed Secrets
          if (secretReports.length > 0) {
            doc.addPage();
            yPosition = 20;
            doc.setFontSize(16);
            doc.setTextColor(156, 39, 176);
            doc.text('EXPOSED SECRETS REPORTS', 14, yPosition);
            yPosition += 10;

            secretReports.forEach((report, idx) => {
              const secrets = report.report?.secrets || [];
              const tableData = secrets.length === 0
                ? [['No secrets found', '', '', '']]
                : secrets.map(s => [
                    (s.ruleID || '').substring(0, 20),
                    (s.title || '').substring(0, 40),
                    s.severity || '',
                    (s.target || '').substring(0, 30)
                  ]);

              autoTable(doc, {
                startY: yPosition,
                head: [[`Report: ${report.metadata?.name || 'Unknown'} (${report.metadata?.namespace || 'N/A'})`]],
                headStyles: { fillColor: [156, 39, 176], fontSize: 10 },
                margin: { left: 14 }
              });

              autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 2,
                head: [['Rule ID', 'Title', 'Severity', 'Target']],
                body: tableData,
                headStyles: { fillColor: [100, 100, 100], fontSize: 8 },
                styles: { fontSize: 7 },
                margin: { left: 14 }
              });

              yPosition = doc.lastAutoTable.finalY + 10;
              if (yPosition > 180 && idx < secretReports.length - 1) {
                doc.addPage();
                yPosition = 20;
              }
            });

            // Save PDF with category-specific filename
            const categoryName = tabNames[tabValue].replace(/\s+/g, '-').toLowerCase();
            doc.save(`trivy-${categoryName}-${namespace.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
          } else {
            alert('Aucun rapport de secrets à exporter');
          }
          break;

        case 3: // RBAC Assessment
          if (rbacReports.length > 0) {
            doc.addPage();
            yPosition = 20;
            doc.setFontSize(16);
            doc.setTextColor(33, 150, 243);
            doc.text('RBAC ASSESSMENT REPORTS', 14, yPosition);
            yPosition += 10;

            rbacReports.forEach((report, idx) => {
              const checks = report.report?.checks || [];
              const tableData = checks.length === 0
                ? [['No RBAC issues found', '', '', '']]
                : checks.filter(c => !c.success).map(c => [
                    (c.checkID || '').substring(0, 15),
                    (c.title || '').substring(0, 50),
                    c.severity || '',
                    c.success ? 'PASS' : 'FAIL'
                  ]);

              autoTable(doc, {
                startY: yPosition,
                head: [[`Report: ${report.metadata?.name || 'Unknown'} (${report.metadata?.namespace || 'N/A'})`]],
                headStyles: { fillColor: [33, 150, 243], fontSize: 10 },
                margin: { left: 14 }
              });

              autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 2,
                head: [['Check ID', 'Title', 'Severity', 'Status']],
                body: tableData,
                headStyles: { fillColor: [100, 100, 100], fontSize: 8 },
                styles: { fontSize: 7 },
                margin: { left: 14 }
              });

              yPosition = doc.lastAutoTable.finalY + 10;
              if (yPosition > 180 && idx < rbacReports.length - 1) {
                doc.addPage();
                yPosition = 20;
              }
            });

            // Save PDF with category-specific filename
            const categoryName = tabNames[tabValue].replace(/\s+/g, '-').toLowerCase();
            doc.save(`trivy-${categoryName}-${namespace.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
          } else {
            alert('Aucun rapport RBAC à exporter');
          }
          break;

        case 4: // Infra Assessment
          if (infraReports.length > 0) {
            doc.addPage();
            yPosition = 20;
            doc.setFontSize(16);
            doc.setTextColor(255, 152, 0);
            doc.text('INFRASTRUCTURE ASSESSMENT REPORTS', 14, yPosition);
            yPosition += 10;

            infraReports.forEach((report, idx) => {
              const checks = report.report?.checks || [];
              const tableData = checks.length === 0
                ? [['No infrastructure issues found', '', '', '']]
                : checks.filter(c => !c.success).map(c => [
                    (c.checkID || '').substring(0, 15),
                    (c.title || '').substring(0, 50),
                    c.severity || '',
                    c.success ? 'PASS' : 'FAIL'
                  ]);

              autoTable(doc, {
                startY: yPosition,
                head: [[`Report: ${report.metadata?.name || 'Unknown'}`]],
                headStyles: { fillColor: [255, 152, 0], fontSize: 10 },
                margin: { left: 14 }
              });

              autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 2,
                head: [['Check ID', 'Title', 'Severity', 'Status']],
                body: tableData,
                headStyles: { fillColor: [100, 100, 100], fontSize: 8 },
                styles: { fontSize: 7 },
                margin: { left: 14 }
              });

              yPosition = doc.lastAutoTable.finalY + 10;
              if (yPosition > 180 && idx < infraReports.length - 1) {
                doc.addPage();
                yPosition = 20;
              }
            });

            // Save PDF with category-specific filename
            const categoryName = tabNames[tabValue].replace(/\s+/g, '-').toLowerCase();
            doc.save(`trivy-${categoryName}-${namespace.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
          } else {
            alert('Aucun rapport d\'infrastructure à exporter');
          }
          break;

        case 5: // SBOM Reports
          if (sbomReports.length > 0) {
            doc.addPage();
            yPosition = 20;
            doc.setFontSize(16);
            doc.setTextColor(94, 53, 177);
            doc.text('SBOM REPORTS - Component Summary', 14, yPosition);
            yPosition += 10;

            const sbomSummaryData = sbomReports.map(report => [
              report.metadata?.name || 'Unknown',
              report.metadata?.namespace || 'N/A',
              report.report?.components?.components?.length || 0,
              report.report?.scanner?.name || 'N/A'
            ]);

            autoTable(doc, {
              startY: yPosition,
              head: [['Report Name', 'Namespace', 'Components', 'Scanner']],
              body: sbomSummaryData,
              headStyles: { fillColor: [94, 53, 177], fontSize: 10 },
              styles: { fontSize: 8 },
              margin: { left: 14 }
            });

            // Save PDF with category-specific filename
            const categoryName = tabNames[tabValue].replace(/\s+/g, '-').toLowerCase();
            doc.save(`trivy-${categoryName}-${namespace.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
          } else {
            alert('Aucun rapport SBOM à exporter');
          }
          break;

        case 6: // KBOM Reports
          if (kbomReports.length > 0) {
            doc.addPage();
            yPosition = 20;
            doc.setFontSize(16);
            doc.setTextColor(0, 150, 136);
            doc.text('KBOM REPORTS - Component Summary', 14, yPosition);
            yPosition += 10;

            const kbomSummaryData = kbomReports.map(report => [
              report.metadata?.name || 'Unknown',
              report.report?.components?.components?.length || 0,
              report.report?.scanner?.name || 'N/A'
            ]);

            autoTable(doc, {
              startY: yPosition,
              head: [['Report Name', 'Components', 'Scanner']],
              body: kbomSummaryData,
              headStyles: { fillColor: [0, 150, 136], fontSize: 10 },
              styles: { fontSize: 8 },
              margin: { left: 14 }
            });

            // Save PDF with category-specific filename
            const categoryName = tabNames[tabValue].replace(/\s+/g, '-').toLowerCase();
            doc.save(`trivy-${categoryName}-${namespace.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
          } else {
            alert('Aucun rapport KBOM à exporter');
          }
          break;

        case 7: // Compliance Reports
          if (complianceReports.length > 0) {
            doc.addPage();
            yPosition = 20;
            doc.setFontSize(16);
            doc.setTextColor(67, 160, 71);
            doc.text('COMPLIANCE REPORTS', 14, yPosition);
            yPosition += 10;

            complianceReports.forEach((report, idx) => {
              const controls = report.spec?.compliance?.controls || [];
              const failedControls = controls.filter(c => (c.totalFail || 0) > 0);
              const tableData = failedControls.length === 0
                ? [['All controls passed', '', '', '']]
                : failedControls.map(c => [
                    (c.id || '').substring(0, 15),
                    (c.name || '').substring(0, 50),
                    c.severity || '',
                    c.totalFail || 0
                  ]);

              autoTable(doc, {
                startY: yPosition,
                head: [[`Report: ${report.metadata?.name || 'Unknown'} - ${report.spec?.compliance?.title || 'Compliance'}`]],
                headStyles: { fillColor: [67, 160, 71], fontSize: 10 },
                margin: { left: 14 }
              });

              autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 2,
                head: [['Control ID', 'Name', 'Severity', 'Failures']],
                body: tableData,
                headStyles: { fillColor: [100, 100, 100], fontSize: 8 },
                styles: { fontSize: 7 },
                margin: { left: 14 }
              });

              yPosition = doc.lastAutoTable.finalY + 10;
              if (yPosition > 180 && idx < complianceReports.length - 1) {
                doc.addPage();
                yPosition = 20;
              }
            });

            // Save PDF with category-specific filename
            const categoryName = tabNames[tabValue].replace(/\s+/g, '-').toLowerCase();
            doc.save(`trivy-${categoryName}-${namespace.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
          } else {
            alert('Aucun rapport de compliance à exporter');
          }
          break;
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF: ' + error.message);
    }
  };

  // Helper function to download a CSV file
  const downloadCSV = (filename, content) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Export reports for current tab category only
  const exportAllToCSV = () => {
    const namespace = selectedNamespace || 'All-Namespaces';
    const date = new Date().toISOString().split('T')[0];
    const namespaceSlug = namespace.replace(/[^a-z0-9]/gi, '-');

    const csvRows = [];

    // Export only the current tab's data
    switch (tabValue) {
      case 0: // Vulnerability Reports CSV
        if (vulnReports.length > 0) {
          csvRows.push('# Trivy Operator - Vulnerability Reports');
          csvRows.push(`# Namespace: ${namespace}`);
          csvRows.push(`# Generated: ${new Date().toISOString()}`);
          csvRows.push('');
          csvRows.push('Report Name,Namespace,CVE ID,Package,Installed Version,Fixed Version,Severity,Score,Title,Description,Primary Link');

          vulnReports.forEach(report => {
            const reportName = report.metadata.name;
            const reportNs = report.metadata.namespace;
            const vulns = report.report?.vulnerabilities || [];
            if (vulns.length === 0) {
              csvRows.push([reportName, reportNs, 'No vulnerabilities found', '', '', '', '', '', '', '', ''].map(escapeCSV).join(','));
            } else {
              vulns.forEach(vuln => {
                csvRows.push([
                  reportName,
                  reportNs,
                  vuln.vulnerabilityID || '',
                  vuln.resource || vuln.pkgName || '',
                  vuln.installedVersion || '',
                  vuln.fixedVersion || '',
                  vuln.severity || '',
                  vuln.score || '',
                  vuln.title || '',
                  (vuln.description || '').substring(0, 200),
                  vuln.primaryLink || ''
                ].map(escapeCSV).join(','));
              });
            }
          });

          downloadCSV(`${namespaceSlug}-vulnerabilities-${date}.csv`, csvRows.join('\n'));
        } else {
          alert('Aucun rapport de vulnérabilité à exporter');
        }
        break;

      case 1: // Config Audit Reports CSV
        if (configReports.length > 0) {
          csvRows.push('# Trivy Operator - Configuration Audit Reports');
          csvRows.push(`# Namespace: ${namespace}`);
          csvRows.push(`# Generated: ${new Date().toISOString()}`);
          csvRows.push('');
          csvRows.push('Report Name,Namespace,Check ID,Title,Category,Severity,Description,Success,Messages');

          configReports.forEach(report => {
            const reportName = report.metadata.name;
            const reportNs = report.metadata.namespace;
            const checks = report.report?.checks || [];
            if (checks.length === 0) {
              csvRows.push([reportName, reportNs, 'No issues found', '', '', '', '', '', ''].map(escapeCSV).join(','));
            } else {
              checks.forEach(check => {
                csvRows.push([
                  reportName,
                  reportNs,
                  check.checkID || '',
                  check.title || '',
                  check.category || '',
                  check.severity || '',
                  (check.description || '').substring(0, 200),
                  check.success ? 'Yes' : 'No',
                  (check.messages || []).join('; ')
                ].map(escapeCSV).join(','));
              });
            }
          });

          downloadCSV(`${namespaceSlug}-config-audit-${date}.csv`, csvRows.join('\n'));
        } else {
          alert('Aucun rapport de configuration à exporter');
        }
        break;

      case 2: // Exposed Secrets CSV
        if (secretReports.length > 0) {
          csvRows.push('# Trivy Operator - Exposed Secrets Reports');
          csvRows.push(`# Namespace: ${namespace}`);
          csvRows.push(`# Generated: ${new Date().toISOString()}`);
          csvRows.push('');
          csvRows.push('Report Name,Namespace,Rule ID,Category,Title,Severity,Target,Match');

          secretReports.forEach(report => {
            const reportName = report.metadata.name;
            const reportNs = report.metadata.namespace;
            const secrets = report.report?.secrets || [];
            if (secrets.length === 0) {
              csvRows.push([reportName, reportNs, 'No secrets found', '', '', '', '', ''].map(escapeCSV).join(','));
            } else {
              secrets.forEach(secret => {
                csvRows.push([
                  reportName,
                  reportNs,
                  secret.ruleID || '',
                  secret.category || '',
                  secret.title || '',
                  secret.severity || '',
                  secret.target || '',
                  secret.match || ''
                ].map(escapeCSV).join(','));
              });
            }
          });

          downloadCSV(`${namespaceSlug}-exposed-secrets-${date}.csv`, csvRows.join('\n'));
        } else {
          alert('Aucun rapport de secrets à exporter');
        }
        break;

      case 3: // RBAC Assessment CSV
        if (rbacReports.length > 0) {
          csvRows.push('# Trivy Operator - RBAC Assessment Reports');
          csvRows.push(`# Namespace: ${namespace}`);
          csvRows.push(`# Generated: ${new Date().toISOString()}`);
          csvRows.push('');
          csvRows.push('Report Name,Namespace,Check ID,Title,Category,Severity,Description,Success');

          rbacReports.forEach(report => {
            const reportName = report.metadata.name;
            const reportNs = report.metadata.namespace;
            const checks = report.report?.checks || [];
            if (checks.length === 0) {
              csvRows.push([reportName, reportNs, 'No RBAC issues found', '', '', '', '', ''].map(escapeCSV).join(','));
            } else {
              checks.forEach(check => {
                csvRows.push([
                  reportName,
                  reportNs,
                  check.checkID || '',
                  check.title || '',
                  check.category || '',
                  check.severity || '',
                  (check.description || '').substring(0, 200),
                  check.success ? 'Yes' : 'No'
                ].map(escapeCSV).join(','));
              });
            }
          });

          downloadCSV(`${namespaceSlug}-rbac-assessment-${date}.csv`, csvRows.join('\n'));
        } else {
          alert('Aucun rapport RBAC à exporter');
        }
        break;

      case 4: // Infrastructure Assessment CSV
        if (infraReports.length > 0) {
          csvRows.push('# Trivy Operator - Infrastructure Assessment Reports');
          csvRows.push(`# Namespace: cluster-wide`);
          csvRows.push(`# Generated: ${new Date().toISOString()}`);
          csvRows.push('');
          csvRows.push('Report Name,Check ID,Title,Category,Severity,Description,Success');

          infraReports.forEach(report => {
            const reportName = report.metadata.name;
            const checks = report.report?.checks || [];
            if (checks.length === 0) {
              csvRows.push([reportName, 'No infrastructure issues found', '', '', '', '', ''].map(escapeCSV).join(','));
            } else {
              checks.forEach(check => {
                csvRows.push([
                  reportName,
                  check.checkID || '',
                  check.title || '',
                  check.category || '',
                  check.severity || '',
                  (check.description || '').substring(0, 200),
                  check.success ? 'Yes' : 'No'
                ].map(escapeCSV).join(','));
              });
            }
          });

          downloadCSV(`cluster-infra-assessment-${date}.csv`, csvRows.join('\n'));
        } else {
          alert('Aucun rapport d\'infrastructure à exporter');
        }
        break;

      case 5: // SBOM Reports CSV
        if (sbomReports.length > 0) {
          csvRows.push('# Trivy Operator - SBOM Reports (Software Bill of Materials)');
          csvRows.push(`# Namespace: ${namespace}`);
          csvRows.push(`# Generated: ${new Date().toISOString()}`);
          csvRows.push('');
          csvRows.push('Report Name,Namespace,Component Name,Version,Type,Licenses');

          sbomReports.forEach(report => {
            const reportName = report.metadata.name;
            const reportNs = report.metadata.namespace;
            const components = report.report?.components?.components || [];
            if (components.length === 0) {
              csvRows.push([reportName, reportNs, 'No components found', '', '', ''].map(escapeCSV).join(','));
            } else {
              components.forEach(comp => {
                const licenses = (comp.licenses || []).map(l => l.license?.name || l.license?.id || 'Unknown').join('; ');
                csvRows.push([
                  reportName,
                  reportNs,
                  comp.name || '',
                  comp.version || '',
                  comp.type || '',
                  licenses
                ].map(escapeCSV).join(','));
              });
            }
          });

          downloadCSV(`${namespaceSlug}-sbom-${date}.csv`, csvRows.join('\n'));
        } else {
          alert('Aucun rapport SBOM à exporter');
        }
        break;

      case 6: // KBOM Reports CSV
        if (kbomReports.length > 0) {
          csvRows.push('# Trivy Operator - KBOM Reports (Kubernetes Bill of Materials)');
          csvRows.push(`# Namespace: cluster-wide`);
          csvRows.push(`# Generated: ${new Date().toISOString()}`);
          csvRows.push('');
          csvRows.push('Report Name,Component Name,Version,Type');

          kbomReports.forEach(report => {
            const reportName = report.metadata.name;
            const components = report.report?.components?.components || [];
            if (components.length === 0) {
              csvRows.push([reportName, 'No components found', '', ''].map(escapeCSV).join(','));
            } else {
              components.forEach(comp => {
                csvRows.push([
                  reportName,
                  comp.name || '',
                  comp.version || '',
                  comp.type || ''
                ].map(escapeCSV).join(','));
              });
            }
          });

          downloadCSV(`cluster-kbom-${date}.csv`, csvRows.join('\n'));
        } else {
          alert('Aucun rapport KBOM à exporter');
        }
        break;

      case 7: // Compliance Reports CSV
        if (complianceReports.length > 0) {
          csvRows.push('# Trivy Operator - Compliance Reports');
          csvRows.push(`# Namespace: cluster-wide`);
          csvRows.push(`# Generated: ${new Date().toISOString()}`);
          csvRows.push('');
          csvRows.push('Report Name,Compliance Type,Control ID,Name,Severity,Total Fail,Description');

          complianceReports.forEach(report => {
            const reportName = report.metadata.name;
            const complianceType = report.spec?.compliance?.title || 'Unknown';
            const controls = report.spec?.compliance?.controls || [];
            if (controls.length === 0) {
              csvRows.push([reportName, complianceType, 'No controls found', '', '', '', ''].map(escapeCSV).join(','));
            } else {
              controls.forEach(control => {
                csvRows.push([
                  reportName,
                  complianceType,
                  control.id || '',
                  control.name || '',
                  control.severity || '',
                  control.totalFail || 0,
                  (control.description || '').substring(0, 200)
                ].map(escapeCSV).join(','));
              });
            }
          });

          downloadCSV(`cluster-compliance-${date}.csv`, csvRows.join('\n'));
        } else {
          alert('Aucun rapport de compliance à exporter');
        }
        break;
    }
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
          <Tooltip title="Download complete details of all reports as PDF">
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={exportAllToPDF}
            >
              Export All (PDF)
            </Button>
          </Tooltip>
          <Tooltip title="Download complete details of all reports as CSV">
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<TableViewIcon />}
              onClick={exportAllToCSV}
            >
              Export All (CSV)
            </Button>
          </Tooltip>
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Namespace</InputLabel>
            <Select
              value={selectedNamespace}
              onChange={(e) => handleNamespaceChange(e.target.value)}
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
          <IconButton onClick={refreshTabData} color="primary">
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
          <Tab label={`Vulnerability Reports${vulnReports.length > 0 ? ` (${vulnReports.length})` : ''}`} />
          <Tab label={`Config Audit${configReports.length > 0 ? ` (${configReports.length})` : ''}`} />
          <Tab label={`Exposed Secrets${secretReports.length > 0 ? ` (${secretReports.length})` : ''}`} />
          <Tab label={`RBAC Assessment${rbacReports.length > 0 ? ` (${rbacReports.length})` : ''}`} />
          <Tab label={`Infra Assessment${infraReports.length > 0 ? ` (${infraReports.length})` : ''}`} />
          <Tab label={`SBOM Reports${sbomReports.length > 0 ? ` (${sbomReports.length})` : ''}`} />
          <Tab label={`KBOM Reports${kbomReports.length > 0 ? ` (${kbomReports.length})` : ''}`} />
          <Tab label={`Compliance Reports${complianceReports.length > 0 ? ` (${complianceReports.length})` : ''}`} />
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
                  <TableCell align="center"><strong>Export</strong></TableCell>
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
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Download PDF">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => exportToPDF(report, 'Vulnerability Report', e)}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download CSV">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={(e) => exportToCSV(report, 'Vulnerability Report', e)}
                              >
                                <TableViewIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
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
                  <TableCell align="center"><strong>Export</strong></TableCell>
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
                          <Tooltip title="Download CSV">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={(e) => exportToCSV(report, 'Config Audit Report', e)}
                            >
                              <TableViewIcon />
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
                  <TableCell align="center"><strong>Export</strong></TableCell>
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
                          <Tooltip title="Download CSV">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={(e) => exportToCSV(report, 'Exposed Secret Report', e)}
                            >
                              <TableViewIcon />
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
                  <TableCell align="center"><strong>Export</strong></TableCell>
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
                          <Tooltip title="Download CSV">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={(e) => exportToCSV(report, 'RBAC Assessment Report', e)}
                            >
                              <TableViewIcon />
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
                  <TableCell align="center"><strong>Export</strong></TableCell>
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
                          <Tooltip title="Download CSV">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={(e) => exportToCSV(report, 'Infrastructure Assessment Report', e)}
                            >
                              <TableViewIcon />
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

      {/* SBOM Reports Table */}
      {tabValue === 5 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Namespace</strong></TableCell>
                  <TableCell><strong>Image</strong></TableCell>
                  <TableCell><strong>Scanner</strong></TableCell>
                  <TableCell align="center"><strong>Components</strong></TableCell>
                  <TableCell align="center"><strong>Dependencies</strong></TableCell>
                  <TableCell><strong>Updated</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sbomReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                        No SBOM reports found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sbomReports
                    .slice(sbomPage * sbomRowsPerPage, sbomPage * sbomRowsPerPage + sbomRowsPerPage)
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
                          <Chip
                            label={report.report.summary.componentsCount || 0}
                            size="small"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={report.report.summary.dependenciesCount || 0}
                            size="small"
                            color="secondary"
                          />
                        </TableCell>
                        <TableCell>{formatDate(report.report.updateTimestamp)}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={sbomReports.length}
            page={sbomPage}
            onPageChange={(e, newPage) => setSbomPage(newPage)}
            rowsPerPage={sbomRowsPerPage}
            onRowsPerPageChange={(e) => {
              setSbomRowsPerPage(parseInt(e.target.value, 10));
              setSbomPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Reports per page:"
          />
        </Paper>
      )}

      {/* KBOM Reports Table */}
      {tabValue === 6 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Scanner</strong></TableCell>
                  <TableCell align="center"><strong>Components</strong></TableCell>
                  <TableCell align="center"><strong>Dependencies</strong></TableCell>
                  <TableCell><strong>Updated</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {kbomReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                        No KBOM reports found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  kbomReports
                    .slice(kbomPage * kbomRowsPerPage, kbomPage * kbomRowsPerPage + kbomRowsPerPage)
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
                          <Chip
                            label={report.report.summary.componentsCount || 0}
                            size="small"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={report.report.summary.dependenciesCount || 0}
                            size="small"
                            color="secondary"
                          />
                        </TableCell>
                        <TableCell>{formatDate(report.report.updateTimestamp)}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={kbomReports.length}
            page={kbomPage}
            onPageChange={(e, newPage) => setKbomPage(newPage)}
            rowsPerPage={kbomRowsPerPage}
            onRowsPerPageChange={(e) => {
              setKbomRowsPerPage(parseInt(e.target.value, 10));
              setKbomPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Reports per page:"
          />
        </Paper>
      )}

      {/* Compliance Reports Table */}
      {tabValue === 7 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Scanner</strong></TableCell>
                  <TableCell align="center"><strong>Pass</strong></TableCell>
                  <TableCell align="center"><strong>Fail</strong></TableCell>
                  <TableCell align="center"><strong>Warn</strong></TableCell>
                  <TableCell align="center"><strong>Skip</strong></TableCell>
                  <TableCell><strong>Updated</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {complianceReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                        No compliance reports found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  complianceReports
                    .slice(compliancePage * complianceRowsPerPage, compliancePage * complianceRowsPerPage + complianceRowsPerPage)
                    .map((report, index) => (
                      <TableRow
                        key={index}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleOpenDetail(report)}
                      >
                        <TableCell>{report.metadata.name}</TableCell>
                        <TableCell>{report.spec?.compliance?.title || 'Compliance Report'}</TableCell>
                        <TableCell>Trivy Operator</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={report.status?.summary?.passCount || 0}
                            size="small"
                            sx={{ bgcolor: SEVERITY_COLORS.LOW, color: 'white' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={report.status?.summary?.failCount || 0}
                            size="small"
                            sx={{ bgcolor: SEVERITY_COLORS.CRITICAL, color: 'white' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={report.status?.summary?.warnCount || 0}
                            size="small"
                            sx={{ bgcolor: SEVERITY_COLORS.MEDIUM, color: 'white' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={report.status?.summary?.skipCount || 0}
                            size="small"
                            sx={{ bgcolor: SEVERITY_COLORS.UNKNOWN, color: 'white' }}
                          />
                        </TableCell>
                        <TableCell>{formatDate(report.status?.updateTimestamp)}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={complianceReports.length}
            page={compliancePage}
            onPageChange={(e, newPage) => setCompliancePage(newPage)}
            rowsPerPage={complianceRowsPerPage}
            onRowsPerPageChange={(e) => {
              setComplianceRowsPerPage(parseInt(e.target.value, 10));
              setCompliancePage(0);
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {selectedReport && (selectedReport.report || selectedReport.spec) && (
                <>
                  <Tooltip title="Download PDF">
                    <IconButton
                      color="primary"
                      onClick={(e) => {
                        const reportType = selectedReport.report.vulnerabilities
                          ? 'Vulnerability Report'
                          : selectedReport.report.secrets
                          ? 'Exposed Secret Report'
                          : selectedReport.report.checks
                          ? 'Config/RBAC/Infra Report'
                          : 'SBOM/KBOM Report';
                        exportToPDF(selectedReport, reportType, e);
                      }}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download CSV">
                    <IconButton
                      color="success"
                      onClick={(e) => {
                        const reportType = selectedReport.report.vulnerabilities
                          ? 'Vulnerability Report'
                          : selectedReport.report.secrets
                          ? 'Exposed Secret Report'
                          : selectedReport.report.checks
                          ? 'Config/RBAC/Infra Report'
                          : 'SBOM/KBOM Report';
                        exportToCSV(selectedReport, reportType, e);
                      }}
                    >
                      <TableViewIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              <IconButton onClick={handleCloseDetail} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedReport && selectedReport.report && selectedReport.report.vulnerabilities && (
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
          {selectedReport && selectedReport.report && selectedReport.report.secrets && (
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
          {selectedReport && selectedReport.report && selectedReport.report.checks && (
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
          {selectedReport && selectedReport.report && selectedReport.report.components && selectedReport.report.components.components && (
            /* SBOM Report Details */
            <>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>BOM Format:</strong> {selectedReport.report.components.bomFormat || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Total Components:</strong> {selectedReport.report.components.components?.length || 0}
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>Version</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Licenses</strong></TableCell>
                      <TableCell><strong>PURL</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedReport.report.components.components.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                            No components found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedReport.report.components.components.slice(0, 100).map((component, index) => (
                        <TableRow key={index}>
                          <TableCell>{component.name || 'N/A'}</TableCell>
                          <TableCell>{component.version || 'N/A'}</TableCell>
                          <TableCell>{component.type || 'N/A'}</TableCell>
                          <TableCell>
                            {component.licenses && component.licenses.length > 0
                              ? (typeof component.licenses[0] === 'string' ? component.licenses.join(', ') :
                                 component.licenses.map(l => l.license?.id || l.license?.name || 'Unknown').join(', '))
                              : 'N/A'}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {component.purl || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {selectedReport.report.components.components.length > 100 && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
                  Showing first 100 of {selectedReport.report.components.components.length} components
                </Typography>
              )}
            </>
          )}
          {selectedReport && selectedReport.spec && selectedReport.spec.compliance && selectedReport.spec.compliance.controls && (
            /* Compliance Report Details */
            <>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="h6">{selectedReport.spec.compliance.title || selectedReport.metadata.name}</Typography>
                {selectedReport.spec.compliance.description && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {selectedReport.spec.compliance.description}
                  </Typography>
                )}
                {selectedReport.spec.compliance.version && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Version:</strong> {selectedReport.spec.compliance.version}
                  </Typography>
                )}
                {selectedReport.status && selectedReport.status.summary && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                    <Typography variant="body2" color="success.main">
                      <strong>Pass:</strong> {selectedReport.status.summary.passCount || 0}
                    </Typography>
                    <Typography variant="body2" color="error.main">
                      <strong>Fail:</strong> {selectedReport.status.summary.failCount || 0}
                    </Typography>
                    {selectedReport.status.summary.warnCount > 0 && (
                      <Typography variant="body2" color="warning.main">
                        <strong>Warn:</strong> {selectedReport.status.summary.warnCount}
                      </Typography>
                    )}
                    {selectedReport.status.summary.skipCount > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Skip:</strong> {selectedReport.status.summary.skipCount}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Control ID</strong></TableCell>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>Severity</strong></TableCell>
                      <TableCell><strong>Checks</strong></TableCell>
                      <TableCell><strong>Description</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedReport.spec.compliance.controls.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                            No compliance controls found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedReport.spec.compliance.controls.map((control, index) => (
                        <TableRow key={index}>
                          <TableCell>{control.id || 'N/A'}</TableCell>
                          <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {control.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {control.severity && (
                              <Chip
                                label={control.severity}
                                size="small"
                                sx={{
                                  bgcolor: SEVERITY_COLORS[control.severity?.toUpperCase()] || SEVERITY_COLORS.UNKNOWN,
                                  color: 'white',
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {control.checks && control.checks.length > 0
                              ? control.checks.map(c => c.id).join(', ')
                              : 'N/A'}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '400px' }}>
                            {control.description || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Warning Dialog for All Namespaces */}
      <Dialog
        open={showAllNamespacesWarning}
        onClose={cancelAllNamespaces}
        aria-labelledby="warning-dialog-title"
        aria-describedby="warning-dialog-description"
      >
        <DialogTitle id="warning-dialog-title">
          Avertissement: Tous les Namespaces
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="warning-dialog-description">
            La sélection de "Tous les Namespaces" peut entraîner le chargement d'un grand nombre de rapports,
            ce qui pourrait ralentir l'application ou provoquer un timeout. Voulez-vous continuer ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelAllNamespaces} color="primary">
            Annuler
          </Button>
          <Button onClick={confirmAllNamespaces} color="primary" autoFocus>
            Continuer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReportsView;
