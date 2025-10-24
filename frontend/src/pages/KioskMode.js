import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Container
} from '@mui/material';
import {
  PersonAdd as NewPatientIcon,
  Search as ExistingPatientIcon,
  TouchApp as TouchIcon
} from '@mui/icons-material';
import NewPatientForm from '../components/Registration/NewPatientForm';
import ExistingPatientForm from '../components/Registration/ExistingPatientForm';
import AppointmentBooking from '../components/Registration/AppointmentBooking';
import ConfirmationPage from '../components/Registration/ConfirmationPage';

const KioskMode = () => {
  const [currentStep, setCurrentStep] = useState('welcome');
  const [patientType, setPatientType] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [appointmentData, setAppointmentData] = useState(null);

  const handlePatientTypeSelect = (type) => {
    setPatientType(type);
    setCurrentStep('patient-info');
  };

  const handlePatientSubmit = (data) => {
    setPatientData(data);
    setCurrentStep('appointment-booking');
  };

  const handleAppointmentSubmit = (data) => {
    setAppointmentData(data);
    setCurrentStep('confirmation');
  };

  const handleStartOver = () => {
    setCurrentStep('welcome');
    setPatientType(null);
    setPatientData(null);
    setAppointmentData(null);
  };

  const renderWelcomeScreen = () => (
    <Container maxWidth="md">
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <TouchIcon sx={{ fontSize: 120, color: 'primary.main', mb: 4 }} />
        
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
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.05)' }
              }}
              onClick={() => handlePatientTypeSelect('new')}
            >
              <CardContent sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <NewPatientIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                  New Patient
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  First time visiting?<br />
                  Register as a new patient
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Card 
              sx={{ 
                height: 300, 
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.05)' }
              }}
              onClick={() => handlePatientTypeSelect('existing')}
            >
              <CardContent sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <ExistingPatientIcon sx={{ fontSize: 80, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                  Existing Patient
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Have a Patient ID?<br />
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">
            {patientType === 'new' ? 'New Patient Registration' : 'Patient Lookup'}
          </Typography>
          <Button
            variant="outlined"
            size="large"
            onClick={handleStartOver}
          >
            Start Over
          </Button>
        </Box>
        
        {patientType === 'new' ? (
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">
            Book Appointment
          </Typography>
          <Button
            variant="outlined"
            size="large"
            onClick={handleStartOver}
          >
            Start Over
          </Button>
        </Box>
        
        <AppointmentBooking 
          patient={patientData}
          onSubmit={handleAppointmentSubmit}
          onBack={() => setCurrentStep('patient-info')}
        />
      </Box>
    </Container>
  );

  const renderConfirmation = () => (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <ConfirmationPage 
          patient={patientData}
          appointment={appointmentData}
          onStartOver={handleStartOver}
        />
      </Box>
    </Container>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: 'background.default',
      // Kiosk-specific styles
      fontSize: '1.2rem',
      '& .MuiButton-root': {
        minHeight: 60,
        fontSize: '1.1rem'
      },
      '& .MuiTextField-root': {
        '& .MuiInputBase-input': {
          fontSize: '1.1rem',
          padding: '16px'
        }
      }
    }}>
      {/* Kiosk Header */}
      <Box sx={{ 
        backgroundColor: 'primary.main', 
        color: 'white', 
        py: 2, 
        textAlign: 'center' 
      }}>
        <Typography variant="h5" fontWeight="bold">
          🏥 HealthTech Kiosk - Self-Service Registration
        </Typography>
      </Box>

      {/* Content */}
      {currentStep === 'welcome' && renderWelcomeScreen()}
      {currentStep === 'patient-info' && renderPatientForm()}
      {currentStep === 'appointment-booking' && renderAppointmentBooking()}
      {currentStep === 'confirmation' && renderConfirmation()}

      {/* Kiosk Footer */}
      <Box sx={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'grey.100',
        py: 1,
        textAlign: 'center',
        borderTop: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="caption" color="text.secondary">
          Kiosk Mode - Touch anywhere to continue | Need help? Call front desk: (555) 123-4567
        </Typography>
      </Box>
    </Box>
  );
};

export default KioskMode;