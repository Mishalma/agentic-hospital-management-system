import React from 'react';
import {
  Grid,
  TextField,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import toast from 'react-hot-toast';

const validationSchema = Yup.object({
  uniqueId: Yup.string()
    .matches(/^PT\d{10}$/, 'Patient ID must be in format PT followed by 10 digits (e.g., PT2024123456)')
    .required('Patient ID is required')
});

const ExistingPatientForm = ({ onSubmit }) => {
  const formik = useFormik({
    initialValues: {
      uniqueId: ''
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const response = await axios.post('/api/patients/find', {
          uniqueId: values.uniqueId
        });
        
        if (response.data.success) {
          toast.success('Patient found successfully!');
          onSubmit(response.data.patient);
        } else {
          toast.error(response.data.message || 'Patient not found');
        }
      } catch (error) {
        console.error('Patient lookup error:', error);
        if (error.response?.status === 404) {
          toast.error('Patient not found. Please check your Patient ID or register as a new patient.');
        } else {
          toast.error(error.response?.data?.message || 'Failed to find patient');
        }
      } finally {
        setSubmitting(false);
      }
    }
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Existing Patient Lookup
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom color="primary">
            Enter Your Patient ID
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Your Patient ID can be found on previous appointment confirmations, 
            discharge papers, or by calling our front desk.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="uniqueId"
                label="Patient ID"
                value={formik.values.uniqueId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.uniqueId && Boolean(formik.errors.uniqueId)}
                helperText={formik.touched.uniqueId && formik.errors.uniqueId}
                placeholder="PT2024123456"
                required
                inputProps={{
                  style: { textTransform: 'uppercase' }
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Patient ID Format:</strong> PT followed by 10 digits (e.g., PT2024123456)
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Demo Patient IDs */}
      <Card sx={{ mb: 3, backgroundColor: 'warning.light' }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            🚀 Demo Patient IDs (for testing):
          </Typography>
          <Typography variant="body2" component="div">
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>PT2024123456 - John Doe</li>
              <li>PT2024789012 - Jane Smith</li>
              <li>PT2024345678 - Bob Johnson</li>
            </ul>
          </Typography>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Don't have a Patient ID? Register as a new patient instead.
        </Typography>
        
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={formik.isSubmitting}
          sx={{ minWidth: 200 }}
        >
          {formik.isSubmitting ? 'Looking up...' : 'Find Patient'}
        </Button>
      </Box>
    </Box>
  );
};

export default ExistingPatientForm;