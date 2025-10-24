import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  LocalHospital as HospitalIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import moment from 'moment';

const QueueStatus = () => {
  const [queueData, setQueueData] = useState(null);
  const [tokenSearch, setTokenSearch] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const { socket, joinQueue } = useSocket();

  useEffect(() => {
    loadQueueStatus();
    joinQueue();

    // Socket listeners for real-time updates
    if (socket) {
      socket.on('appointment-booked', handleQueueUpdate);
      socket.on('appointment-updated', handleQueueUpdate);
      socket.on('patient-called', handlePatientCalled);
      socket.on('queue-reordered', handleQueueUpdate);

      return () => {
        socket.off('appointment-booked');
        socket.off('appointment-updated');
        socket.off('patient-called');
        socket.off('queue-reordered');
      };
    }
  }, [socket]);

  const loadQueueStatus = async () => {
    try {
      const response = await axios.get('/api/queue/status');
      if (response.data.success) {
        setQueueData(response.data);
      }
    } catch (error) {
      console.error('Failed to load queue status:', error);
      toast.error('Failed to load queue status');
    } finally {
      setLoading(false);
    }
  };

  const handleQueueUpdate = () => {
    loadQueueStatus();
  };

  const handlePatientCalled = (data) => {
    toast.success(`${data.patientName} called to ${data.room}`, {
      duration: 6000
    });
    loadQueueStatus();
  };

  const searchToken = async () => {
    if (!tokenSearch.trim()) {
      toast.error('Please enter a token number');
      return;
    }

    setSearching(true);
    try {
      const response = await axios.get(`/api/queue/position/${tokenSearch.trim()}`);
      if (response.data.success) {
        setSearchResult(response.data);
        toast.success('Token found!');
      }
    } catch (error) {
      console.error('Token search error:', error);
      if (error.response?.status === 404) {
        toast.error('Token not found or not in today\'s queue');
        setSearchResult(null);
      } else {
        toast.error('Failed to search token');
      }
    } finally {
      setSearching(false);
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading queue status...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Queue Status
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadQueueStatus}
        >
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
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Enter Token Number"
                  value={tokenSearch}
                  onChange={(e) => setTokenSearch(e.target.value.toUpperCase())}
                  placeholder="Q12341234"
                  onKeyPress={(e) => e.key === 'Enter' && searchToken()}
                />
                <Button
                  variant="contained"
                  onClick={searchToken}
                  disabled={searching}
                  sx={{ minWidth: 100 }}
                >
                  {searching ? <CircularProgress size={20} /> : <SearchIcon />}
                </Button>
              </Box>

              {searchResult && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Token: {searchResult.token}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Patient:</strong> {searchResult.patientName}<br />
                    <strong>Position:</strong> #{searchResult.position}<br />
                    <strong>ETA:</strong> {searchResult.eta} (around {searchResult.estimatedTime})<br />
                    <strong>Doctor:</strong> {searchResult.doctor}<br />
                    <strong>Department:</strong> {searchResult.department}<br />
                    <strong>Scheduled:</strong> {searchResult.scheduledTime}<br />
                    {searchResult.symptoms && (
                      <>
                        <strong>Symptoms:</strong> {searchResult.symptoms}<br />
                      </>
                    )}
                    <strong>Status:</strong> <Chip 
                      label={searchResult.status} 
                      color={getStatusColor(searchResult.status)}
                      size="small"
                    />
                    {searchResult.urgency && (
                      <>
                        {' '}
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
                      <Typography variant="caption">
                        Total Appointments
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {queueData.stats.inProgress}
                      </Typography>
                      <Typography variant="caption">
                        In Progress
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {queueData.stats.waiting}
                      </Typography>
                      <Typography variant="caption">
                        Waiting
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {queueData.stats.averageWaitTime}m
                      </Typography>
                      <Typography variant="caption">
                        Avg Wait
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box textAlign="center" sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total waiting time: {Math.floor((queueData.stats.totalWaitingTime || 0) / 60)}h {(queueData.stats.totalWaitingTime || 0) % 60}m
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
              {queueData.queue['in-progress']?.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="success.main">
                      🟢 Currently Being Served
                    </Typography>
                    <List>
                      {queueData.queue['in-progress'].map((appointment, index) => (
                        <ListItem key={appointment.id}>
                          <ListItemIcon>
                            <HospitalIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
                                  label={appointment.channel} 
                                  variant="outlined"
                                  size="small"
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  <strong>Doctor:</strong> {appointment.doctor} - Room {appointment.room || 'TBD'}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Department:</strong> {appointment.department}
                                </Typography>
                                {appointment.symptoms && (
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Symptoms:</strong> {appointment.symptoms.length > 50 ? 
                                      appointment.symptoms.substring(0, 50) + '...' : 
                                      appointment.symptoms}
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
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  backgroundColor: 'primary.light',
                                  color: 'white',
                                  fontWeight: 'bold'
                                }}>
                                  {index + 1}
                                </Box>
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
                                    <Chip 
                                      label={appointment.channel} 
                                      variant="outlined"
                                      size="small"
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="body2">
                                      <strong>Doctor:</strong> {appointment.doctor} - <strong>Department:</strong> {appointment.department}
                                    </Typography>
                                    {appointment.symptoms && (
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        <strong>Symptoms:</strong> {appointment.symptoms.length > 80 ? 
                                          appointment.symptoms.substring(0, 80) + '...' : 
                                          appointment.symptoms}
                                      </Typography>
                                    )}
                                    <Typography variant="caption" color="text.secondary">
                                      <strong>Scheduled:</strong> {appointment.scheduledTime || moment(appointment.slot).format('HH:mm')} | 
                                      <strong>ETA:</strong> {appointment.eta} (around {appointment.estimatedTime})
                                    </Typography>
                                    {appointment.patientDetails && (
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                        <strong>Patient ID:</strong> {appointment.patientDetails.uniqueId}
                                        {appointment.patientDetails.age && ` | Age: ${appointment.patientDetails.age}`}
                                        {appointment.patientDetails.gender && ` | ${appointment.patientDetails.gender}`}
                                        {appointment.patientDetails.phone && ` | Phone: ${appointment.patientDetails.phone}`}
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
                    <Alert severity="info">
                      No patients currently waiting in queue.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </Grid>
      </Grid>

      {/* Last Updated */}
      {queueData && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {moment(queueData.lastUpdated).format('HH:mm:ss')} | 
            Updates automatically every 30 seconds
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default QueueStatus;