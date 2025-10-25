import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  Print as PrintIcon,
  Home as HomeIcon,
  Queue as QueueIcon,
} from "@mui/icons-material";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import moment from "moment";

const ConfirmationPage = ({ patient, appointment, onStartOver }) => {
  const navigate = useNavigate();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const generatePassword = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return password;
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePasswordDialog = () => {
    const password = generatePassword();
    setGeneratedPassword(password);
    setShowPasswordDialog(true);
  };

  const qrData = JSON.stringify({
    token: appointment.token,
    patientId: patient.id,
    type: "appointment",
  });

  return (
    <Box sx={{ textAlign: "center" }}>
      {/* Success Header */}
      <Box sx={{ mb: 4 }}>
        <CheckIcon sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
        <Typography variant="h4" gutterBottom color="success.main">
          Appointment Confirmed!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Your appointment has been successfully booked
        </Typography>
      </Box>

      {/* Password Notification for Consultations */}
      {appointment && appointment.type === "consultation" && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Password Access Required
          </Typography>
          <Typography variant="body2">
            A password has been generated for accessing your patient history. Click the button below to view it.
          </Typography>
          <Button variant="contained" size="small" sx={{ mt: 1 }} onClick={handlePasswordDialog}>
            Show Password
          </Button>
        </Alert>
      )}

      {/* Appointment Details */}
      <Card sx={{ mb: 3, textAlign: "left" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Appointment Details
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Token Number
                </Typography>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {appointment.token}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Patient Name
                  </Typography>
                  <Typography variant="body1">{patient.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Patient ID
                  </Typography>
                  <Typography variant="body1">{patient.uniqueId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Doctor
                  </Typography>
                  <Typography variant="body1">{appointment.doctor}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Department
                  </Typography>
                  <Typography variant="body1">{appointment.department}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date & Time
                  </Typography>
                  <Typography variant="body1">{moment(appointment.slot).format("MMMM DD, YYYY at HH:mm")}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Priority
                  </Typography>
                  <Chip
                    label={appointment.urgency.toUpperCase()}
                    color={getUrgencyColor(appointment.urgency)}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  QR Code
                </Typography>
                <Box
                  sx={{
                    display: "inline-block",
                    p: 2,
                    border: "2px solid #ddd",
                    borderRadius: 2,
                    backgroundColor: "white",
                  }}
                >
                  <QRCodeSVG value={qrData} size={150} level="M" />
                </Box>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Show this QR code at the hospital
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Symptoms/Reason for Visit
          </Typography>
          <Typography
            variant="body2"
            sx={{
              backgroundColor: "grey.100",
              p: 2,
              borderRadius: 1,
              fontStyle: "italic",
            }}
          >
            "{appointment.symptoms}"
          </Typography>
        </CardContent>
      </Card>

      {/* Important Instructions */}
      <Alert severity="info" sx={{ mb: 3, textAlign: "left" }}>
        <Typography variant="subtitle2" gutterBottom>
          Important Instructions:
        </Typography>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>Please arrive 15 minutes before your scheduled appointment time</li>
          <li>Bring a valid ID and insurance card (if applicable)</li>
          <li>
            Show your QR code or mention token number: <strong>{appointment.token}</strong>
          </li>
          <li>You will receive SMS/email confirmations and reminders</li>
        </ul>
      </Alert>

      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={3}>
          <Button variant="outlined" fullWidth startIcon={<PrintIcon />} onClick={handlePrint}>
            Print Details
          </Button>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button variant="outlined" fullWidth startIcon={<QueueIcon />} onClick={() => navigate("/queue")}>
            View Queue
          </Button>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button variant="outlined" fullWidth onClick={onStartOver}>
            Book Another
          </Button>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button variant="contained" fullWidth startIcon={<HomeIcon />} onClick={() => navigate("/")}>
            Go Home
          </Button>
        </Grid>
      </Grid>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>Your Password</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="body1" gutterBottom>
              Please save this password to access your patient history:
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontFamily: "monospace",
                fontWeight: "bold",
                letterSpacing: 2,
                color: "primary.main",
                backgroundColor: "grey.100",
                p: 2,
                borderRadius: 1,
                mt: 2,
              }}
            >
              {generatedPassword}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              This password will be required when accessing your patient history records.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)} variant="contained" fullWidth>
            I Understand
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contact Information */}
      <Card sx={{ mt: 4, backgroundColor: "grey.50" }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Need Help?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            For any questions or to reschedule your appointment, please contact us:
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            📞 Phone: (555) 123-4567
            <br />
            📧 Email: appointments@healthtech.com
            <br />
            🕒 Hours: Monday - Friday, 8:00 AM - 6:00 PM
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ConfirmationPage;
