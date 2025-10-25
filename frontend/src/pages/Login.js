import React, { useState } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  InputAdornment,
  Divider,
  Fade,
  Slide,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  LocalHospital as HospitalIcon,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const loginValidationSchema = Yup.object({
  username: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
});

const registerValidationSchema = Yup.object({
  username: Yup.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .required("Username is required"),
  email: Yup.string().email("Invalid email format").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm password is required"),
  fullName: Yup.string().max(100, "Full name must be less than 100 characters").required("Full name is required"),
  role: Yup.string().required("Role is required"),
  department: Yup.string().required("Department is required"),
});

const AuthPage = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();

  const loginFormik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema: loginValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setLoading(true);
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        const result = await response.json();

        if (result.success) {
          localStorage.setItem("token", result.data.token);
          localStorage.setItem("user", JSON.stringify(result.data.user));

          toast.success("Login successful!");

          // Navigate based on role
          const userRole = result.data.user.role;
          switch (userRole) {
            case "admin":
              navigate("/enterprise-dashboard");
              break;
            case "doctor":
              navigate("/consultations");
              break;
            default:
              navigate("/kiosk");
          }
        } else {
          toast.error(result.message || "Login failed");
        }
      } catch (error) {
        console.error("Login error:", error);
        toast.error("Network error. Please try again.");
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
  });

  const registerFormik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      role: "",
      department: "",
    },
    validationSchema: registerValidationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setLoading(true);
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: values.username,
            email: values.email,
            password: values.password,
            fullName: values.fullName,
            role: values.role,
            department: values.department,
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast.success("Registration successful! Please login.");
          resetForm();
          setTabValue(0); // Switch to login tab
        } else {
          toast.error(result.message || "Registration failed");
        }
      } catch (error) {
        console.error("Registration error:", error);
        toast.error("Network error. Please try again.");
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
  });

  const roles = [
    { value: "admin", label: "Administrator" },
    { value: "receptionist", label: "Receptionist" },
    { value: "doctor", label: "Doctor" },
    { value: "nurse", label: "Nurse" },
    { value: "pharmacist", label: "Pharmacist" },
    { value: "lab_technician", label: "Lab Technician" },
    { value: "billing_staff", label: "Billing Staff" },
    { value: "hr_manager", label: "HR Manager" },
    { value: "inventory_manager", label: "Inventory Manager" },
    { value: "security_guard", label: "Security Guard" },
    { value: "user", label: "User" },
  ];

  const departments = [
    { value: "administration", label: "Administration" },
    { value: "emergency", label: "Emergency" },
    { value: "outpatient", label: "Outpatient" },
    { value: "inpatient", label: "Inpatient" },
    { value: "surgery", label: "Surgery" },
    { value: "laboratory", label: "Laboratory" },
    { value: "pharmacy", label: "Pharmacy" },
    { value: "radiology", label: "Radiology" },
    { value: "billing", label: "Billing" },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Fade in timeout={800}>
          <Paper
            elevation={24}
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
            }}
          >
            {/* Header */}
            <Box
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                p: 4,
                textAlign: "center",
              }}
            >
              <HospitalIcon sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                HealthTech Hospital
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Enterprise Management System
              </Typography>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                centered
                sx={{
                  "& .MuiTab-root": {
                    minHeight: 64,
                    fontSize: "1rem",
                    fontWeight: 600,
                  },
                }}
              >
                <Tab icon={<LoginIcon />} label="Login" iconPosition="start" />
                <Tab icon={<RegisterIcon />} label="Register" iconPosition="start" />
              </Tabs>
            </Box>

            {/* Login Form */}
            {tabValue === 0 && (
              <Slide direction="right" in={tabValue === 0} timeout={500}>
                <Box sx={{ p: 4 }}>
                  <Typography variant="h5" gutterBottom textAlign="center" sx={{ mb: 3 }}>
                    Welcome Back
                  </Typography>

                  <Box component="form" onSubmit={loginFormik.handleSubmit}>
                    <TextField
                      fullWidth
                      name="username"
                      label="Username or Email"
                      value={loginFormik.values.username}
                      onChange={loginFormik.handleChange}
                      onBlur={loginFormik.handleBlur}
                      error={loginFormik.touched.username && Boolean(loginFormik.errors.username)}
                      helperText={loginFormik.touched.username && loginFormik.errors.username}
                      margin="normal"
                      variant="outlined"
                      required
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      name="password"
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={loginFormik.values.password}
                      onChange={loginFormik.handleChange}
                      onBlur={loginFormik.handleBlur}
                      error={loginFormik.touched.password && Boolean(loginFormik.errors.password)}
                      helperText={loginFormik.touched.password && loginFormik.errors.password}
                      margin="normal"
                      variant="outlined"
                      required
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mb: 3 }}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loginFormik.isSubmitting || loading}
                      sx={{
                        py: 1.5,
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        "&:hover": {
                          background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                        },
                      }}
                    >
                      {loading ? "Signing In..." : "Sign In"}
                    </Button>
                  </Box>

                  <Alert severity="info" sx={{ mt: 3 }}>
                    <Typography variant="body2">
                      <strong>First Time?</strong> Click the Register tab to create your account. Admin users can create
                      accounts for other staff members.
                    </Typography>
                  </Alert>
                </Box>
              </Slide>
            )}

            {/* Register Form */}
            {tabValue === 1 && (
              <Slide direction="left" in={tabValue === 1} timeout={500}>
                <Box sx={{ p: 4 }}>
                  <Typography variant="h5" gutterBottom textAlign="center" sx={{ mb: 3 }}>
                    Create Account
                  </Typography>

                  <Box component="form" onSubmit={registerFormik.handleSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="fullName"
                          label="Full Name"
                          value={registerFormik.values.fullName}
                          onChange={registerFormik.handleChange}
                          onBlur={registerFormik.handleBlur}
                          error={registerFormik.touched.fullName && Boolean(registerFormik.errors.fullName)}
                          helperText={registerFormik.touched.fullName && registerFormik.errors.fullName}
                          variant="outlined"
                          required
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="username"
                          label="Username"
                          value={registerFormik.values.username}
                          onChange={registerFormik.handleChange}
                          onBlur={registerFormik.handleBlur}
                          error={registerFormik.touched.username && Boolean(registerFormik.errors.username)}
                          helperText={registerFormik.touched.username && registerFormik.errors.username}
                          variant="outlined"
                          required
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          name="email"
                          label="Email Address"
                          type="email"
                          value={registerFormik.values.email}
                          onChange={registerFormik.handleChange}
                          onBlur={registerFormik.handleBlur}
                          error={registerFormik.touched.email && Boolean(registerFormik.errors.email)}
                          helperText={registerFormik.touched.email && registerFormik.errors.email}
                          variant="outlined"
                          required
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="password"
                          label="Password"
                          type={showPassword ? "text" : "password"}
                          value={registerFormik.values.password}
                          onChange={registerFormik.handleChange}
                          onBlur={registerFormik.handleBlur}
                          error={registerFormik.touched.password && Boolean(registerFormik.errors.password)}
                          helperText={registerFormik.touched.password && registerFormik.errors.password}
                          variant="outlined"
                          required
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="confirmPassword"
                          label="Confirm Password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={registerFormik.values.confirmPassword}
                          onChange={registerFormik.handleChange}
                          onBlur={registerFormik.handleBlur}
                          error={
                            registerFormik.touched.confirmPassword && Boolean(registerFormik.errors.confirmPassword)
                          }
                          helperText={registerFormik.touched.confirmPassword && registerFormik.errors.confirmPassword}
                          variant="outlined"
                          required
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required>
                          <InputLabel>Role</InputLabel>
                          <Select
                            name="role"
                            value={registerFormik.values.role}
                            onChange={registerFormik.handleChange}
                            onBlur={registerFormik.handleBlur}
                            error={registerFormik.touched.role && Boolean(registerFormik.errors.role)}
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
                            value={registerFormik.values.department}
                            onChange={registerFormik.handleChange}
                            onBlur={registerFormik.handleBlur}
                            error={registerFormik.touched.department && Boolean(registerFormik.errors.department)}
                          >
                            {departments.map((dept) => (
                              <MenuItem key={dept.value} value={dept.value}>
                                {dept.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={registerFormik.isSubmitting || loading}
                      sx={{
                        mt: 3,
                        py: 1.5,
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        "&:hover": {
                          background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                        },
                      }}
                    >
                      {loading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </Box>

                  <Alert severity="success" sx={{ mt: 3 }}>
                    <Typography variant="body2">
                      <strong>Secure Registration:</strong> Your password will be encrypted and stored securely. Account
                      permissions are assigned based on your selected role.
                    </Typography>
                  </Alert>
                </Box>
              </Slide>
            )}
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default AuthPage;
