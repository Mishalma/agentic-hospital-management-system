import React, { useState } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Collapse,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  AccountCircle as AccountIcon,
  People as PatientsIcon,
  EventNote as AppointmentsIcon,
  LocalHospital as MedicalIcon,
  Inventory as InventoryIcon,
  AttachMoney as BillingIcon,
  Report as ReportsIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Gavel as GavelIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ModuleCard from "./ModuleCard";
import "./EnterpriseLayout.css";

const drawerWidth = 280;
const collapsedDrawerWidth = 70;

const EnterpriseLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission, hasRole } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  // Hospital Management Modules - Role-based access
  const getHospitalModules = () => {
    const baseModules = {
      "Patient Management": {
        icon: <PatientsIcon />,
        color: "#2196F3",
        modules: [
          {
            name: "Kiosk Dashboard",
            path: "/kiosk",
            icon: "🖥️",
            status: hasRole(["user", "admin"]) ? "active" : "restricted",
            description: "Self-service kiosk interface for patient check-in and information",
          },
          {
            name: "Patient History Viewer",
            path: "/patient-history",
            icon: "📋",
            status: hasRole("user") ? "active" : "restricted",
            description: "View patient medical history, vitals, prescriptions, and consultations",
            requiredRole: "user",
          },
        ],
      },
      "Medical Records & EMR": {
        icon: <MedicalIcon />,
        color: "#FF9800",
        modules: [
          {
            name: "Vitals",
            path: "/vitals",
            icon: "🩺",
            status: hasRole(["nurse", "doctor", "admin"]) ? "active" : "restricted",
            description: "Record patient vitals on tablets/mobile and monitor abnormal vitals",
            requiredRole: ["nurse", "doctor", "admin"],
          },
          {
            name: "Triage Assessment",
            path: "/triage-assessment",
            icon: "🚨",
            status: hasRole(["nurse", "doctor", "admin"]) ? "active" : "restricted",
            description: "AI-powered patient prioritization",
            requiredRole: ["nurse", "doctor", "admin"],
          },
          {
            name: "Consultation Dashboard",
            path: "/consultations",
            icon: "👨‍⚕️",
            status: hasRole(["doctor", "admin"]) ? "active" : "restricted",
            description: "AI-powered consultation management",
            requiredRole: ["doctor", "admin"],
          },
          {
            name: "Prescription Manager",
            path: "/prescription/new",
            icon: "💊",
            status: hasRole(["doctor", "admin"]) ? "active" : "restricted",
            description: "AI-powered prescription management and tracking",
            requiredRole: ["doctor", "admin"],
          },
          {
            name: "Drug Information",
            path: "/drug-information",
            icon: "🔍",
            status: hasRole(["doctor", "pharmacist", "admin"]) ? "active" : "restricted",
            description: "Drug interactions, food interactions, and safety analysis",
            requiredRole: ["doctor", "pharmacist", "admin"],
          },
          {
            name: "ADR Reporting",
            path: "/adr-reporting",
            icon: "⚠️",
            status: hasRole(["doctor", "pharmacist", "admin"]) ? "active" : "restricted",
            description: "Adverse Drug Reaction reporting and management",
            requiredRole: ["doctor", "pharmacist", "admin"],
          },
          {
            name: "Xray AI Inference",
            path: "https://agentic-radiology-system.vercel.app",
            icon: "🩻",
            status: hasRole(["doctor", "admin"]) ? "active" : "restricted",
            description: "AI-powered X-ray analysis and inference",
            requiredRole: ["doctor", "admin"],
            external: true,
          },
          {
            name: "Lab Order Management",
            path: "/lab-orders",
            icon: "📋",
            status: hasRole(["lab_technician", "doctor", "admin"]) ? "active" : "restricted",
            description: "Manage lab orders, sample tracking, and result entry",
            requiredRole: ["lab_technician", "doctor", "admin"],
          },
        ],
      },
      "Communication & Support": {
        icon: <NotificationsIcon />,
        color: "#9C27B0",
        modules: [
          {
            name: "WhatsApp Integration",
            path: "/whatsapp",
            icon: "💬",
            status: hasRole("admin") ? "active" : "restricted",
            requiredRole: "admin",
          },
          {
            name: "Telegram Bot",
            path: "/telegram",
            icon: "📱",
            status: hasRole("admin") ? "active" : "restricted",
            requiredRole: "admin",
          },
          {
            name: "SMS Notifications",
            path: "/sms",
            icon: "📲",
            status: hasRole("admin") ? "active" : "restricted",
            requiredRole: "admin",
          },
          {
            name: "Complaint Management",
            path: "/complaints",
            icon: "📝",
            status: hasPermission("complaints", "read") ? "active" : "restricted",
            requiredPermission: { module: "complaints", action: "read" },
          },
        ],
      },
      "Billing & Finance": {
        icon: <BillingIcon />,
        color: "#F44336",
        modules: [
          {
            name: "Billing Dashboard",
            path: "/billing",
            icon: "💰",
            status: hasRole(["billing_staff", "admin"]) ? "active" : "restricted",
            description: "Centralized billing management across all departments",
            requiredRole: ["billing_staff", "admin"],
          },
        ],
      },
      "Pharmacy Information System": {
        icon: <InventoryIcon />,
        color: "#607D8B",
        modules: [
          {
            name: "Pharmacy Dashboard",
            path: "/pharmacy",
            icon: "🏥",
            status: hasRole(["pharmacist", "admin"]) ? "active" : "restricted",
            description: "Real-time pharmacy analytics and alerts",
            requiredRole: ["pharmacist", "admin"],
          },
          {
            name: "Inventory Management",
            path: "/pharmacy/inventory",
            icon: "📦",
            status: hasRole(["pharmacist", "admin"]) ? "active" : "restricted",
            description: "Stock tracking with expiry alerts",
            requiredRole: ["pharmacist", "admin"],
          },
          {
            name: "E-Prescription Processing",
            path: "/pharmacy/prescriptions",
            icon: "💊",
            status: hasRole(["pharmacist", "admin"]) ? "active" : "restricted",
            description: "Digital prescription dispensing",
            requiredRole: ["pharmacist", "admin"],
          },
          {
            name: "Transaction Management",
            path: "/pharmacy/transactions",
            icon: "💰",
            status: hasRole(["pharmacist", "admin"]) ? "active" : "restricted",
            description: "Sales and billing management",
            requiredRole: ["pharmacist", "admin"],
          },
          {
            name: "Pharmacy Reports",
            path: "/pharmacy/reports",
            icon: "📊",
            status: hasRole(["pharmacist", "admin"]) ? "active" : "restricted",
            description: "Analytics and compliance reports",
            requiredRole: ["pharmacist", "admin"],
          },
        ],
      },
      "Emergency & Legal": {
        icon: <WarningIcon />,
        color: "#FF5722",
        modules: [
          {
            name: "Emergency Case Management",
            path: "/emergency",
            icon: "🚑",
            status: hasRole(["emergency_staff", "doctor", "admin"]) ? "active" : "restricted",
            description: "Emergency case management and triage",
            requiredRole: ["emergency_staff", "doctor", "admin"],
          },
          {
            name: "Legal Case (MLC)",
            path: "/legal-mlc",
            icon: "⚖️",
            status: hasRole(["admin", "doctor"]) ? "active" : "restricted",
            description: "Medico-Legal Cases and legal documentation",
            requiredRole: ["admin", "doctor"],
          },
          {
            name: "Admission and Bed Management",
            path: "/admission-bed",
            icon: "🛏️",
            status: hasRole(["admin", "doctor", "nurse"]) ? "active" : "restricted",
            description: "Patient admission and bed allocation",
            requiredRole: ["admin", "doctor", "nurse"],
          },
          {
            name: "Brought Dead Record",
            path: "/brought-dead",
            icon: "⚰️",
            status: hasRole(["admin", "doctor"]) ? "active" : "restricted",
            description: "Recording and management of brought dead cases",
            requiredRole: ["admin", "doctor"],
          },
          {
            name: "Digital Security Logging",
            path: "/security-logging",
            icon: "🔒",
            status: hasRole("admin") ? "active" : "restricted",
            description: "Security event logging and monitoring",
            requiredRole: "admin",
          },
        ],
      },
      "Analytics & Reports": {
        icon: <ReportsIcon />,
        color: "#3F51B5",
        modules: [
          {
            name: "Dashboard Analytics",
            path: "/admin",
            icon: "📊",
            status: hasRole(["admin", "doctor"]) ? "active" : "restricted",
            requiredRole: ["admin", "doctor"],
          },
          {
            name: "Enterprise Dashboard",
            path: "/enterprise-dashboard",
            icon: "🏢",
            status: hasRole("admin") ? "active" : "restricted",
            requiredRole: "admin",
          },
          {
            name: "EMR System",
            path: "https://agentic-radiology-system.vercel.app",
            icon: "📱",
            status: hasRole("admin") ? "active" : "restricted",
            requiredRole: "admin",
            external: true,
            description: "Access Electronic Medical Records system",
          },
        ],
      },
    };

    // Add System Administration only for admins
    if (hasRole("admin")) {
      baseModules["System Administration"] = {
        icon: <SettingsIcon />,
        color: "#424242",
        modules: [
          {
            name: "User Registration",
            path: "/user-registration",
            icon: "👤",
            status: "active",
            description: "Create new user accounts",
          },
          {
            name: "Patient Search",
            path: "/patient-search",
            icon: "🔍",
            status: "active",
            description: "Search patients by name (Admin Only)",
          },
          { name: "Role & Permissions", path: "/permissions", icon: "🔐", status: "coming-soon" },
          { name: "System Settings", path: "/settings", icon: "⚙️", status: "coming-soon" },
          { name: "Backup & Recovery", path: "/backup", icon: "💾", status: "coming-soon" },
          { name: "Audit Logs", path: "/audit", icon: "📝", status: "coming-soon" },
        ],
      };
      baseModules["Admin Portal"] = {
        icon: <AdminIcon />,
        color: "#1976D2",
        modules: [
          {
            name: "Admin Dashboard",
            path: "https://hospital-softwareservices.vercel.app/",
            icon: "🏠",
            status: "active",
            external: true,
            description: "Access admin dashboard at localhost:3001",
          },
          {
            name: "Operations",
            path: "https://hospital-softwareservices.vercel.app/operations",
            icon: "⚙️",
            status: "active",
            external: true,
            description: "Operations management dashboard",
          },
          {
            name: "Quality",
            path: "https://hospital-softwareservices.vercel.app/quality",
            icon: "⭐",
            status: "active",
            external: true,
            description: "Quality management and metrics",
          },
          {
            name: "Admin",
            path: "https://hospital-softwareservices.vercel.app/admin",
            icon: "👑",
            status: "active",
            external: true,
            description: "Administrative controls and settings",
          },
          {
            name: "Support",
            path: "https://hospital-softwareservices.vercel.app/support",
            icon: "🆘",
            status: "active",
            external: true,
            description: "Technical support and help desk",
          },
          {
            name: "Specialized",
            path: "https://hospital-softwareservices.vercel.app/specialized",
            icon: "🎯",
            status: "active",
            external: true,
            description: "Specialized services and departments",
          },
          {
            name: "Compliance",
            path: "https://hospital-softwareservices.vercel.app/compliance",
            icon: "📋",
            status: "active",
            external: true,
            description: "Compliance monitoring and reporting",
          },
        ],
      };
    }

    return baseModules;
  };

  const hospitalModules = getHospitalModules();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerCollapse = () => {
    setDrawerCollapsed(!drawerCollapsed);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleModuleExpand = (moduleName) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleName]: !prev[moduleName],
    }));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    handleProfileMenuClose();
  };

  const renderModuleList = () => (
    <List sx={{ pt: 0 }}>
      {Object.entries(hospitalModules)
        .filter(([categoryName, category]) => category.modules.some((module) => module.status === "active"))
        .map(([categoryName, category]) => (
          <React.Fragment key={categoryName}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                px: 2,
                py: 1.5,
                cursor: "pointer",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
                borderLeft: expandedModules[categoryName] ? `4px solid ${category.color}` : "none",
              }}
              onClick={() => handleModuleExpand(categoryName)}
            >
              <Box sx={{ color: category.color, mr: drawerCollapsed ? 0 : 2 }}>{category.icon}</Box>
              {!drawerCollapsed && (
                <>
                  <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: 600 }}>
                    {categoryName}
                  </Typography>
                  {expandedModules[categoryName] ? <ExpandLess /> : <ExpandMore />}
                </>
              )}
            </Box>

            {!drawerCollapsed && (
              <Collapse in={expandedModules[categoryName]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {category.modules
                    .filter((module) => module.status === "active")
                    .map((module) => (
                      <ModuleCard
                        key={module.name}
                        module={module}
                        isActive={location.pathname === module.path}
                        onClick={() => {
                          if (module.status === "active") {
                            if (module.external) {
                              window.open(module.path, "_blank");
                            } else {
                              navigate(module.path);
                            }
                          }
                        }}
                      />
                    ))}
                </List>
              </Collapse>
            )}

            {categoryName !== "System Administration" && <Divider sx={{ my: 1 }} />}
          </React.Fragment>
        ))}
    </List>
  );

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Hospital Logo & Name */}
      <Box
        sx={{
          p: 2,
          backgroundColor: "primary.main", // Solid dark blue from theme
          color: "primary.contrastText",
          textAlign: "center",
        }}
      >
        {!drawerCollapsed ? (
          <>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 0.5 }}>
              🏥 HealthTech
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Enterprise Hospital Management
            </Typography>
          </>
        ) : (
          <Typography variant="h4">🏥</Typography>
        )}
      </Box>

      {/* Module Navigation */}
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>{renderModuleList()}</Box>

      {/* Collapse Button */}
      {!isMobile && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: "divider" }}>
          <IconButton
            onClick={handleDrawerCollapse}
            sx={{ width: "100%", justifyContent: drawerCollapsed ? "center" : "flex-start" }}
          >
            {drawerCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            {!drawerCollapsed && (
              <Typography variant="caption" sx={{ ml: 1 }}>
                Collapse Menu
              </Typography>
            )}
          </IconButton>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          ml: { md: `${drawerCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
          backgroundColor: "primary.main", // Solid dark blue from theme
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)", // Adjusted shadow for solid color
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap component="div">
              Hospital Management System
            </Typography>
            {user && (
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Welcome, {user.fullName} ({user.role})
              </Typography>
            )}
          </Box>

          {/* System Status */}
          <Chip
            label="System Online"
            color="success"
            size="small"
            sx={{ mr: 2, color: "white", backgroundColor: "rgba(76, 175, 80, 0.8)" }}
          />

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={handleNotificationOpen}>
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile Menu */}
          <Tooltip title="Account">
            <IconButton color="inherit" onClick={handleProfileMenuOpen}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: "rgba(255,255,255,0.2)" }}>
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerCollapsed ? collapsedDrawerWidth : drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerCollapsed ? collapsedDrawerWidth : drawerWidth,
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleProfileMenuClose}>
          <AccountIcon sx={{ mr: 2 }} />
          Profile Settings
        </MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>
          <SettingsIcon sx={{ mr: 2 }} />
          System Preferences
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <Typography color="error">Logout</Typography>
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{ sx: { width: 320, maxHeight: 400 } }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        <MenuItem>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              New Patient Registration
            </Typography>
            <Typography variant="caption" color="text.secondary">
              John Doe registered 5 minutes ago
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              Complaint Submitted
            </Typography>
            <Typography variant="caption" color="text.secondary">
              High priority complaint received
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              System Update
            </Typography>
            <Typography variant="caption" color="text.secondary">
              New features available
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default EnterpriseLayout;
