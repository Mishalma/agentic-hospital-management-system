import React, { useState, useEffect } from "react";
import "./TriageQueue.css";

const TriageQueue = () => {
  const [triageQueue, setTriageQueue] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTriageQueue();
    fetchDashboardData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTriageQueue();
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchTriageQueue = async () => {
    try {
      const response = await fetch("/api/triage/queue");
      const data = await response.json();
      if (data.success) {
        setTriageQueue(data.data);
      }
    } catch (error) {
      console.error("Error fetching triage queue:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/triage/dashboard");
      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const updateTriageStatus = async (triageId, newStatus) => {
    try {
      const response = await fetch(`/api/triage/${triageId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`Status updated to ${newStatus}`);
        fetchTriageQueue();
        fetchDashboardData();
      } else {
        setMessage(data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setMessage("Failed to update status");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
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

  const getTriageLevelText = (level) => {
    const levels = {
      1: "Level 1 - Immediate",
      2: "Level 2 - Urgent",
      3: "Level 3 - Less Urgent",
      4: "Level 4 - Non-Urgent",
      5: "Level 5 - Routine",
    };
    return levels[level] || "Unknown";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#ffc107";
      case "in-assessment":
        return "#17a2b8";
      case "waiting-doctor":
        return "#fd7e14";
      case "completed":
        return "#28a745";
      default:
        return "#6c757d";
    }
  };

  const filteredQueue =
    selectedPriority === "all" ? triageQueue : triageQueue.filter((t) => t.priority === selectedPriority);

  if (loading) {
    return (
      <div className="triage-queue">
        <div className="loading">Loading triage queue...</div>
      </div>
    );
  }

  return (
    <div className="triage-queue">
      <div className="queue-header">
        <h2>Triage Queue</h2>
        <div className="last-updated">Last updated: {new Date().toLocaleTimeString()}</div>
      </div>

      {/* Dashboard Statistics */}
      {dashboardData && (
        <div className="dashboard-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{dashboardData.stats.total}</div>
              <div className="stat-label">Total Active</div>
            </div>
            <div className="stat-card critical-card">
              <div className="stat-number">{dashboardData.stats.byPriority.critical}</div>
              <div className="stat-label">Critical</div>
            </div>
            <div className="stat-card high-card">
              <div className="stat-number">{dashboardData.stats.byPriority.high}</div>
              <div className="stat-label">High Priority</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{dashboardData.stats.averageRiskScore}</div>
              <div className="stat-label">Avg Risk Score</div>
            </div>
          </div>

          <div className="priority-filter">
            <label>Filter by Priority:</label>
            <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      )}

      {message && <div className="message success">{message}</div>}

      {/* Triage Queue List */}
      <div className="queue-container">
        {filteredQueue.length > 0 ? (
          <div className="queue-list">
            {filteredQueue.map((triage, index) => (
              <div key={triage.id} className="triage-card">
                <div className="card-header">
                  <div className="patient-info">
                    <h3>{triage.patientName}</h3>
                    <p>ID: {triage.patientId}</p>
                  </div>
                  <div className="priority-info">
                    <div className="priority-badge" style={{ backgroundColor: getPriorityColor(triage.priority) }}>
                      {triage.priority.toUpperCase()}
                    </div>
                    <div className="queue-position">#{index + 1}</div>
                  </div>
                </div>

                <div className="card-content">
                  <div className="triage-details">
                    <div className="detail-item">
                      <label>Risk Score:</label>
                      <span className="risk-score">{triage.riskScore}/100</span>
                    </div>
                    <div className="detail-item">
                      <label>Triage Level:</label>
                      <span>{getTriageLevelText(triage.triageLevel)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Wait Time:</label>
                      <span>{triage.estimatedWaitTime} minutes</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(triage.status) }}>
                        {triage.status.replace("-", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="symptoms-section">
                    <h4>Symptoms:</h4>
                    <div className="symptoms-list">
                      {triage.symptoms.map((symptom, idx) => (
                        <div key={idx} className="symptom-item">
                          <span className="symptom-name">{symptom.symptom}</span>
                          <span className={`severity-badge ${symptom.severity}`}>{symptom.severity}</span>
                          <span className="duration">({symptom.duration})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {triage.vitals &&
                    Object.keys(triage.vitals).some(
                      (key) =>
                        triage.vitals[key] &&
                        (typeof triage.vitals[key] === "number" ||
                          (typeof triage.vitals[key] === "object" && Object.values(triage.vitals[key]).some((v) => v)))
                    ) && (
                      <div className="vitals-section">
                        <h4>Vitals:</h4>
                        <div className="vitals-grid">
                          {triage.vitals.bloodPressure &&
                            (triage.vitals.bloodPressure.systolic || triage.vitals.bloodPressure.diastolic) && (
                              <div className="vital-item">
                                <label>BP:</label>
                                <span>
                                  {triage.vitals.bloodPressure.systolic}/{triage.vitals.bloodPressure.diastolic} mmHg
                                </span>
                              </div>
                            )}
                          {triage.vitals.heartRate && (
                            <div className="vital-item">
                              <label>HR:</label>
                              <span>{triage.vitals.heartRate} bpm</span>
                            </div>
                          )}
                          {triage.vitals.temperature && triage.vitals.temperature.value && (
                            <div className="vital-item">
                              <label>Temp:</label>
                              <span>
                                {triage.vitals.temperature.value}°{triage.vitals.temperature.unit}
                              </span>
                            </div>
                          )}
                          {triage.vitals.oxygenSaturation && (
                            <div className="vital-item">
                              <label>O2:</label>
                              <span>{triage.vitals.oxygenSaturation}%</span>
                            </div>
                          )}
                          {triage.vitals.painLevel && (
                            <div className="vital-item">
                              <label>Pain:</label>
                              <span>{triage.vitals.painLevel}/10</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {triage.notes && (
                    <div className="notes-section">
                      <h4>Notes:</h4>
                      <p>{triage.notes}</p>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  <div className="assigned-nurse">Assigned: {triage.assignedNurse}</div>
                  <div className="status-actions">
                    {triage.status === "pending" && (
                      <button
                        onClick={() => updateTriageStatus(triage.id, "in-assessment")}
                        className="btn-action start-assessment"
                      >
                        Start Assessment
                      </button>
                    )}
                    {triage.status === "in-assessment" && (
                      <button
                        onClick={() => updateTriageStatus(triage.id, "waiting-doctor")}
                        className="btn-action waiting-doctor"
                      >
                        Ready for Doctor
                      </button>
                    )}
                    {triage.status === "waiting-doctor" && (
                      <button
                        onClick={() => updateTriageStatus(triage.id, "completed")}
                        className="btn-action complete"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>

                <div className="card-footer">
                  <span>Assessed: {new Date(triage.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-queue">
            <p>No patients in triage queue for selected priority level.</p>
            <button onClick={() => (window.location.href = "/triage-assessment")} className="btn-primary">
              New Triage Assessment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TriageQueue;
