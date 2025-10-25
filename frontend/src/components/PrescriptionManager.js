import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DoctorChatbot from "./AIAssistant/DoctorChatbot";
import EPrescriptionTracker from "./EPrescriptionTracker";
import "./PrescriptionManager.css";

const PrescriptionManager = ({ consultationId, compact = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    consultationId: consultationId || "",
    patientId: "",
    vitals: {
      bloodPressure: { systolic: "", diastolic: "" },
      heartRate: "",
      temperature: { value: "", unit: "F" },
      respiratoryRate: "",
      oxygenSaturation: "",
      painLevel: "",
    },
    medications: [],
    diagnosis: { primary: "", secondary: [] },
    pharmacyInfo: {
      pharmacyName: "",
      pharmacyAddress: "",
      pharmacyPhone: "",
      preferredPharmacy: false,
    },
    patientInstructions: {
      generalInstructions: "Take medications as prescribed. Do not skip doses.",
      dietaryRestrictions: "",
      followUpInstructions: "Return if symptoms worsen or new symptoms develop.",
    },
    priority: "routine",
  });

  const [formularySearch, setFormularySearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [drugInteractions, setDrugInteractions] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [selectedPharmacies, setSelectedPharmacies] = useState([
    {
      id: "PHARM001",
      name: "Central Pharmacy",
      address: "123 Main St",
      phone: "(555) 123-4567",
      distance: "0.5 miles",
    },
    {
      id: "PHARM002",
      name: "HealthMart Pharmacy",
      address: "456 Oak Ave",
      phone: "(555) 234-5678",
      distance: "1.2 miles",
    },
    {
      id: "PHARM003",
      name: "Community Drug Store",
      address: "789 Pine St",
      phone: "(555) 345-6789",
      distance: "2.1 miles",
    },
  ]);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  useEffect(() => {
    if (consultationId) {
      fetchConsultationData();
    }
  }, [consultationId]);

  useEffect(() => {
    if (formData.patientId && formData.patientId.trim()) {
      fetchLatestVitals(formData.patientId.trim());
    }
  }, [formData.patientId]);

  const fetchConsultationData = async () => {
    try {
      const response = await axios.get(`/api/consultations/${consultationId}`);
      const consultation = response.data.data;

      setFormData((prev) => ({
        ...prev,
        patientId: consultation.patientId,
        diagnosis: {
          primary: consultation.assessment?.primaryDiagnosis || "",
          secondary: consultation.assessment?.differentialDiagnosis || [],
        },
      }));
    } catch (error) {
      console.error("Error fetching consultation:", error);
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
            temperature: {
              value: latestVitals.vitals.temperature?.value || "",
              unit: latestVitals.vitals.temperature?.unit || "F",
            },
            respiratoryRate: latestVitals.vitals.respiratoryRate || "",
            oxygenSaturation: latestVitals.vitals.oxygenSaturation || "",
            painLevel: latestVitals.vitals.painLevel || "",
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching latest vitals:", error);
    }
  };

  const searchFormulary = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get("/api/consultations/formulary/search", {
        params: { query },
      });
      setSearchResults(response.data.data);
    } catch (error) {
      console.error("Error searching formulary:", error);
    }
  };

  const addMedication = (drugInfo = null) => {
    const newMedication = {
      genericName: drugInfo?.genericName || "",
      brandName: drugInfo?.brands?.[0] || "",
      dosage: "",
      dosageForm: drugInfo?.dosageForms?.[0] || "tablet",
      frequency: "",
      route: "oral",
      duration: { value: "", unit: "days" },
      quantity: "",
      refills: 0,
      instructions: "",
      indication: formData.diagnosis.primary,
      substitutionAllowed: true,
      brandPreference: {
        preferred: drugInfo?.brands?.[0] || "",
        alternatives: drugInfo?.brands || [],
      },
      showAdvanced: false,
      status: "active",
      urgency: "routine",
    };

    setFormData((prev) => ({
      ...prev,
      medications: [...prev.medications, newMedication],
    }));

    // Clear search
    setFormularySearch("");
    setSearchResults([]);
  };

  const updateMedication = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.map((med, i) => {
        if (i === index) {
          if (field.includes(".")) {
            const [parent, child] = field.split(".");
            return {
              ...med,
              [parent]: {
                ...med[parent],
                [child]: value,
              },
            };
          }
          return { ...med, [field]: value };
        }
        return med;
      }),
    }));
  };

  const removeMedication = (index) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const checkDrugInteractions = async () => {
    if (formData.medications.length < 2) return;

    try {
      const response = await axios.post(`/api/consultations/${consultationId}/drug-interactions`, {
        newMedications: formData.medications,
      });

      if (response.data.success) {
        setDrugInteractions(response.data.data.formularyInteractions || []);
      }
    } catch (error) {
      console.error("Error checking drug interactions:", error);
    }
  };

  const getPrescriptionSuggestions = async () => {
    if (!formData.diagnosis.primary) {
      alert("Please enter a primary diagnosis to get AI suggestions.");
      return;
    }

    setLoadingAI(true);
    try {
      // Create a more comprehensive request for AI suggestions
      const requestData = {
        diagnosis: formData.diagnosis.primary,
        patientInfo: {
          age: "Adult", // This would come from patient data
          allergies: [], // This would come from patient data
          currentMedications: formData.medications.map((med) => med.genericName).filter(Boolean),
        },
        symptoms: [], // This would come from consultation data
        vitals: {}, // This would come from consultation data
      };

      const response = await axios.post(
        `/api/consultations/${consultationId || "temp"}/prescription-suggestions`,
        requestData
      );

      if (response.data.success) {
        setAiSuggestions(response.data.data);
      } else {
        // Provide fallback suggestions based on common conditions
        setAiSuggestions(getFallbackSuggestions(formData.diagnosis.primary));
      }
    } catch (error) {
      console.error("Error getting prescription suggestions:", error);
      // Provide fallback suggestions
      setAiSuggestions(getFallbackSuggestions(formData.diagnosis.primary));
    } finally {
      setLoadingAI(false);
    }
  };

  const getFallbackSuggestions = (diagnosis) => {
    const commonTreatments = {
      hypertension: {
        medications: ["Lisinopril 10mg daily", "Amlodipine 5mg daily"],
        instructions: "Monitor blood pressure regularly",
        followUp: "Return in 4-6 weeks",
      },
      diabetes: {
        medications: ["Metformin 500mg twice daily"],
        instructions: "Take with meals, monitor blood sugar",
        followUp: "Return in 3 months for HbA1c",
      },
      infection: {
        medications: ["Amoxicillin 500mg three times daily"],
        instructions: "Complete full course even if feeling better",
        followUp: "Return if symptoms worsen",
      },
      pain: {
        medications: ["Ibuprofen 400mg as needed"],
        instructions: "Take with food, maximum 3 times daily",
        followUp: "Return if pain persists beyond 1 week",
      },
    };

    const key = Object.keys(commonTreatments).find((condition) => diagnosis.toLowerCase().includes(condition));

    return key
      ? commonTreatments[key]
      : {
          medications: ["Consult clinical guidelines"],
          instructions: "Follow standard treatment protocols",
          followUp: "As clinically indicated",
        };
  };

  const validatePrescription = async () => {
    try {
      // Create a temporary prescription for validation
      const tempPrescription = {
        ...formData,
        doctorId: user.id,
        prescriptionDate: new Date(),
      };

      const response = await axios.post("/api/prescriptions", tempPrescription);

      if (response.data.success) {
        alert("Prescription validated successfully!");
        return response.data.data;
      } else {
        alert("Validation failed: " + response.data.message);
        return null;
      }
    } catch (error) {
      console.error("Error validating prescription:", error);
      alert("Validation error: " + (error.response?.data?.message || error.message));
      return null;
    }
  };

  const generatePrescriptionPreview = () => {
    return {
      prescriptionNumber: `RX${Date.now()}`,
      date: new Date().toLocaleDateString(),
      doctor: user.fullName || user.username,
      patient: formData.patientId,
      medications: formData.medications,
      pharmacy: formData.pharmacyInfo.pharmacyName || "To be selected",
    };
  };

  const sendToPharmacy = async (pharmacyId) => {
    try {
      setSaving(true);
      const prescriptionData = {
        ...formData,
        doctorId: user.id,
        prescriptionDate: new Date(),
        pharmacyInfo: {
          ...formData.pharmacyInfo,
          pharmacyId: pharmacyId,
        },
      };

      const response = await axios.post("/api/prescriptions", prescriptionData);

      if (response.data.success) {
        const prescriptionId = response.data.data.id;

        // Send to pharmacy
        await axios.post(`/api/prescriptions/${prescriptionId}/send`, {
          pharmacyId: pharmacyId,
          method: "electronic",
        });

        alert("Prescription sent to pharmacy successfully!");
        // navigate("/consultations");
      }
    } catch (error) {
      console.error("Error sending prescription:", error);
      alert("Error sending prescription: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const prescriptionData = {
        ...formData,
        doctorId: user.id,
        prescriptionDate: new Date(),
      };

      const response = await axios.post("/api/prescriptions", prescriptionData);

      if (response.data.success) {
        alert("Prescription created successfully!");
        // navigate("/consultations");
      }
    } catch (error) {
      console.error("Error creating prescription:", error);
      alert("Error creating prescription: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (formData.medications.length > 0) {
      checkDrugInteractions();
    }
  }, [formData.medications]);

  return (
    <div className={`prescription-manager ${compact ? "compact" : ""}`}>
      {!compact && (
        <div className="manager-header">
          <h1>Prescription Manager</h1>
          <div className="header-actions">
            <button type="button" className="btn-ai" onClick={getPrescriptionSuggestions} disabled={loadingAI}>
              {loadingAI ? "🤖 Getting Suggestions..." : "🤖 AI Suggestions"}
            </button>
            <button type="button" className="btn-validate" onClick={validatePrescription}>
              ✓ Validate
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="prescription-form">
        {/* Basic Information */}
        <div className="form-section">
          {!compact && <h3>Prescription Information</h3>}

          <div className="form-grid">
            <div className="form-group">
              <label>Patient ID</label>
              <input
                type="text"
                value={formData.patientId}
                onChange={(e) => setFormData((prev) => ({ ...prev, patientId: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label>Consultation ID</label>
              <input
                type="text"
                value={formData.consultationId}
                onChange={(e) => setFormData((prev) => ({ ...prev, consultationId: e.target.value }))}
                required
              />
            </div>

            <div className="form-group primary-diagnosis-group">
              <label>Primary Diagnosis *</label>
              <textarea
                value={formData.diagnosis.primary}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    diagnosis: { ...prev.diagnosis, primary: e.target.value },
                  }))
                }
                placeholder="Enter detailed primary diagnosis with relevant clinical findings..."
                rows="4"
                className="primary-diagnosis-textarea"
                required
              />
            </div>
          </div>
        </div>

        {/* Formulary Search */}
        <div className="form-section">
          <h3>Add Medications</h3>

          <div className="formulary-search">
            <div className="search-input">
              <input
                type="text"
                placeholder="Search medications..."
                value={formularySearch}
                onChange={(e) => {
                  setFormularySearch(e.target.value);
                  searchFormulary(e.target.value);
                }}
              />
              <button type="button" onClick={() => addMedication()}>
                + Add Custom
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((drug, index) => (
                  <div key={index} className="search-result-item">
                    <div className="drug-info">
                      <h4>{drug.genericName}</h4>
                      <p>Brands: {drug.brands.join(", ")}</p>
                      <p>Category: {drug.category}</p>
                    </div>
                    <button type="button" onClick={() => addMedication(drug)} className="btn-add-drug">
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Suggestions */}
        {aiSuggestions && (
          <div className="ai-suggestions">
            <h3>🤖 AI Prescription Suggestions</h3>
            <div className="suggestions-content">
              {aiSuggestions.medications && (
                <div className="suggestion-section">
                  <h4>Recommended Medications:</h4>
                  <ul>
                    {Array.isArray(aiSuggestions.medications) ? (
                      aiSuggestions.medications.map((med, index) => <li key={index}>{med}</li>)
                    ) : (
                      <li>{aiSuggestions.medications}</li>
                    )}
                  </ul>
                </div>
              )}

              {aiSuggestions.instructions && (
                <div className="suggestion-section">
                  <h4>Instructions:</h4>
                  <p>{aiSuggestions.instructions}</p>
                </div>
              )}

              {aiSuggestions.followUp && (
                <div className="suggestion-section">
                  <h4>Follow-up:</h4>
                  <p>{aiSuggestions.followUp}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Medications List */}
        <div className="form-section">
          <h3>Prescribed Medications ({formData.medications.length})</h3>

          {formData.medications.map((medication, index) => (
            <div key={index} className="medication-item">
              <div className="medication-header">
                <div className="medication-basic-info">
                  <div className="medicine-name">
                    <input
                      type="text"
                      value={medication.genericName}
                      onChange={(e) => updateMedication(index, "genericName", e.target.value)}
                      placeholder="Medicine name"
                      required
                    />
                  </div>
                  <div className="dosage-frequency">
                    <input
                      type="text"
                      value={medication.dosage}
                      onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                      placeholder="Dosage"
                      required
                    />
                    <select
                      value={medication.frequency}
                      onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                      required
                    >
                      <option value="">Frequency</option>
                      <option value="Once daily">Once daily</option>
                      <option value="BID">BID</option>
                      <option value="TID">TID</option>
                      <option value="QID">QID</option>
                      <option value="PRN">PRN</option>
                    </select>
                  </div>
                </div>
                <div className="medication-actions">
                  <button
                    type="button"
                    className="btn-toggle-advanced"
                    onClick={() => updateMedication(index, "showAdvanced", !medication.showAdvanced)}
                  >
                    {medication.showAdvanced ? "Hide Details" : "Show Details"}
                  </button>
                  <button type="button" className="btn-remove" onClick={() => removeMedication(index)}>
                    Remove
                  </button>
                </div>
              </div>

              {medication.showAdvanced && (
                <div className="medication-advanced">
                  <div className="medication-grid">
                    <div className="form-group">
                      <label>Brand Name</label>
                      <input
                        type="text"
                        value={medication.brandName}
                        onChange={(e) => updateMedication(index, "brandName", e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Dosage Form</label>
                      <select
                        value={medication.dosageForm}
                        onChange={(e) => updateMedication(index, "dosageForm", e.target.value)}
                      >
                        <option value="tablet">Tablet</option>
                        <option value="capsule">Capsule</option>
                        <option value="syrup">Syrup</option>
                        <option value="injection">Injection</option>
                        <option value="cream">Cream</option>
                        <option value="drops">Drops</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Duration</label>
                      <div className="duration-input">
                        <input
                          type="number"
                          value={medication.duration.value}
                          onChange={(e) => updateMedication(index, "duration.value", e.target.value)}
                          placeholder="7"
                        />
                        <select
                          value={medication.duration.unit}
                          onChange={(e) => updateMedication(index, "duration.unit", e.target.value)}
                        >
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                          <option value="months">Months</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Quantity</label>
                      <input
                        type="number"
                        value={medication.quantity}
                        onChange={(e) => updateMedication(index, "quantity", e.target.value)}
                        placeholder="30"
                      />
                    </div>

                    <div className="form-group">
                      <label>Route</label>
                      <select
                        value={medication.route}
                        onChange={(e) => updateMedication(index, "route", e.target.value)}
                      >
                        <option value="oral">Oral</option>
                        <option value="topical">Topical</option>
                        <option value="injection">Injection</option>
                        <option value="inhalation">Inhalation</option>
                        <option value="rectal">Rectal</option>
                        <option value="sublingual">Sublingual</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Refills</label>
                      <select
                        value={medication.refills}
                        onChange={(e) => updateMedication(index, "refills", parseInt(e.target.value))}
                      >
                        <option value={0}>No refills</option>
                        <option value={1}>1 refill</option>
                        <option value={2}>2 refills</option>
                        <option value={3}>3 refills</option>
                        <option value={5}>5 refills</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Urgency</label>
                      <select
                        value={medication.urgency}
                        onChange={(e) => updateMedication(index, "urgency", e.target.value)}
                      >
                        <option value="routine">Routine</option>
                        <option value="urgent">Urgent</option>
                        <option value="stat">STAT</option>
                      </select>
                    </div>

                    <div className="form-group full-width">
                      <label>Instructions</label>
                      <textarea
                        value={medication.instructions}
                        onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                        placeholder="Take with food, avoid alcohol, etc."
                        rows="2"
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={medication.substitutionAllowed}
                          onChange={(e) => updateMedication(index, "substitutionAllowed", e.target.checked)}
                        />
                        Allow generic substitution
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {formData.medications.length === 0 && (
            <div className="no-medications">
              <p>No medications added yet. Search and add medications above.</p>
            </div>
          )}
        </div>

        {/* Drug Interactions */}
        {drugInteractions.length > 0 && (
          <div className="drug-interactions">
            <h3>⚠️ Drug Interactions ({drugInteractions.length})</h3>
            {drugInteractions.map((interaction, index) => (
              <div key={index} className="interaction-item">
                <div className="interaction-drugs">
                  <strong>{interaction.drug1}</strong> ↔ <strong>{interaction.drug2}</strong>
                </div>
                <div className="interaction-severity">
                  Severity: <span className={`severity-${interaction.severity}`}>{interaction.severity}</span>
                </div>
                <div className="interaction-description">{interaction.description}</div>
              </div>
            ))}
          </div>
        )}

        {/* Pharmacy Selection */}
        <div className="form-section">
          <h3>Pharmacy Selection</h3>

          <div className="pharmacy-grid">
            {selectedPharmacies.map((pharmacy) => (
              <div key={pharmacy.id} className="pharmacy-card">
                <div className="pharmacy-info">
                  <h4>{pharmacy.name}</h4>
                  <p>{pharmacy.address}</p>
                  <p>{pharmacy.phone}</p>
                  <span className="distance">{pharmacy.distance}</span>
                </div>
                <div className="pharmacy-actions">
                  <button
                    type="button"
                    className="btn-select-pharmacy"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        pharmacyInfo: {
                          ...prev.pharmacyInfo,
                          pharmacyName: pharmacy.name,
                          pharmacyAddress: pharmacy.address,
                          pharmacyPhone: pharmacy.phone,
                        },
                      }))
                    }
                  >
                    Select
                  </button>
                  <button
                    type="button"
                    className="btn-send-pharmacy"
                    onClick={() => sendToPharmacy(pharmacy.id)}
                    disabled={saving || formData.medications.length === 0}
                  >
                    Send Prescription
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="custom-pharmacy">
            <h4>Custom Pharmacy</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Pharmacy Name</label>
                <input
                  type="text"
                  value={formData.pharmacyInfo.pharmacyName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pharmacyInfo: { ...prev.pharmacyInfo, pharmacyName: e.target.value },
                    }))
                  }
                  placeholder="Enter pharmacy name"
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={formData.pharmacyInfo.pharmacyPhone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pharmacyInfo: { ...prev.pharmacyInfo, pharmacyPhone: e.target.value },
                    }))
                  }
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Patient Instructions */}
        <div className="form-section">
          <h3>Patient Instructions</h3>

          <div className="form-group">
            <label>General Instructions</label>
            <textarea
              value={formData.patientInstructions.generalInstructions}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  patientInstructions: {
                    ...prev.patientInstructions,
                    generalInstructions: e.target.value,
                  },
                }))
              }
              placeholder="General instructions for the patient"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Dietary Restrictions</label>
            <textarea
              value={formData.patientInstructions.dietaryRestrictions}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  patientInstructions: {
                    ...prev.patientInstructions,
                    dietaryRestrictions: e.target.value,
                  },
                }))
              }
              placeholder="Any dietary restrictions or recommendations"
              rows="2"
            />
          </div>

          <div className="form-group">
            <label>Follow-up Instructions</label>
            <textarea
              value={formData.patientInstructions.followUpInstructions}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  patientInstructions: {
                    ...prev.patientInstructions,
                    followUpInstructions: e.target.value,
                  },
                }))
              }
              placeholder="When to return, what to watch for, etc."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Prescription Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">STAT (Immediate)</option>
            </select>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          {!compact && (
            <button type="button" className="btn-cancel" onClick={() => navigate("/consultations")}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? "Creating Prescription..." : "Create Prescription"}
          </button>
        </div>
      </form>

      {/* E-Prescription Tracker */}
      <EPrescriptionTracker compact={true} />

      {/* AI Chatbot */}
      <DoctorChatbot isOpen={chatbotOpen} onToggle={() => setChatbotOpen(!chatbotOpen)} />
    </div>
  );
};

export default PrescriptionManager;
