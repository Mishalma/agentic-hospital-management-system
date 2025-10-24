import React, { useState, useEffect } from 'react';
import './EmergencyCaseDetails.css';

const EmergencyCaseDetails = ({ caseId, onClose }) => {
  const [caseData, setCase] = useState(null);
  const [deteriorationPrediction, setDeteriorationPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newOrder, setNewOrder] = useState({
    type: 'medication',
    description: '',
    urgency: 'routine'
  });
  const [showOrderForm, setShowOrderForm] = useState(false);

  useEffect(() => {
    if (caseId) {
      fetchCaseDetails();
      const interval = setInterval(fetchCaseDetails, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [caseId]);

  const fetchCaseDetails = async () => {
    try {
      const response = await fetch(`/api/emergency/cases/${caseId}`);
      const data = await response.json();
      setCase(data.case);
      setDeteriorationPrediction(data.deteriorationPrediction);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching case details:', error);
      setLoading(false);
    }
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/emergency/cases/${caseId}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newOrder,
          orderedBy: 'Current User' // Should come from auth context
        })
      });

      if (response.ok) {
        setNewOrder({ type: 'medication', description: '', urgency: 'routine' });
        setShowOrderForm(false);
        fetchCaseDetails(); // Refresh data
      }
    } catch (error) {
      console.error('Error adding order:', error);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`/api/emergency/cases/${caseId}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          completedBy: status === 'completed' ? 'Current User' : undefined
        })
      });

      if (response.ok) {
        fetchCaseDetails(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleDischarge = async () => {
    const disposition = prompt('Enter disposition (Home, Admitted, Transfer, etc.):');
    if (!disposition) return;

    const dischargeNotes = prompt('Enter discharge notes:');
    
    try {
      const response = await fetch(`/api/emergency/cases/${caseId}/discharge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          disposition,
          dischargeNotes,
          followUpInstructions: 'Follow up with primary care physician in 1-2 weeks'
        })
      });

      if (response.ok) {
        fetchCaseDetails();
        alert('Patient discharged successfully');
      }
    } catch (error) {
      console.error('Error discharging patient:', error);
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

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'in-progress': return '#ffc107';
      case 'pending': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (startTime, endTime = null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMinutes = Math.floor((end - start) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="case-details-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading case details...</p>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="case-details-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>Case not found</p>
      </div>
    );
  }

  return (
    <div className="emergency-case-details">
      <div className="case-header">
        <div className="case-title">
          <h1>
            <i className="fas fa-user-injured"></i>
            Case #{caseData._id.slice(-6)}
          </h1>
          <div className="case-status">
            <span 
              className="priority-badge"
              style={{ backgroundColor: getPriorityColor(caseData.priority) }}
            >
              {caseData.priority} Priority
            </span>
            <span className={`status-badge ${caseData.status}`}>
              {caseData.status.charAt(0).toUpperCase() + caseData.status.slice(1)}
            </span>
          </div>
        </div>
        
        <div className="case-actions">
          {caseData.status === 'active' && (
            <>
              <button className="btn btn-success" onClick={handleDischarge}>
                <i className="fas fa-sign-out-alt"></i>
                Discharge
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setShowOrderForm(true)}
              >
                <i className="fas fa-plus"></i>
                Add Order
              </button>
            </>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            <i className="fas fa-times"></i>
            Close
          </button>
        </div>
      </div>

      {deteriorationPrediction && deteriorationPrediction.risk !== 'Low' && (
        <div className={`deterioration-alert ${deteriorationPrediction.risk.toLowerCase()}`}>
          <div className="alert-content">
            <i className="fas fa-exclamation-triangle"></i>
            <div>
              <strong>Deterioration Risk: {deteriorationPrediction.risk}</strong>
              <p>Confidence: {deteriorationPrediction.confidence}%</p>
              <ul>
                {deteriorationPrediction.recommendations?.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="case-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'vitals' ? 'active' : ''}`}
          onClick={() => setActiveTab('vitals')}
        >
          Vitals History
        </button>
        <button 
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Treatment Orders
        </button>
        <button 
          className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
      </div>

      <div className="case-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="info-grid">
              <div className="info-card">
                <h3>
                  <i className="fas fa-user"></i>
                  Patient Information
                </h3>
                <div className="info-details">
                  <p><strong>Name:</strong> {caseData.patientId?.name || 'Unknown'}</p>
                  <p><strong>Age:</strong> {caseData.patientId?.age || 'Unknown'}</p>
                  <p><strong>Gender:</strong> {caseData.patientId?.gender || 'Unknown'}</p>
                  <p><strong>Arrival Time:</strong> {formatDateTime(caseData.arrivalTime)}</p>
                  <p><strong>Arrival Mode:</strong> {caseData.arrivalMode}</p>
                  {caseData.treatmentStartTime && (
                    <p><strong>Treatment Started:</strong> {formatDateTime(caseData.treatmentStartTime)}</p>
                  )}
                  <p><strong>Total Time in ED:</strong> {formatDuration(caseData.arrivalTime, caseData.dischargeTime)}</p>
                </div>
              </div>

              <div className="info-card">
                <h3>
                  <i className="fas fa-stethoscope"></i>
                  Clinical Information
                </h3>
                <div className="info-details">
                  <p><strong>Chief Complaint:</strong> {caseData.chiefComplaint}</p>
                  <p><strong>Triage Score:</strong> {caseData.triageScore}/20</p>
                  <p><strong>Recommended Action:</strong> {caseData.recommendedAction}</p>
                  {caseData.symptoms?.length > 0 && (
                    <div>
                      <strong>Symptoms:</strong>
                      <div className="symptoms-list">
                        {caseData.symptoms.map((symptom, index) => (
                          <span key={index} className="symptom-tag">{symptom}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="info-card">
                <h3>
                  <i className="fas fa-heartbeat"></i>
                  Current Vitals
                </h3>
                <div className="vitals-display">
                  <div className="vital-item">
                    <span className="vital-label">Blood Pressure</span>
                    <span className="vital-value">
                      {caseData.vitals?.systolicBP}/{caseData.vitals?.diastolicBP} mmHg
                    </span>
                  </div>
                  <div className="vital-item">
                    <span className="vital-label">Heart Rate</span>
                    <span className="vital-value">{caseData.vitals?.heartRate} bpm</span>
                  </div>
                  <div className="vital-item">
                    <span className="vital-label">Temperature</span>
                    <span className="vital-value">{caseData.vitals?.temperature}°C</span>
                  </div>
                  <div className="vital-item">
                    <span className="vital-label">O2 Saturation</span>
                    <span className="vital-value">{caseData.vitals?.oxygenSaturation}%</span>
                  </div>
                  <div className="vital-item">
                    <span className="vital-label">Respiratory Rate</span>
                    <span className="vital-value">{caseData.vitals?.respiratoryRate} /min</span>
                  </div>
                  {caseData.vitals?.painScale && (
                    <div className="vital-item">
                      <span className="vital-label">Pain Scale</span>
                      <span className="vital-value">{caseData.vitals.painScale}/10</span>
                    </div>
                  )}
                </div>
              </div>

              {caseData.riskFactors?.length > 0 && (
                <div className="info-card risk-factors-card">
                  <h3>
                    <i className="fas fa-exclamation-triangle"></i>
                    Risk Factors
                  </h3>
                  <ul className="risk-factors-list">
                    {caseData.riskFactors.map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}

              {caseData.assignedStaff?.length > 0 && (
                <div className="info-card">
                  <h3>
                    <i className="fas fa-user-md"></i>
                    Assigned Staff
                  </h3>
                  <div className="staff-list">
                    {caseData.assignedStaff.map((staff, index) => (
                      <div key={index} className="staff-item">
                        <strong>{staff.staffId?.name || 'Unknown'}</strong>
                        <span className="staff-role">{staff.role}</span>
                        <span className="staff-time">
                          Since {formatDateTime(staff.assignedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="vitals-history">
            <h3>Vitals History</h3>
            <div className="vitals-timeline">
              {caseData.vitalsHistory?.map((vitals, index) => (
                <div key={index} className="vitals-entry">
                  <div className="vitals-time">
                    {formatDateTime(vitals.timestamp)}
                  </div>
                  <div className="vitals-values">
                    <span>BP: {vitals.systolicBP}/{vitals.diastolicBP}</span>
                    <span>HR: {vitals.heartRate}</span>
                    <span>Temp: {vitals.temperature}°C</span>
                    <span>O2: {vitals.oxygenSaturation}%</span>
                    <span>RR: {vitals.respiratoryRate}</span>
                    {vitals.painScale && <span>Pain: {vitals.painScale}/10</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="treatment-orders">
            <div className="orders-header">
              <h3>Treatment Orders</h3>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setShowOrderForm(true)}
              >
                <i className="fas fa-plus"></i>
                Add Order
              </button>
            </div>
            
            <div className="orders-list">
              {caseData.treatmentOrders?.length === 0 ? (
                <div className="no-orders">No treatment orders yet</div>
              ) : (
                caseData.treatmentOrders?.map((order) => (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <div className="order-type">
                        <i className={`fas ${order.type === 'medication' ? 'fa-pills' : 
                                           order.type === 'lab' ? 'fa-vial' : 
                                           order.type === 'imaging' ? 'fa-x-ray' : 'fa-notes-medical'}`}></i>
                        {order.type.charAt(0).toUpperCase() + order.type.slice(1)}
                      </div>
                      <div className="order-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getOrderStatusColor(order.status) }}
                        >
                          {order.status}
                        </span>
                        <span className={`urgency-badge ${order.urgency}`}>
                          {order.urgency}
                        </span>
                      </div>
                    </div>
                    <div className="order-description">
                      {order.description}
                    </div>
                    <div className="order-meta">
                      <span>Ordered by: {order.orderedBy}</span>
                      <span>Time: {formatDateTime(order.orderedAt)}</span>
                      {order.completedAt && (
                        <span>Completed: {formatDateTime(order.completedAt)}</span>
                      )}
                    </div>
                    {order.status === 'pending' && (
                      <div className="order-actions">
                        <button 
                          className="btn btn-sm btn-warning"
                          onClick={() => handleUpdateOrderStatus(order._id, 'in-progress')}
                        >
                          Start
                        </button>
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => handleUpdateOrderStatus(order._id, 'completed')}
                        >
                          Complete
                        </button>
                      </div>
                    )}
                    {order.status === 'in-progress' && (
                      <div className="order-actions">
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => handleUpdateOrderStatus(order._id, 'completed')}
                        >
                          Complete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="case-timeline">
            <h3>Case Timeline</h3>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-marker arrival"></div>
                <div className="timeline-content">
                  <div className="timeline-time">{formatDateTime(caseData.arrivalTime)}</div>
                  <div className="timeline-event">Patient arrived via {caseData.arrivalMode}</div>
                  <div className="timeline-details">Chief complaint: {caseData.chiefComplaint}</div>
                </div>
              </div>
              
              {caseData.treatmentStartTime && (
                <div className="timeline-item">
                  <div className="timeline-marker treatment"></div>
                  <div className="timeline-content">
                    <div className="timeline-time">{formatDateTime(caseData.treatmentStartTime)}</div>
                    <div className="timeline-event">Treatment started</div>
                    <div className="timeline-details">Priority: {caseData.priority}</div>
                  </div>
                </div>
              )}
              
              {caseData.treatmentOrders?.map((order, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-marker order"></div>
                  <div className="timeline-content">
                    <div className="timeline-time">{formatDateTime(order.orderedAt)}</div>
                    <div className="timeline-event">{order.type} order placed</div>
                    <div className="timeline-details">{order.description}</div>
                  </div>
                </div>
              ))}
              
              {caseData.dischargeTime && (
                <div className="timeline-item">
                  <div className="timeline-marker discharge"></div>
                  <div className="timeline-content">
                    <div className="timeline-time">{formatDateTime(caseData.dischargeTime)}</div>
                    <div className="timeline-event">Patient discharged</div>
                    <div className="timeline-details">Disposition: {caseData.disposition}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showOrderForm && (
        <div className="modal-overlay" onClick={() => setShowOrderForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Treatment Order</h3>
              <button 
                className="close-btn"
                onClick={() => setShowOrderForm(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddOrder} className="order-form">
              <div className="form-group">
                <label>Order Type</label>
                <select
                  value={newOrder.type}
                  onChange={(e) => setNewOrder({...newOrder, type: e.target.value})}
                  className="form-control"
                  required
                >
                  <option value="medication">Medication</option>
                  <option value="lab">Laboratory</option>
                  <option value="imaging">Imaging</option>
                  <option value="procedure">Procedure</option>
                  <option value="consultation">Consultation</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newOrder.description}
                  onChange={(e) => setNewOrder({...newOrder, description: e.target.value})}
                  className="form-control"
                  rows="3"
                  placeholder="Enter order details..."
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Urgency</label>
                <select
                  value={newOrder.urgency}
                  onChange={(e) => setNewOrder({...newOrder, urgency: e.target.value})}
                  className="form-control"
                  required
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOrderForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyCaseDetails;