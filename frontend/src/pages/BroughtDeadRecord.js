import React, { useState, useEffect } from "react";
import axios from "axios";
import "./BroughtDeadRecord.css";

const BroughtDeadRecord = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    patientInfo: {
      name: "",
      age: "",
      gender: "",
      phone: "",
      address: "",
      identification: "",
    },
    arrivalDetails: {
      arrivalDate: "",
      arrivalTime: "",
      arrivedFrom: "",
      broughtBy: "",
      witnessPresent: false,
      witnessInfo: {
        name: "",
        designation: "",
        contact: "",
      },
    },
    physicalExamination: {
      bodyCondition: "",
      estimatedTimeOfDeath: "",
      externalInjuries: "",
      clothing: "",
      personalBelongings: "",
    },
    causeOfDeath: {
      primaryCause: "",
      secondaryCauses: "",
      mannerOfDeath: "Natural",
      causeCode: "",
      confidence: "",
      evidence: "",
    },
    policeDetails: {
      firNumber: "",
      policeStation: "",
      investigatingOfficer: "",
      contactNumber: "",
      notificationSent: false,
    },
    medicalExamination: {
      examinedBy: "",
      examinationDate: "",
      findings: "",
      autopsyRequired: false,
      autopsyScheduled: "",
    },
    status: "Under Investigation",
    priority: "Medium",
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/brought-dead-records");
      setRecords(response.data.records);
    } catch (err) {
      setError("Failed to fetch records");
      console.error("Error fetching records:", err);
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
        arrivalDetails: {
          ...formData.arrivalDetails,
          arrivalDate: new Date(formData.arrivalDetails.arrivalDate),
          notificationTime: formData.policeDetails.notificationSent ? new Date() : null,
        },
        medicalExamination: {
          ...formData.medicalExamination,
          examinationDate: formData.medicalExamination.examinationDate
            ? new Date(formData.medicalExamination.examinationDate)
            : null,
          autopsyScheduled: formData.medicalExamination.autopsyScheduled
            ? new Date(formData.medicalExamination.autopsyScheduled)
            : null,
        },
      };

      if (selectedRecord) {
        await axios.put(`/api/brought-dead-records/${selectedRecord.recordId}`, processedData);
      } else {
        await axios.post("/api/brought-dead-records", processedData);
      }

      setShowForm(false);
      setSelectedRecord(null);
      resetForm();
      fetchRecords();
    } catch (err) {
      setError("Failed to save record");
      console.error("Error saving record:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      patientInfo: {
        name: "",
        age: "",
        gender: "",
        phone: "",
        address: "",
        identification: "",
      },
      arrivalDetails: {
        arrivalDate: "",
        arrivalTime: "",
        arrivedFrom: "",
        broughtBy: "",
        witnessPresent: false,
        witnessInfo: {
          name: "",
          designation: "",
          contact: "",
        },
      },
      physicalExamination: {
        bodyCondition: "",
        estimatedTimeOfDeath: "",
        externalInjuries: "",
        clothing: "",
        personalBelongings: "",
      },
      causeOfDeath: {
        primaryCause: "",
        secondaryCauses: "",
        mannerOfDeath: "Natural",
        causeCode: "",
        confidence: "",
        evidence: "",
      },
      policeDetails: {
        firNumber: "",
        policeStation: "",
        investigatingOfficer: "",
        contactNumber: "",
        notificationSent: false,
      },
      medicalExamination: {
        examinedBy: "",
        examinationDate: "",
        findings: "",
        autopsyRequired: false,
        autopsyScheduled: "",
      },
      status: "Under Investigation",
      priority: "Medium",
    });
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      ...record,
      arrivalDetails: {
        ...record.arrivalDetails,
        arrivalDate: record.arrivalDetails.arrivalDate
          ? new Date(record.arrivalDetails.arrivalDate).toISOString().split("T")[0]
          : "",
      },
      medicalExamination: {
        ...record.medicalExamination,
        examinationDate: record.medicalExamination.examinationDate
          ? new Date(record.medicalExamination.examinationDate).toISOString().split("T")[0]
          : "",
        autopsyScheduled: record.medicalExamination.autopsyScheduled
          ? new Date(record.medicalExamination.autopsyScheduled).toISOString().split("T")[0]
          : "",
      },
    });
    setShowForm(true);
  };

  const handleDelete = async (recordId) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await axios.delete(`/api/brought-dead-records/${recordId}`);
        fetchRecords();
      } catch (err) {
        setError("Failed to delete record");
        console.error("Error deleting record:", err);
      }
    }
  };

  if (loading) return <div className="loading">Loading records...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="brought-dead-record">
      <div className="header">
        <h2>Brought Dead Records</h2>
        <button
          className="add-btn"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Add New Record
        </button>
      </div>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedRecord ? "Edit Record" : "Add New Record"}</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Patient Information */}
              <div className="form-section">
                <h4>Patient Information</h4>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.patientInfo.name}
                    onChange={(e) => handleInputChange("patientInfo", "name", e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    value={formData.patientInfo.age}
                    onChange={(e) => handleInputChange("patientInfo", "age", e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <select
                    value={formData.patientInfo.gender}
                    onChange={(e) => handleInputChange("patientInfo", "gender", e.target.value)}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Phone"
                    value={formData.patientInfo.phone}
                    onChange={(e) => handleInputChange("patientInfo", "phone", e.target.value)}
                  />
                </div>
                <textarea
                  placeholder="Address"
                  value={formData.patientInfo.address}
                  onChange={(e) => handleInputChange("patientInfo", "address", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Identification"
                  value={formData.patientInfo.identification}
                  onChange={(e) => handleInputChange("patientInfo", "identification", e.target.value)}
                />
              </div>

              {/* Arrival Details */}
              <div className="form-section">
                <h4>Arrival Details</h4>
                <div className="form-row">
                  <input
                    type="date"
                    value={formData.arrivalDetails.arrivalDate}
                    onChange={(e) => handleInputChange("arrivalDetails", "arrivalDate", e.target.value)}
                    required
                  />
                  <input
                    type="time"
                    value={formData.arrivalDetails.arrivalTime}
                    onChange={(e) => handleInputChange("arrivalDetails", "arrivalTime", e.target.value)}
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder="Arrived From"
                  value={formData.arrivalDetails.arrivedFrom}
                  onChange={(e) => handleInputChange("arrivalDetails", "arrivedFrom", e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Brought By"
                  value={formData.arrivalDetails.broughtBy}
                  onChange={(e) => handleInputChange("arrivalDetails", "broughtBy", e.target.value)}
                  required
                />
              </div>

              {/* Cause of Death */}
              <div className="form-section">
                <h4>Cause of Death</h4>
                <input
                  type="text"
                  placeholder="Primary Cause"
                  value={formData.causeOfDeath.primaryCause}
                  onChange={(e) => handleInputChange("causeOfDeath", "primaryCause", e.target.value)}
                  required
                />
                <select
                  value={formData.causeOfDeath.mannerOfDeath}
                  onChange={(e) => handleInputChange("causeOfDeath", "mannerOfDeath", e.target.value)}
                  required
                >
                  <option value="Natural">Natural</option>
                  <option value="Accident">Accident</option>
                  <option value="Suicide">Suicide</option>
                  <option value="Homicide">Homicide</option>
                  <option value="Undetermined">Undetermined</option>
                </select>
                <input
                  type="text"
                  placeholder="Cause Code (ICD-10)"
                  value={formData.causeOfDeath.causeCode}
                  onChange={(e) => handleInputChange("causeOfDeath", "causeCode", e.target.value)}
                />
              </div>

              {/* Status and Priority */}
              <div className="form-section">
                <div className="form-row">
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange("", "status", e.target.value)}
                    required
                  >
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Closed">Closed</option>
                    <option value="Pending">Pending</option>
                  </select>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange("", "priority", e.target.value)}
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {selectedRecord ? "Update Record" : "Create Record"}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="records-table">
        <table>
          <thead>
            <tr>
              <th>Record ID</th>
              <th>Patient Name</th>
              <th>Arrival Date</th>
              <th>Cause of Death</th>
              <th>Manner</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.recordId}>
                <td>{record.recordId}</td>
                <td>{record.patientInfo.name || "Unknown"}</td>
                <td>{new Date(record.arrivalDetails.arrivalDate).toLocaleDateString()}</td>
                <td>{record.causeOfDeath.primaryCause}</td>
                <td>{record.causeOfDeath.mannerOfDeath}</td>
                <td>
                  <span className={`status ${record.status.toLowerCase().replace(" ", "-")}`}>{record.status}</span>
                </td>
                <td>
                  <span className={`priority ${record.priority.toLowerCase()}`}>{record.priority}</span>
                </td>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(record)}>
                    Edit
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(record.recordId)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BroughtDeadRecord;
