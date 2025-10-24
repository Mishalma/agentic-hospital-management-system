import React, { useState, useEffect } from 'react';
import './EmergencyDashboard.css';

const EmergencyDashboard = () => {
  const [stats, setStats] = useState({
    today: { total: 0, critical: 0, high: 0, medium: 0, low: 0, completed: 0 },
    active: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
    averageWaitTime: 0,
    bedOccupancy: 0
  });
  const [queue, setQueue] = useState({
    critical: [],
    high: [],
    medium: [],
    low: []
  });
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, queueResponse] = await Promise.all([
        fetch('/api/emergency/dashboard/stats'),
        fetch('/api/emergency/queue')
      ]);

      const statsData = await statsResponse.json();
      const queueData = await queueResponse.json();

      setStats(statsData);
      setQueue(queueData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const formatWaitTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleCaseClick = (caseItem) => {
    setSelectedCase(caseItem);
  };

  const StatCard = ({ title, value, subtitle, color = '#007bff', icon }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: color }}>
        <i className={icon}></i>
      </div>
      <div className="stat-content">
        <h3>{value}</h3>
        <p>{title}</p>
        {subtitle && <small>{subtitle}</small>}
      </div>
    </div>
  );

  const PriorityQueue = ({ title, cases, priority }) => (
    <div className="priority-queue">
      <div className="queue-header">
        <h4 style={{ color: getPriorityColor(priority) }}>
          {title} ({cases.length})
        </h4>
      </div>
      <div className="queue-cases">
        {cases.length === 0 ? (
          <div className="no-cases">No {priority.toLowerCase()} priority cases</div>
        ) : (
          cases.map((caseItem) => (
            <div 
              key={caseItem._id} 
              className="case-card"
              onClick={() => handleCaseClick(caseItem)}
            >
              <div className="case-header">
                <span className="case-id">#{caseItem._id.slice(-6)}</span>
                <span className="wait-time">{formatWaitTime(caseItem.waitTime)}</span>
              </div>
              <div className="case-patient">
                <strong>{caseItem.patientId?.name || 'Unknown Patient'}</strong>
                <span className="patient-age">
                  {caseItem.patientId?.age}y, {caseItem.patientId?.gender}
                </span>
              </div>
              <div className="case-complaint">
                {caseItem.chiefComplaint}
              </div>
              <div className="case-vitals">
                <span>BP: {caseItem.vitals?.systolicBP}/{caseItem.vitals?.diastolicBP}</span>
                <span>HR: {caseItem.vitals?.heartRate}</span>
                <span>O2: {caseItem.vitals?.oxygenSaturation}%</span>
              </div>
              {caseItem.assignedStaff?.length > 0 && (
                <div className="case-staff">
                  Assigned: {caseItem.assignedStaff[0].staffId?.name}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="emergency-dashboard">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading Emergency Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="emergency-dashboard">
      <div className="dashboard-header">
        <h1>
          <i className="fas fa-ambulance"></i>
          Emergency Department Dashboard
        </h1>
        <div className="header-actions">
          <button className="btn btn-primary">
            <i className="fas fa-plus"></i>
            New Case
          </button>
          <button className="btn btn-secondary" onClick={fetchDashboardData}>
            <i className="fas fa-sync-alt"></i>
            Refresh
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          Priority Queue
        </button>
        <button 
          className={`tab ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          Metrics
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="dashboard-content">
          <div className="stats-grid">
            <StatCard
              title="Total Cases Today"
              value={stats.today.total}
              subtitle={`${stats.today.completed} completed`}
              color="#007bff"
              icon="fas fa-calendar-day"
            />
            <StatCard
              title="Active Cases"
              value={stats.active.total}
              subtitle="Currently in ED"
              color="#28a745"
              icon="fas fa-user-injured"
            />
            <StatCard
              title="Critical Cases"
              value={stats.active.critical}
              subtitle="Immediate attention"
              color="#dc3545"
              icon="fas fa-exclamation-triangle"
            />
            <StatCard
              title="Average Wait Time"
              value={formatWaitTime(stats.averageWaitTime)}
              subtitle="For treatment start"
              color="#ffc107"
              icon="fas fa-clock"
            />
            <StatCard
              title="Bed Occupancy"
              value={`${stats.bedOccupancy}%`}
              subtitle="Current utilization"
              color="#17a2b8"
              icon="fas fa-bed"
            />
          </div>

          <div className="priority-overview">
            <h3>Priority Distribution</h3>
            <div className="priority-bars">
              {['critical', 'high', 'medium', 'low'].map(priority => (
                <div key={priority} className="priority-bar">
                  <div className="priority-label">
                    <span style={{ color: getPriorityColor(priority.charAt(0).toUpperCase() + priority.slice(1)) }}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                    <span>{stats.active[priority]}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${(stats.active[priority] / Math.max(stats.active.total, 1)) * 100}%`,
                        backgroundColor: getPriorityColor(priority.charAt(0).toUpperCase() + priority.slice(1))
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'queue' && (
        <div className="dashboard-content">
          <div className="queue-grid">
            <PriorityQueue 
              title="Critical Priority" 
              cases={queue.critical} 
              priority="Critical"
            />
            <PriorityQueue 
              title="High Priority" 
              cases={queue.high} 
              priority="High"
            />
            <PriorityQueue 
              title="Medium Priority" 
              cases={queue.medium} 
              priority="Medium"
            />
            <PriorityQueue 
              title="Low Priority" 
              cases={queue.low} 
              priority="Low"
            />
          </div>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="dashboard-content">
          <div className="metrics-grid">
            <div className="metric-card">
              <h4>Performance Indicators</h4>
              <div className="metric-item">
                <span>Door-to-Doctor Time</span>
                <span className="metric-value">{formatWaitTime(stats.averageWaitTime)}</span>
              </div>
              <div className="metric-item">
                <span>Left Without Being Seen</span>
                <span className="metric-value">2.3%</span>
              </div>
              <div className="metric-item">
                <span>Patient Satisfaction</span>
                <span className="metric-value">4.2/5</span>
              </div>
            </div>

            <div className="metric-card">
              <h4>Resource Utilization</h4>
              <div className="metric-item">
                <span>Trauma Bays</span>
                <span className="metric-value">3/4 (75%)</span>
              </div>
              <div className="metric-item">
                <span>Acute Beds</span>
                <span className="metric-value">12/15 (80%)</span>
              </div>
              <div className="metric-item">
                <span>Standard Beds</span>
                <span className="metric-value">18/20 (90%)</span>
              </div>
            </div>

            <div className="metric-card">
              <h4>Quality Metrics</h4>
              <div className="metric-item">
                <span>Triage Accuracy</span>
                <span className="metric-value">94.2%</span>
              </div>
              <div className="metric-item">
                <span>Readmission Rate (72h)</span>
                <span className="metric-value">1.8%</span>
              </div>
              <div className="metric-item">
                <span>Mortality Rate</span>
                <span className="metric-value">0.3%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCase && (
        <div className="case-modal-overlay" onClick={() => setSelectedCase(null)}>
          <div className="case-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Case #{selectedCase._id.slice(-6)}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedCase(null)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="case-details">
                <div className="detail-section">
                  <h4>Patient Information</h4>
                  <p><strong>Name:</strong> {selectedCase.patientId?.name}</p>
                  <p><strong>Age:</strong> {selectedCase.patientId?.age}</p>
                  <p><strong>Gender:</strong> {selectedCase.patientId?.gender}</p>
                </div>
                
                <div className="detail-section">
                  <h4>Case Details</h4>
                  <p><strong>Chief Complaint:</strong> {selectedCase.chiefComplaint}</p>
                  <p><strong>Priority:</strong> 
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(selectedCase.priority) }}
                    >
                      {selectedCase.priority}
                    </span>
                  </p>
                  <p><strong>Arrival Time:</strong> {new Date(selectedCase.arrivalTime).toLocaleString()}</p>
                  <p><strong>Wait Time:</strong> {formatWaitTime(selectedCase.waitTime)}</p>
                </div>

                <div className="detail-section">
                  <h4>Current Vitals</h4>
                  <div className="vitals-grid">
                    <div>BP: {selectedCase.vitals?.systolicBP}/{selectedCase.vitals?.diastolicBP}</div>
                    <div>HR: {selectedCase.vitals?.heartRate} bpm</div>
                    <div>Temp: {selectedCase.vitals?.temperature}°C</div>
                    <div>O2 Sat: {selectedCase.vitals?.oxygenSaturation}%</div>
                    <div>RR: {selectedCase.vitals?.respiratoryRate}</div>
                  </div>
                </div>

                {selectedCase.riskFactors?.length > 0 && (
                  <div className="detail-section">
                    <h4>Risk Factors</h4>
                    <ul>
                      {selectedCase.riskFactors.map((factor, index) => (
                        <li key={index}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Recommended Action</h4>
                  <p>{selectedCase.recommendedAction}</p>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary">
                <i className="fas fa-user-md"></i>
                Assign Staff
              </button>
              <button className="btn btn-secondary">
                <i className="fas fa-notes-medical"></i>
                Add Order
              </button>
              <button className="btn btn-info">
                <i className="fas fa-chart-line"></i>
                View Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyDashboard;