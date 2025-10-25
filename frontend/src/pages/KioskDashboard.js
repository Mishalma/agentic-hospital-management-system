import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Container,
  Tab,
  Tabs,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Avatar,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import {
  PersonAdd as NewPatientIcon,
  Search as SearchIcon,
  ExistingPatientIcon,
  TouchApp as TouchIcon,
  Person as PersonIcon,
  Event as EventIcon,
  CheckCircle as CheckIcon,
  LocalHospital as DoctorIcon,
  Schedule as TimeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  AccessTime as AccessTimeIcon,
  HospitalIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useSocket } from "../contexts/SocketContext";
import axios from "axios";
import toast from "react-hot-toast";
import moment from "moment";
import NewPatientForm from "../components/Registration/NewPatientForm";
import ExistingPatientForm from "../components/Registration/ExistingPatientForm";
import AppointmentBooking from "../components/Registration/AppointmentBooking";
import ConfirmationPage from "../components/Registration/ConfirmationPage";

const KioskDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [currentStep, setCurrentStep] = useState("welcome");
  const [patientType, setPatientType] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [appointmentData, setAppointmentData] = useState(null);

  // Booking states from IntegratedBooking
  const [bookingActiveStep, setBookingActiveStep] = useState(0);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingValidationErrors, setBookingValidationErrors] = useState({});
  const [bookingPatientData, setBookingPatientData] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
    gender: "",
    address: "",
    emergencyContact: "",
  });
  const [bookingAppointmentData, setBookingAppointmentData] = useState({
    department: "",
    doctor: "",
    date: "",
    time: "",
    symptoms: "",
    urgency: "normal",
  });
  const [bookingConfirmation, setBookingConfirmation] = useState(null);

  // Queue states from QueueStatus
  const [queueData, setQueueData] = useState(null);
  const [tokenSearch, setTokenSearch] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const { socket, joinQueue } = useSocket();
  const [showFeaturesPopup, setShowFeaturesPopup] = useState(true);

  const departments = [
    { id: "general", name: "General Medicine", icon: "🩺" },
    { id: "cardiology", name: "Cardiology", icon: "❤️" },
    { id: "pediatrics", name: "Pediatrics", icon: "👶" },
    { id: "orthopedics", name: "Orthopedics", icon: "🦴" },
    { id: "dermatology", name: "Dermatology", icon: "🧴" },
    { id: "neurology", name: "Neurology", icon: "🧠" },
  ];

  const doctors = {
    general: [
      { id: "dr-johnson", name: "Dr. Sarah Johnson", experience: "15 years", rating: 4.8 },
      { id: "dr-smith", name: "Dr. Michael Smith", experience: "12 years", rating: 4.7 },
    ],
    cardiology: [
      { id: "dr-chen", name: "Dr. Michael Chen", experience: "20 years", rating: 4.9 },
      { id: "dr-patel", name: "Dr. Priya Patel", experience: "18 years", rating: 4.8 },
    ],
    pediatrics: [{ id: "dr-rodriguez", name: "Dr. Emily Rodriguez", experience: "14 years", rating: 4.9 }],
    orthopedics: [{ id: "dr-kim", name: "Dr. David Kim", experience: "16 years", rating: 4.7 }],
    dermatology: [{ id: "dr-wilson", name: "Dr. Lisa Wilson", experience: "13 years", rating: 4.6 }],
    neurology: [{ id: "dr-brown", name: "Dr. James Brown", experience: "22 years", rating: 4.9 }],
  };

  const timeSlots = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
  ];

  useEffect(() => {
    if (activeTab === 1) {
      // Queue Status tab
      loadQueueStatus();
      joinQueue();

      if (socket) {
        socket.on("appointment-booked", handleQueueUpdate);
        socket.on("appointment-updated", handleQueueUpdate);
        socket.on("patient-called", handlePatientCalled);
        socket.on("queue-reordered", handleQueueUpdate);

        return () => {
          socket.off("appointment-booked");
          socket.off("appointment-updated");
          socket.off("patient-called");
          socket.off("queue-reordered");
        };
      }
    }
  }, [activeTab, socket]);

  // Queue functions
  const loadQueueStatus = async () => {
    try {
      const response = await axios.get("/api/queue/status");
      if (response.data.success) {
        setQueueData(response.data);
      }
    } catch (error) {
      console.error("Failed to load queue status:", error);
      toast.error("Failed to load queue status");
    } finally {
      setQueueLoading(false);
    }
  };

  const handleQueueUpdate = () => {
    loadQueueStatus();
  };

  const handlePatientCalled = (data) => {
    toast.success(`${data.patientName} called to ${data.room}`, {
      duration: 6000,
    });
    loadQueueStatus();
  };

  const searchToken = async () => {
    if (!tokenSearch.trim()) {
      toast.error("Please enter a token number");
      return;
    }

    setSearching(true);
    try {
      const response = await axios.get(`/api/queue/position/${tokenSearch.trim()}`);
      if (response.data.success) {
        setSearchResult(response.data);
        toast.success("Token found!");
      }
    } catch (error) {
      console.error("Token search error:", error);
      if (error.response?.status === 404) {
        toast.error("Token not found or not in today's queue");
        setSearchResult(null);
      } else {
        toast.error("Failed to search token");
      }
    } finally {
      setSearching(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "in-progress":
        return "success";
      case "queued":
        return "warning";
      case "booked":
        return "info";
      case "completed":
        return "default";
      case "canceled":
        return "error";
      default:
        return "default";
    }
  };

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

  // Booking functions
  const handleBookingNext = () => {
    if (bookingActiveStep === 0 && validateBookingPatientData()) {
      setBookingActiveStep(1);
    } else if (bookingActiveStep === 1 && validateBookingAppointmentData()) {
      setBookingActiveStep(2);
    } else if (bookingActiveStep === 2) {
      handleBookingSubmit();
    }
  };

  const handleBookingBack = () => {
    setBookingActiveStep(bookingActiveStep - 1);
  };

  const validateBookingPatientData = () => {
    const errors = {};

    if (!bookingPatientData.name.trim()) {
      errors.name = "Full name is required";
    }

    if (!bookingPatientData.phone.trim()) {
      errors.phone = "Phone number is required";
    }

    if (!bookingPatientData.dob) {
      errors.dob = "Date of birth is required";
    }

    setBookingValidationErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const validateBookingAppointmentData = () => {
    return (
      bookingAppointmentData.department &&
      bookingAppointmentData.doctor &&
      bookingAppointmentData.date &&
      bookingAppointmentData.time &&
      bookingAppointmentData.symptoms
    );
  };

  const handleBookingSubmit = async () => {
    setBookingLoading(true);

    try {
      const bookingData = {
        patient: bookingPatientData,
        appointment: bookingAppointmentData,
      };

      const response = await fetch("/api/appointments/book-integrated", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (result.success) {
        setBookingConfirmation({
          appointmentId: result.data.appointment.id,
          tokenNumber: result.data.appointment.token,
          patientId: result.data.patient.uniqueId,
          estimatedWaitTime: "30-45 minutes",
          smsStatus: result.data.smsStatus,
        });

        setBookingActiveStep(3);
      } else {
        throw new Error(result.message || "Booking failed");
      }
    } catch (error) {
      console.error("Booking failed:", error);
      alert(`Failed to book appointment: ${error.message}. Please try again.`);
    } finally {
      setBookingLoading(false);
    }
  };

  // Kiosk functions
  const handlePatientTypeSelect = (type) => {
    setPatientType(type);
    setCurrentStep("patient-info");
  };

  const handlePatientSubmit = (data) => {
    setPatientData(data);
    setCurrentStep("appointment-booking");
  };

  const handleAppointmentSubmit = (data) => {
    setAppointmentData(data);
    setCurrentStep("confirmation");
  };

  const handleStartOver = () => {
    setCurrentStep("welcome");
    setPatientType(null);
    setPatientData(null);
    setAppointmentData(null);
  };

  // Render functions for Booking tab
  const renderBookingPatientForm = () => (
    <Card sx={{ maxWidth: 600, mx: "auto" }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Avatar sx={{ bgcolor: "#2196F3", mr: 2 }}>
            <PersonIcon />
          </Avatar>
          <Typography variant="h5" fontWeight="bold">
            Patient Information
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Full Name"
              value={bookingPatientData.name}
              onChange={(e) => {
                setBookingPatientData({ ...bookingPatientData, name: e.target.value });
                setBookingValidationErrors({ ...bookingValidationErrors, name: "" });
              }}
              error={!!bookingValidationErrors.name}
              helperText={bookingValidationErrors.name}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              value={bookingPatientData.phone}
              onChange={(e) => {
                setBookingPatientData({ ...bookingPatientData, phone: e.target.value });
                setBookingValidationErrors({ ...bookingValidationErrors, phone: "" });
              }}
              error={!!bookingValidationErrors.phone}
              helperText={bookingValidationErrors.phone}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={bookingPatientData.email}
              onChange={(e) => setBookingPatientData({ ...bookingPatientData, email: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              value={bookingPatientData.dob}
              onChange={(e) => {
                setBookingPatientData({ ...bookingPatientData, dob: e.target.value });
                setBookingValidationErrors({ ...bookingValidationErrors, dob: "" });
              }}
              InputLabelProps={{ shrink: true }}
              error={!!bookingValidationErrors.dob}
              helperText={bookingValidationErrors.dob}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={bookingPatientData.gender}
                onChange={(e) => setBookingPatientData({ ...bookingPatientData, gender: e.target.value })}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              multiline
              rows={2}
              value={bookingPatientData.address}
              onChange={(e) => setBookingPatientData({ ...bookingPatientData, address: e.target.value })}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Emergency Contact"
              value={bookingPatientData.emergencyContact}
              onChange={(e) => setBookingPatientData({ ...bookingPatientData, emergencyContact: e.target.value })}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderBookingAppointmentForm = () => (
    <Card sx={{ maxWidth: 800, mx: "auto" }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Avatar sx={{ bgcolor: "#4CAF50", mr: 2 }}>
            <EventIcon />
          </Avatar>
          <Typography variant="h5" fontWeight="bold">
            Appointment Details
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Select Department
            </Typography>
            <Grid container spacing={2}>
              {departments.map((dept) => (
                <Grid item xs={12} sm={6} md={4} key={dept.id}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      border: bookingAppointmentData.department === dept.id ? 2 : 1,
                      borderColor: bookingAppointmentData.department === dept.id ? "#4CAF50" : "divider",
                      "&:hover": { borderColor: "#4CAF50" },
                    }}
                    onClick={() =>
                      setBookingAppointmentData({ ...bookingAppointmentData, department: dept.id, doctor: "" })
                    }
                  >
                    <CardContent sx={{ textAlign: "center", py: 2 }}>
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        {dept.icon}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {dept.name}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {bookingAppointmentData.department && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Select Doctor
              </Typography>
              <List>
                {doctors[bookingAppointmentData.department]?.map((doctor) => (
                  <ListItem
                    button
                    selected={bookingAppointmentData.doctor === doctor.id}
                    onClick={() => setBookingAppointmentData({ ...bookingAppointmentData, doctor: doctor.id })}
                    sx={{
                      border: 1,
                      borderColor: bookingAppointmentData.doctor === doctor.id ? "#4CAF50" : "divider",
                      borderRadius: 2,
                      mb: 1,
                    }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: "#4CAF50" }}>
                        <DoctorIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={doctor.name}
                      secondary={
                        <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                          <Chip label={doctor.experience} size="small" />
                          <Chip label={`⭐ ${doctor.rating}`} size="small" color="success" />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          )}

          {bookingAppointmentData.doctor && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Appointment Date"
                  type="date"
                  value={bookingAppointmentData.date}
                  onChange={(e) => setBookingAppointmentData({ ...bookingAppointmentData, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: new Date().toISOString().split("T")[0] }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Time Slot</InputLabel>
                  <Select
                    value={bookingAppointmentData.time}
                    onChange={(e) => setBookingAppointmentData({ ...bookingAppointmentData, time: e.target.value })}
                  >
                    {timeSlots.map((time) => (
                      <MenuItem key={time} value={time}>
                        {time}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Symptoms / Reason for Visit"
                  multiline
                  rows={3}
                  value={bookingAppointmentData.symptoms}
                  onChange={(e) => setBookingAppointmentData({ ...bookingAppointmentData, symptoms: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Urgency Level</InputLabel>
                  <Select
                    value={bookingAppointmentData.urgency}
                    onChange={(e) => setBookingAppointmentData({ ...bookingAppointmentData, urgency: e.target.value })}
                  >
                    <MenuItem value="low">Low - Routine checkup</MenuItem>
                    <MenuItem value="normal">Normal - Standard consultation</MenuItem>
                    <MenuItem value="high">High - Urgent medical attention</MenuItem>
                    <MenuItem value="emergency">Emergency - Immediate care needed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderBookingConfirmation = () => {
    if (bookingLoading) {
      return (
        <Card sx={{ maxWidth: 600, mx: "auto", textAlign: "center" }}>
          <CardContent sx={{ p: 6 }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6">Processing your appointment...</Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we confirm your booking
            </Typography>
          </CardContent>
        </Card>
      );
    }

    if (bookingConfirmation) {
      const selectedDept = departments.find((d) => d.id === bookingAppointmentData.department);
      const selectedDoctor = doctors[bookingAppointmentData.department]?.find(
        (d) => d.id === bookingAppointmentData.doctor
      );

      return (
        <Card sx={{ maxWidth: 600, mx: "auto" }}>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <Avatar sx={{ bgcolor: "#4CAF50", width: 80, height: 80, mx: "auto", mb: 3 }}>
              <CheckIcon sx={{ fontSize: 40 }} />
            </Avatar>

            <Typography variant="h4" fontWeight="bold" color="success.main" gutterBottom>
              Appointment Confirmed!
            </Typography>

            <Alert severity="success" sx={{ mb: 3, textAlign: "left" }}>
              <Typography variant="body1" fontWeight="bold">
                Your appointment has been successfully booked
              </Typography>
            </Alert>

            <Box sx={{ textAlign: "left", mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                📋 Appointment Details
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Patient Name:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {bookingPatientData.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Token Number:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    {bookingConfirmation.tokenNumber}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Department:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedDept?.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Doctor:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedDoctor?.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Date & Time:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {bookingAppointmentData.date} at {bookingAppointmentData.time}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Estimated Wait:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {bookingConfirmation.estimatedWaitTime}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Alert severity="info" sx={{ mb: 3, textAlign: "left" }}>
              <Typography variant="body2">
                <strong>Important Instructions:</strong>
                <br />
                • Arrive 15 minutes before your appointment
                <br />
                • Bring a valid ID and insurance card
                <br />
                • Show your token number at reception
                <br />• Keep this confirmation for your records
              </Typography>
            </Alert>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Button
                variant="contained"
                onClick={() => setActiveTab(1)}
                sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
              >
                View Queue Status
              </Button>
              <Button variant="outlined" onClick={() => (window.location.href = "/enterprise-dashboard")}>
                Back to Dashboard
              </Button>
            </Box>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  // Render functions for Kiosk tab
  const renderWelcomeScreen = () => (
    <Container maxWidth="md">
      <Box sx={{ textAlign: "center", py: 8 }}>
        <TouchIcon sx={{ fontSize: 120, color: "primary.main", mb: 4 }} />

        <Typography variant="h2" gutterBottom fontWeight="bold">
          Welcome to HealthTech
        </Typography>

        <Typography variant="h5" color="text.secondary" sx={{ mb: 6 }}>
          Touch-friendly appointment booking
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                height: 300,
                cursor: "pointer",
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.05)" },
              }}
              onClick={() => handlePatientTypeSelect("new")}
            >
              <CardContent
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <NewPatientIcon sx={{ fontSize: 80, color: "primary.main", mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                  New Patient
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  First time visiting?
                  <br />
                  Register as a new patient
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card
              sx={{
                height: 300,
                cursor: "pointer",
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.05)" },
              }}
              onClick={() => handlePatientTypeSelect("existing")}
            >
              <CardContent
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <ExistingPatientIcon sx={{ fontSize: 80, color: "secondary.main", mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                  Existing Patient
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Have a Patient ID?
                  <br />
                  Quick check-in here
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          Need help? Please ask our front desk staff
        </Typography>
      </Box>
    </Container>
  );

  const renderPatientForm = () => (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Typography variant="h4">{patientType === "new" ? "New Patient Registration" : "Patient Lookup"}</Typography>
          <Button variant="outlined" size="large" onClick={handleStartOver}>
            Start Over
          </Button>
        </Box>

        {patientType === "new" ? (
          <NewPatientForm onSubmit={handlePatientSubmit} />
        ) : (
          <ExistingPatientForm onSubmit={handlePatientSubmit} />
        )}
      </Box>
    </Container>
  );

  const renderAppointmentBooking = () => (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Typography variant="h4">Book Appointment</Typography>
          <Button variant="outlined" size="large" onClick={handleStartOver}>
            Start Over
          </Button>
        </Box>

        <AppointmentBooking
          patient={patientData}
          onSubmit={handleAppointmentSubmit}
          onBack={() => setCurrentStep("patient-info")}
        />
      </Box>
    </Container>
  );

  const renderConfirmation = () => (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <ConfirmationPage patient={patientData} appointment={appointmentData} onStartOver={handleStartOver} />
      </Box>
    </Container>
  );

  const renderQueueStatus = () => {
    if (queueLoading) {
      return (
        <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading queue status...
          </Typography>
        </Container>
      );
    }

    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Typography variant="h4" component="h1">
            Queue Status
          </Typography>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadQueueStatus}>
            Refresh
          </Button>
        </Box>

        <Grid container spacing={4}>
          {/* Token Search */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Find Your Position
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Enter Token Number"
                    value={tokenSearch}
                    onChange={(e) => setTokenSearch(e.target.value.toUpperCase())}
                    placeholder="Q12341234"
                    onKeyPress={(e) => e.key === "Enter" && searchToken()}
                  />
                  <Button variant="contained" onClick={searchToken} disabled={searching} sx={{ minWidth: 100 }}>
                    {searching ? <CircularProgress size={20} /> : <SearchIcon />}
                  </Button>
                </Box>

                {searchResult && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Token: {searchResult.token}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Patient:</strong> {searchResult.patientName}
                      <br />
                      <strong>Position:</strong> #{searchResult.position}
                      <br />
                      <strong>ETA:</strong> {searchResult.eta} (around {searchResult.estimatedTime})<br />
                      <strong>Doctor:</strong> {searchResult.doctor}
                      <br />
                      <strong>Department:</strong> {searchResult.department}
                      <br />
                      <strong>Scheduled:</strong> {searchResult.scheduledTime}
                      <br />
                      {searchResult.symptoms && (
                        <>
                          <strong>Symptoms:</strong> {searchResult.symptoms}
                          <br />
                        </>
                      )}
                      <strong>Status:</strong>{" "}
                      <Chip label={searchResult.status} color={getStatusColor(searchResult.status)} size="small" />
                      {searchResult.urgency && (
                        <>
                          {" "}
                          <Chip
                            label={searchResult.urgency}
                            color={getUrgencyColor(searchResult.urgency)}
                            size="small"
                          />
                        </>
                      )}
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Queue Statistics */}
            {queueData && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Today's Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary">
                          {queueData.stats.total}
                        </Typography>
                        <Typography variant="caption">Total Appointments</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main">
                          {queueData.stats.inProgress}
                        </Typography>
                        <Typography variant="caption">In Progress</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="warning.main">
                          {queueData.stats.waiting}
                        </Typography>
                        <Typography variant="caption">Waiting</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="info.main">
                          {queueData.stats.averageWaitTime}m
                        </Typography>
                        <Typography variant="caption">Avg Wait</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box textAlign="center" sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Total waiting time: {Math.floor((queueData.stats.totalWaitingTime || 0) / 60)}h{" "}
                          {(queueData.stats.totalWaitingTime || 0) % 60}m
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Queue Lists */}
          <Grid item xs={12} md={8}>
            {queueData && (
              <>
                {/* Currently Being Served */}
                {queueData.queue["in-progress"]?.length > 0 && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="success.main">
                        🟢 Currently Being Served
                      </Typography>
                      <List>
                        {queueData.queue["in-progress"].map((appointment, index) => (
                          <ListItem key={appointment.id}>
                            <ListItemIcon>
                              <HospitalIcon color="success" />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {appointment.token}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    - {appointment.patientName}
                                  </Typography>
                                  <Chip
                                    label={appointment.urgency}
                                    color={getUrgencyColor(appointment.urgency)}
                                    size="small"
                                  />
                                  <Chip label={appointment.channel} variant="outlined" size="small" />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2">
                                    <strong>Doctor:</strong> {appointment.doctor} - Room {appointment.room || "TBD"}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Department:</strong> {appointment.department}
                                  </Typography>
                                  {appointment.symptoms && (
                                    <Typography variant="body2" color="text.secondary">
                                      <strong>Symptoms:</strong>{" "}
                                      {appointment.symptoms.length > 50
                                        ? appointment.symptoms.substring(0, 50) + "..."
                                        : appointment.symptoms}
                                    </Typography>
                                  )}
                                  {appointment.patientDetails && (
                                    <Typography variant="caption" color="text.secondary">
                                      Patient ID: {appointment.patientDetails.uniqueId} |
                                      {appointment.patientDetails.age && ` Age: ${appointment.patientDetails.age} |`}
                                      {appointment.patientDetails.gender && ` ${appointment.patientDetails.gender}`}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                )}

                {/* Waiting Queue */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="warning.main">
                      ⏳ Waiting Queue
                    </Typography>

                    {queueData.queue.queued?.length > 0 || queueData.queue.booked?.length > 0 ? (
                      <List>
                        {[...queueData.queue.queued, ...queueData.queue.booked]
                          .sort((a, b) => new Date(a.slot) - new Date(b.slot))
                          .map((appointment, index) => (
                            <React.Fragment key={appointment.id}>
                              <ListItem>
                                <ListItemIcon>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: 40,
                                      height: 40,
                                      borderRadius: "50%",
                                      backgroundColor: "primary.light",
                                      color: "white",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {index + 1}
                                  </Box>
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                      <Typography variant="subtitle1" fontWeight="bold">
                                        {appointment.token}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        - {appointment.patientName}
                                      </Typography>
                                      <Chip
                                        label={appointment.urgency}
                                        color={getUrgencyColor(appointment.urgency)}
                                        size="small"
                                      />
                                      <Chip
                                        label={appointment.status}
                                        color={getStatusColor(appointment.status)}
                                        size="small"
                                      />
                                      <Chip label={appointment.channel} variant="outlined" size="small" />
                                    </Box>
                                  }
                                  secondary={
                                    <Box>
                                      <Typography variant="body2">
                                        <strong>Doctor:</strong> {appointment.doctor} - <strong>Department:</strong>{" "}
                                        {appointment.department}
                                      </Typography>
                                      {appointment.symptoms && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                          <strong>Symptoms:</strong>{" "}
                                          {appointment.symptoms.length > 80
                                            ? appointment.symptoms.substring(0, 80) + "..."
                                            : appointment.symptoms}
                                        </Typography>
                                      )}
                                      <Typography variant="caption" color="text.secondary">
                                        <strong>Scheduled:</strong>{" "}
                                        {appointment.scheduledTime || moment(appointment.slot).format("HH:mm")} |
                                        <strong>ETA:</strong> {appointment.eta} (around {appointment.estimatedTime})
                                      </Typography>
                                      {appointment.patientDetails && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{ display: "block", mt: 0.5 }}
                                        >
                                          <strong>Patient ID:</strong> {appointment.patientDetails.uniqueId}
                                          {appointment.patientDetails.age &&
                                            ` | Age: ${appointment.patientDetails.age}`}
                                          {appointment.patientDetails.gender &&
                                            ` | ${appointment.patientDetails.gender}`}
                                          {appointment.patientDetails.phone &&
                                            ` | Phone: ${appointment.patientDetails.phone}`}
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                />
                              </ListItem>
                              {index < queueData.queue.queued.length + queueData.queue.booked.length - 1 && (
                                <Divider variant="inset" component="li" />
                              )}
                            </React.Fragment>
                          ))}
                      </List>
                    ) : (
                      <Alert severity="info">No patients currently waiting in queue.</Alert>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </Grid>
        </Grid>

        {/* Last Updated */}
        {queueData && (
          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Last updated: {moment(queueData.lastUpdated).format("HH:mm:ss")} | Updates automatically every 30 seconds
            </Typography>
          </Box>
        )}
      </Container>
    );
  };

  const bookingSteps = ["Patient Information", "Appointment Details", "Confirmation"];

  const isBookingPatientDataValid =
    bookingPatientData.name.trim() && bookingPatientData.phone.trim() && bookingPatientData.dob;
  const isBookingAppointmentDataValid =
    bookingAppointmentData.department &&
    bookingAppointmentData.doctor &&
    bookingAppointmentData.date &&
    bookingAppointmentData.time &&
    bookingAppointmentData.symptoms;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "background.default",
        fontSize: "1.1rem",
        "& .MuiButton-root": {
          minHeight: 48,
          fontSize: "1rem",
        },
        "& .MuiTextField-root": {
          "& .MuiInputBase-input": {
            fontSize: "1rem",
            padding: "12px",
          },
        },
      }}
    >
      {/* Features Popup */}
      <Dialog open={showFeaturesPopup} onClose={() => setShowFeaturesPopup(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: "bold", color: "primary.main" }}>
            🚀 Advanced Features Available
          </Typography>
          <IconButton onClick={() => setShowFeaturesPopup(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", pb: 3 }}>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
            There are more features like the{" "}
            <Box component="span" sx={{ fontWeight: "bold", color: "primary.main" }}>
              agentic AI conversational appointment booking through phone call
            </Box>
            , as well as{" "}
            <Box component="span" sx={{ fontWeight: "bold", color: "primary.main" }}>
              agentic WhatsApp chat
            </Box>
            , as well as a{" "}
            <Box component="span" sx={{ fontWeight: "bold", color: "primary.main" }}>
              chat based RAG system for the enterprise
            </Box>
            .
          </Typography>
          <Button variant="contained" onClick={() => setShowFeaturesPopup(false)} sx={{ mt: 2, minWidth: 120 }}>
            Got it!
          </Button>
        </DialogContent>
      </Dialog>
      {/* Kiosk Header */}
      <Box
        sx={{
          backgroundColor: "primary.main",
          color: "white",
          py: 2,
          textAlign: "center",
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          🏥 HealthTech Kiosk Dashboard
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} centered>
          <Tab label="Book Appointment" icon={<EventIcon />} iconPosition="start" />
          <Tab label="Touch Kiosk" icon={<TouchIcon />} iconPosition="start" />
          <Tab label="Queue Status" icon={<AccessTimeIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ py: 2 }}>
        {activeTab === 0 && (
          <Container maxWidth="lg">
            <Box sx={{ mb: 4, textAlign: "center" }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                🏥 Book New Appointment
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Complete patient registration and appointment booking in one flow
              </Typography>
            </Box>

            <Box sx={{ maxWidth: 800, mx: "auto", mb: 4 }}>
              <Stepper activeStep={bookingActiveStep} alternativeLabel>
                {bookingSteps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            <Box sx={{ mb: 4 }}>
              {bookingActiveStep === 0 && renderBookingPatientForm()}
              {bookingActiveStep === 1 && renderBookingAppointmentForm()}
              {(bookingActiveStep === 2 || bookingActiveStep === 3) && renderBookingConfirmation()}
            </Box>

            {bookingActiveStep < 3 && !bookingLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                <Button disabled={bookingActiveStep === 0} onClick={handleBookingBack} variant="outlined">
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleBookingNext}
                  disabled={
                    (bookingActiveStep === 0 && !isBookingPatientDataValid) ||
                    (bookingActiveStep === 1 && !isBookingAppointmentDataValid)
                  }
                  sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
                >
                  {bookingActiveStep === 2 ? "Confirm Booking" : "Next"}
                </Button>
              </Box>
            )}
          </Container>
        )}

        {activeTab === 1 && (
          <>
            {currentStep === "welcome" && renderWelcomeScreen()}
            {currentStep === "patient-info" && renderPatientForm()}
            {currentStep === "appointment-booking" && renderAppointmentBooking()}
            {currentStep === "confirmation" && renderConfirmation()}
          </>
        )}

        {activeTab === 2 && renderQueueStatus()}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "grey.100",
          py: 1,
          textAlign: "center",
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Kiosk Dashboard - Need help? Call front desk: (555) 123-4567
        </Typography>
      </Box>
    </Box>
  );
};

export default KioskDashboard;
