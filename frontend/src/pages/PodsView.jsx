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
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getPodsList, getNamespaces } from '../services/api';

const SEVERITY_COLORS = {
  CRITICAL: '#d32f2f',
  HIGH: '#f57c00',
  MEDIUM: '#fbc02d',
  LOW: '#388e3c',
  UNKNOWN: '#757575',
};

const PodsView = () => {
  const [pods, setPods] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchNamespaces = async () => {
    try {
      const response = await getNamespaces();
      setNamespaces(response.data.namespaces || []);
    } catch (err) {
      console.error('Failed to fetch namespaces:', err);
    }
  };

  const fetchPods = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPodsList(selectedNamespace);
      setPods(response.data.pods || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch pods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNamespaces();
  }, []);

  useEffect(() => {
    fetchPods();
  }, [selectedNamespace]);

  const handleViewPod = (namespace, podName) => {
    navigate(`/pods/${namespace}/${podName}`);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Pods Security Overview</Typography>
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
          <Tooltip title="Refresh">
            <IconButton onClick={fetchPods} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Namespace</strong></TableCell>
              <TableCell><strong>Pod Name</strong></TableCell>
              <TableCell align="center"><strong>Vulnerabilities</strong></TableCell>
              <TableCell align="center" colSpan={4} sx={{ borderBottom: '2px solid #e0e0e0' }}>
                <strong>Vulnerability Severity</strong>
              </TableCell>
              <TableCell align="center"><strong>Config Issues</strong></TableCell>
              <TableCell align="center" colSpan={4} sx={{ borderBottom: '2px solid #e0e0e0' }}>
                <strong>Config Issue Severity</strong>
              </TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
            <TableRow>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell align="center"><strong>Critical</strong></TableCell>
              <TableCell align="center"><strong>High</strong></TableCell>
              <TableCell align="center"><strong>Medium</strong></TableCell>
              <TableCell align="center"><strong>Low</strong></TableCell>
              <TableCell></TableCell>
              <TableCell align="center"><strong>Critical</strong></TableCell>
              <TableCell align="center"><strong>High</strong></TableCell>
              <TableCell align="center"><strong>Medium</strong></TableCell>
              <TableCell align="center"><strong>Low</strong></TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} align="center">
                  <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                    No pods found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              pods.map((pod) => (
                <TableRow
                  key={`${pod.namespace}/${pod.podName}`}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleViewPod(pod.namespace, pod.podName)}
                >
                  <TableCell>{pod.namespace}</TableCell>
                  <TableCell>{pod.podName}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={pod.totalVulnerabilities || 0}
                      color={pod.totalVulnerabilities > 0 ? 'error' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {pod.vulnerabilitySummary?.criticalCount > 0 ? (
                      <Chip
                        label={pod.vulnerabilitySummary.criticalCount}
                        size="small"
                        sx={{ bgcolor: SEVERITY_COLORS.CRITICAL, color: 'white' }}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {pod.vulnerabilitySummary?.highCount > 0 ? (
                      <Chip
                        label={pod.vulnerabilitySummary.highCount}
                        size="small"
                        sx={{ bgcolor: SEVERITY_COLORS.HIGH, color: 'white' }}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {pod.vulnerabilitySummary?.mediumCount > 0 ? (
                      <Chip
                        label={pod.vulnerabilitySummary.mediumCount}
                        size="small"
                        sx={{ bgcolor: SEVERITY_COLORS.MEDIUM, color: 'white' }}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {pod.vulnerabilitySummary?.lowCount > 0 ? (
                      <Chip
                        label={pod.vulnerabilitySummary.lowCount}
                        size="small"
                        sx={{ bgcolor: SEVERITY_COLORS.LOW, color: 'white' }}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={pod.totalConfigIssues || 0}
                      color={pod.totalConfigIssues > 0 ? 'warning' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {pod.configIssueSummary?.criticalCount > 0 ? (
                      <Chip
                        label={pod.configIssueSummary.criticalCount}
                        size="small"
                        sx={{ bgcolor: SEVERITY_COLORS.CRITICAL, color: 'white' }}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {pod.configIssueSummary?.highCount > 0 ? (
                      <Chip
                        label={pod.configIssueSummary.highCount}
                        size="small"
                        sx={{ bgcolor: SEVERITY_COLORS.HIGH, color: 'white' }}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {pod.configIssueSummary?.mediumCount > 0 ? (
                      <Chip
                        label={pod.configIssueSummary.mediumCount}
                        size="small"
                        sx={{ bgcolor: SEVERITY_COLORS.MEDIUM, color: 'white' }}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {pod.configIssueSummary?.lowCount > 0 ? (
                      <Chip
                        label={pod.configIssueSummary.lowCount}
                        size="small"
                        sx={{ bgcolor: SEVERITY_COLORS.LOW, color: 'white' }}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewPod(pod.namespace, pod.podName);
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
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

export default PodsView;
