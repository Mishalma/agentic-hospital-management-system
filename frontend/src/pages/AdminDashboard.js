import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Edit as EditIcon,
  Call as CallIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import moment from 'moment';

const AdminDashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const { socket, joinAdmin } = useSocket();
  const [dashboardData, setDashboardData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState({ open: false, appointment: null });
  const [callDialog, setCallDialog] = useState({ open: false, appointment: null });

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
      loadAppointments();
      joinAdmin();

      // Socket listeners
      if (socket) {
        socket.on('new-appointment', handleNewAppointment);
        socket.on('appointment-status-changed', handleAppointmentUpdate);

        return () => {
          socket.off('new-appointment');
          socket.off('appointment-status-changed');
        };
      }
    }
  }, [isAuthenticated, socket]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const loadDashboardData = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard');
      if (response.data.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const loadAppointments = async () => {
    try {
      const response = await axios.get('/api/admin/appointments');
      if (response.data.success) {
        setAppointments(response.data.appointments);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleNewAppointment = (appointment) => {
    toast.success(`New appointment: ${appointment.token}`);
    loadDashboardData();
    loadAppointments();
  };

  const handleAppointmentUpdate = (appointment) => {
    loadDashboardData();
    loadAppointments();
  };

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      const response = await axios.put(`/api/appointments/${appointmentId}/status`, {
        status,
        notes: `Status updated by ${user.name}`
      });
      
      if (response.data.success) {
        toast.success('Status updated successfully');
        loadAppointments();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleCallNext = async (doctor, room) => {
    try {
      const response = await axios.post('/api/queue/call-next', {
        doctor,
        room
      });
      
      if (response.data.success) {
        toast.success(`Called ${response.data.appointment.patientName} to ${room}`);
        loadAppointments();
        setCallDialog({ open: false, appointment: null });
      }
    } catch (error) {
      console.error('Failed to call next patient:', error);
      toast.error(error.response?.data?.message || 'Failed to call next patient');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress': return 'success';
      case 'queued': return 'warning';
      case 'booked': return 'info';
      case 'completed': return 'default';
      case 'canceled': return 'error';
      default: return 'default';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  if (loading || !dashboardData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading dashboard...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Admin Dashboard
        </Typography>
        <Box>
          <Typography variant="subtitle1">
            Welcome, {user.name} ({user.role})
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              loadDashboardData();
              loadAppointments();
            }}
            sx={{ ml: 2 }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DashboardIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {dashboardData.metrics.todayStats.totalAppointments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Today
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {dashboardData.metrics.todayStats.inProgress}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {dashboardData.metrics.todayStats.waiting}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Waiting
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {dashboardData.metrics.averageWaitTime}m
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Wait
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Appointments Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Today's Appointments
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Token</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Urgency</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {appointment.token}
                      </Typography>
                    </TableCell>
                    <TableCell>{appointment.patientName}</TableCell>
                    <TableCell>{appointment.doctor}</TableCell>
                    <TableCell>
                      {moment(appointment.slot).format('HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={appointment.status} 
                        color={getStatusColor(appointment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={appointment.urgency} 
                        color={getUrgencyColor(appointment.urgency)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => setCallDialog({ open: true, appointment })}
                        disabled={appointment.status === 'completed' || appointment.status === 'canceled'}
                      >
                        <CallIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setEditDialog({ open: true, appointment })}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Call Next Patient Dialog */}
      <Dialog 
        open={callDialog.open} 
        onClose={() => setCallDialog({ open: false, appointment: null })}
      >
        <DialogTitle>Call Next Patient</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Call patient to room for: {callDialog.appointment?.doctor}
          </Typography>
          <TextField
            fullWidth
            label="Room Number"
            margin="normal"
            id="room-number"
            placeholder="e.g., Room 101"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCallDialog({ open: false, appointment: null })}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              const room = document.getElementById('room-number').value;
              if (room) {
                handleCallNext(callDialog.appointment.doctor, room);
              }
            }}
          >
            Call Patient
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog 
        open={editDialog.open} 
        onClose={() => setEditDialog({ open: false, appointment: null })}
      >
        <DialogTitle>Update Appointment Status</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Token: {editDialog.appointment?.token}
          </Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              defaultValue={editDialog.appointment?.status}
              label="Status"
              id="status-select"
            >
              <MenuItem value="booked">Booked</MenuItem>
              <MenuItem value="queued">Queued</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="canceled">Canceled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, appointment: null })}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              const status = document.getElementById('status-select').value;
              if (status) {
                handleStatusUpdate(editDialog.appointment.id, status);
                setEditDialog({ open: false, appointment: null });
              }
            }}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;