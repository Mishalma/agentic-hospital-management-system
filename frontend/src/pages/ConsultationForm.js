import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { usePatient } from "../contexts/PatientContext";
import { useParams, useNavigate } from "react-router-dom";
import DoctorChatbot from "../components/AIAssistant/DoctorChatbot";
import "./ConsultationForm.css";

const ConsultationForm = () => {
  const { user } = useAuth();
  const { currentPatientId, setCurrentPatientId } = usePatient();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    patientId: currentPatientId || "",
    chiefComplaint: "",
    historyOfPresentIllness: "",
    pastMedicalHistory: "",
    medications: [],
    allergies: [],
    vitals: {
      bloodPressure: { systolic: "", diastolic: "" },
      heartRate: "",
      temperature: "",
      respiratoryRate: "",
      oxygenSaturation: "",
      weight: "",
      height: "",
    },
    symptoms: [],
    assessment: {
      primaryDiagnosis: "",
      differentialDiagnosis: [],
      clinicalNotes: "",
    },
    investigations: [],
    consultationType: "initial",
  });

  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [patientHistory, setPatientHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchConsultation();
    }
  }, [id, isEditing]);

  const fetchConsultation = async () => {
    try {
      const response = await axios.get(`/api/consultations/${id}`);
      setFormData(response.data.data);
      if (response.data.data.aiSuggestions?.response) {
        setAiSuggestions(response.data.data.aiSuggestions.response);
      }
    } catch (error) {
      console.error("Error fetching consultation:", error);
    }
  };

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

    // Auto-load patient history and vitals when patientId changes
    if (field === "patientId" && value.trim()) {
      setCurrentPatientId(value.trim());
      fetchPatientHistory(value.trim());
      fetchLatestVitals(value.trim());
    }
  };

  const fetchPatientHistory = async (patientId) => {
    if (!patientId) return;

    setLoadingHistory(true);
    try {
      const response = await axios.get(`/api/patients/${patientId}/history`);
      if (response.data.success) {
        setPatientHistory(response.data.data);

        // Auto-populate form with patient data
        if (response.data.data.patient) {
          setFormData((prev) => ({
            ...prev,
            // Pre-fill allergies if available
            allergies: response.data.data.patient.allergies || prev.allergies,
            // Pre-fill medications if available
            medications:
              response.data.data.currentMedications?.map((med) => ({
                name: med.genericName || med.name,
                dosage: med.dosage || "",
                frequency: med.frequency || "",
                status: "active",
              })) || prev.medications,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching patient history:", error);
      // Don't show error for missing patients, just clear history
      if (error.response?.status === 404) {
        setPatientHistory(null);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchLatestVitals = async (patientId) => {
    try {
      const response = await axios.get(`/api/vitals/latest/${patientId}`);
      if (response.data.success && response.data.data) {
        const latestVitals = response.data.data;
        setFormData((prev) => ({
          ...prev,
          vitals: {
            bloodPressure: {
              systolic: latestVitals.vitals.bloodPressure?.systolic || "",
              diastolic: latestVitals.vitals.bloodPressure?.diastolic || "",
            },
            heartRate: latestVitals.vitals.heartRate || "",
            temperature: latestVitals.vitals.temperature?.value || "",
            respiratoryRate: latestVitals.vitals.respiratoryRate || "",
            oxygenSaturation: latestVitals.vitals.oxygenSaturation || "",
            weight: prev.vitals.weight, // Keep existing weight since it's not in vitals
            height: prev.vitals.height, // Keep existing height since it's not in vitals
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching latest vitals:", error);
    }
  };

  const handleVitalsChange = (field, value) => {
    if (field === "bloodPressure") {
      const [type, val] = value.split(":");
      setFormData((prev) => ({
        ...prev,
        vitals: {
          ...prev.vitals,
          bloodPressure: {
            ...prev.vitals.bloodPressure,
            [type]: val,
          },
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        vitals: {
          ...prev.vitals,
          [field]: value,
        },
      }));
    }
  };

  const addSymptom = () => {
    setFormData((prev) => ({
      ...prev,
      symptoms: [
        ...prev.symptoms,
        {
          symptom: "",
          severity: 5,
          duration: "",
          onset: "",
          character: "",
        },
      ],
    }));
  };

  const updateSymptom = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.map((symptom, i) => (i === index ? { ...symptom, [field]: value } : symptom)),
    }));
  };

  const removeSymptom = (index) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index),
    }));
  };

  const addMedication = () => {
    setFormData((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        {
          name: "",
          dosage: "",
          frequency: "",
          status: "active",
        },
      ],
    }));
  };

  const updateMedication = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.map((med, i) => (i === index ? { ...med, [field]: value } : med)),
    }));
  };

  const removeMedication = (index) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const addAllergy = () => {
    setFormData((prev) => ({
      ...prev,
      allergies: [
        ...prev.allergies,
        {
          allergen: "",
          reaction: "",
          severity: "mild",
        },
      ],
    }));
  };

  const updateAllergy = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.map((allergy, i) => (i === index ? { ...allergy, [field]: value } : allergy)),
    }));
  };

  const removeAllergy = (index) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index),
    }));
  };

  const getAISuggestions = async () => {
    if (!formData.chiefComplaint) {
      alert("Please enter chief complaint to get AI suggestions.");
      return;
    }

    setLoadingAI(true);
    try {
      // Create a temporary consultation if we don't have an ID
      let consultationId = id;
      if (!consultationId) {
        const tempConsultation = {
          ...formData,
          doctorId: user.id,
          consultationDate: new Date(),
        };
        const tempResponse = await axios.post("/api/consultations", tempConsultation);
        consultationId = tempResponse.data.data.id;
      }

      const requestData = {
        symptoms:
          formData.symptoms.length > 0 ? formData.symptoms : [{ symptom: formData.chiefComplaint, severity: 5 }],
        vitals: formData.vitals,
        patientHistory: formData.pastMedicalHistory,
        chiefComplaint: formData.chiefComplaint,
        age: formData.patientAge || "Adult",
        gender: formData.patientGender || "Not specified",
      };

      const response = await axios.post(`/api/consultations/${consultationId}/ai-suggestions`, requestData);

      if (response.data.success) {
        setAiSuggestions(response.data.data);
      } else {
        // Provide fallback suggestions
        setAiSuggestions(getFallbackSuggestions(formData.chiefComplaint));
      }
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      // Provide fallback suggestions instead of just showing error
      setAiSuggestions(getFallbackSuggestions(formData.chiefComplaint));
    } finally {
      setLoadingAI(false);
    }
  };

  const getFallbackSuggestions = (chiefComplaint) => {
    const complaint = chiefComplaint.toLowerCase();

    if (complaint.includes("chest pain") || complaint.includes("chest")) {
      return {
        differentialDiagnosis: [
          { diagnosis: "Angina pectoris", likelihood: "medium", reasoning: "Chest pain with possible cardiac origin" },
          { diagnosis: "Musculoskeletal pain", likelihood: "medium", reasoning: "Non-cardiac chest pain" },
          { diagnosis: "GERD", likelihood: "low", reasoning: "Gastroesophageal reflux" },
        ],
        investigations: [
          { test: "ECG", priority: "urgent", reasoning: "Rule out cardiac causes" },
          { test: "Chest X-ray", priority: "routine", reasoning: "Evaluate chest structures" },
        ],
        treatment: {
          immediate: "Monitor vital signs, provide reassurance",
          medications: "Consider nitroglycerin if cardiac suspected",
          nonPharmacological: "Rest, avoid exertion",
        },
        redFlags: ["Severe chest pain", "Shortness of breath", "Syncope"],
        followUp: {
          timeframe: "24-48 hours or sooner if symptoms worsen",
          instructions: "Return immediately if chest pain worsens",
        },
        confidence: 60,
      };
    } else if (complaint.includes("fever") || complaint.includes("temperature")) {
      return {
        differentialDiagnosis: [
          { diagnosis: "Viral infection", likelihood: "high", reasoning: "Most common cause of fever" },
          { diagnosis: "Bacterial infection", likelihood: "medium", reasoning: "Requires antibiotic treatment" },
        ],
        investigations: [
          { test: "Complete Blood Count", priority: "routine", reasoning: "Assess infection markers" },
          { test: "Blood cultures", priority: "urgent", reasoning: "If high fever or sepsis suspected" },
        ],
        treatment: {
          immediate: "Symptomatic treatment, hydration",
          medications: "Acetaminophen or ibuprofen for fever",
          nonPharmacological: "Rest, increased fluid intake",
        },
        redFlags: ["High fever >101.5°F", "Severe headache", "Difficulty breathing"],
        followUp: {
          timeframe: "2-3 days if no improvement",
          instructions: "Monitor temperature, return if worsening",
        },
        confidence: 70,
      };
    } else {
      return {
        differentialDiagnosis: [
          { diagnosis: "Clinical evaluation needed", likelihood: "unknown", reasoning: "Requires detailed assessment" },
        ],
        investigations: [
          { test: "Complete history and physical examination", priority: "routine", reasoning: "Standard evaluation" },
        ],
        treatment: {
          immediate: "Symptomatic care as appropriate",
          medications: "Based on clinical findings",
          nonPharmacological: "Supportive care",
        },
        redFlags: ["Worsening symptoms", "New concerning symptoms"],
        followUp: {
          timeframe: "As clinically indicated",
          instructions: "Follow up if symptoms persist or worsen",
        },
        confidence: 40,
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const consultationData = {
        ...formData,
        doctorId: user.id,
        consultationDate: new Date(),
      };

      let response;
      if (isEditing) {
        // For editing, we need to use the existing consultation ID
        response = await axios.put(`/api/consultations/${id}`, consultationData);
      } else {
        // For new consultations, create without ID
        response = await axios.post("/api/consultations", consultationData);
      }

      if (response.data.success) {
        alert(`Consultation ${isEditing ? "updated" : "created"} successfully!`);
        navigate("/consultations");
      }
    } catch (error) {
      console.error("Error saving consultation:", error);
      console.error("Error details:", error.response?.data);
      alert(`Error saving consultation: ${error.response?.data?.message || "Please try again."}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="consultation-form">
      <div className="form-header">
        <h1>{isEditing ? "Edit Consultation" : "New Consultation"}</h1>
        <div className="form-actions">
          <button type="button" className="btn-ai" onClick={getAISuggestions} disabled={loadingAI}>
            {loadingAI ? "🤖 Getting AI Suggestions..." : "🤖 Get AI Suggestions"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="consultation-form-content">
        <div className="form-grid">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>

            <div className="form-group">
              <label>Patient ID *</label>
              <div className="patient-id-input">
                <input
                  type="text"
                  value={formData.patientId}
                  onChange={(e) => handleInputChange("patientId", e.target.value)}
                  required
                  placeholder="Enter Patient ID"
                />
                {formData.patientId && (
                  <button
                    type="button"
                    className="btn-medical-history"
                    onClick={() => window.open(`/medical-history/${formData.patientId}`, "_blank")}
                    title="View/Edit Medical History"
                  >
                    🩺 Medical History
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Chief Complaint *</label>
              <textarea
                value={formData.chiefComplaint}
                onChange={(e) => handleInputChange("chiefComplaint", e.target.value)}
                required
                placeholder="Patient's main concern or reason for visit"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Consultation Type</label>
              <select
                value={formData.consultationType}
                onChange={(e) => handleInputChange("consultationType", e.target.value)}
              >
                <option value="initial">Initial</option>
                <option value="follow-up">Follow-up</option>
                <option value="emergency">Emergency</option>
                <option value="telemedicine">Telemedicine</option>
              </select>
            </div>
          </div>

          {/* History */}
          <div className="form-section">
            <h3>History</h3>

            <div className="form-group">
              <label>History of Present Illness</label>
              <textarea
                value={formData.historyOfPresentIllness}
                onChange={(e) => handleInputChange("historyOfPresentIllness", e.target.value)}
                placeholder="Detailed description of current illness"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Past Medical History</label>
              <textarea
                value={formData.pastMedicalHistory}
                onChange={(e) => handleInputChange("pastMedicalHistory", e.target.value)}
                placeholder="Previous medical conditions, surgeries, etc."
                rows="3"
              />
            </div>
          </div>

          {/* Vital Signs */}
          <div className="form-section">
            <h3>Vital Signs</h3>

            <div className="vitals-grid">
              <div className="form-group">
                <label>Blood Pressure</label>
                <div className="bp-inputs">
                  <input
                    type="number"
                    placeholder="Systolic"
                    value={formData.vitals.bloodPressure.systolic}
                    onChange={(e) => handleVitalsChange("bloodPressure", `systolic:${e.target.value}`)}
                  />
                  <span>/</span>
                  <input
                    type="number"
                    placeholder="Diastolic"
                    value={formData.vitals.bloodPressure.diastolic}
                    onChange={(e) => handleVitalsChange("bloodPressure", `diastolic:${e.target.value}`)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={formData.vitals.heartRate}
                  onChange={(e) => handleVitalsChange("heartRate", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Temperature (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.vitals.temperature}
                  onChange={(e) => handleVitalsChange("temperature", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Respiratory Rate</label>
                <input
                  type="number"
                  value={formData.vitals.respiratoryRate}
                  onChange={(e) => handleVitalsChange("respiratoryRate", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>O2 Saturation (%)</label>
                <input
                  type="number"
                  value={formData.vitals.oxygenSaturation}
                  onChange={(e) => handleVitalsChange("oxygenSaturation", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Weight (lbs)</label>
                <input
                  type="number"
                  value={formData.vitals.weight}
                  onChange={(e) => handleVitalsChange("weight", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Symptoms Section */}
        <div className="form-section full-width">
          <div className="section-header">
            <h3>Symptoms</h3>
            <button type="button" className="btn-add" onClick={addSymptom}>
              + Add Symptom
            </button>
          </div>

          {formData.symptoms.map((symptom, index) => (
            <div key={index} className="symptom-item">
              <div className="symptom-grid">
                <input
                  type="text"
                  placeholder="Symptom"
                  value={symptom.symptom}
                  onChange={(e) => updateSymptom(index, "symptom", e.target.value)}
                />

                <div className="severity-input">
                  <label>Severity: {symptom.severity}/10</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={symptom.severity}
                    onChange={(e) => updateSymptom(index, "severity", parseInt(e.target.value))}
                  />
                </div>

                <input
                  type="text"
                  placeholder="Duration"
                  value={symptom.duration}
                  onChange={(e) => updateSymptom(index, "duration", e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Character"
                  value={symptom.character}
                  onChange={(e) => updateSymptom(index, "character", e.target.value)}
                />

                <button type="button" className="btn-remove" onClick={() => removeSymptom(index)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Patient History Sidebar */}
        {patientHistory && (
          <div className="patient-history-sidebar">
            <h3>📋 Patient History</h3>

            {patientHistory.patient && (
              <div className="patient-info">
                <h4>Patient Info</h4>
                <p>
                  <strong>Name:</strong> {patientHistory.patient.name || "Not available"}
                </p>
                <p>
                  <strong>Age:</strong>{" "}
                  {patientHistory.patient.dob
                    ? new Date().getFullYear() - new Date(patientHistory.patient.dob).getFullYear()
                    : "N/A"}
                </p>
              </div>
            )}

            {patientHistory.medicalHistory && patientHistory.medicalHistory.length > 0 && (
              <div className="medical-history">
                <h4>Medical History</h4>
                {patientHistory.medicalHistory.map((history, index) => (
                  <div key={index} className="history-item">
                    <small>
                      <strong>{history.condition}</strong> ({history.status || "active"})
                    </small>
                    <p>
                      {history.diagnosedDate
                        ? new Date(history.diagnosedDate).toLocaleDateString()
                        : "Date not available"}
                    </p>
                    {history.notes && (
                      <p>
                        <em>{history.notes}</em>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {patientHistory.recentVitals && patientHistory.recentVitals.length > 0 && (
              <div className="recent-vitals">
                <h4>Recent Vitals</h4>
                {patientHistory.recentVitals.slice(0, 3).map((vital, index) => (
                  <div key={index} className="vital-summary">
                    <small>{new Date(vital.createdAt || vital.recordedAt).toLocaleDateString()}</small>
                    <p>
                      BP: {vital.vitals?.bloodPressure?.systolic || "N/A"}/
                      {vital.vitals?.bloodPressure?.diastolic || "N/A"}, HR: {vital.vitals?.heartRate || "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {patientHistory.recentConsultations && patientHistory.recentConsultations.length > 0 && (
              <div className="recent-consultations">
                <h4>Recent Consultations</h4>
                {patientHistory.recentConsultations.slice(0, 2).map((consultation, index) => (
                  <div key={index} className="consultation-summary">
                    <small>{new Date(consultation.consultationDate).toLocaleDateString()}</small>
                    <p>{consultation.chiefComplaint}</p>
                  </div>
                ))}
              </div>
            )}

            {patientHistory.currentMedications && patientHistory.currentMedications.length > 0 && (
              <div className="current-medications">
                <h4>Current Medications ({patientHistory.currentMedications.length})</h4>
                {patientHistory.currentMedications.slice(0, 3).map((med, index) => (
                  <div key={index} className="medication-summary">
                    <small>{med.genericName || med.name}</small>
                    <p>
                      {med.dosage} {med.frequency}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading indicator for patient history */}
        {loadingHistory && (
          <div className="loading-history">
            <p>Loading patient history...</p>
          </div>
        )}

        {/* AI Suggestions Display */}
        {aiSuggestions && (
          <div className="ai-suggestions-section">
            <h3>🤖 AI Suggestions</h3>
            <div className="ai-suggestions-content">
              {aiSuggestions.differentialDiagnosis && (
                <div className="suggestion-item">
                  <h4>Differential Diagnosis:</h4>
                  <p>
                    {Array.isArray(aiSuggestions.differentialDiagnosis)
                      ? aiSuggestions.differentialDiagnosis.join(", ")
                      : aiSuggestions.differentialDiagnosis}
                  </p>
                </div>
              )}

              {aiSuggestions.investigations && (
                <div className="suggestion-item">
                  <h4>Recommended Investigations:</h4>
                  <p>
                    {Array.isArray(aiSuggestions.investigations)
                      ? aiSuggestions.investigations.join(", ")
                      : aiSuggestions.investigations}
                  </p>
                </div>
              )}

              {aiSuggestions.treatment && (
                <div className="suggestion-item">
                  <h4>Treatment Approach:</h4>
                  <p>{aiSuggestions.treatment}</p>
                </div>
              )}

              {aiSuggestions.redFlags && (
                <div className="suggestion-item warning">
                  <h4>⚠️ Red Flags:</h4>
                  <p>
                    {Array.isArray(aiSuggestions.redFlags) ? aiSuggestions.redFlags.join(", ") : aiSuggestions.redFlags}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assessment */}
        <div className="form-section full-width">
          <h3>Assessment</h3>

          <div className="form-group">
            <label>Primary Diagnosis</label>
            <input
              type="text"
              value={formData.assessment.primaryDiagnosis}
              onChange={(e) => handleInputChange("assessment.primaryDiagnosis", e.target.value)}
              placeholder="Primary diagnosis"
            />
          </div>

          <div className="form-group">
            <label>Clinical Notes</label>
            <textarea
              value={formData.assessment.clinicalNotes}
              onChange={(e) => handleInputChange("assessment.clinicalNotes", e.target.value)}
              placeholder="Additional clinical notes and observations"
              rows="4"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions-bottom">
          <div className="form-actions-left">
            <button
              type="button"
              className="btn-medical-history-nav"
              onClick={() => {
                const patientId = formData.patientId || prompt("Enter Patient ID:");
                if (patientId) {
                  navigate(`/medical-history/${patientId}`);
                }
              }}
            >
              🩺 Medical History
            </button>
          </div>

          <div className="form-actions-right">
            <button type="button" className="btn-cancel" onClick={() => navigate("/consultations")}>
              Cancel
            </button>

            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Update Consultation" : "Save Consultation"}
            </button>
          </div>
        </div>
      </form>

      {/* AI Chatbot */}
      <DoctorChatbot isOpen={chatbotOpen} onToggle={() => setChatbotOpen(!chatbotOpen)} />
    </div>
  );
};

export default ConsultationForm;
