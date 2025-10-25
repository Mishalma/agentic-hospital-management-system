import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  EventNote as EventIcon,
  LocalHospital as HospitalIcon,
  AttachMoney as MoneyIcon,
  Notifications as NotificationIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

const EnterpriseDashboard = () => {
  const [showFeaturesPopup, setShowFeaturesPopup] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalPatients: 15420,
      todayAppointments: 127,
      activeStaff: 89,
      revenue: 2450000,
      complaints: 23,
      satisfaction: 4.7,
      drugInteractions: 156,
      adrReports: 12,
      emergencyCases: 24,
      criticalCases: 3,
      averageWaitTime: 18,
      bedOccupancy: 87,
    },
    trends: {
      patients: [12000, 12500, 13200, 13800, 14200, 14800, 15420],
      appointments: [95, 102, 118, 125, 134, 129, 127],
      revenue: [2100000, 2200000, 2300000, 2350000, 2400000, 2420000, 2450000],
    },
    recentActivities: [
      {
        type: "emergency",
        message: "Critical case: Chest pain patient arrived via ambulance",
        time: "30 seconds ago",
        severity: "error",
      },
      {
        type: "drug",
        message: "High-risk drug interaction detected: Warfarin + Aspirin",
        time: "1 minute ago",
        severity: "warning",
      },
      {
        type: "emergency",
        message: "High priority case triaged - Score: 8/20",
        time: "2 minutes ago",
        severity: "warning",
      },
      { type: "patient", message: "New patient registered: John Doe", time: "3 minutes ago", severity: "info" },
      {
        type: "emergency",
        message: "Patient discharged from ED - Total stay: 2h 15m",
        time: "4 minutes ago",
        severity: "success",
      },
      { type: "adr", message: "ADR report submitted for Lisinopril", time: "5 minutes ago", severity: "warning" },
      { type: "complaint", message: "High priority complaint received", time: "7 minutes ago", severity: "warning" },
      {
        type: "prescription",
        message: "E-prescription sent to Central Pharmacy",
        time: "8 minutes ago",
        severity: "success",
      },
      {
        type: "appointment",
        message: "15 appointments scheduled for tomorrow",
        time: "10 minutes ago",
        severity: "success",
      },
      {
        type: "emergency",
        message: "Deterioration alert: Patient vitals trending downward",
        time: "12 minutes ago",
        severity: "error",
      },
      { type: "system", message: "Backup completed successfully", time: "1 hour ago", severity: "success" },
      { type: "alert", message: "Equipment maintenance due", time: "2 hours ago", severity: "warning" },
    ],
    moduleStatus: [
      { name: "Patient Management", status: "online", usage: 95 },
      { name: "Appointment System", status: "online", usage: 87 },
      { name: "Emergency Case Management", status: "online", usage: 92 },
      { name: "Laboratory Information System", status: "online", usage: 84 },
      { name: "Hospital Billing Management", status: "online", usage: 88 },
      { name: "Drug Information System", status: "online", usage: 78 },
      { name: "E-Prescription System", status: "online", usage: 82 },
      { name: "Pharmacy Management", status: "online", usage: 91 },
      { name: "Inventory Management", status: "online", usage: 72 },
      { name: "Communication Hub", status: "online", usage: 89 },
    ],
  });

  const StatCard = ({ title, value, icon, color, trend, subtitle }) => (
    <Card sx={{ height: "100%", backgroundColor: "background.paper", border: `1px solid ${color}20` }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>{icon}</Avatar>
          {trend && <Chip icon={<TrendingUpIcon />} label={`+${trend}%`} color="success" size="small" />}
        </Box>
        <Typography variant="h4" fontWeight="bold" color={color}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </Typography>
        <Typography variant="h6" color="text.primary" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const patientTrendData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      {
        label: "Total Patients",
        data: dashboardData.trends.patients,
        borderColor: "#1565c0", // Primary color from theme
        backgroundColor: "rgba(21, 101, 192, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const appointmentData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Daily Appointments",
        data: dashboardData.trends.appointments,
        backgroundColor: "rgba(76, 175, 80, 0.8)", // Success color from theme
        borderColor: "#4caf50",
        borderWidth: 1,
      },
    ],
  };

  const moduleStatusData = {
    labels: ["Online", "Maintenance", "Offline"],
    datasets: [
      {
        data: [85, 10, 5],
        backgroundColor: ["#4caf50", "#ff9800", "#f44336"], // Success, warning, error colors from theme
        borderWidth: 0,
      },
    ],
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "patient":
        return <PeopleIcon />;
      case "appointment":
        return <EventIcon />;
      case "complaint":
        return <WarningIcon />;
      case "system":
        return <CheckIcon />;
      case "drug":
        return <HospitalIcon />;
      case "adr":
        return <WarningIcon />;
      case "prescription":
        return <HospitalIcon />;
      case "emergency":
        return <HospitalIcon />;
      case "alert":
        return <WarningIcon />;
      default:
        return <NotificationIcon />;
    }
  };

  const getActivityColor = (severity) => {
    switch (severity) {
      case "success":
        return "#4caf50";
      case "warning":
        return "#ff9800";
      case "error":
        return "#f44336";
      default:
        return "#2196f3";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Features Popup */}
      <Dialog open={showFeaturesPopup} onClose={() => setShowFeaturesPopup(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: "bold", color: "primary.main" }}>
            🚀 Advanced Features Available
          </Typography>
          <IconButton onClick={() => setShowFeaturesPopup(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", pb: 3 }}>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
            There are more features like the{" "}
            <Box component="span" sx={{ fontWeight: "bold", color: "primary.main" }}>
              agentic AI conversational appointment booking through phone call
            </Box>
            , as well as{" "}
            <Box component="span" sx={{ fontWeight: "bold", color: "primary.main" }}>
              agentic WhatsApp chat
            </Box>
            , as well as a{" "}
            <Box component="span" sx={{ fontWeight: "bold", color: "primary.main" }}>
              chat based RAG system for the enterprise
            </Box>
            .
          </Typography>
          <Button variant="contained" onClick={() => setShowFeaturesPopup(false)} sx={{ mt: 2, minWidth: 120 }}>
            Got it!
          </Button>
        </DialogContent>
      </Dialog>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          🏥 Enterprise Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Real-time overview of your hospital management system
        </Typography>
      </Box>

      {/* Key Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Patients"
            value={dashboardData.stats.totalPatients}
            icon={<PeopleIcon />}
            color="#2196f3"
            trend={12}
            subtitle="Active registrations"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Today's Appointments"
            value={dashboardData.stats.todayAppointments}
            icon={<EventIcon />}
            color="#4caf50"
            trend={8}
            subtitle="Scheduled visits"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Active Staff"
            value={dashboardData.stats.activeStaff}
            icon={<HospitalIcon />}
            color="#ff9800"
            subtitle="On duty now"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Monthly Revenue"
            value={`₹${(dashboardData.stats.revenue / 100000).toFixed(1)}L`}
            icon={<MoneyIcon />}
            color="#9c27b0"
            trend={15}
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Open Complaints"
            value={dashboardData.stats.complaints}
            icon={<WarningIcon />}
            color="#f44336"
            subtitle="Pending resolution"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Satisfaction"
            value={`${dashboardData.stats.satisfaction}/5`}
            icon={<AssessmentIcon />}
            color="#4caf50"
            subtitle="Patient rating"
          />
        </Grid>
      </Grid>

      {/* Additional Statistics Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Drug Interactions"
            value={dashboardData.stats.drugInteractions}
            icon={<HospitalIcon />}
            color="#e74c3c"
            trend={5}
            subtitle="Checked this month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="ADR Reports"
            value={dashboardData.stats.adrReports}
            icon={<WarningIcon />}
            color="#f39c12"
            subtitle="Submitted this month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Emergency Cases"
            value={dashboardData.stats.emergencyCases}
            icon={<HospitalIcon />}
            color="#e74c3c"
            trend={8}
            subtitle="Active in ED"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Critical Cases"
            value={dashboardData.stats.criticalCases}
            icon={<WarningIcon />}
            color="#dc3545"
            subtitle="Immediate attention"
          />
        </Grid>
      </Grid>

      {/* Emergency Department Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Wait Time"
            value={`${dashboardData.stats.averageWaitTime}m`}
            icon={<ScheduleIcon />}
            color="#17a2b8"
            subtitle="Door to doctor"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Bed Occupancy"
            value={`${dashboardData.stats.bedOccupancy}%`}
            icon={<HospitalIcon />}
            color="#6f42c1"
            subtitle="ED capacity"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="E-Prescriptions"
            value="89"
            icon={<HospitalIcon />}
            color="#9b59b6"
            trend={12}
            subtitle="Processed today"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Safety Alerts" value="3" icon={<WarningIcon />} color="#e67e22" subtitle="Active warnings" />
        </Grid>
      </Grid>

      {/* Charts and Analytics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Patient Growth Trend
              </Typography>
              <Box sx={{ height: 320 }}>
                <Line data={patientTrendData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔧 System Status
              </Typography>
              <Box sx={{ height: 250, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Doughnut data={moduleStatusData} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  52 modules monitored
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Weekly Appointments */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📅 Weekly Appointments
              </Typography>
              <Box sx={{ height: 320 }}>
                <Bar data={appointmentData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Emergency Cases Widget */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400, border: "1px solid #e74c3c" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: "#e74c3c" }}>
                🚨 Active Emergency Cases
              </Typography>
              <List sx={{ maxHeight: 320, overflow: "auto" }}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "#dc3545", width: 40, height: 40 }}>
                      <HospitalIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Critical - Chest Pain"
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Patient: John Smith, 65M • Arrived: 2:30 PM
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#dc3545", fontWeight: "bold" }}>
                          Triage Score: 18/20 • Wait: 5 minutes
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "#fd7e14", width: 40, height: 40 }}>
                      <HospitalIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="High - Abdominal Pain"
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Patient: Sarah Johnson, 45F • Arrived: 2:15 PM
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#fd7e14", fontWeight: "bold" }}>
                          Triage Score: 8/20 • Wait: 20 minutes
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "#ffc107", width: 40, height: 40 }}>
                      <HospitalIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Medium - Ankle Injury"
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Patient: Mike Davis, 28M • Arrived: 1:45 PM
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#ffc107", fontWeight: "bold" }}>
                          Triage Score: 4/20 • Wait: 50 minutes
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "#28a745", width: 40, height: 40 }}>
                      <HospitalIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Low - Minor Cut"
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Patient: Lisa Brown, 32F • Arrived: 1:30 PM
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#28a745", fontWeight: "bold" }}>
                          Triage Score: 2/20 • Wait: 1h 5m
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </List>
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Button variant="contained" onClick={() => (window.location.href = "/emergency")} color="error">
                  View All Cases
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔔 Recent Activities
              </Typography>
              <List sx={{ maxHeight: 320, overflow: "auto" }}>
                {dashboardData.recentActivities.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getActivityColor(activity.severity), width: 40, height: 40 }}>
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.message}
                        secondary={activity.time}
                        primaryTypographyProps={{ variant: "body2" }}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                    </ListItem>
                    {index < dashboardData.recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Module Status Overview */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🏥 Hospital Module Status
          </Typography>
          <Grid container spacing={2}>
            {dashboardData.moduleStatus.map((module, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {module.name}
                    </Typography>
                    <Chip
                      label={module.status}
                      color={
                        module.status === "online" ? "success" : module.status === "maintenance" ? "warning" : "error"
                      }
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Box sx={{ textAlign: "right", minWidth: 80 }}>
                    <Typography variant="body2" color="text.secondary">
                      {module.status === "online" ? `${module.usage}% usage` : "Offline"}
                    </Typography>
                    {module.status === "online" && (
                      <LinearProgress variant="determinate" value={module.usage} sx={{ mt: 1, width: 60 }} />
                    )}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Emergency Department Section */}
      <Card sx={{ mt: 3, border: "2px solid #e74c3c", borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: "#e74c3c", fontWeight: "bold" }}>
            🚨 Emergency Department
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: "center", p: 2, bgcolor: "#fff5f5", borderRadius: 2 }}>
                <Typography variant="h4" sx={{ color: "#dc3545", fontWeight: "bold" }}>
                  {dashboardData.stats.criticalCases}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Critical Cases
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: "center", p: 2, bgcolor: "#fff8e1", borderRadius: 2 }}>
                <Typography variant="h4" sx={{ color: "#ff9800", fontWeight: "bold" }}>
                  {dashboardData.stats.emergencyCases}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Active
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: "center", p: 2, bgcolor: "#e3f2fd", borderRadius: 2 }}>
                <Typography variant="h4" sx={{ color: "#2196f3", fontWeight: "bold" }}>
                  {dashboardData.stats.averageWaitTime}m
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Wait Time
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: "center", p: 2, bgcolor: "#f3e5f5", borderRadius: 2 }}>
                <Typography variant="h4" sx={{ color: "#9c27b0", fontWeight: "bold" }}>
                  {dashboardData.stats.bedOccupancy}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bed Occupancy
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              startIcon={<HospitalIcon />}
              onClick={() => (window.location.href = "/emergency")}
              color="error"
            >
              Emergency Dashboard
            </Button>
            <Button
              variant="contained"
              startIcon={<EventIcon />}
              onClick={() => (window.location.href = "/emergency/case/new")}
              color="error"
            >
              New Emergency Case
            </Button>
            <Button
              variant="outlined"
              startIcon={<AssessmentIcon />}
              onClick={() => (window.location.href = "/triage-queue")}
              sx={{ borderColor: "#e74c3c", color: "#e74c3c" }}
            >
              Triage Queue
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ⚡ Quick Actions
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button variant="contained" startIcon={<EventIcon />} onClick={() => (window.location.href = "/register")}>
              Book New Appointment
            </Button>
            <Button
              variant="contained"
              startIcon={<PeopleIcon />}
              onClick={() => (window.location.href = "/register?mode=patient-only")}
              color="success"
            >
              Register Patient Only
            </Button>
            <Button
              variant="contained"
              startIcon={<AssessmentIcon />}
              onClick={() => (window.location.href = "/admin")}
              color="warning"
            >
              View Analytics
            </Button>
            <Button variant="outlined" startIcon={<ScheduleIcon />} onClick={() => (window.location.href = "/queue")}>
              View Queue
            </Button>
            <Button
              variant="outlined"
              startIcon={<NotificationIcon />}
              onClick={() => (window.location.href = "/complaints")}
            >
              Manage Complaints
            </Button>
            <Button
              variant="contained"
              startIcon={<HospitalIcon />}
              onClick={() => (window.location.href = "/drug-information")}
              color="secondary"
            >
              Drug Information
            </Button>
            <Button
              variant="outlined"
              startIcon={<WarningIcon />}
              onClick={() => (window.location.href = "/adr-reporting")}
            >
              ADR Reporting
            </Button>
            <Button
              variant="contained"
              startIcon={<ScheduleIcon />}
              onClick={() => (window.location.href = "/kiosk")}
              color="secondary"
            >
              Kiosk Dashboard
            </Button>
            <Button
              variant="contained"
              startIcon={<HospitalIcon />}
              onClick={() => (window.location.href = "/laboratory")}
              color="info"
            >
              Laboratory System
            </Button>
            <Button
              variant="contained"
              startIcon={<MoneyIcon />}
              onClick={() => (window.location.href = "/billing")}
              color="error"
            >
              Billing Management
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EnterpriseDashboard;
