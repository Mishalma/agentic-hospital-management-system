import React, { useState } from 'react';
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { PersonAdd, Search } from '@mui/icons-material';
import NewPatientForm from '../components/Registration/NewPatientForm';
import ExistingPatientForm from '../components/Registration/ExistingPatientForm';
import AppointmentBooking from '../components/Registration/AppointmentBooking';
import ConfirmationPage from '../components/Registration/ConfirmationPage';

const Registration = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [patientData, setPatientData] = useState(null);
  const [appointmentData, setAppointmentData] = useState(null);

  const steps = ['Patient Info', 'Book Appointment', 'Confirmation'];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setCurrentStep(0);
    setPatientData(null);
    setAppointmentData(null);
  };

  const handlePatientSubmit = (data) => {
    setPatientData(data);
    setCurrentStep(1);
  };

  const handleAppointmentSubmit = (data) => {
    setAppointmentData(data);
    setCurrentStep(2);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(0);
    setPatientData(null);
    setAppointmentData(null);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return activeTab === 0 ? (
          <NewPatientForm onSubmit={handlePatientSubmit} />
        ) : (
          <ExistingPatientForm onSubmit={handlePatientSubmit} />
        );
      case 1:
        return (
          <AppointmentBooking 
            patient={patientData}
            onSubmit={handleAppointmentSubmit}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <ConfirmationPage 
            patient={patientData}
            appointment={appointmentData}
            onStartOver={handleStartOver}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          Patient Registration
        </Typography>
        
        {currentStep < 2 && (
          <>
            {/* Patient Type Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                centered
                variant="fullWidth"
              >
                <Tab 
                  icon={<PersonAdd />} 
                  label="New Patient" 
                  disabled={currentStep > 0}
                />
                <Tab 
                  icon={<Search />} 
                  label="Existing Patient" 
                  disabled={currentStep > 0}
                />
              </Tabs>
            </Box>

            {/* Progress Stepper */}
            <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </>
        )}

        {/* Step Content */}
        {renderStepContent()}

        {/* Help Section */}
        {currentStep === 0 && (
          <Card sx={{ mt: 4, backgroundColor: 'info.light' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Need Help?
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <strong>New Patient:</strong> First time visiting? Fill out the complete registration form.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <strong>Existing Patient:</strong> Have a patient ID? Use it to quickly access your information.
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Paper>
    </Container>
  );
};

export default Registration;