import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { usePatient } from "../contexts/PatientContext";
import PrescriptionManager from "../components/PrescriptionManager";
import { Dialog, DialogContent, DialogTitle, Typography, Button, Box, IconButton } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import "./ConsultationDashboard.css";

const ConsultationDashboard = () => {
  const { user } = useAuth();
  const { currentPatientId, setCurrentPatientId } = usePatient();
  const [consultations, setConsultations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    dateFrom: "",
    dateTo: "",
    patientId: currentPatientId || "",
  });
  const [selectedConsultationId, setSelectedConsultationId] = useState(null);
  const [showPrescriptionSection, setShowPrescriptionSection] = useState(false);
  const [showTestRequestModal, setShowTestRequestModal] = useState(false);
  const [selectedConsultationForTest, setSelectedConsultationForTest] = useState(null);
  const [testCatalog, setTestCatalog] = useState([]);
  const [showFeaturesPopup, setShowFeaturesPopup] = useState(true);

  useEffect(() => {
    fetchConsultations();
    fetchStats();
    fetchTestCatalog();
  }, [filters]);

  useEffect(() => {
    if (currentPatientId) {
      setFilters((prev) => ({ ...prev, patientId: currentPatientId }));
    }
  }, [currentPatientId]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const params = {
        doctorId: user.id,
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.patientId && { patientId: filters.patientId }),
      };

      const response = await axios.get("/api/consultations", { params });
      setConsultations(response.data.data);
    } catch (error) {
      console.error("Error fetching consultations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`/api/consultations/stats/${user.id}`);
      setStats(response.data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchTestCatalog = async () => {
    try {
      const response = await axios.get("/api/laboratory/test-catalog");
      if (response.data.success) {
        setTestCatalog(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching test catalog:", error);
    }
  };

  const handleNewConsultationSuccess = () => {
    fetchConsultations();
    fetchStats();
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNewPrescription = (consultationId) => {
    setSelectedConsultationId(consultationId);
    setShowPrescriptionSection(true);
  };

  const handleClosePrescription = () => {
    setShowPrescriptionSection(false);
    setSelectedConsultationId(null);
  };

  const handleRequestTest = (consultation) => {
    setSelectedConsultationForTest(consultation);
    setShowTestRequestModal(true);
  };

  const handleCloseTestRequestModal = () => {
    setShowTestRequestModal(false);
    setSelectedConsultationForTest(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "in-progress":
        return "#ffa500";
      case "completed":
        return "#28a745";
      case "cancelled":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="consultation-dashboard">
        <div className="loading-spinner">Loading consultations...</div>
      </div>
    );
  }

  return (
    <div className="consultation-dashboard">
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

      <div className="dashboard-header">
        <h1>Consultation Dashboard</h1>
        <div className="stats-cards">
          <div className="stat-card">
            <h3>{stats.total || 0}</h3>
            <p>Total Consultations</p>
          </div>
          <div className="stat-card">
            <h3>{stats.today || 0}</h3>
            <p>Today</p>
          </div>
          <div className="stat-card">
            <h3>{stats.inProgress || 0}</h3>
            <p>In Progress</p>
          </div>
          <div className="stat-card">
            <h3>{stats.prescriptionsWritten || 0}</h3>
            <p>Prescriptions</p>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <select value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
            <option value="all">All</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label>From Date:</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>To Date:</label>
          <input type="date" value={filters.dateTo} onChange={(e) => handleFilterChange("dateTo", e.target.value)} />
        </div>

        <div className="filter-group">
          <label>Patient ID:</label>
          <input
            type="text"
            placeholder="Enter Patient ID"
            value={filters.patientId}
            onChange={(e) => handleFilterChange("patientId", e.target.value)}
          />
        </div>

        <button className="new-consultation-btn" onClick={() => (window.location.href = "/consultation/new")}>
          New Consultation
        </button>
      </div>

      <div className="consultations-list">
        {consultations.length === 0 ? (
          <div className="no-consultations">
            <p>No consultations found matching your criteria.</p>
          </div>
        ) : (
          consultations.map((consultation) => (
            <div key={consultation.id} className="consultation-card">
              <div className="consultation-header">
                <div className="consultation-info">
                  <h3>Patient ID: {consultation.patientId}</h3>
                  <p className="consultation-date">{formatDate(consultation.consultationDate)}</p>
                </div>
                <div
                  className="consultation-status"
                  style={{ backgroundColor: getStatusColor(consultation.consultationStatus) }}
                >
                  {consultation.consultationStatus}
                </div>
              </div>

              <div className="consultation-details">
                <div className="detail-item">
                  <strong>Chief Complaint:</strong>
                  <span>{consultation.chiefComplaint}</span>
                </div>

                {consultation.assessment?.primaryDiagnosis && (
                  <div className="detail-item">
                    <strong>Primary Diagnosis:</strong>
                    <span>{consultation.assessment.primaryDiagnosis}</span>
                  </div>
                )}

                <div className="consultation-metrics">
                  <span className="metric">📋 {consultation.prescriptions?.length || 0} Prescriptions</span>
                  <span className="metric">🔬 {consultation.investigations?.length || 0} Investigations</span>
                  {consultation.aiSuggestions?.requested && <span className="metric ai-badge">🤖 AI Assisted</span>}
                </div>
              </div>

              <div className="consultation-actions">
                <button
                  className="btn-primary"
                  onClick={() => {
                    setCurrentPatientId(consultation.patientId);
                    window.location.href = `/consultation/${consultation.id}`;
                  }}
                >
                  View Details
                </button>

                {consultation.consultationStatus === "in-progress" && (
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setCurrentPatientId(consultation.patientId);
                      window.location.href = `/consultation/${consultation.id}/edit`;
                    }}
                  >
                    Continue
                  </button>
                )}

                <button className="btn-outline" onClick={() => handleNewPrescription(consultation.id)}>
                  Manage Prescription
                </button>

                <button className="btn-outline" onClick={() => handleRequestTest(consultation)}>
                  Request Lab Test
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Prescription Section */}
      {showPrescriptionSection && (
        <div className="prescription-section">
          <div className="prescription-section-header">
            <h2>Prescription Management</h2>
            <button className="btn-close" onClick={handleClosePrescription}>
              ✕ Close
            </button>
          </div>
          <PrescriptionManager consultationId={selectedConsultationId} compact={true} />
        </div>
      )}

      {/* Test Request Modal */}
      {showTestRequestModal && selectedConsultationForTest && (
        <TestRequestModal
          consultation={selectedConsultationForTest}
          doctorId={user.id}
          testCatalog={testCatalog}
          onClose={handleCloseTestRequestModal}
        />
      )}
    </div>
  );
};

// Test Request Modal Component
const TestRequestModal = ({ consultation, doctorId, testCatalog, onClose }) => {
  const [formData, setFormData] = useState({
    priority: "Routine",
    clinicalInfo: {
      diagnosis: consultation.assessment?.primaryDiagnosis || "",
      symptoms: "",
      medications: "",
      allergies: "",
    },
    selectedTests: [],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleTestSelection = (test, category) => {
    const testWithCategory = { ...test, category };
    setFormData((prev) => ({
      ...prev,
      selectedTests: prev.selectedTests.some((t) => t.testCode === test.testCode)
        ? prev.selectedTests.filter((t) => t.testCode !== test.testCode)
        : [...prev.selectedTests, testWithCategory],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const orderData = {
        patientId: consultation.patientId,
        doctorId: doctorId,
        consultationId: consultation.id,
        priority: formData.priority,
        clinicalInfo: formData.clinicalInfo,
        tests: formData.selectedTests.map((test) => ({
          testCode: test.testCode,
          testName: test.testName,
          category: test.category,
          specimen: test.specimen,
          priority: formData.priority,
        })),
      };

      const response = await axios.post("/api/laboratory/orders", orderData);

      if (response.data.success) {
        alert("Lab order created successfully!");
        onClose();
      } else {
        alert("Failed to create lab order: " + response.data.message);
      }
    } catch (error) {
      console.error("Error creating lab order:", error);
      alert("Failed to create lab order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content test-request-modal">
        <div className="modal-header">
          <h2>Request Lab Test</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="order-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Patient ID</label>
              <input type="text" value={consultation.patientId} readOnly />
            </div>

            <div className="form-group">
              <label>Doctor ID</label>
              <input type="text" value={doctorId} readOnly />
            </div>

            <div className="form-group">
              <label>Consultation ID</label>
              <input type="text" value={consultation.id} readOnly />
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select value={formData.priority} onChange={(e) => handleInputChange("priority", e.target.value)}>
                <option value="Routine">Routine</option>
                <option value="Urgent">Urgent</option>
                <option value="STAT">STAT</option>
              </select>
            </div>
          </div>

          <div className="clinical-info">
            <h4>Clinical Information</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Diagnosis</label>
                <input
                  type="text"
                  value={formData.clinicalInfo.diagnosis}
                  onChange={(e) => handleInputChange("clinicalInfo.diagnosis", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Symptoms</label>
                <input
                  type="text"
                  value={formData.clinicalInfo.symptoms}
                  onChange={(e) => handleInputChange("clinicalInfo.symptoms", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Current Medications</label>
                <input
                  type="text"
                  value={formData.clinicalInfo.medications}
                  onChange={(e) => handleInputChange("clinicalInfo.medications", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Allergies</label>
                <input
                  type="text"
                  value={formData.clinicalInfo.allergies}
                  onChange={(e) => handleInputChange("clinicalInfo.allergies", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="test-selection">
            <h4>Select Tests</h4>
            {testCatalog.map((category) => (
              <div key={category.category} className="test-category">
                <h5>{category.category}</h5>
                <div className="tests-grid">
                  {category.tests.map((test) => (
                    <div
                      key={test.testCode}
                      className={`test-item ${
                        formData.selectedTests.some((t) => t.testCode === test.testCode) ? "selected" : ""
                      }`}
                      onClick={() => handleTestSelection(test, category.category)}
                    >
                      <div className="test-info">
                        <strong>{test.testName}</strong>
                        <p>Specimen: {test.specimen}</p>
                        <p>TAT: {test.turnaroundTime}</p>
                        <p>Cost: ${test.cost}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || formData.selectedTests.length === 0}
            >
              {submitting ? "Creating..." : "Create Lab Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsultationDashboard;
