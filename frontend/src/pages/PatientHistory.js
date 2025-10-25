import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Favorite as HeartIcon,
  MedicalServices as MedicalIcon,
  Medication as MedicationIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { usePatient } from "../contexts/PatientContext";
import toast from "react-hot-toast";

const PatientHistory = () => {
  const { user } = useAuth();
  const { currentPatientId, setCurrentPatientId } = usePatient();
  const [patientId, setPatientId] = useState(currentPatientId || "");
  const [password, setPassword] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const fetchPatientHistory = async () => {
    if (!patientId.trim()) {
      toast.error("Please enter a patient ID");
      return;
    }

    setShowPasswordDialog(true);
  };

  const handlePasswordSubmit = async () => {
    if (password.trim() !== "password") {
      toast.error("Invalid password. Please try again.");
      return;
    }

    setLoading(true);
    setShowPasswordDialog(false);

    try {
      // Fetch patient basic info and history
      const response = await fetch(`/api/patients/${patientId}/history`);
      const result = await response.json();

      if (result.success) {
        setPatientData(result.data);
        setCurrentPatientId(patientId); // Save to context
        toast.success("Patient history loaded successfully");
      } else {
        toast.error(result.message || "Failed to fetch patient history");
        setPatientData(null);
      }
    } catch (error) {
      console.error("Error fetching patient history:", error);
      toast.error("Network error. Please try again.");
      setPatientData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      fetchPatientHistory();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderVitalsTab = () => {
    if (!patientData?.recentVitals?.length) {
      return <Alert severity="info">No recent vitals found for this patient.</Alert>;
    }

    return (
      <Grid container spacing={2}>
        {patientData.recentVitals.map((vital, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vitals Reading #{index + 1}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Recorded: {formatDate(vital.createdAt)}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={1}>
                  {vital.vitals.temperature && (
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Temperature:</strong> {vital.vitals.temperature.value}°{vital.vitals.temperature.unit}
                      </Typography>
                    </Grid>
                  )}
                  {vital.vitals.bloodPressure && (
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>BP:</strong> {vital.vitals.bloodPressure.systolic}/
                        {vital.vitals.bloodPressure.diastolic}
                      </Typography>
                    </Grid>
                  )}
                  {vital.vitals.pulse && (
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Pulse:</strong> {vital.vitals.pulse.value} bpm
                      </Typography>
                    </Grid>
                  )}
                  {vital.vitals.respiratoryRate && (
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Resp Rate:</strong> {vital.vitals.respiratoryRate.value} breaths/min
                      </Typography>
                    </Grid>
                  )}
                  {vital.vitals.oxygenSaturation && (
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>O2 Sat:</strong> {vital.vitals.oxygenSaturation.value}%
                      </Typography>
                    </Grid>
                  )}
                </Grid>
                {vital.alerts && vital.alerts.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      Alerts:
                    </Typography>
                    {vital.alerts.map((alert, alertIndex) => (
                      <Chip
                        key={alertIndex}
                        label={alert.message}
                        size="small"
                        color={alert.severity === "critical" ? "error" : alert.severity === "high" ? "warning" : "info"}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderConsultationsTab = () => {
    if (!patientData?.recentConsultations?.length) {
      return <Alert severity="info">No recent consultations found for this patient.</Alert>;
    }

    return (
      <List>
        {patientData.recentConsultations.map((consultation, index) => (
          <Accordion key={index} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                <MedicalIcon sx={{ mr: 2, color: "primary.main" }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">Consultation on {formatDate(consultation.consultationDate)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Doctor: {consultation.doctorName || "Doctor"} | Type: {consultation.consultationType || "General"}
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" gutterBottom>
                <strong>Symptoms:</strong> {consultation.symptoms || "Not specified"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Diagnosis:</strong> {consultation.diagnosis || "Not specified"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Treatment:</strong> {consultation.treatment || "Not specified"}
              </Typography>
              {consultation.notes && (
                <Typography variant="body1">
                  <strong>Notes:</strong> {consultation.notes}
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </List>
    );
  };

  const renderPrescriptionsTab = () => {
    if (!patientData?.currentMedications?.length) {
      return <Alert severity="info">No current medications found for this patient.</Alert>;
    }

    return (
      <Grid container spacing={2}>
        {patientData.currentMedications.map((medication, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <MedicationIcon sx={{ mr: 2, color: "primary.main" }} />
                  <Typography variant="h6">{medication.brandName || medication.genericName}</Typography>
                </Box>
                <Typography variant="body2" gutterBottom>
                  <strong>Generic:</strong> {medication.genericName}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Dosage:</strong> {medication.dosage}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Frequency:</strong> {medication.frequency}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Quantity:</strong> {medication.quantity}
                </Typography>
                {medication.instructions && (
                  <Typography variant="body2">
                    <strong>Instructions:</strong> {medication.instructions}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderMedicalHistoryTab = () => {
    if (!patientData?.medicalHistory?.length) {
      return <Alert severity="info">No medical history found for this patient.</Alert>;
    }

    return (
      <List>
        {patientData.medicalHistory.map((history, index) => (
          <ListItem key={index} sx={{ border: 1, borderColor: "divider", borderRadius: 1, mb: 1 }}>
            <ListItemText
              primary={
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="h6">{history.condition}</Typography>
                  <Chip
                    label={history.status || "active"}
                    color={history.status === "resolved" ? "success" : "warning"}
                    size="small"
                  />
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" gutterBottom>
                    <strong>Diagnosed:</strong> {history.diagnosedDate ? formatDate(history.diagnosedDate) : "Unknown"}
                  </Typography>
                  {history.notes && (
                    <Typography variant="body2">
                      <strong>Notes:</strong> {history.notes}
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
        <HistoryIcon sx={{ mr: 2 }} />
        Patient History Viewer
      </Typography>

      {/* Search Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Search Patient History
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            fullWidth
            label="Enter Patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., PT00000001"
            variant="outlined"
          />
          <Button
            variant="contained"
            onClick={fetchPatientHistory}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
            sx={{ minWidth: 120 }}
          >
            {loading ? "Loading..." : "Search"}
          </Button>
        </Box>
      </Paper>

      {/* Patient Info */}
      {patientData && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
            <PersonIcon sx={{ mr: 2 }} />
            Patient Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>Name:</strong> {patientData.patient.name}
              </Typography>
              <Typography variant="body1">
                <strong>Patient ID:</strong> {patientData.patient.uniqueId}
              </Typography>
              <Typography variant="body1">
                <strong>Phone:</strong> {patientData.patient.phone}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>Email:</strong> {patientData.patient.email || "Not provided"}
              </Typography>
              <Typography variant="body1">
                <strong>Date of Birth:</strong>{" "}
                {patientData.patient.dob ? formatDate(patientData.patient.dob) : "Not provided"}
              </Typography>
              <Typography variant="body1">
                <strong>Active Prescriptions:</strong> {patientData.activePrescriptions || 0}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tabs for different sections */}
      {patientData && (
        <Paper sx={{ width: "100%" }}>
          <Tabs
            value={activeTab}
            onChange={(event, newValue) => setActiveTab(newValue)}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab icon={<HeartIcon />} label="Vitals" />
            <Tab icon={<MedicalIcon />} label="Consultations" />
            <Tab icon={<MedicationIcon />} label="Prescriptions" />
            <Tab icon={<HistoryIcon />} label="Medical History" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && renderVitalsTab()}
            {activeTab === 1 && renderConsultationsTab()}
            {activeTab === 2 && renderPrescriptionsTab()}
            {activeTab === 3 && renderMedicalHistoryTab()}
          </Box>
        </Paper>
      )}

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>Enter Password</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" gutterBottom>
              Please enter the password you received after booking your consultation:
            </Typography>
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              variant="outlined"
              placeholder="Enter your password"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handlePasswordSubmit();
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handlePasswordSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      {!patientData && !loading && (
        <Alert severity="info" sx={{ mt: 4 }}>
          Enter a patient ID above and click Search to view their complete medical history.
        </Alert>
      )}
    </Container>
  );
};

export default PatientHistory;
