import React, { useState, useEffect } from 'react';
import './ComplaintManagement.css';

const ComplaintManagement = () => {
    const [complaints, setComplaints] = useState([]);
    const [analytics, setAnalytics] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedComplaint, setSelectedComplaint] = useState(null);

    useEffect(() => {
        fetchComplaints();
        fetchAnalytics();
    }, []);

    const fetchComplaints = async () => {
        try {
            const response = await fetch('/api/complaints/admin/open');
            const data = await response.json();
            if (data.success) {
                setComplaints(data.data);
            }
        } catch (error) {
            console.error('Error fetching complaints:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const response = await fetch('/api/complaints/admin/analytics');
            const data = await response.json();
            if (data.success) {
                setAnalytics(data.data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const getUrgencyColor = (urgency) => {
        const colors = {
            low: '#28a745',
            medium: '#ffc107',
            high: '#fd7e14',
            critical: '#dc3545'
        };
        return colors[urgency] || '#6c757d';
    };

    const getStatusColor = (status) => {
        const colors = {
            open: '#dc3545',
            in_progress: '#ffc107',
            resolved: '#28a745',
            escalated: '#fd7e14',
            closed: '#6c757d'
        };
        return colors[status] || '#6c757d';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleStatusUpdate = async (complaintId, newStatus) => {
        try {
            const response = await fetch(`/api/complaints/${complaintId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus,
                    performedBy: {
                        id: 'admin',
                        name: 'Admin User',
                        role: 'admin'
                    }
                })
            });

            if (response.ok) {
                fetchComplaints();
                alert('Status updated successfully!');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const renderDashboard = () => (
        <div className="dashboard-grid">
            <div className="stats-cards">
                <div className="stat-card urgent">
                    <div className="stat-icon">🚨</div>
                    <div className="stat-content">
                        <h3>{complaints.filter(c => c.urgency === 'critical').length}</h3>
                        <p>Critical Complaints</p>
                    </div>
                </div>
                
                <div className="stat-card warning">
                    <div className="stat-icon">⏰</div>
                    <div className="stat-content">
                        <h3>{complaints.filter(c => c.slaStatus === 'overdue').length}</h3>
                        <p>Overdue Complaints</p>
                    </div>
                </div>
                
                <div className="stat-card info">
                    <div className="stat-icon">📋</div>
                    <div className="stat-content">
                        <h3>{complaints.length}</h3>
                        <p>Open Complaints</p>
                    </div>
                </div>
                
                <div className="stat-card success">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <h3>{analytics.satisfactionRating || '4.2'}</h3>
                        <p>Avg Satisfaction</p>
                    </div>
                </div>
            </div>

            <div className="recent-complaints">
                <h3>🔥 Priority Complaints</h3>
                <div className="complaints-list">
                    {complaints
                        .filter(c => c.urgency === 'critical' || c.urgency === 'high')
                        .slice(0, 5)
                        .map(complaint => (
                            <div key={complaint.complaintId} className="complaint-item priority">
                                <div className="complaint-header">
                                    <span className="complaint-id">#{complaint.complaintId}</span>
                                    <span 
                                        className="urgency-badge"
                                        style={{ backgroundColor: getUrgencyColor(complaint.urgency) }}
                                    >
                                        {complaint.urgency.toUpperCase()}
                                    </span>
                                </div>
                                <h4>{complaint.title}</h4>
                                <p className="complaint-meta">
                                    👤 {complaint.patientName} • 
                                    📂 {complaint.category.replace(/_/g, ' ')} • 
                                    ⏰ {complaint.ageInHours}h ago
                                </p>
                                <div className="complaint-actions">
                                    <button 
                                        className="btn-view"
                                        onClick={() => setSelectedComplaint(complaint)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );

    const renderComplaintsList = () => (
        <div className="complaints-table-container">
            <div className="table-header">
                <h3>📋 All Complaints</h3>
                <div className="table-filters">
                    <select className="filter-select">
                        <option value="">All Categories</option>
                        <option value="appointment_scheduling">Appointment Scheduling</option>
                        <option value="doctor_behavior">Doctor Behavior</option>
                        <option value="billing_issues">Billing Issues</option>
                        <option value="waiting_time">Waiting Time</option>
                    </select>
                    <select className="filter-select">
                        <option value="">All Urgency</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>
            
            <div className="complaints-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Patient</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Urgency</th>
                            <th>Status</th>
                            <th>Age</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {complaints.map(complaint => (
                            <tr key={complaint.complaintId}>
                                <td>
                                    <span className="complaint-id">#{complaint.complaintId}</span>
                                </td>
                                <td>
                                    <div className="patient-info">
                                        <strong>{complaint.patientName}</strong>
                                        <small>{complaint.patientPhone}</small>
                                    </div>
                                </td>
                                <td>
                                    <div className="complaint-title">
                                        {complaint.title}
                                        {complaint.channel && (
                                            <span className="channel-badge">{complaint.channel}</span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span className="category-badge">
                                        {complaint.category.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td>
                                    <span 
                                        className="urgency-badge"
                                        style={{ backgroundColor: getUrgencyColor(complaint.urgency) }}
                                    >
                                        {complaint.urgency}
                                    </span>
                                </td>
                                <td>
                                    <span 
                                        className="status-badge"
                                        style={{ backgroundColor: getStatusColor(complaint.status) }}
                                    >
                                        {complaint.status.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td>
                                    <span className="age-info">
                                        {complaint.ageInHours}h
                                        {complaint.slaStatus === 'overdue' && (
                                            <span className="overdue-indicator">⚠️</span>
                                        )}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button 
                                            className="btn-view"
                                            onClick={() => setSelectedComplaint(complaint)}
                                        >
                                            View
                                        </button>
                                        <select 
                                            className="status-select"
                                            value={complaint.status}
                                            onChange={(e) => handleStatusUpdate(complaint.complaintId, e.target.value)}
                                        >
                                            <option value="open">Open</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="resolved">Resolved</option>
                                            <option value="escalated">Escalated</option>
                                        </select>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderComplaintDetails = () => (
        <div className="complaint-details">
            <div className="details-header">
                <button 
                    className="btn-back"
                    onClick={() => setSelectedComplaint(null)}
                >
                    ← Back to List
                </button>
                <h2>Complaint Details</h2>
            </div>
            
            <div className="details-content">
                <div className="complaint-info">
                    <div className="info-section">
                        <h3>📋 Basic Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Complaint ID:</label>
                                <span>#{selectedComplaint.complaintId}</span>
                            </div>
                            <div className="info-item">
                                <label>Patient:</label>
                                <span>{selectedComplaint.patientName}</span>
                            </div>
                            <div className="info-item">
                                <label>Phone:</label>
                                <span>{selectedComplaint.patientPhone}</span>
                            </div>
                            <div className="info-item">
                                <label>Category:</label>
                                <span>{selectedComplaint.category.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="info-item">
                                <label>Urgency:</label>
                                <span 
                                    className="urgency-badge"
                                    style={{ backgroundColor: getUrgencyColor(selectedComplaint.urgency) }}
                                >
                                    {selectedComplaint.urgency}
                                </span>
                            </div>
                            <div className="info-item">
                                <label>Status:</label>
                                <span 
                                    className="status-badge"
                                    style={{ backgroundColor: getStatusColor(selectedComplaint.status) }}
                                >
                                    {selectedComplaint.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="info-section">
                        <h3>📝 Complaint Details</h3>
                        <div className="complaint-content">
                            <h4>{selectedComplaint.title}</h4>
                            <p>{selectedComplaint.description}</p>
                        </div>
                    </div>
                    
                    {selectedComplaint.timeline && selectedComplaint.timeline.length > 0 && (
                        <div className="info-section">
                            <h3>📅 Timeline</h3>
                            <div className="timeline">
                                {selectedComplaint.timeline.map((entry, index) => (
                                    <div key={index} className="timeline-item">
                                        <div className="timeline-date">
                                            {formatDate(entry.timestamp)}
                                        </div>
                                        <div className="timeline-content">
                                            <strong>{entry.action}</strong>
                                            <p>{entry.description}</p>
                                            <small>By: {entry.performedBy.name}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading complaint management system...</p>
            </div>
        );
    }

    return (
        <div className="complaint-management">
            <div className="page-header">
                <h1>🎯 AI-Powered Complaint Management</h1>
                <p>Intelligent complaint tracking, categorization, and resolution system</p>
            </div>

            {selectedComplaint ? (
                renderComplaintDetails()
            ) : (
                <>
                    <div className="tab-navigation">
                        <button 
                            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            📊 Dashboard
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'complaints' ? 'active' : ''}`}
                            onClick={() => setActiveTab('complaints')}
                        >
                            📋 All Complaints
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                            onClick={() => setActiveTab('analytics')}
                        >
                            📈 Analytics
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'dashboard' && renderDashboard()}
                        {activeTab === 'complaints' && renderComplaintsList()}
                        {activeTab === 'analytics' && (
                            <div className="analytics-section">
                                <h3>📈 Complaint Analytics</h3>
                                <p>Advanced analytics and reporting features coming soon...</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ComplaintManagement;