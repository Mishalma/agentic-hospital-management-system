import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DrugInformation.css';

const DrugInformation = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [drugInfo, setDrugInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Interaction checking states
  const [medications, setMedications] = useState(['']);
  const [drugInteractions, setDrugInteractions] = useState(null);
  const [foodInteractions, setFoodInteractions] = useState(null);
  const [incompatibilityCheck, setIncompatibilityCheck] = useState({ drug1: '', drug2: '', result: null });

  // Prescription analysis
  const [analysisData, setAnalysisData] = useState({
    medications: [''],
    allergies: [''],
    conditions: ['']
  });
  const [analysisResult, setAnalysisResult] = useState(null);

  // Search drugs
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`/api/drug-info/drugs/search/${searchQuery}`);
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Error searching drugs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get drug information
  const handleGetDrugInfo = async (drugName) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/drug-info/drugs/${drugName}`);
      if (response.data.success) {
        setDrugInfo(response.data.data);
        setSelectedDrug(drugName);
      }
    } catch (error) {
      console.error('Error getting drug info:', error);
      setDrugInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // Check drug-drug interactions
  const checkDrugInteractions = async () => {
    const validMeds = medications.filter(med => med.trim());
    if (validMeds.length < 2) return;

    try {
      setLoading(true);
      const response = await axios.post('/api/drug-info/interactions/drug-drug', {
        medications: validMeds
      });
      setDrugInteractions(response.data);
    } catch (error) {
      console.error('Error checking drug interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check food-drug interactions
  const checkFoodInteractions = async (drugName) => {
    if (!drugName.trim()) return;

    try {
      setLoading(true);
      const response = await axios.post('/api/drug-info/interactions/food-drug', {
        drugName: drugName
      });
      setFoodInteractions(response.data);
    } catch (error) {
      console.error('Error checking food interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check incompatibility
  const checkIncompatibility = async () => {
    if (!incompatibilityCheck.drug1.trim() || !incompatibilityCheck.drug2.trim()) return;

    try {
      setLoading(true);
      const response = await axios.post('/api/drug-info/interactions/incompatibility', {
        drug1: incompatibilityCheck.drug1,
        drug2: incompatibilityCheck.drug2
      });
      setIncompatibilityCheck(prev => ({ ...prev, result: response.data }));
    } catch (error) {
      console.error('Error checking incompatibility:', error);
    } finally {
      setLoading(false);
    }
  };

  // Analyze prescription
  const analyzePrescription = async () => {
    const validMeds = analysisData.medications.filter(med => med.trim());
    if (validMeds.length === 0) return;

    try {
      setLoading(true);
      const response = await axios.post('/api/drug-info/analyze', {
        medications: validMeds,
        patientAllergies: analysisData.allergies.filter(allergy => allergy.trim()),
        patientConditions: analysisData.conditions.filter(condition => condition.trim())
      });
      setAnalysisResult(response.data);
    } catch (error) {
      console.error('Error analyzing prescription:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add/remove medication inputs
  const addMedicationInput = (type) => {
    if (type === 'medications') {
      setMedications([...medications, '']);
    } else if (type === 'analysis') {
      setAnalysisData(prev => ({
        ...prev,
        medications: [...prev.medications, '']
      }));
    }
  };

  const removeMedicationInput = (index, type) => {
    if (type === 'medications') {
      setMedications(medications.filter((_, i) => i !== index));
    } else if (type === 'analysis') {
      setAnalysisData(prev => ({
        ...prev,
        medications: prev.medications.filter((_, i) => i !== index)
      }));
    }
  };

  const addInput = (field) => {
    setAnalysisData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeInput = (field, index) => {
    setAnalysisData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#e74c3c';
      case 'moderate': return '#f39c12';
      case 'low': return '#f1c40f';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="drug-information">
      <div className="drug-info-header">
        <h1>Drug Information System</h1>
        <p>Comprehensive drug database with interaction checking and safety analysis</p>
      </div>

      <div className="drug-info-tabs">
        <button 
          className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Drug Search
        </button>
        <button 
          className={`tab-button ${activeTab === 'interactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('interactions')}
        >
          ⚠️ Drug Interactions
        </button>
        <button 
          className={`tab-button ${activeTab === 'food' ? 'active' : ''}`}
          onClick={() => setActiveTab('food')}
        >
          🍎 Food Interactions
        </button>
        <button 
          className={`tab-button ${activeTab === 'incompatibility' ? 'active' : ''}`}
          onClick={() => setActiveTab('incompatibility')}
        >
          🚫 Incompatibility
        </button>
        <button 
          className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          📊 Prescription Analysis
        </button>
      </div>

      <div className="drug-info-content">
        {/* Drug Search Tab */}
        {activeTab === 'search' && (
          <div className="search-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search for drugs by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            <div className="search-results">
              <div className="results-list">
                <h3>Search Results ({searchResults.length})</h3>
                {searchResults.map((drug, index) => (
                  <div key={index} className="drug-result-item" onClick={() => handleGetDrugInfo(drug.id)}>
                    <div className="drug-name">{drug.name}</div>
                    <div className="drug-category">{drug.category}</div>
                    <div className="drug-description">{drug.description}</div>
                  </div>
                ))}
              </div>

              {drugInfo && (
                <div className="drug-details">
                  <h3>{drugInfo.name} ({drugInfo.category})</h3>
                  <p className="drug-description">{drugInfo.description}</p>

                  <div className="drug-info-section">
                    <h4>Side Effects</h4>
                    <ul>
                      {drugInfo.sideEffects?.map((effect, index) => (
                        <li key={index}>{effect}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="drug-info-section">
                    <h4>Contraindications</h4>
                    <ul>
                      {drugInfo.contraindications?.map((contra, index) => (
                        <li key={index}>{contra}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="drug-info-section">
                    <h4>Food Interactions</h4>
                    {drugInfo.foodInteractions?.map((interaction, index) => (
                      <div key={index} className="interaction-item">
                        <span className="food-name">{interaction.food}</span>
                        <span className={`severity ${interaction.severity}`}>
                          {interaction.severity.toUpperCase()}
                        </span>
                        <p>{interaction.effect}</p>
                      </div>
                    ))}
                  </div>

                  <div className="drug-info-section">
                    <h4>Drug Interactions</h4>
                    {drugInfo.drugInteractions?.map((interaction, index) => (
                      <div key={index} className="interaction-item">
                        <span className="drug-name">{interaction.drug}</span>
                        <span className={`severity ${interaction.severity}`}>
                          {interaction.severity.toUpperCase()}
                        </span>
                        <p>{interaction.effect}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Drug Interactions Tab */}
        {activeTab === 'interactions' && (
          <div className="interactions-section">
            <h3>Drug-Drug Interaction Checker</h3>
            <p>Enter multiple medications to check for potential interactions</p>

            <div className="medication-inputs">
              {medications.map((med, index) => (
                <div key={index} className="input-group">
                  <input
                    type="text"
                    placeholder={`Medication ${index + 1}`}
                    value={med}
                    onChange={(e) => {
                      const newMeds = [...medications];
                      newMeds[index] = e.target.value;
                      setMedications(newMeds);
                    }}
                  />
                  {medications.length > 1 && (
                    <button 
                      className="remove-btn"
                      onClick={() => removeMedicationInput(index, 'medications')}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              
              <button className="add-btn" onClick={() => addMedicationInput('medications')}>
                + Add Medication
              </button>
              
              <button className="check-btn" onClick={checkDrugInteractions} disabled={loading}>
                {loading ? 'Checking...' : 'Check Interactions'}
              </button>
            </div>

            {drugInteractions && (
              <div className="interaction-results">
                <h4>Interaction Results</h4>
                {drugInteractions.hasInteractions ? (
                  <div>
                    <div className="interaction-summary">
                      <span className="total-interactions">
                        {drugInteractions.interactions.length} interactions found
                      </span>
                      {drugInteractions.highRiskInteractions > 0 && (
                        <span className="high-risk-alert">
                          {drugInteractions.highRiskInteractions} HIGH RISK
                        </span>
                      )}
                    </div>
                    
                    {drugInteractions.interactions.map((interaction, index) => (
                      <div key={index} className="interaction-detail">
                        <div className="interaction-header">
                          <span className="drug-pair">
                            {interaction.drug1} + {interaction.drug2}
                          </span>
                          <span 
                            className={`severity-badge ${interaction.severity}`}
                            style={{ backgroundColor: getSeverityColor(interaction.severity) }}
                          >
                            {interaction.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="interaction-effect">{interaction.effect}</p>
                        <p className="interaction-recommendation">{interaction.recommendation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-interactions">
                    ✅ No significant interactions found between the selected medications.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Food Interactions Tab */}
        {activeTab === 'food' && (
          <div className="food-interactions-section">
            <h3>Food-Drug Interaction Checker</h3>
            <p>Check how food affects medication absorption and effectiveness</p>

            <div className="food-check-input">
              <input
                type="text"
                placeholder="Enter medication name"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    checkFoodInteractions(e.target.value);
                  }
                }}
              />
              <button 
                onClick={(e) => {
                  const input = e.target.previousElementSibling;
                  checkFoodInteractions(input.value);
                }}
                disabled={loading}
              >
                {loading ? 'Checking...' : 'Check Food Interactions'}
              </button>
            </div>

            {foodInteractions && (
              <div className="food-interaction-results">
                <h4>Food Interactions for {foodInteractions.drugName}</h4>
                {foodInteractions.hasInteractions ? (
                  foodInteractions.interactions.map((interaction, index) => (
                    <div key={index} className="food-interaction-item">
                      <div className="food-interaction-header">
                        <span className="food-name">{interaction.food}</span>
                        <span 
                          className={`severity-badge ${interaction.severity}`}
                          style={{ backgroundColor: getSeverityColor(interaction.severity) }}
                        >
                          {interaction.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="interaction-effect">{interaction.effect}</p>
                      <p className="interaction-recommendation">{interaction.recommendation}</p>
                    </div>
                  ))
                ) : (
                  <div className="no-interactions">
                    ✅ No significant food interactions found for this medication.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Incompatibility Tab */}
        {activeTab === 'incompatibility' && (
          <div className="incompatibility-section">
            <h3>Drug Incompatibility Checker</h3>
            <p>Check if two medications can be mixed or administered together (IV compatibility)</p>

            <div className="incompatibility-inputs">
              <input
                type="text"
                placeholder="First medication"
                value={incompatibilityCheck.drug1}
                onChange={(e) => setIncompatibilityCheck(prev => ({ ...prev, drug1: e.target.value }))}
              />
              <span className="vs-text">vs</span>
              <input
                type="text"
                placeholder="Second medication"
                value={incompatibilityCheck.drug2}
                onChange={(e) => setIncompatibilityCheck(prev => ({ ...prev, drug2: e.target.value }))}
              />
              <button onClick={checkIncompatibility} disabled={loading}>
                {loading ? 'Checking...' : 'Check Compatibility'}
              </button>
            </div>

            {incompatibilityCheck.result && (
              <div className="incompatibility-result">
                <div className={`compatibility-status ${incompatibilityCheck.result.incompatible ? 'incompatible' : 'compatible'}`}>
                  {incompatibilityCheck.result.incompatible ? (
                    <span>⚠️ INCOMPATIBLE</span>
                  ) : (
                    <span>✅ COMPATIBLE</span>
                  )}
                </div>
                <p className="compatibility-recommendation">
                  {incompatibilityCheck.result.recommendation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Prescription Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="analysis-section">
            <h3>Comprehensive Prescription Analysis</h3>
            <p>Analyze complete prescription for interactions, allergies, and contraindications</p>

            <div className="analysis-inputs">
              <div className="input-section">
                <h4>Medications</h4>
                {analysisData.medications.map((med, index) => (
                  <div key={index} className="input-group">
                    <input
                      type="text"
                      placeholder={`Medication ${index + 1}`}
                      value={med}
                      onChange={(e) => {
                        const newData = { ...analysisData };
                        newData.medications[index] = e.target.value;
                        setAnalysisData(newData);
                      }}
                    />
                    {analysisData.medications.length > 1 && (
                      <button onClick={() => removeInput('medications', index)}>✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addInput('medications')}>+ Add Medication</button>
              </div>

              <div className="input-section">
                <h4>Patient Allergies</h4>
                {analysisData.allergies.map((allergy, index) => (
                  <div key={index} className="input-group">
                    <input
                      type="text"
                      placeholder={`Allergy ${index + 1}`}
                      value={allergy}
                      onChange={(e) => {
                        const newData = { ...analysisData };
                        newData.allergies[index] = e.target.value;
                        setAnalysisData(newData);
                      }}
                    />
                    {analysisData.allergies.length > 1 && (
                      <button onClick={() => removeInput('allergies', index)}>✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addInput('allergies')}>+ Add Allergy</button>
              </div>

              <div className="input-section">
                <h4>Medical Conditions</h4>
                {analysisData.conditions.map((condition, index) => (
                  <div key={index} className="input-group">
                    <input
                      type="text"
                      placeholder={`Condition ${index + 1}`}
                      value={condition}
                      onChange={(e) => {
                        const newData = { ...analysisData };
                        newData.conditions[index] = e.target.value;
                        setAnalysisData(newData);
                      }}
                    />
                    {analysisData.conditions.length > 1 && (
                      <button onClick={() => removeInput('conditions', index)}>✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addInput('conditions')}>+ Add Condition</button>
              </div>

              <button className="analyze-btn" onClick={analyzePrescription} disabled={loading}>
                {loading ? 'Analyzing...' : 'Analyze Prescription'}
              </button>
            </div>

            {analysisResult && (
              <div className="analysis-results">
                <h4>Analysis Results</h4>
                
                {/* Allergy Alerts */}
                {analysisResult.analysis.allergyAlerts.length > 0 && (
                  <div className="alert-section critical">
                    <h5>🚨 CRITICAL ALLERGY ALERTS</h5>
                    {analysisResult.analysis.allergyAlerts.map((alert, index) => (
                      <div key={index} className="alert-item">
                        <strong>{alert.drug}</strong> - Patient allergic to {alert.allergy}
                      </div>
                    ))}
                  </div>
                )}

                {/* Contraindications */}
                {analysisResult.analysis.contraindications.length > 0 && (
                  <div className="alert-section warning">
                    <h5>⚠️ CONTRAINDICATIONS</h5>
                    {analysisResult.analysis.contraindications.map((contra, index) => (
                      <div key={index} className="alert-item">
                        <strong>{contra.drug}</strong> - Contraindicated in {contra.contraindication}
                        <br />
                        <small>Patient condition: {contra.patientCondition}</small>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drug Interactions */}
                {analysisResult.analysis.drugInteractions.hasInteractions && (
                  <div className="alert-section info">
                    <h5>💊 DRUG INTERACTIONS</h5>
                    {analysisResult.analysis.drugInteractions.interactions.map((interaction, index) => (
                      <div key={index} className="alert-item">
                        <strong>{interaction.drug1} + {interaction.drug2}</strong>
                        <br />
                        {interaction.effect}
                        <br />
                        <small>{interaction.recommendation}</small>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {analysisResult.analysis.recommendations.length > 0 && (
                  <div className="recommendations-section">
                    <h5>📋 RECOMMENDATIONS</h5>
                    {analysisResult.analysis.recommendations.map((rec, index) => (
                      <div key={index} className="recommendation-item">
                        {rec}
                      </div>
                    ))}
                  </div>
                )}

                {/* Safe Prescription */}
                {analysisResult.analysis.allergyAlerts.length === 0 && 
                 analysisResult.analysis.contraindications.length === 0 && 
                 analysisResult.analysis.drugInteractions.highRiskInteractions === 0 && (
                  <div className="safe-prescription">
                    ✅ Prescription appears safe with no critical issues identified.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DrugInformation;