import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Event as EventIcon,
  CheckCircle as CheckIcon,
  LocalHospital as DoctorIcon,
  Schedule as TimeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
// Removed problematic date picker imports
import './IntegratedBooking.css';

const IntegratedBooking = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [patientData, setPatientData] = useState({
    name: '',
    phone: '',
    email: '',
    dob: '',
    gender: '',
    address: '',
    emergencyContact: ''
  });
  const [appointmentData, setAppointmentData] = useState({
    department: '',
    doctor: '',
    date: '',
    time: '',
    symptoms: '',
    urgency: 'normal'
  });
  const [confirmation, setConfirmation] = useState(null);

  const steps = [
    'Patient Information',
    'Appointment Details', 
    'Confirmation'
  ];

  const departments = [
    { id: 'general', name: 'General Medicine', icon: '🩺' },
    { id: 'cardiology', name: 'Cardiology', icon: '❤️' },
    { id: 'pediatrics', name: 'Pediatrics', icon: '👶' },
    { id: 'orthopedics', name: 'Orthopedics', icon: '🦴' },
    { id: 'dermatology', name: 'Dermatology', icon: '🧴' },
    { id: 'neurology', name: 'Neurology', icon: '🧠' }
  ];

  const doctors = {
    general: [
      { id: 'dr-johnson', name: 'Dr. Sarah Johnson', experience: '15 years', rating: 4.8 },
      { id: 'dr-smith', name: 'Dr. Michael Smith', experience: '12 years', rating: 4.7 }
    ],
    cardiology: [
      { id: 'dr-chen', name: 'Dr. Michael Chen', experience: '20 years', rating: 4.9 },
      { id: 'dr-patel', name: 'Dr. Priya Patel', experience: '18 years', rating: 4.8 }
    ],
    pediatrics: [
      { id: 'dr-rodriguez', name: 'Dr. Emily Rodriguez', experience: '14 years', rating: 4.9 }
    ],
    orthopedics: [
      { id: 'dr-kim', name: 'Dr. David Kim', experience: '16 years', rating: 4.7 }
    ],
    dermatology: [
      { id: 'dr-wilson', name: 'Dr. Lisa Wilson', experience: '13 years', rating: 4.6 }
    ],
    neurology: [
      { id: 'dr-brown', name: 'Dr. James Brown', experience: '22 years', rating: 4.9 }
    ]
  };

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  const handleNext = () => {
    console.log('Current step:', activeStep);
    console.log('Patient data:', patientData);
    console.log('Validation result:', validatePatientData());
    
    if (activeStep === 0 && validatePatientData()) {
      setActiveStep(1);
    } else if (activeStep === 1 && validateAppointmentData()) {
      setActiveStep(2);
    } else if (activeStep === 2) {
      handleSubmit();
    } else {
      // Show validation error
      console.log('Validation failed for step:', activeStep);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const validatePatientData = () => {
    const errors = {};
    
    if (!patientData.name.trim()) {
      errors.name = 'Full name is required';
    }
    
    if (!patientData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    if (!patientData.dob) {
      errors.dob = 'Date of birth is required';
    }
    
    setValidationErrors(errors);
    
    const isValid = Object.keys(errors).length === 0;
    console.log('Validating patient data:', {
      name: patientData.name,
      phone: patientData.phone,
      dob: patientData.dob,
      errors,
      isValid
    });
    
    return isValid;
  };

  const validateAppointmentData = () => {
    return appointmentData.department && appointmentData.doctor && 
           appointmentData.date && appointmentData.time && appointmentData.symptoms;
  };

  // Computed validation states to avoid calling validation functions in render
  const isPatientDataValid = patientData.name.trim() && patientData.phone.trim() && patientData.dob;
  const isAppointmentDataValid = appointmentData.department && appointmentData.doctor && 
                                appointmentData.date && appointmentData.time && appointmentData.symptoms;

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Create patient and appointment via API
      const bookingData = {
        patient: patientData,
        appointment: appointmentData
      };

      console.log('Submitting booking data:', bookingData);

      const response = await fetch('/api/appointments/book-integrated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('Response data:', result);

      if (result.success) {
        setConfirmation({
          appointmentId: result.data.appointment.id,
          tokenNumber: result.data.appointment.token,
          patientId: result.data.patient.uniqueId,
          estimatedWaitTime: '30-45 minutes',
          smsStatus: result.data.smsStatus
        });
        
        setActiveStep(3);
      } else {
        throw new Error(result.message || 'Booking failed');
      }
      
    } catch (error) {
      console.error('Booking failed:', error);
      console.error('Error details:', error.message);
      alert(`Failed to book appointment: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const renderPatientForm = () => (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ bgcolor: '#2196F3', mr: 2 }}>
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
              value={patientData.name}
              onChange={(e) => {
                setPatientData({...patientData, name: e.target.value});
                setValidationErrors({...validationErrors, name: ''});
              }}
              error={!!validationErrors.name}
              helperText={validationErrors.name}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              value={patientData.phone}
              onChange={(e) => {
                setPatientData({...patientData, phone: e.target.value});
                setValidationErrors({...validationErrors, phone: ''});
              }}
              error={!!validationErrors.phone}
              helperText={validationErrors.phone}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={patientData.email}
              onChange={(e) => setPatientData({...patientData, email: e.target.value})}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              value={patientData.dob}
              onChange={(e) => {
                setPatientData({...patientData, dob: e.target.value});
                setValidationErrors({...validationErrors, dob: ''});
              }}
              InputLabelProps={{ shrink: true }}
              error={!!validationErrors.dob}
              helperText={validationErrors.dob}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={patientData.gender}
                onChange={(e) => setPatientData({...patientData, gender: e.target.value})}
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
              value={patientData.address}
              onChange={(e) => setPatientData({...patientData, address: e.target.value})}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Emergency Contact"
              value={patientData.emergencyContact}
              onChange={(e) => setPatientData({...patientData, emergencyContact: e.target.value})}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderAppointmentForm = () => (
    <Card sx={{ maxWidth: 800, mx: 'auto' }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ bgcolor: '#4CAF50', mr: 2 }}>
            <EventIcon />
          </Avatar>
          <Typography variant="h5" fontWeight="bold">
            Appointment Details
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          {/* Department Selection */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Select Department
            </Typography>
            <Grid container spacing={2}>
              {departments.map((dept) => (
                <Grid item xs={12} sm={6} md={4} key={dept.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: appointmentData.department === dept.id ? 2 : 1,
                      borderColor: appointmentData.department === dept.id ? '#4CAF50' : 'divider',
                      '&:hover': { borderColor: '#4CAF50' }
                    }}
                    onClick={() => setAppointmentData({...appointmentData, department: dept.id, doctor: ''})}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
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

          {/* Doctor Selection */}
          {appointmentData.department && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Select Doctor
              </Typography>
              <List>
                {doctors[appointmentData.department]?.map((doctor) => (
                  <React.Fragment key={doctor.id}>
                    <ListItem
                      button
                      selected={appointmentData.doctor === doctor.id}
                      onClick={() => setAppointmentData({...appointmentData, doctor: doctor.id})}
                      sx={{
                        border: 1,
                        borderColor: appointmentData.doctor === doctor.id ? '#4CAF50' : 'divider',
                        borderRadius: 2,
                        mb: 1
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#4CAF50' }}>
                          <DoctorIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={doctor.name}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip label={doctor.experience} size="small" />
                            <Chip label={`⭐ ${doctor.rating}`} size="small" color="success" />
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Grid>
          )}

          {/* Date and Time Selection */}
          {appointmentData.doctor && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Appointment Date"
                  type="date"
                  value={appointmentData.date}
                  onChange={(e) => setAppointmentData({...appointmentData, date: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: new Date().toISOString().split('T')[0] }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Time Slot</InputLabel>
                  <Select
                    value={appointmentData.time}
                    onChange={(e) => setAppointmentData({...appointmentData, time: e.target.value})}
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
                  value={appointmentData.symptoms}
                  onChange={(e) => setAppointmentData({...appointmentData, symptoms: e.target.value})}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Urgency Level</InputLabel>
                  <Select
                    value={appointmentData.urgency}
                    onChange={(e) => setAppointmentData({...appointmentData, urgency: e.target.value})}
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

  const renderConfirmation = () => {
    if (loading) {
      return (
        <Card sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
          <CardContent sx={{ p: 6 }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6">
              Processing your appointment...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we confirm your booking
            </Typography>
          </CardContent>
        </Card>
      );
    }

    if (confirmation) {
      const selectedDept = departments.find(d => d.id === appointmentData.department);
      const selectedDoctor = doctors[appointmentData.department]?.find(d => d.id === appointmentData.doctor);

      return (
        <Card sx={{ maxWidth: 600, mx: 'auto' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: '#4CAF50', width: 80, height: 80, mx: 'auto', mb: 3 }}>
              <CheckIcon sx={{ fontSize: 40 }} />
            </Avatar>
            
            <Typography variant="h4" fontWeight="bold" color="success.main" gutterBottom>
              Appointment Confirmed!
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body1" fontWeight="bold">
                Your appointment has been successfully booked
              </Typography>
            </Alert>

            <Box sx={{ textAlign: 'left', mb: 3 }}>
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
                    {patientData.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Token Number:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    {confirmation.tokenNumber}
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
                    {appointmentData.date} at {appointmentData.time}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Estimated Wait:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {confirmation.estimatedWaitTime}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Important Instructions:</strong><br />
                • Arrive 15 minutes before your appointment<br />
                • Bring a valid ID and insurance card<br />
                • Show your token number at reception<br />
                • Keep this confirmation for your records
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={() => window.location.href = '/queue-status'}
                sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                View Queue Status
              </Button>
              <Button
                variant="outlined"
                onClick={() => window.location.href = '/enterprise-dashboard'}
              >
                Back to Dashboard
              </Button>
            </Box>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          🏥 Book New Appointment
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Complete patient registration and appointment booking in one flow
        </Typography>
      </Box>

      {/* Stepper */}
      <Box sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Form Content */}
      <Box sx={{ mb: 4 }}>
        {activeStep === 0 && renderPatientForm()}
        {activeStep === 1 && renderAppointmentForm()}
        {(activeStep === 2 || activeStep === 3) && renderConfirmation()}
      </Box>

      {/* Navigation Buttons */}
      {activeStep < 3 && !loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={
              (activeStep === 0 && !isPatientDataValid) ||
              (activeStep === 1 && !isAppointmentDataValid)
            }
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            {activeStep === 2 ? 'Confirm Booking' : 'Next'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default IntegratedBooking;