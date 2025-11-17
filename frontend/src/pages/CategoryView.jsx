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
  ButtonGroup,
  Button,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getReportsByCategory } from '../services/api';

const SEVERITY_COLORS = {
  CRITICAL: '#d32f2f',
  HIGH: '#f57c00',
  MEDIUM: '#fbc02d',
  LOW: '#388e3c',
  UNKNOWN: '#757575',
};

const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'];

const CategoryView = () => {
  const { severity } = useParams();
  const navigate = useNavigate();
  const [categoryReport, setCategoryReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSeverity, setCurrentSeverity] = useState(severity?.toUpperCase() || 'CRITICAL');

  const fetchCategoryReport = async (sev) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getReportsByCategory(sev);
      setCategoryReport(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch category report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryReport(currentSeverity);
  }, [currentSeverity]);

  const handleSeverityChange = (sev) => {
    setCurrentSeverity(sev);
    navigate(`/category/${sev.toLowerCase()}`);
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
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
            <Link
              underline="hover"
              color="inherit"
              onClick={() => navigate('/')}
              sx={{ cursor: 'pointer' }}
            >
              Dashboard
            </Link>
            <Typography color="text.primary">Category: {currentSeverity}</Typography>
          </Breadcrumbs>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/')} color="primary">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4">
              Vulnerabilities by Category
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={() => fetchCategoryReport(currentSeverity)} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Severity Filter */}
      <Box sx={{ mb: 3 }}>
        <ButtonGroup variant="contained" aria-label="severity filter">
          {SEVERITIES.map((sev) => (
            <Button
              key={sev}
              onClick={() => handleSeverityChange(sev)}
              sx={{
                bgcolor: currentSeverity === sev ? SEVERITY_COLORS[sev] : '#e0e0e0',
                color: currentSeverity === sev ? 'white' : 'black',
                '&:hover': {
                  bgcolor: SEVERITY_COLORS[sev],
                  color: 'white',
                },
              }}
            >
              {sev}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* Summary */}
      {categoryReport && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6">
            Total {categoryReport.severity} Severity Vulnerabilities: {categoryReport.count}
          </Typography>
        </Paper>
      )}

      {/* Vulnerabilities Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>CVE ID</strong></TableCell>
              <TableCell><strong>Namespace</strong></TableCell>
              <TableCell><strong>Pod</strong></TableCell>
              <TableCell><strong>Container</strong></TableCell>
              <TableCell><strong>Package</strong></TableCell>
              <TableCell><strong>Installed</strong></TableCell>
              <TableCell><strong>Fixed</strong></TableCell>
              <TableCell><strong>Title</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!categoryReport || categoryReport.vulnerabilities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                    No {currentSeverity.toLowerCase()} severity vulnerabilities found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              categoryReport.vulnerabilities.map((vuln, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    {vuln.primaryLink ? (
                      <Link href={vuln.primaryLink} target="_blank" rel="noopener">
                        {vuln.vulnerabilityID}
                      </Link>
                    ) : (
                      vuln.vulnerabilityID
                    )}
                  </TableCell>
                  <TableCell>{vuln.namespace}</TableCell>
                  <TableCell>
                    <Link
                      onClick={() => navigate(`/pods/${vuln.namespace}/${vuln.podName}`)}
                      sx={{ cursor: 'pointer' }}
                    >
                      {vuln.podName}
                    </Link>
                  </TableCell>
                  <TableCell>{vuln.containerName}</TableCell>
                  <TableCell>{vuln.resource}</TableCell>
                  <TableCell>{vuln.installedVersion}</TableCell>
                  <TableCell>{vuln.fixedVersion || 'N/A'}</TableCell>
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
    </Container>
  );
};

export default CategoryView;
