import React from 'react';
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
  CardContent
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import toast from 'react-hot-toast';

const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .required('Name is required'),
  dob: Yup.date()
    .max(new Date(), 'Date of birth cannot be in the future')
    .required('Date of birth is required'),
  phone: Yup.string()
    .matches(/^\+?[\d\s\-\(\)]{10,15}$/, 'Invalid phone number')
    .required('Phone number is required'),
  email: Yup.string()
    .email('Invalid email address')
    .optional(),
  insuranceProvider: Yup.string().optional(),
  policyNumber: Yup.string().optional(),
  emergencyContactName: Yup.string().optional(),
  emergencyContactPhone: Yup.string()
    .matches(/^\+?[\d\s\-\(\)]{10,15}$/, 'Invalid phone number')
    .optional(),
  emergencyContactRelationship: Yup.string().optional()
});

const NewPatientForm = ({ onSubmit }) => {
  const formik = useFormik({
    initialValues: {
      name: '',
      dob: '',
      phone: '',
      email: '',
      insuranceProvider: '',
      policyNumber: '',
      groupNumber: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: ''
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const patientData = {
          name: values.name,
          dob: values.dob,
          phone: values.phone,
          email: values.email || undefined,
          insurance: values.insuranceProvider ? {
            provider: values.insuranceProvider,
            policyNumber: values.policyNumber,
            groupNumber: values.groupNumber || undefined
          } : undefined,
          emergencyContact: values.emergencyContactName ? {
            name: values.emergencyContactName,
            phone: values.emergencyContactPhone,
            relationship: values.emergencyContactRelationship
          } : undefined
        };

        const response = await axios.post('/api/patients/register', patientData);
        
        if (response.data.success) {
          toast.success('Patient registered successfully!');
          onSubmit(response.data.patient);
        } else {
          toast.error(response.data.message || 'Registration failed');
        }
      } catch (error) {
        console.error('Registration error:', error);
        if (error.response?.status === 409) {
          toast.error('Patient already exists with this phone number');
        } else {
          toast.error(error.response?.data?.message || 'Registration failed');
        }
      } finally {
        setSubmitting(false);
      }
    }
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <Typography variant="h6" gutterBottom>
        New Patient Registration
      </Typography>

      {/* Basic Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom color="primary">
            Basic Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="name"
                label="Full Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="dob"
                label="Date of Birth"
                type="date"
                value={formik.values.dob}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.dob && Boolean(formik.errors.dob)}
                helperText={formik.touched.dob && formik.errors.dob}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="phone"
                label="Phone Number"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone && Boolean(formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
                placeholder="+1 (555) 123-4567"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="email"
                label="Email Address"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                placeholder="patient@example.com"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Insurance Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom color="primary">
            Insurance Information (Optional)
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Insurance Provider</InputLabel>
                <Select
                  name="insuranceProvider"
                  value={formik.values.insuranceProvider}
                  onChange={formik.handleChange}
                  label="Insurance Provider"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="Blue Cross Blue Shield">Blue Cross Blue Shield</MenuItem>
                  <MenuItem value="Aetna">Aetna</MenuItem>
                  <MenuItem value="Cigna">Cigna</MenuItem>
                  <MenuItem value="UnitedHealth">UnitedHealth</MenuItem>
                  <MenuItem value="Kaiser Permanente">Kaiser Permanente</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                name="policyNumber"
                label="Policy Number"
                value={formik.values.policyNumber}
                onChange={formik.handleChange}
                placeholder="ABC123456789"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                name="groupNumber"
                label="Group Number"
                value={formik.values.groupNumber}
                onChange={formik.handleChange}
                placeholder="GRP001"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom color="primary">
            Emergency Contact (Optional)
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                name="emergencyContactName"
                label="Contact Name"
                value={formik.values.emergencyContactName}
                onChange={formik.handleChange}
                placeholder="John Doe"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                name="emergencyContactPhone"
                label="Contact Phone"
                value={formik.values.emergencyContactPhone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.emergencyContactPhone && Boolean(formik.errors.emergencyContactPhone)}
                helperText={formik.touched.emergencyContactPhone && formik.errors.emergencyContactPhone}
                placeholder="+1 (555) 987-6543"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Relationship</InputLabel>
                <Select
                  name="emergencyContactRelationship"
                  value={formik.values.emergencyContactRelationship}
                  onChange={formik.handleChange}
                  label="Relationship"
                >
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="Spouse">Spouse</MenuItem>
                  <MenuItem value="Parent">Parent</MenuItem>
                  <MenuItem value="Child">Child</MenuItem>
                  <MenuItem value="Sibling">Sibling</MenuItem>
                  <MenuItem value="Friend">Friend</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={formik.isSubmitting}
          sx={{ minWidth: 200 }}
        >
          {formik.isSubmitting ? 'Registering...' : 'Continue to Booking'}
        </Button>
      </Box>
    </Box>
  );
};

export default NewPatientForm;