import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import StorageIcon from '@mui/icons-material/Storage';
import WarningIcon from '@mui/icons-material/Warning';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import SecurityIcon from '@mui/icons-material/Security';
import CloudIcon from '@mui/icons-material/Cloud';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { getDashboard, getNamespaces } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [showAllNamespacesWarning, setShowAllNamespacesWarning] = useState(false);
  const [pendingNamespace, setPendingNamespace] = useState('');

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

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDashboard(selectedNamespace);
      setDashboard(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    fetchNamespaces();
  }, []);

  useEffect(() => {
    if (selectedNamespace !== '') {
      fetchDashboard();
    }
  }, [selectedNamespace]);

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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Security Dashboard
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
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
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
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
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{ bgcolor: '#d32f2f', color: 'white', cursor: 'pointer', '&:hover': { opacity: 0.9 } }}
            onClick={() => navigate('/reports?tab=0')}
          >
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
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{ bgcolor: '#f57c00', color: 'white', cursor: 'pointer', '&:hover': { opacity: 0.9 } }}
            onClick={() => navigate('/reports?tab=1')}
          >
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
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{ bgcolor: '#9c27b0', color: 'white', cursor: 'pointer', '&:hover': { opacity: 0.9 } }}
            onClick={() => navigate('/reports?tab=2')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6">Exposed Secrets</Typography>
                  <Typography variant="h3">{dashboard.totalExposedSecrets || 0}</Typography>
                </Box>
                <VpnKeyIcon sx={{ fontSize: 60, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{ bgcolor: '#00796b', color: 'white', cursor: 'pointer', '&:hover': { opacity: 0.9 } }}
            onClick={() => navigate('/reports?tab=3')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6">RBAC Issues</Typography>
                  <Typography variant="h3">{dashboard.totalRbacIssues || 0}</Typography>
                </Box>
                <SecurityIcon sx={{ fontSize: 60, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{ bgcolor: '#0288d1', color: 'white', cursor: 'pointer', '&:hover': { opacity: 0.9 } }}
            onClick={() => navigate('/reports?tab=4')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6">Infra Issues</Typography>
                  <Typography variant="h3">{dashboard.totalInfraIssues || 0}</Typography>
                </Box>
                <CloudIcon sx={{ fontSize: 60, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{ bgcolor: '#5e35b1', color: 'white', cursor: 'pointer', '&:hover': { opacity: 0.9 } }}
            onClick={() => navigate('/reports?tab=5')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6">SBOM Reports</Typography>
                  <Typography variant="h3">{dashboard.totalSbomReports || 0}</Typography>
                </Box>
                <InventoryIcon sx={{ fontSize: 60, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{ bgcolor: '#43a047', color: 'white', cursor: 'pointer', '&:hover': { opacity: 0.9 } }}
            onClick={() => navigate('/reports?tab=7')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6">Compliance Reports</Typography>
                  <Typography variant="h3">{dashboard.totalComplianceReports || 0}</Typography>
                </Box>
                <AssignmentTurnedInIcon sx={{ fontSize: 60, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Warning Dialog for All Namespaces */}
      <Dialog
        open={showAllNamespacesWarning}
        onClose={cancelAllNamespaces}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Avertissement: Tous les Namespaces
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
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

export default Dashboard;
