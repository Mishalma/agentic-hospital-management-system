import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import "./EPrescriptionTracker.css";

const EPrescriptionTracker = ({ compact = false }) => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [trackingDetails, setTrackingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    dateRange: "week",
  });

  useEffect(() => {
    fetchPrescriptions();
    // Set up real-time updates
    const interval = setInterval(fetchPrescriptions, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedPrescription) {
      fetchTrackingDetails(selectedPrescription.id);
      // Set up real-time tracking updates
      const trackingInterval = setInterval(() => {
        fetchTrackingDetails(selectedPrescription.id);
      }, 15000);
      return () => clearInterval(trackingInterval);
    }
  }, [selectedPrescription]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/prescriptions", {
        params: {
          doctorId: user.id,
          status: filters.status !== "all" ? filters.status : undefined,
        },
      });

      // Filter prescriptions that have been sent
      const sentPrescriptions = response.data.data.filter((p) => p.status !== "draft" && p.transmissionInfo);

      setPrescriptions(sentPrescriptions);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingDetails = async (prescriptionId) => {
    try {
      setTrackingLoading(true);
      const response = await axios.get(`/api/prescriptions/${prescriptionId}/status`);
      setTrackingDetails(response.data.data);
    } catch (error) {
      console.error("Error fetching tracking details:", error);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleTrackPrescription = (prescription) => {
    setSelectedPrescription(prescription);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "sent":
        return "#3498db";
      case "received":
        return "#f39c12";
      case "processing":
        return "#e67e22";
      case "ready":
        return "#27ae60";
      case "dispensed":
        return "#2ecc71";
      case "cancelled":
        return "#e74c3c";
      default:
        return "#95a5a6";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "stat":
        return "#e74c3c";
      case "urgent":
        return "#f39c12";
      case "routine":
        return "#27ae60";
      default:
        return "#95a5a6";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "sent":
        return "📤";
      case "received":
        return "📥";
      case "processing":
        return "⚙️";
      case "ready":
        return "✅";
      case "dispensed":
        return "🎯";
      case "cancelled":
        return "❌";
      default:
        return "📋";
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "N/A";
    return new Date(dateTime).toLocaleString();
  };

  const calculateProgress = (status) => {
    const statusOrder = ["sent", "received", "processing", "ready", "dispensed"];
    const currentIndex = statusOrder.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
  };

  if (compact) {
    // Compact version for embedding in other pages
    return (
      <div className="eprescription-tracker-compact">
        <div className="tracker-header">
          <h3>E-Prescription Tracking</h3>
          <div className="tracker-stats">
            <span className="stat-item">
              {prescriptions.filter((p) => p.status === "ready" || p.status === "dispensed").length}/
              {prescriptions.length} Ready
            </span>
          </div>
        </div>

        <div className="tracker-list">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            prescriptions.slice(0, 5).map((prescription) => (
              <div key={prescription.id} className="compact-prescription-item">
                <div className="item-info">
                  <span className="rx-number">Rx #{prescription.prescriptionNumber}</span>
                  <span className="patient-id">Patient: {prescription.patientId}</span>
                </div>
                <div className="item-status">
                  <span className="status-indicator" style={{ backgroundColor: getStatusColor(prescription.status) }}>
                    {getStatusIcon(prescription.status)}
                  </span>
                  <span className="status-text">{prescription.status}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="tracker-actions">
          <button className="btn-view-all" onClick={() => (window.location.href = "/eprescription-tracking")}>
            View All
          </button>
        </div>
      </div>
    );
  }

  // Full version (original EPrescriptionTracking component)
  if (loading) {
    return (
      <div className="eprescription-tracking">
        <div className="loading-spinner">Loading prescriptions...</div>
      </div>
    );
  }

  return (
    <div className="eprescription-tracking">
      <div className="tracking-header">
        <h1>E-Prescription Tracking</h1>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{prescriptions.length}</span>
            <span className="stat-label">Total Sent</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {prescriptions.filter((p) => p.status === "ready" || p.status === "dispensed").length}
            </span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {prescriptions.filter((p) => p.priority === "stat" || p.priority === "urgent").length}
            </span>
            <span className="stat-label">Priority</span>
          </div>
        </div>
      </div>

      <div className="tracking-content">
        <div className="prescriptions-list">
          <div className="list-header">
            <h3>Sent Prescriptions</h3>
            <div className="list-filters">
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="received">Received</option>
                <option value="processing">Processing</option>
                <option value="ready">Ready</option>
                <option value="dispensed">Dispensed</option>
              </select>
            </div>
          </div>

          <div className="prescriptions-grid">
            {prescriptions.length === 0 ? (
              <div className="no-prescriptions">
                <p>No sent prescriptions found</p>
              </div>
            ) : (
              prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className={`prescription-card ${selectedPrescription?.id === prescription.id ? "selected" : ""}`}
                  onClick={() => handleTrackPrescription(prescription)}
                >
                  <div className="prescription-header">
                    <div className="prescription-info">
                      <h4>Rx #{prescription.prescriptionNumber}</h4>
                      <p className="patient-info">Patient: {prescription.patientId}</p>
                      <p className="sent-time">
                        Sent: {formatDateTime(prescription.transmissionInfo?.transmittedDate)}
                      </p>
                    </div>

                    <div className="prescription-badges">
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(prescription.status) }}>
                        {getStatusIcon(prescription.status)} {prescription.status?.toUpperCase()}
                      </span>

                      {prescription.priority && (
                        <span
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(prescription.priority) }}
                        >
                          {prescription.priority?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="prescription-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${calculateProgress(prescription.status)}%`,
                          backgroundColor: getStatusColor(prescription.status),
                        }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      {prescription.status === "dispensed"
                        ? "Complete"
                        : prescription.status === "ready"
                        ? "Ready for pickup"
                        : prescription.status === "processing"
                        ? "Being processed"
                        : prescription.status === "received"
                        ? "Received by pharmacy"
                        : "In transit"}
                    </div>
                  </div>

                  <div className="prescription-details">
                    <div className="medication-count">{prescription.medications?.length || 0} medications</div>

                    {prescription.pharmacyInfo && (
                      <div className="pharmacy-info">
                        <strong>{prescription.pharmacyInfo.pharmacyName}</strong>
                        <p>{prescription.pharmacyInfo.pharmacyPhone}</p>
                      </div>
                    )}

                    {prescription.transmissionInfo?.pharmacyConfirmation?.estimatedReadyTime && (
                      <div className="estimated-time">
                        <strong>Est. Ready:</strong>{" "}
                        {formatDateTime(prescription.transmissionInfo.pharmacyConfirmation.estimatedReadyTime)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="tracking-details">
          {selectedPrescription ? (
            <div className="details-panel">
              <div className="details-header">
                <h3>Tracking Details</h3>
                <div className="prescription-id">Rx #{selectedPrescription.prescriptionNumber}</div>
              </div>

              {trackingLoading ? (
                <div className="tracking-loading">Loading tracking details...</div>
              ) : trackingDetails ? (
                <div className="tracking-content-details">
                  {/* Current Status */}
                  <div className="current-status">
                    <div className="status-icon">{getStatusIcon(trackingDetails.currentStatus)}</div>
                    <div className="status-info">
                      <h4>{trackingDetails.currentStatus?.toUpperCase()}</h4>
                      {trackingDetails.priority && (
                        <span className="priority">Priority: {trackingDetails.priority}</span>
                      )}
                      {trackingDetails.estimatedReadyTime && (
                        <div className="ready-time">
                          <strong>Estimated Ready Time:</strong>
                          <br />
                          {formatDateTime(trackingDetails.estimatedReadyTime)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pharmacy Information */}
                  {trackingDetails.pharmacyInfo && (
                    <div className="pharmacy-details">
                      <h4>Pharmacy Information</h4>
                      <div className="pharmacy-card">
                        <h5>{trackingDetails.pharmacyInfo.pharmacyName}</h5>
                        <p>{trackingDetails.pharmacyInfo.pharmacyAddress}</p>
                        <p>📞 {trackingDetails.pharmacyInfo.pharmacyPhone}</p>
                      </div>
                    </div>
                  )}

                  {/* Status History */}
                  <div className="status-history">
                    <h4>Status History</h4>
                    <div className="timeline">
                      {trackingDetails.statusHistory?.map((status, index) => (
                        <div key={index} className="timeline-item">
                          <div className="timeline-marker">
                            <div className="marker-dot" style={{ backgroundColor: getStatusColor(status.status) }}>
                              {getStatusIcon(status.status)}
                            </div>
                            {index < trackingDetails.statusHistory.length - 1 && <div className="marker-line"></div>}
                          </div>
                          <div className="timeline-content">
                            <div className="timeline-status">{status.status?.toUpperCase()}</div>
                            <div className="timeline-description">{status.description}</div>
                            <div className="timeline-time">{formatDateTime(status.timestamp)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prescription Details */}
                  <div className="prescription-medications">
                    <h4>Medications ({selectedPrescription.medications?.length || 0})</h4>
                    <div className="medications-list">
                      {selectedPrescription.medications?.map((med, index) => (
                        <div key={index} className="medication-item">
                          <div className="medication-name">
                            <strong>{med.genericName}</strong>
                            {med.brandName && <span> ({med.brandName})</span>}
                          </div>
                          <div className="medication-details">
                            <span>
                              {med.dosage} • {med.frequency}
                            </span>
                            <span>Qty: {med.quantity}</span>
                          </div>
                          {med.instructions && <div className="medication-instructions">{med.instructions}</div>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="tracking-actions">
                    <button className="btn-contact">📞 Contact Pharmacy</button>
                    {trackingDetails.currentStatus === "ready" && (
                      <button className="btn-notify">📱 Notify Patient</button>
                    )}
                    <button className="btn-print">🖨️ Print Details</button>
                  </div>
                </div>
              ) : (
                <div className="no-tracking-data">
                  <p>No tracking data available</p>
                </div>
              )}
            </div>
          ) : (
            <div className="no-selection">
              <div className="no-selection-content">
                <div className="no-selection-icon">📋</div>
                <h3>Select a Prescription</h3>
                <p>Choose a prescription from the list to view detailed tracking information</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EPrescriptionTracker;
