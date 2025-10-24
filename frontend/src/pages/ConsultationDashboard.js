import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './ConsultationDashboard.css';

const ConsultationDashboard = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    patientId: ''
  });

  useEffect(() => {
    fetchConsultations();
    fetchStats();
  }, [filters]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const params = {
        doctorId: user.id,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.patientId && { patientId: filters.patientId })
      };

      const response = await axios.get('/api/consultations', { params });
      setConsultations(response.data.data);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`/api/consultations/stats/${user.id}`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress': return '#ffa500';
      case 'completed': return '#28a745';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="consultation-dashboard">
        <div className="loading-spinner">Loading consultations...</div>
      </div>
    );
  }

  return (
    <div className="consultation-dashboard">
      <div className="dashboard-header">
        <h1>Consultation Dashboard</h1>
        <div className="stats-cards">
          <div className="stat-card">
            <h3>{stats.total || 0}</h3>
            <p>Total Consultations</p>
          </div>
          <div className="stat-card">
            <h3>{stats.today || 0}</h3>
            <p>Today</p>
          </div>
          <div className="stat-card">
            <h3>{stats.inProgress || 0}</h3>
            <p>In Progress</p>
          </div>
          <div className="stat-card">
            <h3>{stats.prescriptionsWritten || 0}</h3>
            <p>Prescriptions</p>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label>From Date:</label>
          <input 
            type="date" 
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>To Date:</label>
          <input 
            type="date" 
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Patient ID:</label>
          <input 
            type="text" 
            placeholder="Enter Patient ID"
            value={filters.patientId}
            onChange={(e) => handleFilterChange('patientId', e.target.value)}
          />
        </div>

        <button className="new-consultation-btn" onClick={() => window.location.href = '/consultation/new'}>
          New Consultation
        </button>
      </div>

      <div className="consultations-list">
        {consultations.length === 0 ? (
          <div className="no-consultations">
            <p>No consultations found matching your criteria.</p>
          </div>
        ) : (
          consultations.map(consultation => (
            <div key={consultation.id} className="consultation-card">
              <div className="consultation-header">
                <div className="consultation-info">
                  <h3>Patient ID: {consultation.patientId}</h3>
                  <p className="consultation-date">{formatDate(consultation.consultationDate)}</p>
                </div>
                <div 
                  className="consultation-status"
                  style={{ backgroundColor: getStatusColor(consultation.consultationStatus) }}
                >
                  {consultation.consultationStatus}
                </div>
              </div>

              <div className="consultation-details">
                <div className="detail-item">
                  <strong>Chief Complaint:</strong>
                  <span>{consultation.chiefComplaint}</span>
                </div>
                
                {consultation.assessment?.primaryDiagnosis && (
                  <div className="detail-item">
                    <strong>Primary Diagnosis:</strong>
                    <span>{consultation.assessment.primaryDiagnosis}</span>
                  </div>
                )}

                <div className="consultation-metrics">
                  <span className="metric">
                    📋 {consultation.prescriptions?.length || 0} Prescriptions
                  </span>
                  <span className="metric">
                    🔬 {consultation.investigations?.length || 0} Investigations
                  </span>
                  {consultation.aiSuggestions?.requested && (
                    <span className="metric ai-badge">
                      🤖 AI Assisted
                    </span>
                  )}
                </div>
              </div>

              <div className="consultation-actions">
                <button 
                  className="btn-primary"
                  onClick={() => window.location.href = `/consultation/${consultation.id}`}
                >
                  View Details
                </button>
                
                {consultation.consultationStatus === 'in-progress' && (
                  <button 
                    className="btn-secondary"
                    onClick={() => window.location.href = `/consultation/${consultation.id}/edit`}
                  >
                    Continue
                  </button>
                )}
                
                <button 
                  className="btn-outline"
                  onClick={() => window.location.href = `/prescription/new?consultationId=${consultation.id}`}
                >
                  New Prescription
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConsultationDashboard;