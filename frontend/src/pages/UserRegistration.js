import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Chip,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const validationSchema = Yup.object({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .required('Username is required'),
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  fullName: Yup.string()
    .max(100, 'Full name must be less than 100 characters')
    .required('Full name is required'),
  role: Yup.string().required('Role is required'),
  department: Yup.string().required('Department is required')
});

const UserRegistration = () => {
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      role: '',
      department: ''
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            username: values.username,
            email: values.email,
            password: values.password,
            fullName: values.fullName,
            role: values.role,
            department: values.department
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast.success('User registered successfully!');
          resetForm();
        } else {
          toast.error(result.message || 'Registration failed');
        }
      } catch (error) {
        console.error('Registration error:', error);
        toast.error('Network error. Please try again.');
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    }
  });

  // Check if user has admin privileges
  if (!hasRole('admin')) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Access Denied: Only administrators can register new users.
        </Alert>
      </Container>
    );
  }

  const roles = [
    { value: 'admin', label: 'Administrator', description: 'Full system access' },
    { value: 'receptionist', label: 'Receptionist', description: 'Patient registration & appointments' },
    { value: 'doctor', label: 'Doctor', description: 'Patient care & medical records' },
    { value: 'nurse', label: 'Nurse', description: 'Patient care & monitoring' },
    { value: 'pharmacist', label: 'Pharmacist', description: 'Prescription management' },
    { value: 'lab_technician', label: 'Lab Technician', description: 'Laboratory tests & results' },
    { value: 'billing_staff', label: 'Billing Staff', description: 'Financial operations' },
    { value: 'hr_manager', label: 'HR Manager', description: 'Staff management' },
    { value: 'inventory_manager', label: 'Inventory Manager', description: 'Supply management' },
    { value: 'security_guard', label: 'Security Guard', description: 'Access control & security' }
  ];

  const departments = [
    { value: 'administration', label: 'Administration' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'outpatient', label: 'Outpatient' },
    { value: 'inpatient', label: 'Inpatient' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'laboratory', label: 'Laboratory' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'radiology', label: 'Radiology' },
    { value: 'billing', label: 'Billing' }
  ];

  const getPermissionsForRole = (role) => {
    const rolePermissions = {
      admin: ['All Modules', 'User Management', 'System Settings'],
      receptionist: ['Appointments', 'Patient Registration', 'Queue Management', 'Billing (Read)'],
      doctor: ['Medical Records', 'Prescriptions', 'Patient Management', 'Lab Results'],
      nurse: ['Patient Care', 'Medical Records', 'Inventory (Read)', 'Queue Management'],
      pharmacist: ['Prescriptions', 'Inventory Management', 'Patient Info (Read)', 'Billing'],
      lab_technician: ['Lab Tests', 'Patient Info (Read)', 'Appointments (Read)', 'Inventory (Read)'],
      billing_staff: ['Billing Management', 'Patient Info (Read)', 'Insurance', 'Appointments (Read)'],
      hr_manager: ['Staff Management', 'Payroll', 'Scheduling', 'Reports'],
      inventory_manager: ['Inventory Management', 'Suppliers', 'Procurement', 'Reports'],
      security_guard: ['Visitor Management', 'Access Control', 'Incident Reports']
    };
    return rolePermissions[role] || [];
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          User Registration
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
          Create new user accounts with role-based permissions
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Box component="form" onSubmit={formik.handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="username"
                    label="Username"
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.username && Boolean(formik.errors.username)}
                    helperText={formik.touched.username && formik.errors.username}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="email"
                    label="Email"
                    type="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="fullName"
                    label="Full Name"
                    value={formik.values.fullName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                    helperText={formik.touched.fullName && formik.errors.fullName}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                    helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Role</InputLabel>
                    <Select
                      name="role"
                      value={formik.values.role}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.role && Boolean(formik.errors.role)}
                    >
                      {roles.map((role) => (
                        <MenuItem key={role.value} value={role.value}>
                          {role.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Department</InputLabel>
                    <Select
                      name="department"
                      value={formik.values.department}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.department && Boolean(formik.errors.department)}
                    >
                      {departments.map((dept) => (
                        <MenuItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={formik.isSubmitting || loading}
                    sx={{ mt: 2 }}
                  >
                    {loading ? 'Creating User...' : 'Create User'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Role Information
                </Typography>
                {formik.values.role && (
                  <>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      {roles.find(r => r.value === formik.values.role)?.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {roles.find(r => r.value === formik.values.role)?.description}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Permissions:
                    </Typography>
                    <Box>
                      {getPermissionsForRole(formik.values.role).map((permission, index) => (
                        <Chip
                          key={index}
                          label={permission}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5, fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  </>
                )}
                {!formik.values.role && (
                  <Typography variant="body2" color="text.secondary">
                    Select a role to see permissions
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Admin Access Required:</strong> Only administrators can create new user accounts.
                Each role has specific permissions and module access.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default UserRegistration;