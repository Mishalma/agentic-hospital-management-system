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
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
  Security as SecurityIcon,
  Gavel as GavelIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";

const MLCDocumentation = () => {
  const [mlcCases, setMlcCases] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [openNewCaseDialog, setOpenNewCaseDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [newCaseData, setNewCaseData] = useState({
    patientId: "",
    chiefComplaint: "",
    injuryType: "",
    evidence: "",
    firNumber: "",
    policeStation: "",
    forensicOpinion: "",
  });

  useEffect(() => {
    fetchMLCCases();
  }, []);

  const fetchMLCCases = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/emergency/mlc-cases");
      const data = await response.json();
      setMlcCases(data.cases || []);
      setStats(data.stats || { total: 0, active: 0, completed: 0, pending: 0 });
    } catch (error) {
      console.error("Error fetching MLC cases:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async () => {
    try {
      const response = await fetch("/api/emergency/mlc-cases", {
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
          injuryType: "",
          evidence: "",
          firNumber: "",
          policeStation: "",
          forensicOpinion: "",
        });
        fetchMLCCases();
      }
    } catch (error) {
      console.error("Error creating MLC case:", error);
    }
  };

  const handleViewCase = (case_) => {
    setSelectedCase(case_);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "#2196f3",
      completed: "#4caf50",
      pending: "#ff9800",
    };
    return colors[status] || "#9e9e9e";
  };

  const renderStatsCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total MLC Cases
            </Typography>
            <Typography variant="h4" component="div">
              {stats.total || 0}
            </Typography>
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
              {stats.active || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Completed Cases
            </Typography>
            <Typography variant="h4" component="div">
              {stats.completed || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Pending Documentation
            </Typography>
            <Typography variant="h4" component="div">
              {stats.pending || 0}
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
            <TableCell>Injury Type</TableCell>
            <TableCell>FIR Number</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {mlcCases.map((case_) => (
            <TableRow key={case_.caseId}>
              <TableCell>{case_.caseId}</TableCell>
              <TableCell>{case_.patientInfo?.name || `Patient ${case_.patientId}`}</TableCell>
              <TableCell>{case_.mlcData?.injuryType || "N/A"}</TableCell>
              <TableCell>{case_.mlcData?.firData?.firNumber || "N/A"}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={case_.status.replace("_", " ")}
                  sx={{ backgroundColor: getStatusColor(case_.status), color: "white" }}
                />
              </TableCell>
              <TableCell>{new Date(case_.arrivalTime).toLocaleDateString()}</TableCell>
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
      <DialogTitle>New MLC Case</DialogTitle>
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
              label="Injury Type"
              value={newCaseData.injuryType}
              onChange={(e) => setNewCaseData({ ...newCaseData, injuryType: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Evidence/Description"
              value={newCaseData.evidence}
              onChange={(e) => setNewCaseData({ ...newCaseData, evidence: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="FIR Number"
              value={newCaseData.firNumber}
              onChange={(e) => setNewCaseData({ ...newCaseData, firNumber: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Police Station"
              value={newCaseData.policeStation}
              onChange={(e) => setNewCaseData({ ...newCaseData, policeStation: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Forensic Opinion"
              value={newCaseData.forensicOpinion}
              onChange={(e) => setNewCaseData({ ...newCaseData, forensicOpinion: e.target.value })}
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
        <DialogTitle>MLC Case Details - {selectedCase.caseId}</DialogTitle>
        <DialogContent>
          <Box sx={{ width: "100%" }}>
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tab icon={<DescriptionIcon />} label="Case Information" />
              <Tab icon={<SecurityIcon />} label="Legal Documentation" />
              <Tab icon={<GavelIcon />} label="Authority Notifications" />
            </Tabs>

            {tabValue === 0 && (
              <Box sx={{ p: 3 }}>
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
                          <strong>Injury Type:</strong> {selectedCase.mlcData?.injuryType}
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
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Evidence & Description
                        </Typography>
                        <Typography>
                          {selectedCase.mlcData?.evidence?.join(", ") || "No evidence documented"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          FIR Details
                        </Typography>
                        <Typography>
                          <strong>FIR Number:</strong> {selectedCase.mlcData?.firData?.firNumber || "N/A"}
                        </Typography>
                        <Typography>
                          <strong>Police Station:</strong> {selectedCase.mlcData?.firData?.policeStation || "N/A"}
                        </Typography>
                        <Typography>
                          <strong>Reported At:</strong>{" "}
                          {selectedCase.mlcData?.firData?.reportedAt
                            ? new Date(selectedCase.mlcData.firData.reportedAt).toLocaleString()
                            : "N/A"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Forensic Opinion
                        </Typography>
                        <Typography>
                          {selectedCase.mlcData?.forensicOpinion || "No forensic opinion available"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {tabValue === 2 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Authority Notifications
                        </Typography>
                        {selectedCase.mlcData?.authorityNotifications?.length > 0 ? (
                          selectedCase.mlcData.authorityNotifications.map((notification, index) => (
                            <Typography key={index}>• {notification}</Typography>
                          ))
                        ) : (
                          <Typography>No notifications sent yet</Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Digital Signature & Audit Log
                        </Typography>
                        <Typography>
                          <strong>Digital Signature:</strong> {selectedCase.mlcData?.digitalSignature || "Not signed"}
                        </Typography>
                        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                          Audit Trail:
                        </Typography>
                        {selectedCase.mlcData?.auditLog?.length > 0 ? (
                          selectedCase.mlcData.auditLog.map((entry, index) => (
                            <Typography key={index} variant="body2" color="text.secondary">
                              • {entry}
                            </Typography>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No audit entries
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedCase(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Typography>Loading MLC documentation...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          MLC Documentation
        </Typography>
        <Box>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchMLCCases} sx={{ mr: 2 }}>
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenNewCaseDialog(true)}
            color="primary"
          >
            New MLC Case
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Secure, audit-logged Medico-Legal Case documentation system with digital signatures and authority notifications.
      </Alert>

      {renderStatsCards()}

      {renderCasesTable()}

      {renderNewCaseDialog()}
      {renderCaseDetailsDialog()}
    </Box>
  );
};

export default MLCDocumentation;
