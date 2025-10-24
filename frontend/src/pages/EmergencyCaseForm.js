import React, { useState, useEffect } from 'react';
import './EmergencyCaseForm.css';

const EmergencyCaseForm = ({ caseId, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    patientAge: '',
    patientGender: 'Male',
    chiefComplaint: '',
    symptoms: [],
    arrivalMode: 'Walk-in',
    vitals: {
      systolicBP: '',
      diastolicBP: '',
      heartRate: '',
      temperature: '',
      oxygenSaturation: '',
      respiratoryRate: '',
      painScale: ''
    },
    preHospitalData: {
      ambulanceService: '',
      paramedicsReport: '',
      treatmentGiven: '',
      medications: ''
    },
    allergies: '',
    medications: '',
    medicalHistory: ''
  });

  const [symptomInput, setSymptomInput] = useState('');
  const [triageResult, setTriageResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    fetchPatients();
    if (caseId) {
      fetchCaseData(caseId);
    }
  }, [caseId]);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchCaseData = async (id) => {
    try {
      const response = await fetch(`/api/emergency/cases/${id}`);
      const data = await response.json();
      if (data.case) {
        setFormData({
          ...data.case,
          patientName: data.case.patientId?.name || '',
          patientAge: data.case.patientId?.age || '',
          patientGender: data.case.patientId?.gender || 'Male'
        });
      }
    } catch (error) {
      console.error('Error fetching case data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePatientSelect = (e) => {
    const patientId = e.target.value;
    const selectedPatient = patients.find(p => p._id === patientId);
    
    if (selectedPatient) {
      setFormData(prev => ({
        ...prev,
        patientId: selectedPatient._id,
        patientName: selectedPatient.name,
        patientAge: selectedPatient.age,
        patientGender: selectedPatient.gender,
        allergies: selectedPatient.allergies || '',
        medications: selectedPatient.currentMedications || '',
        medicalHistory: selectedPatient.medicalHistory || ''
      }));
    }
  };

  const addSymptom = () => {
    if (symptomInput.trim()) {
      setFormData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, symptomInput.trim()]
      }));
      setSymptomInput('');
    }
  };

  const removeSymptom = (index) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index)
    }));
  };

  const calculateTriage = async () => {
    if (!formData.vitals.systolicBP || !formData.symptoms.length) {
      alert('Please enter vital signs and symptoms to calculate triage score');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/emergency/triage/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vitals: formData.vitals,
          symptoms: formData.symptoms,
          demographics: {
            age: parseInt(formData.patientAge) || 30
          }
        })
      });

      const result = await response.json();
      setTriageResult(result);
    } catch (error) {
      console.error('Error calculating triage:', error);
      alert('Error calculating triage score');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        age: parseInt(formData.patientAge) || 30
      };

      const url = caseId 
        ? `/api/emergency/cases/${caseId}`
        : '/api/emergency/cases';
      
      const method = caseId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const result = await response.json();
        onSave && onSave(result);
      } else {
        throw new Error('Failed to save case');
      }
    } catch (error) {
      console.error('Error saving case:', error);
      alert('Error saving emergency case');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return '#dc3545';
      case 'High': return '#fd7e14';
      case 'Medium': return '#ffc107';
      case 'Low': return '#28a745';
      default: return '#6c757d';
    }
  };

  return (
    <div className="emergency-case-form">
      <div className="form-header">
        <h2>
          <i className="fas fa-user-injured"></i>
          {caseId ? 'Edit Emergency Case' : 'New Emergency Case'}
        </h2>
        {triageResult && (
          <div className="triage-result">
            <div 
              className="priority-badge"
              style={{ backgroundColor: getPriorityColor(triageResult.priority) }}
            >
              {triageResult.priority} Priority
            </div>
            <div className="triage-score">Score: {triageResult.score}</div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="case-form">
        <div className="form-section">
          <h3>
            <i className="fas fa-user"></i>
            Patient Information
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Select Existing Patient</label>
              <select 
                value={formData.patientId} 
                onChange={handlePatientSelect}
                className="form-control"
              >
                <option value="">Select a patient...</option>
                {patients.map(patient => (
                  <option key={patient._id} value={patient._id}>
                    {patient.name} - {patient.age}y, {patient.gender}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Patient Name *</label>
              <input
                type="text"
                name="patientName"
                value={formData.patientName}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label>Age *</label>
              <input
                type="number"
                name="patientAge"
                value={formData.patientAge}
                onChange={handleInputChange}
                className="form-control"
                min="0"
                max="150"
                required
              />
            </div>

            <div className="form-group">
              <label>Gender *</label>
              <select
                name="patientGender"
                value={formData.patientGender}
                onChange={handleInputChange}
                className="form-control"
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Arrival Mode</label>
              <select
                name="arrivalMode"
                value={formData.arrivalMode}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="Walk-in">Walk-in</option>
                <option value="Ambulance">Ambulance</option>
                <option value="Police">Police</option>
                <option value="Helicopter">Helicopter</option>
                <option value="Transfer">Transfer</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>
            <i className="fas fa-stethoscope"></i>
            Clinical Information
          </h3>
          <div className="form-group">
            <label>Chief Complaint *</label>
            <textarea
              name="chiefComplaint"
              value={formData.chiefComplaint}
              onChange={handleInputChange}
              className="form-control"
              rows="3"
              placeholder="Primary reason for visit..."
              required
            />
          </div>

          <div className="form-group">
            <label>Symptoms</label>
            <div className="symptom-input">
              <input
                type="text"
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                className="form-control"
                placeholder="Enter symptom..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
              />
              <button type="button" onClick={addSymptom} className="btn btn-secondary">
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <div className="symptoms-list">
              {formData.symptoms.map((symptom, index) => (
                <span key={index} className="symptom-tag">
                  {symptom}
                  <button 
                    type="button" 
                    onClick={() => removeSymptom(index)}
                    className="remove-symptom"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>
            <i className="fas fa-heartbeat"></i>
            Vital Signs
          </h3>
          <div className="vitals-grid">
            <div className="form-group">
              <label>Systolic BP *</label>
              <input
                type="number"
                name="vitals.systolicBP"
                value={formData.vitals.systolicBP}
                onChange={handleInputChange}
                className="form-control"
                placeholder="mmHg"
                required
              />
            </div>

            <div className="form-group">
              <label>Diastolic BP *</label>
              <input
                type="number"
                name="vitals.diastolicBP"
                value={formData.vitals.diastolicBP}
                onChange={handleInputChange}
                className="form-control"
                placeholder="mmHg"
                required
              />
            </div>

            <div className="form-group">
              <label>Heart Rate *</label>
              <input
                type="number"
                name="vitals.heartRate"
                value={formData.vitals.heartRate}
                onChange={handleInputChange}
                className="form-control"
                placeholder="bpm"
                required
              />
            </div>

            <div className="form-group">
              <label>Temperature *</label>
              <input
                type="number"
                step="0.1"
                name="vitals.temperature"
                value={formData.vitals.temperature}
                onChange={handleInputChange}
                className="form-control"
                placeholder="°C"
                required
              />
            </div>

            <div className="form-group">
              <label>Oxygen Saturation *</label>
              <input
                type="number"
                name="vitals.oxygenSaturation"
                value={formData.vitals.oxygenSaturation}
                onChange={handleInputChange}
                className="form-control"
                placeholder="%"
                min="0"
                max="100"
                required
              />
            </div>

            <div className="form-group">
              <label>Respiratory Rate *</label>
              <input
                type="number"
                name="vitals.respiratoryRate"
                value={formData.vitals.respiratoryRate}
                onChange={handleInputChange}
                className="form-control"
                placeholder="breaths/min"
                required
              />
            </div>

            <div className="form-group">
              <label>Pain Scale (0-10)</label>
              <input
                type="number"
                name="vitals.painScale"
                value={formData.vitals.painScale}
                onChange={handleInputChange}
                className="form-control"
                min="0"
                max="10"
                placeholder="0-10"
              />
            </div>
          </div>

          <div className="triage-section">
            <button 
              type="button" 
              onClick={calculateTriage}
              className="btn btn-info"
              disabled={loading}
            >
              <i className="fas fa-calculator"></i>
              {loading ? 'Calculating...' : 'Calculate Triage Score'}
            </button>

            {triageResult && (
              <div className="triage-details">
                <div className="triage-info">
                  <h4>Triage Assessment</h4>
                  <p><strong>Priority:</strong> 
                    <span 
                      className="priority-text"
                      style={{ color: getPriorityColor(triageResult.priority) }}
                    >
                      {triageResult.priority}
                    </span>
                  </p>
                  <p><strong>Score:</strong> {triageResult.score}/12</p>
                  <p><strong>Recommended Action:</strong> {triageResult.recommendedAction}</p>
                  
                  {triageResult.riskFactors?.length > 0 && (
                    <div className="risk-factors">
                      <strong>Risk Factors:</strong>
                      <ul>
                        {triageResult.riskFactors.map((factor, index) => (
                          <li key={index}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {formData.arrivalMode === 'Ambulance' && (
          <div className="form-section">
            <h3>
              <i className="fas fa-ambulance"></i>
              Pre-Hospital Data
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Ambulance Service</label>
                <input
                  type="text"
                  name="preHospitalData.ambulanceService"
                  value={formData.preHospitalData.ambulanceService}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Treatment Given</label>
                <textarea
                  name="preHospitalData.treatmentGiven"
                  value={formData.preHospitalData.treatmentGiven}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Medications Administered</label>
                <textarea
                  name="preHospitalData.medications"
                  value={formData.preHospitalData.medications}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Paramedics Report</label>
                <textarea
                  name="preHospitalData.paramedicsReport"
                  value={formData.preHospitalData.paramedicsReport}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="4"
                />
              </div>
            </div>
          </div>
        )}

        <div className="form-section">
          <h3>
            <i className="fas fa-notes-medical"></i>
            Medical History
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Known Allergies</label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleInputChange}
                className="form-control"
                rows="2"
                placeholder="List any known allergies..."
              />
            </div>

            <div className="form-group">
              <label>Current Medications</label>
              <textarea
                name="medications"
                value={formData.medications}
                onChange={handleInputChange}
                className="form-control"
                rows="3"
                placeholder="List current medications..."
              />
            </div>

            <div className="form-group full-width">
              <label>Medical History</label>
              <textarea
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={handleInputChange}
                className="form-control"
                rows="4"
                placeholder="Relevant medical history..."
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel}
            className="btn btn-secondary"
          >
            <i className="fas fa-times"></i>
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            <i className="fas fa-save"></i>
            {loading ? 'Saving...' : (caseId ? 'Update Case' : 'Create Case')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmergencyCaseForm;