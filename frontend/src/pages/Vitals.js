import React, { useState, useEffect } from "react";
import { usePatient } from "../contexts/PatientContext";
import "./Vitals.css";

const Vitals = () => {
  // Modal state
  const [showLoggingModal, setShowLoggingModal] = useState(false);
  const { currentPatientId } = usePatient();

  // States from VitalsLogging
  const [patientId, setPatientId] = useState(currentPatientId || "");
  const [patientName, setPatientName] = useState("");
  const [nurseId, setNurseId] = useState("NURSE001");
  const [vitals, setVitals] = useState({
    bloodPressure: { systolic: "", diastolic: "" },
    heartRate: "",
    temperature: { value: "", unit: "F" },
    respiratoryRate: "",
    oxygenSaturation: "",
    weight: { value: "", unit: "lbs" },
    height: { value: "", unit: "in" },
  });
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // States from VitalsDashboard
  const [dashboardData, setDashboardData] = useState({
    todayCount: 0,
    abnormalCount: 0,
    unsyncedCount: 0,
    alertSeverity: { low: 0, medium: 0, high: 0, critical: 0 },
    recentAbnormal: [],
  });
  const [abnormalVitals, setAbnormalVitals] = useState([]);
  const [unsyncedVitals, setUnsyncedVitals] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load data
    loadAllData();

    // Set up real-time updates
    const interval = setInterval(() => {
      fetchDashboardData();
      if (activeTab === "abnormal") fetchAbnormalVitals();
      if (activeTab === "unsynced") fetchUnsyncedVitals();
    }, 30000); // Refresh every 30 seconds

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [activeTab]);

  const loadAllData = () => {
    fetchDashboardData();
    fetchAbnormalVitals();
    fetchUnsyncedVitals();
  };

  const loadCachedVitals = () => {
    const cached = localStorage.getItem("cachedVitals");
    if (cached) {
      setDashboardData((prev) => ({ ...prev, recentAbnormal: JSON.parse(cached) }));
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/vitals/dashboard");
      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const fetchAbnormalVitals = async () => {
    try {
      const response = await fetch("/api/vitals/abnormal");
      const data = await response.json();
      if (data.success) {
        setAbnormalVitals(data.data);
      }
    } catch (error) {
      console.error("Error fetching abnormal vitals:", error);
    }
  };

  const fetchUnsyncedVitals = async () => {
    try {
      const response = await fetch("/api/vitals/unsynced");
      const data = await response.json();
      if (data.success) {
        setUnsyncedVitals(data.data);
      }
    } catch (error) {
      console.error("Error fetching unsynced vitals:", error);
    }
  };

  const handleVitalChange = (field, value, subfield = null) => {
    setVitals((prev) => {
      if (subfield) {
        return {
          ...prev,
          [field]: {
            ...prev[field],
            [subfield]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const fetchPatientName = async (id) => {
    if (!id || id.length < 10) {
      setPatientName("");
      return;
    }

    try {
      const response = await fetch(`/api/patients/${id}/basic`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPatientName(data.name || "");
        } else {
          setPatientName("");
        }
      } else {
        setPatientName("");
      }
    } catch (error) {
      console.error("Error fetching patient name:", error);
      setPatientName("");
    }
  };

  const handlePatientIdChange = (e) => {
    const value = e.target.value;
    setPatientId(value);
    fetchPatientName(value);
  };

  const validateVitals = () => {
    const errors = [];

    // Blood pressure validation
    if (vitals.bloodPressure.systolic && vitals.bloodPressure.diastolic) {
      const sys = parseInt(vitals.bloodPressure.systolic);
      const dia = parseInt(vitals.bloodPressure.diastolic);
      if (sys < 60 || sys > 300) errors.push("Systolic BP must be between 60-300");
      if (dia < 30 || dia > 200) errors.push("Diastolic BP must be between 30-200");
      if (sys <= dia) errors.push("Systolic BP must be higher than diastolic");
    }

    // Heart rate validation
    if (vitals.heartRate && (vitals.heartRate < 30 || vitals.heartRate > 250)) {
      errors.push("Heart rate must be between 30-250 bpm");
    }

    // Temperature validation
    if (vitals.temperature.value) {
      const temp = parseFloat(vitals.temperature.value);
      const unit = vitals.temperature.unit;
      const tempF = unit === "C" ? (temp * 9) / 5 + 32 : temp;
      if (tempF < 90 || tempF > 110) {
        errors.push(`Temperature seems unusual: ${temp}°${unit}`);
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!patientId.trim()) {
      setMessage("Patient ID is required");
      return;
    }

    const validationErrors = validateVitals();
    if (validationErrors.length > 0) {
      setMessage("Validation errors: " + validationErrors.join(", "));
      return;
    }

    setLoading(true);
    setMessage("");
    setAlerts([]);

    console.log("[VITALS SUBMIT] Submitting vitals with patientId:", patientId);
    console.log("[VITALS SUBMIT] Patient name found:", patientName);

    try {
      if (isOffline) {
        const vitalsData = {
          patientId,
          nurseId,
          vitals,
          notes,
          timestamp: new Date().toISOString(),
          cached: true,
        };

        const cachedData = JSON.parse(localStorage.getItem("offlineVitals") || "[]");
        cachedData.push(vitalsData);
        localStorage.setItem("offlineVitals", JSON.stringify(cachedData));

        setMessage("Vitals cached offline. Will sync when connection is restored.");
        resetForm();
        return;
      }

      const requestData = {
        patientId,
        nurseId,
        vitals,
        notes,
        deviceInfo: {
          deviceType: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "tablet",
          deviceId: localStorage.getItem("deviceId") || "unknown",
        },
      };

      console.log("[VITALS SUBMIT] Sending request data:", JSON.stringify(requestData, null, 2));

      const response = await fetch("/api/vitals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Vitals recorded successfully!");
        setAlerts(data.alerts || []);
        resetForm();
        loadAllData(); // Refresh dashboard data
      } else {
        setMessage(data.message || "Failed to record vitals");
      }
    } catch (error) {
      console.error("Error recording vitals:", error);
      setMessage("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPatientId("");
    setPatientName("");
    setVitals({
      bloodPressure: { systolic: "", diastolic: "" },
      heartRate: "",
      temperature: { value: "", unit: "F" },
      respiratoryRate: "",
      oxygenSaturation: "",
      weight: { value: "", unit: "lbs" },
      height: { value: "", unit: "in" },
    });
    setNotes("");
  };

  const openLoggingModal = () => {
    setShowLoggingModal(true);
  };

  const closeLoggingModal = () => {
    setShowLoggingModal(false);
    resetForm();
    setMessage("");
    setAlerts([]);
  };

  const syncOfflineData = async () => {
    const offlineData = JSON.parse(localStorage.getItem("offlineVitals") || "[]");
    if (offlineData.length === 0) return;

    setLoading(true);
    let syncedCount = 0;

    for (const vitalsData of offlineData) {
      try {
        const response = await fetch("/api/vitals", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(vitalsData),
        });

        if (response.ok) {
          syncedCount++;
        }
      } catch (error) {
        console.error("Error syncing offline data:", error);
      }
    }

    if (syncedCount > 0) {
      localStorage.removeItem("offlineVitals");
      setMessage(`Synced ${syncedCount} offline vitals records`);
      loadAllData();
    }

    setLoading(false);
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOffline) {
      syncOfflineData();
    }
  }, [isOffline]);

  const handleMarkReviewed = async (vitalId) => {
    try {
      const response = await fetch(`/api/vitals/${vitalId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "reviewed" }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Vital marked as reviewed");
        fetchAbnormalVitals();
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error marking vital as reviewed:", error);
      setMessage("Failed to update vital status");
    }
  };

  const handleSyncToEMR = async (vitalId) => {
    try {
      const response = await fetch(`/api/vitals/${vitalId}/sync-emr`, {
        method: "POST",
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Successfully synced to EMR");
        fetchUnsyncedVitals();
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error syncing to EMR:", error);
      setMessage("Failed to sync to EMR");
    }
  };

  const handleBulkSync = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/vitals/sync-all-emr", {
        method: "POST",
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`Successfully synced ${data.syncedCount} vitals to EMR`);
        fetchUnsyncedVitals();
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error bulk syncing to EMR:", error);
      setMessage("Failed to bulk sync to EMR");
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case "critical":
        return "#dc3545";
      case "high":
        return "#fd7e14";
      case "medium":
        return "#ffc107";
      case "low":
        return "#28a745";
      default:
        return "#6c757d";
    }
  };

  const formatVitals = (vitalsData) => {
    const formatted = [];

    if (vitalsData.bloodPressure && vitalsData.bloodPressure.systolic && vitalsData.bloodPressure.diastolic) {
      formatted.push(`BP: ${vitalsData.bloodPressure.systolic}/${vitalsData.bloodPressure.diastolic} mmHg`);
    }
    if (vitalsData.heartRate) {
      formatted.push(`HR: ${vitalsData.heartRate} bpm`);
    }
    if (vitalsData.temperature && vitalsData.temperature.value) {
      formatted.push(`Temp: ${vitalsData.temperature.value}°${vitalsData.temperature.unit}`);
    }
    if (vitalsData.oxygenSaturation) {
      formatted.push(`O2: ${vitalsData.oxygenSaturation}%`);
    }

    return formatted.join(" | ");
  };

  return (
    <div className="vitals">
      <div className="vitals-header">
        <div className="header-content">
          <h2>Vitals Management</h2>
          <button onClick={openLoggingModal} className="btn-primary log-vitals-btn">
            📝 Log New Vitals
          </button>
        </div>
        {isOffline && <div className="offline-indicator">📱 Offline Mode - Data will sync when connected</div>}
      </div>

      <div className="vitals-scrollable">
        {/* Dashboard Section - Now First */}
        <div className="vitals-dashboard-section">
          <div className="dashboard-tabs">
            <button
              className={`tab ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`tab ${activeTab === "abnormal" ? "active" : ""}`}
              onClick={() => setActiveTab("abnormal")}
            >
              Abnormal Vitals ({dashboardData.abnormalCount})
            </button>
            <button
              className={`tab ${activeTab === "unsynced" ? "active" : ""}`}
              onClick={() => setActiveTab("unsynced")}
            >
              Unsynced ({dashboardData.unsyncedCount})
            </button>
          </div>

          {activeTab === "overview" && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{dashboardData.todayCount}</div>
                  <div className="stat-label">Vitals Today</div>
                </div>
                <div className="stat-card alert-card">
                  <div className="stat-number">{dashboardData.abnormalCount}</div>
                  <div className="stat-label">Abnormal Vitals</div>
                </div>
                <div className="stat-card warning-card">
                  <div className="stat-number">{dashboardData.unsyncedCount}</div>
                  <div className="stat-label">Unsynced to EMR</div>
                </div>
              </div>

              <div className="alert-severity-chart">
                <h3>Alert Severity Distribution</h3>
                <div className="severity-bars">
                  {Object.entries(dashboardData.alertSeverity).map(([severity, count]) => (
                    <div key={severity} className="severity-bar">
                      <div className="severity-label">{severity.charAt(0).toUpperCase() + severity.slice(1)}</div>
                      <div className="bar-container">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${Math.max(count * 20, 5)}%`,
                            backgroundColor: getAlertColor(severity),
                          }}
                        ></div>
                        <span className="bar-count">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="recent-abnormal">
                <h3>Recent Abnormal Vitals</h3>
                {dashboardData.recentAbnormal.length > 0 ? (
                  <div className="vitals-list">
                    {dashboardData.recentAbnormal.map((vital, index) => (
                      <div key={index} className="vital-item">
                        <div className="vital-header">
                          <strong>Patient: {vital.patientId}</strong>
                          <span className="vital-time">{new Date(vital.recordedAt).toLocaleString()}</span>
                        </div>
                        <div className="vital-details">{formatVitals(vital.vitals)}</div>
                        {vital.alerts &&
                          vital.alerts.map((alert, alertIndex) => (
                            <div
                              key={alertIndex}
                              className="vital-alert"
                              style={{ color: getAlertColor(alert.severity) }}
                            >
                              <strong>{alert.severity.toUpperCase()}:</strong> {alert.message}
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No recent abnormal vitals</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "abnormal" && (
            <div className="abnormal-tab">
              <div className="tab-header">
                <h3>Abnormal Vitals Requiring Review</h3>
                <button onClick={fetchAbnormalVitals} className="refresh-btn">
                  🔄 Refresh
                </button>
              </div>

              {abnormalVitals.length > 0 ? (
                <div className="vitals-list">
                  {abnormalVitals.map((vital, index) => (
                    <div key={index} className="vital-item abnormal-item">
                      <div className="vital-header">
                        <div>
                          <strong>Patient: {vital.patientId}</strong>
                          <span className="vital-time">{new Date(vital.recordedAt).toLocaleString()}</span>
                        </div>
                        <button onClick={() => handleMarkReviewed(vital.id)} className="review-btn">
                          Mark Reviewed
                        </button>
                      </div>
                      <div className="vital-details">{formatVitals(vital.vitals)}</div>
                      {vital.notes && (
                        <div className="vital-notes">
                          <strong>Notes:</strong> {vital.notes}
                        </div>
                      )}
                      <div className="alerts">
                        {vital.alerts &&
                          vital.alerts.map((alert, alertIndex) => (
                            <div
                              key={alertIndex}
                              className="alert-badge"
                              style={{ backgroundColor: getAlertColor(alert.severity) }}
                            >
                              {alert.message}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>✅ No abnormal vitals requiring review</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "unsynced" && (
            <div className="unsynced-tab">
              <div className="tab-header">
                <h3>Vitals Pending EMR Sync</h3>
                <div className="tab-actions">
                  <button onClick={fetchUnsyncedVitals} className="refresh-btn">
                    🔄 Refresh
                  </button>
                  {unsyncedVitals.length > 0 && (
                    <button onClick={handleBulkSync} className="bulk-sync-btn" disabled={loading}>
                      {loading ? "Syncing..." : `Sync All (${unsyncedVitals.length})`}
                    </button>
                  )}
                </div>
              </div>

              {unsyncedVitals.length > 0 ? (
                <div className="vitals-list">
                  {unsyncedVitals.map((vital, index) => (
                    <div key={index} className="vital-item unsynced-item">
                      <div className="vital-header">
                        <div>
                          <strong>Patient: {vital.patientId}</strong>
                          <span className="vital-time">{new Date(vital.recordedAt).toLocaleString()}</span>
                        </div>
                        <button onClick={() => handleSyncToEMR(vital.id)} className="sync-btn">
                          Sync to EMR
                        </button>
                      </div>
                      <div className="vital-details">{formatVitals(vital.vitals)}</div>
                      {vital.notes && (
                        <div className="vital-notes">
                          <strong>Notes:</strong> {vital.notes}
                        </div>
                      )}
                      <div className="recorded-by">Recorded by: {vital.recordedBy}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>✅ All vitals are synced to EMR</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Vitals Logging Modal */}
      {showLoggingModal && (
        <div
          className="vitals-modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeLoggingModal}
        >
          <div
            className="vitals-modal"
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
              maxWidth: "800px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
              padding: "20px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Log New Vitals</h3>
              <button onClick={closeLoggingModal} className="modal-close-btn">
                ×
              </button>
            </div>

            <div className="modal-body" style={{ padding: "20px" }}>
              <form onSubmit={handleSubmit} className="vitals-form">
                <div className="form-group">
                  <label>Patient ID *</label>
                  <input
                    type="text"
                    value={patientId}
                    onChange={handlePatientIdChange}
                    placeholder="Enter Patient ID (e.g., PT2024123456)"
                    required
                  />
                  {patientName && <small className="patient-name-display">Patient: {patientName}</small>}
                </div>

                <div className="form-group">
                  <label>Nurse ID</label>
                  <select value={nurseId} onChange={(e) => setNurseId(e.target.value)}>
                    <option value="NURSE001">NURSE001 - Sarah Johnson</option>
                    <option value="NURSE002">NURSE002 - Michael Chen</option>
                    <option value="NURSE003">NURSE003 - Emily Davis</option>
                  </select>
                </div>

                <div
                  className="vitals-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "15px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    className="vital-group"
                    style={{
                      padding: "15px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Blood Pressure</label>
                    <div className="bp-inputs" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <input
                        type="number"
                        placeholder="Systolic"
                        value={vitals.bloodPressure.systolic}
                        onChange={(e) => handleVitalChange("bloodPressure", e.target.value, "systolic")}
                        style={{ width: "80px", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                      />
                      <span>/</span>
                      <input
                        type="number"
                        placeholder="Diastolic"
                        value={vitals.bloodPressure.diastolic}
                        onChange={(e) => handleVitalChange("bloodPressure", e.target.value, "diastolic")}
                        style={{ width: "80px", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                      />
                      <span>mmHg</span>
                    </div>
                  </div>

                  <div
                    className="vital-group"
                    style={{
                      padding: "15px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Heart Rate</label>
                    <div className="input-with-unit" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <input
                        type="number"
                        placeholder="72"
                        value={vitals.heartRate}
                        onChange={(e) => handleVitalChange("heartRate", e.target.value)}
                        style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                      />
                      <span>bpm</span>
                    </div>
                  </div>

                  <div
                    className="vital-group"
                    style={{
                      padding: "15px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Temperature</label>
                    <div className="temp-inputs" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="98.6"
                        value={vitals.temperature.value}
                        onChange={(e) => handleVitalChange("temperature", e.target.value, "value")}
                        style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                      />
                      <select
                        value={vitals.temperature.unit}
                        onChange={(e) => handleVitalChange("temperature", e.target.value, "unit")}
                        style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                      >
                        <option value="F">°F</option>
                        <option value="C">°C</option>
                      </select>
                    </div>
                  </div>

                  <div
                    className="vital-group"
                    style={{
                      padding: "15px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                      Respiratory Rate
                    </label>
                    <div className="input-with-unit" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <input
                        type="number"
                        placeholder="16"
                        value={vitals.respiratoryRate}
                        onChange={(e) => handleVitalChange("respiratoryRate", e.target.value)}
                        style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                      />
                      <span>breaths/min</span>
                    </div>
                  </div>

                  <div
                    className="vital-group"
                    style={{
                      padding: "15px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                      Oxygen Saturation
                    </label>
                    <div className="input-with-unit" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <input
                        type="number"
                        placeholder="98"
                        value={vitals.oxygenSaturation}
                        onChange={(e) => handleVitalChange("oxygenSaturation", e.target.value)}
                        style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                      />
                      <span>%</span>
                    </div>
                  </div>

                  <div
                    className="vital-group"
                    style={{
                      padding: "15px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Weight</label>
                    <div className="weight-inputs" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="150"
                        value={vitals.weight.value}
                        onChange={(e) => handleVitalChange("weight", e.target.value, "value")}
                        style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                      />
                      <select
                        value={vitals.weight.unit}
                        onChange={(e) => handleVitalChange("weight", e.target.value, "unit")}
                        style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                      >
                        <option value="lbs">lbs</option>
                        <option value="kg">kg</option>
                      </select>
                    </div>
                  </div>

                  <div
                    className="vital-group"
                    style={{
                      padding: "15px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Height</label>
                    <div className="height-inputs" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="68"
                        value={vitals.height.value}
                        onChange={(e) => handleVitalChange("height", e.target.value, "value")}
                        style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                      />
                      <select
                        value={vitals.height.unit}
                        onChange={(e) => handleVitalChange("height", e.target.value, "unit")}
                        style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                      >
                        <option value="in">inches</option>
                        <option value="cm">cm</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes about patient condition..."
                    rows="3"
                    maxLength="500"
                  />
                  <small>{notes.length}/500 characters</small>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={closeLoggingModal} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? "Recording..." : "Record Vitals"}
                  </button>
                </div>
              </form>

              {message && (
                <div className={`message ${message.includes("success") ? "success" : "error"}`}>{message}</div>
              )}

              {alerts.length > 0 && (
                <div className="alerts-section">
                  <h3>⚠️ Alerts Detected</h3>
                  {alerts.map((alert, index) => (
                    <div key={index} className="alert" style={{ borderLeftColor: getAlertColor(alert.severity) }}>
                      <strong>{alert.severity.toUpperCase()}:</strong> {alert.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vitals;
