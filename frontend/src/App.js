import MedicalHistory from "./pages/MedicalHistory";
import BroughtDeadRecord from "./pages/BroughtDeadRecord";
import PatientHistory from "./pages/PatientHistory";
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import { SocketProvider } from "./contexts/SocketContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PatientProvider } from "./contexts/PatientContext";
import EnterpriseLayout from "./components/Layout/EnterpriseLayout";
import EnterpriseDashboard from "./pages/EnterpriseDashboard";

import QueueStatus from "./pages/QueueStatus";
import AdminDashboard from "./pages/AdminDashboard";
import KioskMode from "./pages/KioskMode";
import AuthPage from "./pages/Login";
import WhatsAppDemo from "./pages/WhatsAppDemo";
import TelegramDemo from "./pages/TelegramDemo";
import ComplaintManagement from "./pages/ComplaintManagement";
import SMSDemo from "./pages/SMSDemo";
import IntegratedBooking from "./pages/IntegratedBooking";
import UserRegistration from "./pages/UserRegistration";
import Vitals from "./pages/Vitals";
import TriageAssessment from "./pages/TriageAssessment";
import ConsultationDashboard from "./pages/ConsultationDashboard";
import ConsultationForm from "./pages/ConsultationForm";
import PrescriptionManager from "./pages/PrescriptionManager";
import PharmacyDashboard from "./pages/PharmacyDashboard";
import PharmacyInventory from "./pages/PharmacyInventory";
import EPrescriptionQueue from "./pages/EPrescriptionQueue";
import PharmacyTransactions from "./pages/PharmacyTransactions";
import PharmacyReports from "./pages/PharmacyReports";
import DrugInformation from "./pages/DrugInformation";
import ADRReporting from "./pages/ADRReporting";

import LabOrderManagement from "./pages/LabOrderManagement";
import BillingDashboard from "./pages/BillingDashboard";
import EmergencyDashboard from "./pages/EmergencyDashboard";
import EmergencyCaseForm from "./pages/EmergencyCaseForm";
import EmergencyCaseDetails from "./pages/EmergencyCaseDetails";
import EmergencyTest from "./pages/EmergencyTest";
import EmergencyDashboardSimple from "./pages/EmergencyDashboardSimple";
import MLCDocumentation from "./pages/MLCDocumentation";
import AdmissionBedManagement from "./pages/AdmissionBedManagement";
import SecurityLogging from "./pages/SecurityLogging";
import PatientSearch from "./pages/PatientSearch";

// Protected Route Component
const ProtectedRoute = ({ children, requiredRoles = [], requiredPermissions = [] }) => {
  const { isAuthenticated, hasRole, hasPermission, loading } = useAuth();

  if (loading) {
    return <Box>Loading...</Box>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check permission-based access
  if (requiredPermissions.length > 0) {
    const hasRequiredPermission = requiredPermissions.some(({ module, action }) => hasPermission(module, action));
    if (!hasRequiredPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

// Unauthorized Access Component
const UnauthorizedAccess = () => (
  <EnterpriseLayout>
    <Box sx={{ p: 4, textAlign: "center" }}>
      <h2>Access Denied</h2>
      <p>You don't have permission to access this page.</p>
    </Box>
  </EnterpriseLayout>
);

function App() {
  return (
    <AuthProvider>
      <PatientProvider>
        <SocketProvider>
          <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<AuthPage />} />

              <Route path="/unauthorized" element={<UnauthorizedAccess />} />

              {/* Protected routes with role-based access */}

              {/* Admin Dashboard - Full access */}
              <Route
                path="/enterprise-dashboard"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <EnterpriseLayout>
                      <EnterpriseDashboard />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* User Registration - Admin only */}
              <Route
                path="/user-registration"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <EnterpriseLayout>
                      <UserRegistration />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Patient Registration - Receptionist, Admin */}
              <Route
                path="/integrated-booking"
                element={
                  <ProtectedRoute requiredPermissions={[{ module: "appointments", action: "create" }]}>
                    <EnterpriseLayout>
                      <IntegratedBooking />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Queue Management - Multiple roles */}
              <Route
                path="/queue-status"
                element={
                  <ProtectedRoute requiredPermissions={[{ module: "queue_management", action: "read" }]}>
                    <EnterpriseLayout>
                      <QueueStatus />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Admin Dashboard - Doctors, Admin */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <EnterpriseLayout>
                      <AdminDashboard />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Complaint Management - Admin, Doctors */}
              <Route
                path="/complaints"
                element={
                  <ProtectedRoute requiredPermissions={[{ module: "complaints", action: "read" }]}>
                    <EnterpriseLayout>
                      <ComplaintManagement />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Vitals Management - Nurses, Doctors, Admin */}
              <Route
                path="/vitals"
                element={
                  <ProtectedRoute requiredRoles={["nurse", "doctor", "admin"]}>
                    <EnterpriseLayout>
                      <Vitals />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Legacy redirects for backward compatibility */}
              <Route path="/vitals-logging" element={<Navigate to="/vitals" replace />} />
              <Route path="/vitals-dashboard" element={<Navigate to="/vitals" replace />} />

              {/* Triage Assessment - Nurses, Doctors, Admin */}
              <Route
                path="/triage-assessment"
                element={
                  <ProtectedRoute requiredRoles={["nurse", "doctor", "admin"]}>
                    <EnterpriseLayout>
                      <TriageAssessment />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Consultation Management - Doctors, Admin */}
              <Route
                path="/consultations"
                element={
                  <ProtectedRoute requiredRoles={["doctor", "admin"]}>
                    <EnterpriseLayout>
                      <ConsultationDashboard />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/consultation/new"
                element={
                  <ProtectedRoute requiredRoles={["doctor", "admin"]}>
                    <EnterpriseLayout>
                      <ConsultationForm />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/consultation/:id/edit"
                element={
                  <ProtectedRoute requiredRoles={["doctor", "admin"]}>
                    <EnterpriseLayout>
                      <ConsultationForm />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Prescription Management - Doctors, Admin */}
              <Route
                path="/prescription/new"
                element={
                  <ProtectedRoute requiredRoles={["doctor", "admin"]}>
                    <EnterpriseLayout>
                      <PrescriptionManager />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Pharmacy Information System - Pharmacists, Admin */}
              <Route
                path="/pharmacy"
                element={
                  <ProtectedRoute requiredRoles={["pharmacist", "admin"]}>
                    <EnterpriseLayout>
                      <PharmacyDashboard />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/pharmacy/inventory"
                element={
                  <ProtectedRoute requiredRoles={["pharmacist", "admin"]}>
                    <EnterpriseLayout>
                      <PharmacyInventory />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/pharmacy/prescriptions"
                element={
                  <ProtectedRoute requiredRoles={["pharmacist", "admin"]}>
                    <EnterpriseLayout>
                      <EPrescriptionQueue />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/pharmacy/transactions"
                element={
                  <ProtectedRoute requiredRoles={["pharmacist", "admin"]}>
                    <EnterpriseLayout>
                      <PharmacyTransactions />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/pharmacy/reports"
                element={
                  <ProtectedRoute requiredRoles={["pharmacist", "admin"]}>
                    <EnterpriseLayout>
                      <PharmacyReports />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Consolidated prescription route - E-Prescription Tracking removed, now integrated in PrescriptionManager */}

              {/* Drug Information System - Doctors, Pharmacists, Admin */}
              <Route
                path="/drug-information"
                element={
                  <ProtectedRoute requiredRoles={["doctor", "pharmacist", "admin"]}>
                    <EnterpriseLayout>
                      <DrugInformation />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* ADR Reporting - Doctors, Pharmacists, Admin */}
              <Route
                path="/adr-reporting"
                element={
                  <ProtectedRoute requiredRoles={["doctor", "pharmacist", "admin"]}>
                    <EnterpriseLayout>
                      <ADRReporting />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/lab-orders"
                element={
                  <ProtectedRoute requiredRoles={["lab_technician", "doctor", "admin"]}>
                    <EnterpriseLayout>
                      <LabOrderManagement />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Hospital Billing Management - Billing Staff, Admin */}
              <Route
                path="/billing"
                element={
                  <ProtectedRoute requiredRoles={["billing_staff", "admin"]}>
                    <EnterpriseLayout>
                      <BillingDashboard />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Emergency Case Management - Emergency Staff, Doctors, Admin */}
              <Route
                path="/emergency"
                element={
                  <ProtectedRoute requiredRoles={["admin", "doctor", "nurse", "receptionist"]}>
                    <EnterpriseLayout>
                      <EmergencyDashboard />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Emergency Test Route - Temporary for debugging */}
              <Route
                path="/emergency-test"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <EnterpriseLayout>
                      <EmergencyTest />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Emergency Simple Dashboard - Fallback */}
              <Route
                path="/emergency-simple"
                element={
                  <ProtectedRoute requiredRoles={["admin", "doctor", "nurse"]}>
                    <EnterpriseLayout>
                      <EmergencyDashboardSimple />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/emergency/case/new"
                element={
                  <ProtectedRoute requiredRoles={["emergency_staff", "doctor", "admin"]}>
                    <EnterpriseLayout>
                      <EmergencyCaseForm />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/emergency/case/:id"
                element={
                  <ProtectedRoute requiredRoles={["emergency_staff", "doctor", "admin"]}>
                    <EnterpriseLayout>
                      <EmergencyCaseDetails />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/emergency/case/:id/edit"
                element={
                  <ProtectedRoute requiredRoles={["emergency_staff", "doctor", "admin"]}>
                    <EnterpriseLayout>
                      <EmergencyCaseForm />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/legal-mlc"
                element={
                  <ProtectedRoute requiredRoles={["admin", "doctor"]}>
                    <EnterpriseLayout>
                      <MLCDocumentation />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admission-bed"
                element={
                  <ProtectedRoute requiredRoles={["admin", "doctor", "nurse"]}>
                    <EnterpriseLayout>
                      <AdmissionBedManagement />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/brought-dead"
                element={
                  <ProtectedRoute requiredRoles={["admin", "doctor", "nurse"]}>
                    <EnterpriseLayout>
                      <BroughtDeadRecord />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/security-logging"
                element={
                  <ProtectedRoute requiredRoles={["admin", "security_staff"]}>
                    <EnterpriseLayout>
                      <SecurityLogging />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Patient Search - Admin only */}
              <Route
                path="/patient-search"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <EnterpriseLayout>
                      <PatientSearch />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Patient History - User role */}
              <Route
                path="/patient-history"
                element={
                  <ProtectedRoute requiredRoles={["user"]}>
                    <EnterpriseLayout>
                      <PatientHistory />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Medical History - Doctors, Admin */}
              <Route
                path="/medical-history/:patientId"
                element={
                  <ProtectedRoute requiredRoles={["doctor", "admin"]}>
                    <EnterpriseLayout>
                      <MedicalHistory />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Communication Demos - Admin only */}
              <Route
                path="/whatsapp"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <EnterpriseLayout>
                      <WhatsAppDemo />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/sms"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <EnterpriseLayout>
                      <SMSDemo />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/telegram"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <EnterpriseLayout>
                      <TelegramDemo />
                    </EnterpriseLayout>
                  </ProtectedRoute>
                }
              />

              {/* Kiosk Mode - Public access */}
              <Route
                path="/kiosk"
                element={
                  <EnterpriseLayout>
                    <KioskMode />
                  </EnterpriseLayout>
                }
              />

              {/* Default redirect based on role */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <RoleBasedRedirect />
                  </ProtectedRoute>
                }
              />

              {/* Legacy routes for backward compatibility */}
              <Route path="/register" element={<Navigate to="/integrated-booking" replace />} />
              <Route path="/queue" element={<Navigate to="/queue-status" replace />} />
            </Routes>
          </Box>
        </SocketProvider>
      </PatientProvider>
    </AuthProvider>
  );
}

// Component to redirect users based on their role
const RoleBasedRedirect = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case "admin":
      return <Navigate to="/enterprise-dashboard" replace />;
    case "doctor":
      return <Navigate to="/consultations" replace />;
    case "receptionist":
      return <Navigate to="/integrated-booking" replace />;
    case "nurse":
      return <Navigate to="/vitals" replace />;
    case "pharmacist":
      return <Navigate to="/pharmacy" replace />;
    case "lab_technician":
      return <Navigate to="/laboratory" replace />;
    case "billing_staff":
      return <Navigate to="/billing" replace />;
    case "user":
      return <Navigate to="/kiosk" replace />;
    default:
      return <Navigate to="/kiosk" replace />;
  }
};

export default App;
