import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import './MedicalHistory.css';

const MedicalHistory = () => {
  const { user } = useAuth();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [patientData, setPatientData] = useState(null);
  const [recentVitals, setRecentVitals] = useState([]);
  const [recentTriage, setRecentTriage] = useState([]);
  const [recentConsultations, setRecentConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    condition: '',
    diagnosedDate: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    if (patientId) {
      fetchMedicalHistory();
    }
  }, [patientId]);

  const fetchMedicalHistory = async () => {
    console.log(`[FRONTEND] Fetching medical history for patientId: ${patientId}`);
    try {
      setLoading(true);
      const [historyResponse, fullHistoryResponse] = await Promise.all([
        axios.get(`/api/patients/${patientId}/medical-history`),
        axios.get(`/api/patients/${patientId}/history`)
      ]);

      console.log(`[FRONTEND] Medical history response:`, historyResponse.data);
      console.log(`[FRONTEND] Full history response:`, fullHistoryResponse.data);

      if (historyResponse.data.success) {
        setMedicalHistory(historyResponse.data.medicalHistory);
        console.log(`[FRONTEND] Set medical history: ${historyResponse.data.medicalHistory.length} entries`);
      }

      if (fullHistoryResponse.data.success) {
        const data = fullHistoryResponse.data.data;
        setPatientData(data.patient);
        setRecentVitals(data.recentVitals || []);
        setRecentTriage(data.recentTriage || []);
        setRecentConsultations(data.recentConsultations || []);

        console.log(`[FRONTEND] Patient data:`, data.patient);
        console.log(`[FRONTEND] Recent vitals: ${data.recentVitals?.length || 0} entries`);
        console.log(`[FRONTEND] Recent triage: ${data.recentTriage?.length || 0} entries`);
        console.log(`[FRONTEND] Recent consultations: ${data.recentConsultations?.length || 0} entries`);
      }
    } catch (error) {
      console.error('[FRONTEND] Error fetching medical history:', error);
      console.error('[FRONTEND] Error details:', error.response?.data || error.message);
      alert('Failed to load medical history');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      condition: '',
      diagnosedDate: '',
      status: 'active',
      notes: ''
    });
    setShowAddForm(false);
    setEditingIndex(null);
  };

  const handleAdd = async () => {
    if (!formData.condition.trim()) {
      alert('Please enter a condition');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post(`/api/patients/${patientId}/medical-history`, formData);
      if (response.data.success) {
        setMedicalHistory(response.data.medicalHistory);
        resetForm();
        alert('Medical history added successfully');
      }
    } catch (error) {
      console.error('Error adding medical history:', error);
      alert('Failed to add medical history');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (index) => {
    const history = medicalHistory[index];
    setFormData({
      condition: history.condition,
      diagnosedDate: history.diagnosedDate ? new Date(history.diagnosedDate).toISOString().split('T')[0] : '',
      status: history.status,
      notes: history.notes || ''
    });
    setEditingIndex(index);
    setShowAddForm(true);
  };

  const handleUpdate = async () => {
    if (!formData.condition.trim()) {
      alert('Please enter a condition');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.put(`/api/patients/${patientId}/medical-history/${editingIndex}`, formData);
      if (response.data.success) {
        setMedicalHistory(response.data.medicalHistory);
        resetForm();
        alert('Medical history updated successfully');
      }
    } catch (error) {
      console.error('Error updating medical history:', error);
      alert('Failed to update medical history');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('Are you sure you want to delete this medical history entry?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/patients/${patientId}/medical-history/${index}`);
      if (response.data.success) {
        setMedicalHistory(response.data.medicalHistory);
        alert('Medical history deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting medical history:', error);
      alert('Failed to delete medical history');
    }
  };

  if (loading) {
    return (
      <div className="medical-history-container">
        <div className="loading">Loading medical history...</div>
      </div>
    );
  }

  return (
    <div className="medical-history-container">
      <div className="header">
        <div className="header-info">
          <h1>Medical History</h1>
          {patientData && (
            <div className="patient-summary">
              <h2>{patientData.name}</h2>
              <p><strong>ID:</strong> {patientData.uniqueId}</p>
              <p><strong>Age:</strong> {patientData.dob ? new Date().getFullYear() - new Date(patientData.dob).getFullYear() : 'N/A'}</p>
              <p><strong>Phone:</strong> {patientData.phone}</p>
            </div>
          )}
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate('/patients')}
          >
            Back to Patients
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            + Add Entry
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h3>{editingIndex !== null ? 'Edit Medical History' : 'Add Medical History'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>

            <div className="form-content">
              <div className="form-group">
                <label>Condition *</label>
                <input
                  type="text"
                  value={formData.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  placeholder="e.g., Diabetes, Hypertension"
                  required
                />
              </div>

              <div className="form-group">
                <label>Diagnosed Date</label>
                <input
                  type="date"
                  value={formData.diagnosedDate}
                  onChange={(e) => handleInputChange('diagnosedDate', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                  <option value="chronic">Chronic</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes or details"
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button className="btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
                <button
                  className="btn-save"
                  onClick={editingIndex !== null ? handleUpdate : handleAdd}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (editingIndex !== null ? 'Update' : 'Add')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Overview */}
      {(recentVitals.length > 0 || recentTriage.length > 0 || recentConsultations.length > 0) && (
        <div className="overview-section">
          <h2>Patient Overview</h2>
          <div className="overview-grid">

            {/* Recent Vitals */}
            {recentVitals.length > 0 && (
              <div className="overview-card">
                <h3>Recent Vitals</h3>
                <div className="vitals-list">
                  {recentVitals.slice(0, 3).map((vital, index) => (
                    <div key={index} className="vital-entry">
                      <small>{new Date(vital.createdAt).toLocaleDateString()}</small>
                      <div className="vital-data">
                        {vital.vitals?.bloodPressure && (
                          <span>BP: {vital.vitals.bloodPressure.systolic}/{vital.vitals.bloodPressure.diastolic} </span>
                        )}
                        {vital.vitals?.heartRate && (
                          <span>HR: {vital.vitals.heartRate} bpm </span>
                        )}
                        {vital.vitals?.temperature && (
                          <span>Temp: {vital.vitals.temperature.value}°{vital.vitals.temperature.unit} </span>
                        )}
                        {vital.vitals?.oxygenSaturation && (
                          <span>O2: {vital.vitals.oxygenSaturation}%</span>
                        )}
                      </div>
                      {vital.alerts && vital.alerts.length > 0 && (
                        <div className="alerts">
                          {vital.alerts.map((alert, idx) => (
                            <span key={idx} className={`alert-badge alert-${alert.severity}`}>
                              {alert.message}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Triage */}
            {recentTriage.length > 0 && (
              <div className="overview-card">
                <h3>Recent Triage Assessments</h3>
                <div className="triage-list">
                  {recentTriage.slice(0, 3).map((triage, index) => (
                    <div key={index} className="triage-entry">
                      <small>{new Date(triage.createdAt).toLocaleDateString()}</small>
                      <div className="triage-data">
                        <span className={`priority-badge priority-${triage.priority}`}>
                          {triage.priority.toUpperCase()}
                        </span>
                        <span>Risk Score: {triage.riskScore}</span>
                      </div>
                      {triage.symptoms && triage.symptoms.length > 0 && (
                        <p><strong>Symptoms:</strong> {triage.symptoms.map(s => s.symptom).join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Consultations */}
            {recentConsultations.length > 0 && (
              <div className="overview-card">
                <h3>Recent Consultations</h3>
                <div className="consultation-list">
                  {recentConsultations.slice(0, 3).map((consultation, index) => (
                    <div key={index} className="consultation-entry">
                      <small>{new Date(consultation.consultationDate).toLocaleDateString()}</small>
                      <p><strong>Chief Complaint:</strong> {consultation.chiefComplaint}</p>
                      {consultation.assessment?.primaryDiagnosis && (
                        <p><strong>Diagnosis:</strong> {consultation.assessment.primaryDiagnosis}</p>
                      )}
                      <span className={`status-badge status-${consultation.consultationStatus}`}>
                        {consultation.consultationStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Medical History List */}
      <div className="history-list">
        <h2>Medical History</h2>
        {medicalHistory.length === 0 ? (
          <div className="empty-state">
            <p>No medical history entries found.</p>
            <button
              className="btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              Add First Entry
            </button>
          </div>
        ) : (
          medicalHistory.map((history, index) => (
            <div key={index} className="history-item">
              <div className="history-content">
                <div className="condition-header">
                  <h3>{history.condition}</h3>
                  <span className={`status-badge status-${history.status}`}>
                    {history.status}
                  </span>
                </div>

                {history.diagnosedDate && (
                  <p className="diagnosis-date">
                    <strong>Diagnosed:</strong> {new Date(history.diagnosedDate).toLocaleDateString()}
                  </p>
                )}

                {history.notes && (
                  <p className="notes">{history.notes}</p>
                )}
              </div>

              <div className="history-actions">
                <button
                  className="btn-edit"
                  onClick={() => handleEdit(index)}
                >
                  Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(index)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MedicalHistory;