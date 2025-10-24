import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import toast from 'react-hot-toast';
import moment from 'moment';

const validationSchema = Yup.object({
  doctor: Yup.string().required('Doctor selection is required'),
  department: Yup.string().required('Department is required'),
  slot: Yup.date().required('Appointment slot is required'),
  symptoms: Yup.string()
    .min(5, 'Please describe your symptoms in at least 5 characters')
    .max(500, 'Description must be less than 500 characters')
    .required('Symptoms description is required'),
  urgency: Yup.string().oneOf(['low', 'medium', 'high']).required('Urgency level is required')
});

const AppointmentBooking = ({ patient, onSubmit, onBack }) => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const doctors = [
    { name: 'Dr. Sarah Johnson', department: 'General Medicine' },
    { name: 'Dr. Michael Chen', department: 'Cardiology' },
    { name: 'Dr. Emily Rodriguez', department: 'Pediatrics' },
    { name: 'Dr. David Kim', department: 'Orthopedics' },
    { name: 'Dr. Lisa Thompson', department: 'Dermatology' }
  ];

  const formik = useFormik({
    initialValues: {
      doctor: '',
      department: '',
      slot: '',
      symptoms: '',
      urgency: 'low'
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const appointmentData = {
          patientId: patient.id,
          doctor: values.doctor,
          department: values.department,
          slot: values.slot,
          symptoms: values.symptoms,
          urgency: values.urgency,
          channel: 'web'
        };

        const response = await axios.post('/api/appointments/book', appointmentData);
        
        if (response.data.success) {
          toast.success('Appointment booked successfully!');
          onSubmit(response.data.appointment);
        } else {
          toast.error(response.data.message || 'Booking failed');
        }
      } catch (error) {
        console.error('Booking error:', error);
        if (error.response?.status === 409) {
          toast.error('Selected slot is no longer available. Please choose another time.');
          loadSlots(formik.values.doctor);
        } else {
          toast.error(error.response?.data?.message || 'Booking failed');
        }
      } finally {
        setSubmitting(false);
      }
    }
  });

  const loadSlots = async (doctor) => {
    if (!doctor) return;
    
    setLoadingSlots(true);
    try {
      const response = await axios.get(`/api/appointments/slots/${encodeURIComponent(doctor)}`);
      if (response.data.success) {
        setAvailableSlots(response.data.slots);
      }
    } catch (error) {
      console.error('Failed to load slots:', error);
      toast.error('Failed to load available slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (formik.values.doctor) {
      loadSlots(formik.values.doctor);
    }
  }, [formik.values.doctor]);

  const handleDoctorChange = (event) => {
    const selectedDoctor = event.target.value;
    const doctorInfo = doctors.find(d => d.name === selectedDoctor);
    
    formik.setFieldValue('doctor', selectedDoctor);
    formik.setFieldValue('department', doctorInfo?.department || '');
    formik.setFieldValue('slot', ''); // Reset slot selection
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Book Appointment for {patient.name}
      </Typography>

      {/* Patient Info Summary */}
      <Card sx={{ mb: 3, backgroundColor: 'info.light' }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Patient Information
          </Typography>
          <Typography variant="body2">
            <strong>Name:</strong> {patient.name} | 
            <strong> ID:</strong> {patient.uniqueId} | 
            <strong> Phone:</strong> {patient.phone}
          </Typography>
        </CardContent>
      </Card>

      {/* Doctor & Department Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom color="primary">
            Doctor & Department
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Select Doctor</InputLabel>
                <Select
                  name="doctor"
                  value={formik.values.doctor}
                  onChange={handleDoctorChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.doctor && Boolean(formik.errors.doctor)}
                  label="Select Doctor"
                >
                  {doctors.map((doctor) => (
                    <MenuItem key={doctor.name} value={doctor.name}>
                      {doctor.name} - {doctor.department}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="department"
                label="Department"
                value={formik.values.department}
                InputProps={{ readOnly: true }}
                disabled
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Available Slots */}
      {formik.values.doctor && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom color="primary">
              Available Time Slots
            </Typography>
            
            {loadingSlots ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : availableSlots.length > 0 ? (
              <Grid container spacing={2}>
                {availableSlots.map((slot, index) => (
                  <Grid item xs={6} md={3} key={index}>
                    <Button
                      variant={formik.values.slot === slot.time ? 'contained' : 'outlined'}
                      fullWidth
                      onClick={() => formik.setFieldValue('slot', slot.time)}
                      sx={{ p: 1.5 }}
                    >
                      {moment(slot.time).format('MMM DD, HH:mm')}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="warning">
                No available slots for the selected doctor today. Please try another doctor or date.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Symptoms & Urgency */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom color="primary">
            Symptoms & Priority
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                name="symptoms"
                label="Describe your symptoms"
                value={formik.values.symptoms}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.symptoms && Boolean(formik.errors.symptoms)}
                helperText={formik.touched.symptoms && formik.errors.symptoms}
                placeholder="Please describe your symptoms, concerns, or reason for visit..."
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Urgency Level</InputLabel>
                <Select
                  name="urgency"
                  value={formik.values.urgency}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.urgency && Boolean(formik.errors.urgency)}
                  label="Urgency Level"
                >
                  <MenuItem value="low">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label="Low" color="success" size="small" />
                      <span>Routine check-up</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="medium">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label="Medium" color="warning" size="small" />
                      <span>Moderate concern</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="high">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label="High" color="error" size="small" />
                      <span>Urgent care needed</span>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={onBack}
          size="large"
        >
          Back
        </Button>
        
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={formik.isSubmitting || !formik.values.slot}
          sx={{ minWidth: 200 }}
        >
          {formik.isSubmitting ? 'Booking...' : 'Book Appointment'}
        </Button>
      </Box>
    </Box>
  );
};

export default AppointmentBooking;