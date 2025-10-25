import React, { useState, useEffect } from "react";
import TriageQueue from "../components/Triage/TriageQueue";
import { usePatient } from "../contexts/PatientContext";
import "./TriageAssessment.css";

const TriageAssessment = () => {
  const { currentPatientId, setCurrentPatientId } = usePatient();
  const [patientId, setPatientId] = useState(currentPatientId || "");
  const [patientName, setPatientName] = useState("");
  const [symptoms, setSymptoms] = useState([{ symptom: "", severity: "mild", duration: "1-6h" }]);
  const [vitals, setVitals] = useState({
    bloodPressure: { systolic: "", diastolic: "" },
    heartRate: "",
    temperature: { value: "", unit: "F" },
    respiratoryRate: "",
    oxygenSaturation: "",
    painLevel: "",
  });
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [assignedNurse, setAssignedNurse] = useState("NURSE001");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [commonSymptoms, setCommonSymptoms] = useState([]);

  useEffect(() => {
    fetchCommonSymptoms();
  }, []);

  useEffect(() => {
    if (currentPatientId) {
      fetchLatestVitals(currentPatientId);
    }
  }, [currentPatientId]);

  useEffect(() => {
    if (patientId && patientId.trim()) {
      setCurrentPatientId(patientId.trim());
      fetchLatestVitals(patientId.trim());
    }
  }, [patientId]);

  useEffect(() => {
    if (currentPatientId) {
      setPatientId(currentPatientId);
    }
  }, [currentPatientId]);

  const fetchCommonSymptoms = async () => {
    try {
      const response = await fetch("/api/triage/symptoms");
      const data = await response.json();
      if (data.success) {
        setCommonSymptoms(data.data);
      }
    } catch (error) {
      console.error("Error fetching symptoms:", error);
    }
  };

  const fetchLatestVitals = async (patientId) => {
    try {
      const response = await fetch(`/api/vitals/latest/${patientId}`);
      const data = await response.json();
      if (data.success && data.data) {
        const latestVitals = data.data;
        setVitals({
          bloodPressure: {
            systolic: latestVitals.vitals.bloodPressure?.systolic || "",
            diastolic: latestVitals.vitals.bloodPressure?.diastolic || "",
          },
          heartRate: latestVitals.vitals.heartRate || "",
          temperature: {
            value: latestVitals.vitals.temperature?.value || "",
            unit: latestVitals.vitals.temperature?.unit || "F",
          },
          respiratoryRate: latestVitals.vitals.respiratoryRate || "",
          oxygenSaturation: latestVitals.vitals.oxygenSaturation || "",
          painLevel: latestVitals.vitals.painLevel || "",
        });
      }
    } catch (error) {
      console.error("Error fetching latest vitals:", error);
    }
  };

  const addSymptom = () => {
    setSymptoms([...symptoms, { symptom: "", severity: "mild", duration: "1-6h" }]);
  };

  const removeSymptom = (index) => {
    if (symptoms.length > 1) {
      setSymptoms(symptoms.filter((_, i) => i !== index));
    }
  };

  const updateSymptom = (index, field, value) => {
    const updated = symptoms.map((symptom, i) => (i === index ? { ...symptom, [field]: value } : symptom));
    setSymptoms(updated);
  };

  const addMedicalHistory = () => {
    setMedicalHistory([...medicalHistory, { condition: "", severity: "mild" }]);
  };

  const removeMedicalHistory = (index) => {
    setMedicalHistory(medicalHistory.filter((_, i) => i !== index));
  };

  const updateMedicalHistory = (index, field, value) => {
    const updated = medicalHistory.map((history, i) => (i === index ? { ...history, [field]: value } : history));
    setMedicalHistory(updated);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!patientId.trim() || !patientName.trim()) {
      setMessage("Patient ID and name are required");
      return;
    }

    const validSymptoms = symptoms.filter((s) => s.symptom.trim());
    if (validSymptoms.length === 0) {
      setMessage("At least one symptom is required");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const triageData = {
        patientId: patientId.trim(),
        patientName: patientName.trim(),
        symptoms: validSymptoms,
        vitals,
        medicalHistory: medicalHistory.filter((h) => h.condition.trim()),
        assignedNurse,
        notes: notes.trim(),
      };

      const response = await fetch("/api/triage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(triageData),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setMessage("Triage assessment completed successfully!");
        // Set current patient in context
        setCurrentPatientId(patientId.trim());
        // Reset form
        resetForm();
      } else {
        setMessage(data.message || "Failed to complete triage assessment");
      }
    } catch (error) {
      console.error("Error submitting triage:", error);
      setMessage("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPatientId("");
    setPatientName("");
    setSymptoms([{ symptom: "", severity: "mild", duration: "1-6h" }]);
    setVitals({
      bloodPressure: { systolic: "", diastolic: "" },
      heartRate: "",
      temperature: { value: "", unit: "F" },
      respiratoryRate: "",
      oxygenSaturation: "",
      painLevel: "",
    });
    setMedicalHistory([]);
    setNotes("");
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

  return (
    <div className="triage-assessment">
      <div className="triage-header">
        <h2>Triage Assessment</h2>
        <p>AI-powered patient prioritization based on symptoms and vitals</p>
      </div>

      <div className="triage-container">
        <div className="triage-form-section">
          <form onSubmit={handleSubmit} className="triage-form">
            {/* Patient Information */}
            <div className="form-section">
              <h3>Patient Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Patient ID *</label>
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    placeholder="Enter Patient ID"
                    required
                  />
                </div>
                <div className="form-group"></div>
              </div>
            </div>

            {/* Symptoms */}
            <div className="form-section">
              <h3>Symptoms</h3>
              {symptoms.map((symptom, index) => (
                <div key={index} className="symptom-row">
                  <div className="form-group">
                    <label>Symptom</label>
                    <input
                      type="text"
                      list="common-symptoms"
                      value={symptom.symptom}
                      onChange={(e) => updateSymptom(index, "symptom", e.target.value)}
                      placeholder="Enter symptom"
                    />
                    <datalist id="common-symptoms">
                      {commonSymptoms.map((s, i) => (
                        <option key={i} value={s} />
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label>Severity</label>
                    <select value={symptom.severity} onChange={(e) => updateSymptom(index, "severity", e.target.value)}>
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <select value={symptom.duration} onChange={(e) => updateSymptom(index, "duration", e.target.value)}>
                      <option value="<1h">Less than 1 hour</option>
                      <option value="1-6h">1-6 hours</option>
                      <option value="6-24h">6-24 hours</option>
                      <option value=">24h">More than 24 hours</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSymptom(index)}
                    className="remove-btn"
                    disabled={symptoms.length === 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" onClick={addSymptom} className="add-btn">
                + Add Symptom
              </button>
            </div>

            {/* Vitals */}
            <div className="form-section">
              <h3>Vital Signs</h3>
              <div className="vitals-grid">
                <div className="form-group">
                  <label>Blood Pressure</label>
                  <div className="bp-inputs">
                    <input
                      type="number"
                      placeholder="Systolic"
                      value={vitals.bloodPressure.systolic}
                      onChange={(e) => handleVitalChange("bloodPressure", e.target.value, "systolic")}
                    />
                    <span>/</span>
                    <input
                      type="number"
                      placeholder="Diastolic"
                      value={vitals.bloodPressure.diastolic}
                      onChange={(e) => handleVitalChange("bloodPressure", e.target.value, "diastolic")}
                    />
                    <span>mmHg</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Heart Rate</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      placeholder="72"
                      value={vitals.heartRate}
                      onChange={(e) => handleVitalChange("heartRate", e.target.value)}
                    />
                    <span>bpm</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Temperature</label>
                  <div className="temp-inputs">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="98.6"
                      value={vitals.temperature.value}
                      onChange={(e) => handleVitalChange("temperature", e.target.value, "value")}
                    />
                    <select
                      value={vitals.temperature.unit}
                      onChange={(e) => handleVitalChange("temperature", e.target.value, "unit")}
                    >
                      <option value="F">°F</option>
                      <option value="C">°C</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Oxygen Saturation</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      placeholder="98"
                      value={vitals.oxygenSaturation}
                      onChange={(e) => handleVitalChange("oxygenSaturation", e.target.value)}
                    />
                    <span>%</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Pain Level (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    placeholder="0"
                    value={vitals.painLevel}
                    onChange={(e) => handleVitalChange("painLevel", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div className="form-section">
              <h3>Medical History</h3>
              {medicalHistory.map((history, index) => (
                <div key={index} className="history-row">
                  <div className="form-group">
                    <label>Condition</label>
                    <input
                      type="text"
                      value={history.condition}
                      onChange={(e) => updateMedicalHistory(index, "condition", e.target.value)}
                      placeholder="Enter medical condition"
                    />
                  </div>
                  <div className="form-group">
                    <label>Severity</label>
                    <select
                      value={history.severity}
                      onChange={(e) => updateMedicalHistory(index, "severity", e.target.value)}
                    >
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                  <button type="button" onClick={() => removeMedicalHistory(index)} className="remove-btn">
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" onClick={addMedicalHistory} className="add-btn">
                + Add Medical History
              </button>
            </div>

            {/* Additional Information */}
            <div className="form-section">
              <h3>Additional Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Assigned Nurse</label>
                  <select value={assignedNurse} onChange={(e) => setAssignedNurse(e.target.value)}>
                    <option value="NURSE001">NURSE001 - Sarah Johnson</option>
                    <option value="NURSE002">NURSE002 - Michael Chen</option>
                    <option value="NURSE003">NURSE003 - Emily Davis</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes or observations..."
                  rows="3"
                  maxLength="500"
                />
                <small>{notes.length}/500 characters</small>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={resetForm} className="btn-secondary">
                Clear Form
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Processing..." : "Complete Triage Assessment"}
              </button>
            </div>
          </form>

          {message && <div className={`message ${message.includes("success") ? "success" : "error"}`}>{message}</div>}
        </div>

        {/* Results Section */}
        {result && (
          <div className="triage-results">
            <h3>Triage Assessment Results</h3>
            <div className="result-card">
              <div className="result-header">
                <div className="patient-info">
                  <h4>{result.patientName}</h4>
                  <p>Patient ID: {result.patientId}</p>
                </div>
                <div className="priority-badge" style={{ backgroundColor: getPriorityColor(result.priority) }}>
                  {result.priority.toUpperCase()}
                </div>
              </div>

              <div className="result-details">
                <div className="result-item">
                  <label>Risk Score:</label>
                  <span className="score">{result.riskScore}/100</span>
                </div>
                <div className="result-item">
                  <label>Triage Level:</label>
                  <span>{getTriageLevelText(result.triageLevel)}</span>
                </div>
                <div className="result-item">
                  <label>Estimated Wait Time:</label>
                  <span>{result.estimatedWaitTime} minutes</span>
                </div>
                <div className="result-item">
                  <label>Status:</label>
                  <span>{result.status}</span>
                </div>
              </div>

              <div className="result-actions">
                <button onClick={() => (window.location.href = "/triage-queue")} className="btn-primary">
                  View Triage Queue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Triage Queue Section */}
      <div className="triage-queue-section">
        <TriageQueue />
      </div>
    </div>
  );
};

export default TriageAssessment;
