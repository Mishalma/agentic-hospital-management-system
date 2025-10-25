import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Timer as TimerIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";

const EmergencyCaseManagement = () => {
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState({ today: {}, active: {}, averageWaitTime: 0, bedOccupancy: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [openNewCaseDialog, setOpenNewCaseDialog] = useState(false);
  const [newCaseData, setNewCaseData] = useState({
    patientId: "",
    chiefComplaint: "",
    symptoms: "",
    vitals: {
      temperature: "",
      bloodPressure: "",
      heartRate: "",
      respiratoryRate: "",
      oxygenSaturation: "",
      painScale: "",
    },
    arrivalMode: "Walk-in",
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [casesResponse, statsResponse] = await Promise.all([
        fetch("/api/emergency/cases?limit=50"),
        fetch("/api/emergency/dashboard/stats"),
      ]);

      const casesData = await casesResponse.json();
      const statsData = await statsResponse.json();

      setCases(casesData.cases || []);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async () => {
    try {
      const response = await fetch("/api/emergency/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCaseData),
      });

      if (response.ok) {
        setOpenNewCaseDialog(false);
        setNewCaseData({
          patientId: "",
          chiefComplaint: "",
          symptoms: "",
          vitals: {
            temperature: "",
            bloodPressure: "",
            heartRate: "",
            respiratoryRate: "",
            oxygenSaturation: "",
            painScale: "",
          },
          arrivalMode: "Walk-in",
        });
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error creating case:", error);
    }
  };

  const handleViewCase = (case_) => {
    setSelectedCase(case_);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Critical: "#f44336",
      High: "#ff9800",
      Medium: "#2196f3",
      Low: "#4caf50",
    };
    return colors[priority] || "#9e9e9e";
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "#2196f3",
      under_treatment: "#ff9800",
      completed: "#4caf50",
    };
    return colors[status] || "#9e9e9e";
  };

  const formatWaitTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const renderStatsCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Today's Cases
            </Typography>
            <Typography variant="h4" component="div">
              {stats.today?.total || 0}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                size="small"
                label={`Critical: ${stats.today?.critical || 0}`}
                sx={{ mr: 1, backgroundColor: "#f44336", color: "white" }}
              />
              <Chip
                size="small"
                label={`High: ${stats.today?.high || 0}`}
                sx={{ backgroundColor: "#ff9800", color: "white" }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Cases
            </Typography>
            <Typography variant="h4" component="div">
              {stats.active?.total || 0}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                size="small"
                label={`Critical: ${stats.active?.critical || 0}`}
                sx={{ mr: 1, backgroundColor: "#f44336", color: "white" }}
              />
              <Chip
                size="small"
                label={`High: ${stats.active?.high || 0}`}
                sx={{ backgroundColor: "#ff9800", color: "white" }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Average Wait Time
            </Typography>
            <Typography variant="h4" component="div">
              {stats.averageWaitTime || 0} min
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Bed Occupancy
            </Typography>
            <Typography variant="h4" component="div">
              {stats.bedOccupancy || 0}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderCasesTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Case ID</TableCell>
            <TableCell>Patient</TableCell>
            <TableCell>Chief Complaint</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Arrival Time</TableCell>
            <TableCell>Wait Time</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cases.map((case_) => (
            <TableRow key={case_.caseId}>
              <TableCell>{case_.caseId}</TableCell>
              <TableCell>{case_.patientInfo?.name || `Patient ${case_.patientId}`}</TableCell>
              <TableCell>{case_.chiefComplaint}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={case_.priority}
                  sx={{ backgroundColor: getPriorityColor(case_.priority), color: "white" }}
                />
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={case_.status.replace("_", " ")}
                  sx={{ backgroundColor: getStatusColor(case_.status), color: "white" }}
                />
              </TableCell>
              <TableCell>{new Date(case_.arrivalTime).toLocaleString()}</TableCell>
              <TableCell>
                {case_.status === "active"
                  ? formatWaitTime(Math.floor((new Date() - new Date(case_.arrivalTime)) / (1000 * 60)))
                  : "-"}
              </TableCell>
              <TableCell>
                <Button size="small" variant="outlined" onClick={() => handleViewCase(case_)}>
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderNewCaseDialog = () => (
    <Dialog open={openNewCaseDialog} onClose={() => setOpenNewCaseDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>New Emergency Case</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Patient ID"
              value={newCaseData.patientId}
              onChange={(e) => setNewCaseData({ ...newCaseData, patientId: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Arrival Mode</InputLabel>
              <Select
                value={newCaseData.arrivalMode}
                onChange={(e) => setNewCaseData({ ...newCaseData, arrivalMode: e.target.value })}
              >
                <MenuItem value="Walk-in">Walk-in</MenuItem>
                <MenuItem value="Ambulance">Ambulance</MenuItem>
                <MenuItem value="Transfer">Transfer</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Chief Complaint"
              value={newCaseData.chiefComplaint}
              onChange={(e) => setNewCaseData({ ...newCaseData, chiefComplaint: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Symptoms"
              value={newCaseData.symptoms}
              onChange={(e) => setNewCaseData({ ...newCaseData, symptoms: e.target.value })}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Vitals
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Temperature (°F)"
              value={newCaseData.vitals.temperature}
              onChange={(e) =>
                setNewCaseData({
                  ...newCaseData,
                  vitals: { ...newCaseData.vitals, temperature: e.target.value },
                })
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Blood Pressure"
              value={newCaseData.vitals.bloodPressure}
              onChange={(e) =>
                setNewCaseData({
                  ...newCaseData,
                  vitals: { ...newCaseData.vitals, bloodPressure: e.target.value },
                })
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Heart Rate"
              value={newCaseData.vitals.heartRate}
              onChange={(e) =>
                setNewCaseData({
                  ...newCaseData,
                  vitals: { ...newCaseData.vitals, heartRate: e.target.value },
                })
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Respiratory Rate"
              value={newCaseData.vitals.respiratoryRate}
              onChange={(e) =>
                setNewCaseData({
                  ...newCaseData,
                  vitals: { ...newCaseData.vitals, respiratoryRate: e.target.value },
                })
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Oxygen Saturation (%)"
              value={newCaseData.vitals.oxygenSaturation}
              onChange={(e) =>
                setNewCaseData({
                  ...newCaseData,
                  vitals: { ...newCaseData.vitals, oxygenSaturation: e.target.value },
                })
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Pain Scale (0-10)"
              value={newCaseData.vitals.painScale}
              onChange={(e) =>
                setNewCaseData({
                  ...newCaseData,
                  vitals: { ...newCaseData.vitals, painScale: e.target.value },
                })
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenNewCaseDialog(false)}>Cancel</Button>
        <Button onClick={handleCreateCase} variant="contained">
          Create Case
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderCaseDetailsDialog = () =>
    selectedCase && (
      <Dialog open={!!selectedCase} onClose={() => setSelectedCase(null)} maxWidth="lg" fullWidth>
        <DialogTitle>Case Details - {selectedCase.caseId}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Patient Information
                  </Typography>
                  <Typography>
                    <strong>Name:</strong> {selectedCase.patientInfo?.name}
                  </Typography>
                  <Typography>
                    <strong>Age:</strong> {selectedCase.patientInfo?.age}
                  </Typography>
                  <Typography>
                    <strong>Gender:</strong> {selectedCase.patientInfo?.gender}
                  </Typography>
                  <Typography>
                    <strong>Phone:</strong> {selectedCase.patientInfo?.phone}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Case Information
                  </Typography>
                  <Typography>
                    <strong>Chief Complaint:</strong> {selectedCase.chiefComplaint}
                  </Typography>
                  <Typography>
                    <strong>Priority:</strong>
                    <Chip
                      size="small"
                      label={selectedCase.priority}
                      sx={{ ml: 1, backgroundColor: getPriorityColor(selectedCase.priority), color: "white" }}
                    />
                  </Typography>
                  <Typography>
                    <strong>Status:</strong>
                    <Chip
                      size="small"
                      label={selectedCase.status.replace("_", " ")}
                      sx={{ ml: 1, backgroundColor: getStatusColor(selectedCase.status), color: "white" }}
                    />
                  </Typography>
                  <Typography>
                    <strong>Arrival Time:</strong> {new Date(selectedCase.arrivalTime).toLocaleString()}
                  </Typography>
                  <Typography>
                    <strong>Arrival Mode:</strong> {selectedCase.arrivalMode}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Vitals
                  </Typography>
                  <Typography>
                    <strong>Temperature:</strong> {selectedCase.vitals?.temperature}°F
                  </Typography>
                  <Typography>
                    <strong>Blood Pressure:</strong> {selectedCase.vitals?.bloodPressure}
                  </Typography>
                  <Typography>
                    <strong>Heart Rate:</strong> {selectedCase.vitals?.heartRate} bpm
                  </Typography>
                  <Typography>
                    <strong>Respiratory Rate:</strong> {selectedCase.vitals?.respiratoryRate}/min
                  </Typography>
                  <Typography>
                    <strong>O2 Saturation:</strong> {selectedCase.vitals?.oxygenSaturation}%
                  </Typography>
                  <Typography>
                    <strong>Pain Scale:</strong> {selectedCase.vitals?.painScale}/10
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    AI Insights
                  </Typography>
                  <Typography>
                    <strong>Deterioration Risk:</strong> {selectedCase.aiInsights?.deteriorationRisk}
                  </Typography>
                  <Typography>
                    <strong>Recommended Action:</strong> {selectedCase.aiInsights?.recommendedAction}
                  </Typography>
                  <Typography>
                    <strong>Predicted Outcome:</strong> {selectedCase.aiInsights?.predictedOutcome}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Treatment Orders
                  </Typography>
                  {selectedCase.treatmentOrders?.length > 0 ? (
                    selectedCase.treatmentOrders.map((order, index) => (
                      <Box key={index} sx={{ mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                        <Typography variant="subtitle2">{order.description}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          Type: {order.type} | Urgency: {order.urgency} | Status: {order.status}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography color="textSecondary">No treatment orders yet</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedCase(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Typography>Loading emergency case management...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Emergency Case Management
        </Typography>
        <Box>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchDashboardData} sx={{ mr: 2 }}>
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenNewCaseDialog(true)}
            color="primary"
          >
            New Case
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Emergency Response System - Real-time case tracking, triage prioritization, and AI-powered insights for optimal
        patient care.
      </Alert>

      {renderStatsCards()}

      {renderCasesTable()}

      {renderNewCaseDialog()}
      {renderCaseDetailsDialog()}
    </Box>
  );
};

export default EmergencyCaseManagement;
