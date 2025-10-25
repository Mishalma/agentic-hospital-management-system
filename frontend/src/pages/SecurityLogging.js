import React, { useState, useEffect } from "react";
import axios from "axios";
import "./SecurityLogging.css";

const SecurityLogging = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [formData, setFormData] = useState({
    entryType: "visitor_checkin",
    timestamp: "",
    location: "",
    personDetails: {
      type: "visitor",
      name: "",
      contactNumber: "",
      purpose: "",
      visitingPatient: "",
      relationship: "",
    },
    accessControl: {
      badgeIssued: false,
      authorizedBy: "",
      accessLevel: "Visitor",
    },
    securityCheck: {
      idVerified: false,
      itemsChecked: false,
      notes: "",
    },
  });

  useEffect(() => {
    fetchLogs();
  }, [activeTab]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let url = "/api/security-logs";
      if (activeTab !== "all") {
        url += `?entryType=${activeTab}`;
      }
      const response = await axios.get(url);
      setLogs(response.data.logs);
    } catch (err) {
      setError("Failed to fetch security logs");
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const processedData = {
        ...formData,
        timestamp: formData.timestamp ? new Date(formData.timestamp) : new Date(),
      };

      if (selectedLog) {
        await axios.put(`/api/security-logs/${selectedLog.logId}`, processedData);
      } else {
        await axios.post("/api/security-logs", processedData);
      }

      setShowForm(false);
      setSelectedLog(null);
      resetForm();
      fetchLogs();
    } catch (err) {
      setError("Failed to save security log");
      console.error("Error saving log:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      entryType: "visitor_checkin",
      timestamp: "",
      location: "",
      personDetails: {
        type: "visitor",
        name: "",
        contactNumber: "",
        purpose: "",
        visitingPatient: "",
        relationship: "",
      },
      accessControl: {
        badgeIssued: false,
        authorizedBy: "",
        accessLevel: "Visitor",
      },
      securityCheck: {
        idVerified: false,
        itemsChecked: false,
        notes: "",
      },
    });
  };

  const handleEdit = (log) => {
    setSelectedLog(log);
    setFormData({
      ...log,
      timestamp: log.timestamp ? new Date(log.timestamp).toISOString().slice(0, 16) : "",
    });
    setShowForm(true);
  };

  const handleCheckout = async (logId) => {
    try {
      const checkoutNotes = prompt("Enter checkout notes:");
      if (checkoutNotes !== null) {
        await axios.post(`/api/security-logs/${logId}/checkout`, {
          checkoutNotes,
          badgeReturned: true,
        });
        fetchLogs();
      }
    } catch (err) {
      setError("Failed to process checkout");
      console.error("Error processing checkout:", err);
    }
  };

  const getEntryTypeColor = (type) => {
    switch (type) {
      case "visitor_checkin":
        return "#4CAF50";
      case "visitor_checkout":
        return "#2196F3";
      case "staff_entry":
        return "#FF9800";
      case "incident_report":
        return "#F44336";
      case "emergency_access":
        return "#9C27B0";
      default:
        return "#9E9E9E";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#4CAF50";
      case "completed":
        return "#2196F3";
      case "resolved":
        return "#FF9800";
      case "pending":
        return "#FF9800";
      default:
        return "#9E9E9E";
    }
  };

  if (loading) return <div className="loading">Loading security logs...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="security-logging">
      <div className="header">
        <h2>Digital Security Logging System</h2>
        <button
          className="add-btn"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Add New Log Entry
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="tabs">
        <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>
          All Logs
        </button>
        <button
          className={activeTab === "visitor_checkin" ? "active" : ""}
          onClick={() => setActiveTab("visitor_checkin")}
        >
          Active Visitors
        </button>
        <button className={activeTab === "staff_entry" ? "active" : ""} onClick={() => setActiveTab("staff_entry")}>
          Staff Entries
        </button>
        <button
          className={activeTab === "incident_report" ? "active" : ""}
          onClick={() => setActiveTab("incident_report")}
        >
          Incidents
        </button>
      </div>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedLog ? "Edit Log Entry" : "Add New Log Entry"}</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h4>Entry Details</h4>
                <div className="form-row">
                  <select
                    value={formData.entryType}
                    onChange={(e) => handleInputChange("", "entryType", e.target.value)}
                    required
                  >
                    <option value="visitor_checkin">Visitor Check-in</option>
                    <option value="staff_entry">Staff Entry</option>
                    <option value="incident_report">Incident Report</option>
                    <option value="emergency_access">Emergency Access</option>
                  </select>
                  <input
                    type="datetime-local"
                    value={formData.timestamp}
                    onChange={(e) => handleInputChange("", "timestamp", e.target.value)}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("", "location", e.target.value)}
                  required
                />
              </div>

              <div className="form-section">
                <h4>Person Details</h4>
                <div className="form-row">
                  <select
                    value={formData.personDetails.type}
                    onChange={(e) => handleInputChange("personDetails", "type", e.target.value)}
                  >
                    <option value="visitor">Visitor</option>
                    <option value="staff">Staff</option>
                    <option value="emergency">Emergency</option>
                    <option value="unknown">Unknown</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.personDetails.name}
                    onChange={(e) => handleInputChange("personDetails", "name", e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Contact Number"
                    value={formData.personDetails.contactNumber}
                    onChange={(e) => handleInputChange("personDetails", "contactNumber", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Purpose"
                    value={formData.personDetails.purpose}
                    onChange={(e) => handleInputChange("personDetails", "purpose", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Security Check</h4>
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.securityCheck.idVerified}
                      onChange={(e) => handleInputChange("securityCheck", "idVerified", e.target.checked)}
                    />
                    ID Verified
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.securityCheck.itemsChecked}
                      onChange={(e) => handleInputChange("securityCheck", "itemsChecked", e.target.checked)}
                    />
                    Items Checked
                  </label>
                </div>
                <textarea
                  placeholder="Security notes"
                  value={formData.securityCheck.notes}
                  onChange={(e) => handleInputChange("securityCheck", "notes", e.target.value)}
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {selectedLog ? "Update Entry" : "Create Entry"}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="logs-table">
        <table>
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Type</th>
              <th>Name</th>
              <th>Location</th>
              <th>Timestamp</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.logId}>
                <td>{log.logId}</td>
                <td>
                  <span className="entry-type" style={{ backgroundColor: getEntryTypeColor(log.entryType) }}>
                    {log.entryType.replace("_", " ").toUpperCase()}
                  </span>
                </td>
                <td>{log.personDetails?.name || "N/A"}</td>
                <td>{log.location}</td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>
                  <span className="status" style={{ backgroundColor: getStatusColor(log.status) }}>
                    {log.status}
                  </span>
                </td>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(log)}>
                    Edit
                  </button>
                  {log.entryType === "visitor_checkin" && log.status === "active" && (
                    <button className="checkout-btn" onClick={() => handleCheckout(log.logId)}>
                      Checkout
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SecurityLogging;
