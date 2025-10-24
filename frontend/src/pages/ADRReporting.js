import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './ADRReporting.css';

const ADRReporting = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('report');
  const [loading, setLoading] = useState(false);
  
  // ADR Report Form State
  const [adrForm, setAdrForm] = useState({
    patient: {
      patientId: '',
      name: '',
      age: '',
      gender: '',
      weight: '',
      medicalHistory: ['']
    },
    suspectedDrug: {
      name: '',
      dosage: '',
      frequency: '',
      startDate: '',
      batchNumber: '',
      manufacturer: ''
    },
    reaction: {
      description: '',
      severity: 'mild',
      onset: '',
      duration: '',
      outcome: 'unknown',
      symptoms: ['']
    },
    reporter: {
      name: user?.fullName || user?.username || '',
      profession: 'Physician',
      contact: user?.email || '',
      institution: 'Hospital'
    },
    assessment: {
      causality: 'possible',
      seriousness: 'non-serious',
      expectedness: 'unknown',
      dechallenge: 'not done',
      rechallenge: 'not done'
    },
    additionalInfo: {
      concomitantMeds: [''],
      labResults: '',
      notes: ''
    }
  });

  // ADR List State
  const [adrList, setAdrList] = useState([]);
  const [selectedAdr, setSelectedAdr] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    dateRange: 'all'
  });

  // Statistics State
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    if (activeTab === 'list') {
      fetchADRList();
    } else if (activeTab === 'statistics') {
      fetchStatistics();
    }
  }, [activeTab, filters]);

  // Fetch ADR list
  const fetchADRList = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.severity !== 'all') params.append('severity', filters.severity);
      
      const response = await axios.get(`/api/drug-info/adr?${params.toString()}`);
      setAdrList(response.data.data || []);
    } catch (error) {
      console.error('Error fetching ADR list:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/drug-info/adr/stats/summary');
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (section, field, value, index = null) => {
    setAdrForm(prev => {
      const newForm = { ...prev };
      
      if (index !== null) {
        // Handle array fields
        newForm[section][field][index] = value;
      } else {
        newForm[section][field] = value;
      }
      
      return newForm;
    });
  };

  // Add array item
  const addArrayItem = (section, field) => {
    setAdrForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...prev[section][field], '']
      }
    }));
  };

  // Remove array item
  const removeArrayItem = (section, field, index) => {
    setAdrForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].filter((_, i) => i !== index)
      }
    }));
  };

  // Submit ADR report
  const submitADRReport = async () => {
    try {
      setLoading(true);
      
      // Clean up empty array items
      const cleanedForm = {
        ...adrForm,
        patient: {
          ...adrForm.patient,
          medicalHistory: adrForm.patient.medicalHistory.filter(item => item.trim())
        },
        reaction: {
          ...adrForm.reaction,
          symptoms: adrForm.reaction.symptoms.filter(item => item.trim())
        },
        additionalInfo: {
          ...adrForm.additionalInfo,
          concomitantMeds: adrForm.additionalInfo.concomitantMeds.filter(item => item.trim())
        }
      };
      
      const response = await axios.post('/api/drug-info/adr', cleanedForm);
      
      if (response.data.success) {
        alert('ADR report submitted successfully!');
        // Reset form
        setAdrForm({
          patient: {
            patientId: '',
            name: '',
            age: '',
            gender: '',
            weight: '',
            medicalHistory: ['']
          },
          suspectedDrug: {
            name: '',
            dosage: '',
            frequency: '',
            startDate: '',
            batchNumber: '',
            manufacturer: ''
          },
          reaction: {
            description: '',
            severity: 'mild',
            onset: '',
            duration: '',
            outcome: 'unknown',
            symptoms: ['']
          },
          reporter: {
            name: user?.fullName || user?.username || '',
            profession: 'Physician',
            contact: user?.email || '',
            institution: 'Hospital'
          },
          assessment: {
            causality: 'possible',
            seriousness: 'non-serious',
            expectedness: 'unknown',
            dechallenge: 'not done',
            rechallenge: 'not done'
          },
          additionalInfo: {
            concomitantMeds: [''],
            labResults: '',
            notes: ''
          }
        });
      }
    } catch (error) {
      console.error('Error submitting ADR report:', error);
      alert('Error submitting ADR report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // View ADR details
  const viewADRDetails = (adr) => {
    setSelectedAdr(adr);
    setShowDetailsModal(true);
  };

  // Update ADR status
  const updateADRStatus = async (adrId, status, notes = '') => {
    try {
      const response = await axios.patch(`/api/drug-info/adr/${adrId}/status`, {
        status,
        notes
      });
      
      if (response.data.success) {
        alert('ADR status updated successfully!');
        fetchADRList();
        setShowDetailsModal(false);
      }
    } catch (error) {
      console.error('Error updating ADR status:', error);
      alert('Error updating ADR status');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'severe': return '#e74c3c';
      case 'moderate': return '#f39c12';
      case 'mild': return '#f1c40f';
      default: return '#95a5a6';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return '#3498db';
      case 'under_review': return '#f39c12';
      case 'reviewed': return '#27ae60';
      case 'closed': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="adr-reporting">
      <div className="adr-header">
        <h1>Adverse Drug Reaction (ADR) Reporting</h1>
        <p>Report and manage adverse drug reactions for patient safety</p>
      </div>

      <div className="adr-tabs">
        <button 
          className={`tab-button ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          📝 Report ADR
        </button>
        <button 
          className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          📋 ADR List
        </button>
        <button 
          className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          📊 Statistics
        </button>
      </div>

      <div className="adr-content">
        {/* Report ADR Tab */}
        {activeTab === 'report' && (
          <div className="adr-form">
            <h3>Submit New ADR Report</h3>
            
            {/* Patient Information */}
            <div className="form-section">
              <h4>Patient Information</h4>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Patient ID"
                  value={adrForm.patient.patientId}
                  onChange={(e) => handleInputChange('patient', 'patientId', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Patient Name"
                  value={adrForm.patient.name}
                  onChange={(e) => handleInputChange('patient', 'name', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Age"
                  value={adrForm.patient.age}
                  onChange={(e) => handleInputChange('patient', 'age', e.target.value)}
                />
                <select
                  value={adrForm.patient.gender}
                  onChange={(e) => handleInputChange('patient', 'gender', e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="number"
                  placeholder="Weight (kg)"
                  value={adrForm.patient.weight}
                  onChange={(e) => handleInputChange('patient', 'weight', e.target.value)}
                />
              </div>
              
              <div className="array-section">
                <label>Medical History</label>
                {adrForm.patient.medicalHistory.map((history, index) => (
                  <div key={index} className="array-input">
                    <input
                      type="text"
                      placeholder={`Medical condition ${index + 1}`}
                      value={history}
                      onChange={(e) => handleInputChange('patient', 'medicalHistory', e.target.value, index)}
                    />
                    {adrForm.patient.medicalHistory.length > 1 && (
                      <button onClick={() => removeArrayItem('patient', 'medicalHistory', index)}>✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addArrayItem('patient', 'medicalHistory')}>+ Add Condition</button>
              </div>
            </div>

            {/* Suspected Drug */}
            <div className="form-section">
              <h4>Suspected Drug</h4>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Drug Name"
                  value={adrForm.suspectedDrug.name}
                  onChange={(e) => handleInputChange('suspectedDrug', 'name', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Dosage"
                  value={adrForm.suspectedDrug.dosage}
                  onChange={(e) => handleInputChange('suspectedDrug', 'dosage', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Frequency"
                  value={adrForm.suspectedDrug.frequency}
                  onChange={(e) => handleInputChange('suspectedDrug', 'frequency', e.target.value)}
                />
                <input
                  type="date"
                  placeholder="Start Date"
                  value={adrForm.suspectedDrug.startDate}
                  onChange={(e) => handleInputChange('suspectedDrug', 'startDate', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Batch Number"
                  value={adrForm.suspectedDrug.batchNumber}
                  onChange={(e) => handleInputChange('suspectedDrug', 'batchNumber', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Manufacturer"
                  value={adrForm.suspectedDrug.manufacturer}
                  onChange={(e) => handleInputChange('suspectedDrug', 'manufacturer', e.target.value)}
                />
              </div>
            </div>

            {/* Reaction Details */}
            <div className="form-section">
              <h4>Reaction Details</h4>
              <textarea
                placeholder="Describe the adverse reaction..."
                value={adrForm.reaction.description}
                onChange={(e) => handleInputChange('reaction', 'description', e.target.value)}
                rows="4"
              />
              
              <div className="form-grid">
                <select
                  value={adrForm.reaction.severity}
                  onChange={(e) => handleInputChange('reaction', 'severity', e.target.value)}
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
                <input
                  type="text"
                  placeholder="Onset (e.g., 2 days after starting)"
                  value={adrForm.reaction.onset}
                  onChange={(e) => handleInputChange('reaction', 'onset', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Duration"
                  value={adrForm.reaction.duration}
                  onChange={(e) => handleInputChange('reaction', 'duration', e.target.value)}
                />
                <select
                  value={adrForm.reaction.outcome}
                  onChange={(e) => handleInputChange('reaction', 'outcome', e.target.value)}
                >
                  <option value="unknown">Unknown</option>
                  <option value="recovered">Recovered</option>
                  <option value="recovering">Recovering</option>
                  <option value="not_recovered">Not Recovered</option>
                  <option value="fatal">Fatal</option>
                </select>
              </div>

              <div className="array-section">
                <label>Symptoms</label>
                {adrForm.reaction.symptoms.map((symptom, index) => (
                  <div key={index} className="array-input">
                    <input
                      type="text"
                      placeholder={`Symptom ${index + 1}`}
                      value={symptom}
                      onChange={(e) => handleInputChange('reaction', 'symptoms', e.target.value, index)}
                    />
                    {adrForm.reaction.symptoms.length > 1 && (
                      <button onClick={() => removeArrayItem('reaction', 'symptoms', index)}>✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addArrayItem('reaction', 'symptoms')}>+ Add Symptom</button>
              </div>
            </div>

            {/* Assessment */}
            <div className="form-section">
              <h4>Clinical Assessment</h4>
              <div className="form-grid">
                <select
                  value={adrForm.assessment.causality}
                  onChange={(e) => handleInputChange('assessment', 'causality', e.target.value)}
                >
                  <option value="certain">Certain</option>
                  <option value="probable">Probable</option>
                  <option value="possible">Possible</option>
                  <option value="unlikely">Unlikely</option>
                  <option value="unrelated">Unrelated</option>
                </select>
                <select
                  value={adrForm.assessment.seriousness}
                  onChange={(e) => handleInputChange('assessment', 'seriousness', e.target.value)}
                >
                  <option value="non-serious">Non-serious</option>
                  <option value="serious">Serious</option>
                </select>
                <select
                  value={adrForm.assessment.expectedness}
                  onChange={(e) => handleInputChange('assessment', 'expectedness', e.target.value)}
                >
                  <option value="expected">Expected</option>
                  <option value="unexpected">Unexpected</option>
                  <option value="unknown">Unknown</option>
                </select>
                <select
                  value={adrForm.assessment.dechallenge}
                  onChange={(e) => handleInputChange('assessment', 'dechallenge', e.target.value)}
                >
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="not done">Not Done</option>
                </select>
              </div>
            </div>

            {/* Additional Information */}
            <div className="form-section">
              <h4>Additional Information</h4>
              
              <div className="array-section">
                <label>Concomitant Medications</label>
                {adrForm.additionalInfo.concomitantMeds.map((med, index) => (
                  <div key={index} className="array-input">
                    <input
                      type="text"
                      placeholder={`Medication ${index + 1}`}
                      value={med}
                      onChange={(e) => handleInputChange('additionalInfo', 'concomitantMeds', e.target.value, index)}
                    />
                    {adrForm.additionalInfo.concomitantMeds.length > 1 && (
                      <button onClick={() => removeArrayItem('additionalInfo', 'concomitantMeds', index)}>✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addArrayItem('additionalInfo', 'concomitantMeds')}>+ Add Medication</button>
              </div>

              <textarea
                placeholder="Laboratory results..."
                value={adrForm.additionalInfo.labResults}
                onChange={(e) => handleInputChange('additionalInfo', 'labResults', e.target.value)}
                rows="3"
              />

              <textarea
                placeholder="Additional notes..."
                value={adrForm.additionalInfo.notes}
                onChange={(e) => handleInputChange('additionalInfo', 'notes', e.target.value)}
                rows="4"
              />
            </div>

            <button className="submit-btn" onClick={submitADRReport} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit ADR Report'}
            </button>
          </div>
        )}

        {/* ADR List Tab */}
        {activeTab === 'list' && (
          <div className="adr-list">
            <div className="list-header">
              <h3>ADR Reports</h3>
              <div className="list-filters">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="all">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                >
                  <option value="all">All Severity</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading">Loading ADR reports...</div>
            ) : (
              <div className="adr-cards">
                {adrList.map((adr) => (
                  <div key={adr.id} className="adr-card" onClick={() => viewADRDetails(adr)}>
                    <div className="adr-card-header">
                      <div className="adr-info">
                        <h4>{adr.reportNumber}</h4>
                        <p>Patient: {adr.patient.name} ({adr.patient.age}y, {adr.patient.gender})</p>
                        <p>Drug: {adr.suspectedDrug.name}</p>
                      </div>
                      <div className="adr-badges">
                        <span 
                          className="severity-badge"
                          style={{ backgroundColor: getSeverityColor(adr.reaction.severity) }}
                        >
                          {adr.reaction.severity.toUpperCase()}
                        </span>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(adr.status) }}
                        >
                          {adr.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="adr-card-content">
                      <p className="reaction-description">{adr.reaction.description}</p>
                      <div className="adr-meta">
                        <span>Reported: {new Date(adr.reportDate).toLocaleDateString()}</span>
                        <span>Reporter: {adr.reporter.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div className="adr-statistics">
            <h3>ADR Statistics</h3>
            
            {loading ? (
              <div className="loading">Loading statistics...</div>
            ) : statistics ? (
              <div className="stats-content">
                <div className="stats-summary">
                  <div className="stat-card">
                    <h4>Total Reports</h4>
                    <p className="stat-number">{statistics.total}</p>
                  </div>
                  
                  <div className="stat-card">
                    <h4>By Status</h4>
                    {Object.entries(statistics.byStatus).map(([status, count]) => (
                      <div key={status} className="stat-item">
                        <span>{status.replace('_', ' ')}: {count}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="stat-card">
                    <h4>By Severity</h4>
                    {Object.entries(statistics.bySeverity).map(([severity, count]) => (
                      <div key={severity} className="stat-item">
                        <span>{severity}: {count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="stats-charts">
                  <div className="chart-section">
                    <h4>Top Drugs with ADRs</h4>
                    <div className="top-drugs">
                      {statistics.topDrugs.map((drug, index) => (
                        <div key={index} className="drug-stat">
                          <span className="drug-name">{drug.drug}</span>
                          <span className="drug-count">{drug.count} reports</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="chart-section">
                    <h4>Monthly Trend</h4>
                    <div className="monthly-trend">
                      {statistics.monthlyTrend.map((trend, index) => (
                        <div key={index} className="trend-item">
                          <span className="trend-month">{trend.month}</span>
                          <span className="trend-count">{trend.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-data">No statistics available</div>
            )}
          </div>
        )}
      </div>

      {/* ADR Details Modal */}
      {showDetailsModal && selectedAdr && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h3>ADR Report Details - {selectedAdr.reportNumber}</h3>
              <button onClick={() => setShowDetailsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="adr-details">
                <div className="detail-section">
                  <h4>Patient Information</h4>
                  <p><strong>Name:</strong> {selectedAdr.patient.name}</p>
                  <p><strong>Age:</strong> {selectedAdr.patient.age}</p>
                  <p><strong>Gender:</strong> {selectedAdr.patient.gender}</p>
                  <p><strong>Weight:</strong> {selectedAdr.patient.weight} kg</p>
                  <p><strong>Medical History:</strong> {selectedAdr.patient.medicalHistory.join(', ')}</p>
                </div>

                <div className="detail-section">
                  <h4>Suspected Drug</h4>
                  <p><strong>Name:</strong> {selectedAdr.suspectedDrug.name}</p>
                  <p><strong>Dosage:</strong> {selectedAdr.suspectedDrug.dosage}</p>
                  <p><strong>Frequency:</strong> {selectedAdr.suspectedDrug.frequency}</p>
                  <p><strong>Start Date:</strong> {new Date(selectedAdr.suspectedDrug.startDate).toLocaleDateString()}</p>
                  <p><strong>Batch:</strong> {selectedAdr.suspectedDrug.batchNumber}</p>
                  <p><strong>Manufacturer:</strong> {selectedAdr.suspectedDrug.manufacturer}</p>
                </div>

                <div className="detail-section">
                  <h4>Reaction Details</h4>
                  <p><strong>Description:</strong> {selectedAdr.reaction.description}</p>
                  <p><strong>Severity:</strong> {selectedAdr.reaction.severity}</p>
                  <p><strong>Onset:</strong> {selectedAdr.reaction.onset}</p>
                  <p><strong>Duration:</strong> {selectedAdr.reaction.duration}</p>
                  <p><strong>Outcome:</strong> {selectedAdr.reaction.outcome}</p>
                  <p><strong>Symptoms:</strong> {selectedAdr.reaction.symptoms.join(', ')}</p>
                </div>

                <div className="detail-section">
                  <h4>Assessment</h4>
                  <p><strong>Causality:</strong> {selectedAdr.assessment.causality}</p>
                  <p><strong>Seriousness:</strong> {selectedAdr.assessment.seriousness}</p>
                  <p><strong>Expectedness:</strong> {selectedAdr.assessment.expectedness}</p>
                  <p><strong>Dechallenge:</strong> {selectedAdr.assessment.dechallenge}</p>
                </div>

                <div className="detail-section">
                  <h4>Additional Information</h4>
                  <p><strong>Concomitant Medications:</strong> {selectedAdr.additionalInfo.concomitantMeds.join(', ')}</p>
                  <p><strong>Lab Results:</strong> {selectedAdr.additionalInfo.labResults}</p>
                  <p><strong>Notes:</strong> {selectedAdr.additionalInfo.notes}</p>
                </div>

                <div className="detail-section">
                  <h4>Reporter Information</h4>
                  <p><strong>Name:</strong> {selectedAdr.reporter.name}</p>
                  <p><strong>Profession:</strong> {selectedAdr.reporter.profession}</p>
                  <p><strong>Contact:</strong> {selectedAdr.reporter.contact}</p>
                  <p><strong>Institution:</strong> {selectedAdr.reporter.institution}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDetailsModal(false)}>Close</button>
              {user?.role === 'admin' && (
                <div className="status-actions">
                  <button onClick={() => updateADRStatus(selectedAdr.id, 'under_review')}>
                    Mark Under Review
                  </button>
                  <button onClick={() => updateADRStatus(selectedAdr.id, 'reviewed')}>
                    Mark Reviewed
                  </button>
                  <button onClick={() => updateADRStatus(selectedAdr.id, 'closed')}>
                    Close Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ADRReporting;