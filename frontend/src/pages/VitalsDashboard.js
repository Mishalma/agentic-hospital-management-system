import React, { useState, useEffect } from 'react';
import './VitalsDashboard.css';

const VitalsDashboard = () => {
    const [dashboardData, setDashboardData] = useState({
        todayCount: 0,
        abnormalCount: 0,
        unsyncedCount: 0,
        alertSeverity: { low: 0, medium: 0, high: 0, critical: 0 },
        recentAbnormal: []
    });
    const [abnormalVitals, setAbnormalVitals] = useState([]);
    const [unsyncedVitals, setUnsyncedVitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchDashboardData();
        fetchAbnormalVitals();
        fetchUnsyncedVitals();
        
        // Set up real-time updates
        const interval = setInterval(() => {
            fetchDashboardData();
            if (activeTab === 'abnormal') fetchAbnormalVitals();
            if (activeTab === 'unsynced') fetchUnsyncedVitals();
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, [activeTab]);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/vitals/dashboard');
            const data = await response.json();
            if (data.success) {
                setDashboardData(data.data);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAbnormalVitals = async () => {
        try {
            const response = await fetch('/api/vitals/abnormal');
            const data = await response.json();
            if (data.success) {
                setAbnormalVitals(data.data);
            }
        } catch (error) {
            console.error('Error fetching abnormal vitals:', error);
        }
    };

    const fetchUnsyncedVitals = async () => {
        try {
            const response = await fetch('/api/vitals/unsynced');
            const data = await response.json();
            if (data.success) {
                setUnsyncedVitals(data.data);
            }
        } catch (error) {
            console.error('Error fetching unsynced vitals:', error);
        }
    };

    const handleMarkReviewed = async (vitalId) => {
        try {
            const response = await fetch(`/api/vitals/${vitalId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'reviewed' }),
            });

            const data = await response.json();
            if (data.success) {
                setMessage('Vital marked as reviewed');
                fetchAbnormalVitals();
                fetchDashboardData();
            }
        } catch (error) {
            console.error('Error marking vital as reviewed:', error);
            setMessage('Failed to update vital status');
        }
    };

    const handleSyncToEMR = async (vitalId) => {
        try {
            const response = await fetch(`/api/vitals/${vitalId}/sync-emr`, {
                method: 'POST',
            });

            const data = await response.json();
            if (data.success) {
                setMessage('Successfully synced to EMR');
                fetchUnsyncedVitals();
                fetchDashboardData();
            }
        } catch (error) {
            console.error('Error syncing to EMR:', error);
            setMessage('Failed to sync to EMR');
        }
    };

    const handleBulkSync = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/vitals/sync-all-emr', {
                method: 'POST',
            });

            const data = await response.json();
            if (data.success) {
                setMessage(`Successfully synced ${data.syncedCount} vitals to EMR`);
                fetchUnsyncedVitals();
                fetchDashboardData();
            }
        } catch (error) {
            console.error('Error bulk syncing to EMR:', error);
            setMessage('Failed to bulk sync to EMR');
        } finally {
            setLoading(false);
        }
    };

    const getAlertColor = (severity) => {
        switch (severity) {
            case 'critical': return '#dc3545';
            case 'high': return '#fd7e14';
            case 'medium': return '#ffc107';
            case 'low': return '#28a745';
            default: return '#6c757d';
        }
    };

    const formatVitals = (vitals) => {
        const formatted = [];
        
        if (vitals.bloodPressure && vitals.bloodPressure.systolic && vitals.bloodPressure.diastolic) {
            formatted.push(`BP: ${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg`);
        }
        if (vitals.heartRate) {
            formatted.push(`HR: ${vitals.heartRate} bpm`);
        }
        if (vitals.temperature && vitals.temperature.value) {
            formatted.push(`Temp: ${vitals.temperature.value}°${vitals.temperature.unit}`);
        }
        if (vitals.oxygenSaturation) {
            formatted.push(`O2: ${vitals.oxygenSaturation}%`);
        }
        
        return formatted.join(' | ');
    };

    if (loading && activeTab === 'overview') {
        return (
            <div className="vitals-dashboard">
                <div className="loading">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="vitals-dashboard">
            <div className="dashboard-header">
                <h2>Vitals Monitoring Dashboard</h2>
                <div className="last-updated">
                    Last updated: {new Date().toLocaleTimeString()}
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
                    className={`tab ${activeTab === 'abnormal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('abnormal')}
                >
                    Abnormal Vitals ({dashboardData.abnormalCount})
                </button>
                <button 
                    className={`tab ${activeTab === 'unsynced' ? 'active' : ''}`}
                    onClick={() => setActiveTab('unsynced')}
                >
                    Unsynced ({dashboardData.unsyncedCount})
                </button>
            </div>

            {message && (
                <div className={`message ${message.includes('Success') ? 'success' : 'info'}`}>
                    {message}
                </div>
            )}

            {activeTab === 'overview' && (
                <div className="overview-tab">
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-number">{dashboardData.todayCount}</div>
                            <div className="stat-label">Vitals Today</div>
                        </div>
                        <div className="stat-card alert-card">
                            <div className="stat-number">{dashboardData.abnormalCount}</div>
                            <div className="stat-label">Abnormal Vitals</div>
                        </div>
                        <div className="stat-card warning-card">
                            <div className="stat-number">{dashboardData.unsyncedCount}</div>
                            <div className="stat-label">Unsynced to EMR</div>
                        </div>
                    </div>

                    <div className="alert-severity-chart">
                        <h3>Alert Severity Distribution</h3>
                        <div className="severity-bars">
                            {Object.entries(dashboardData.alertSeverity).map(([severity, count]) => (
                                <div key={severity} className="severity-bar">
                                    <div className="severity-label">
                                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                                    </div>
                                    <div className="bar-container">
                                        <div 
                                            className="bar-fill"
                                            style={{ 
                                                width: `${Math.max(count * 20, 5)}%`,
                                                backgroundColor: getAlertColor(severity)
                                            }}
                                        ></div>
                                        <span className="bar-count">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="recent-abnormal">
                        <h3>Recent Abnormal Vitals</h3>
                        {dashboardData.recentAbnormal.length > 0 ? (
                            <div className="vitals-list">
                                {dashboardData.recentAbnormal.map((vital, index) => (
                                    <div key={index} className="vital-item">
                                        <div className="vital-header">
                                            <strong>Patient: {vital.patientId}</strong>
                                            <span className="vital-time">
                                                {new Date(vital.recordedAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="vital-details">
                                            {formatVitals(vital.vitals)}
                                        </div>
                                        {vital.alerts && vital.alerts.map((alert, alertIndex) => (
                                            <div 
                                                key={alertIndex} 
                                                className="vital-alert"
                                                style={{ color: getAlertColor(alert.severity) }}
                                            >
                                                <strong>{alert.severity.toUpperCase()}:</strong> {alert.message}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No recent abnormal vitals</p>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'abnormal' && (
                <div className="abnormal-tab">
                    <div className="tab-header">
                        <h3>Abnormal Vitals Requiring Review</h3>
                        <button onClick={fetchAbnormalVitals} className="refresh-btn">
                            🔄 Refresh
                        </button>
                    </div>
                    
                    {abnormalVitals.length > 0 ? (
                        <div className="vitals-list">
                            {abnormalVitals.map((vital, index) => (
                                <div key={index} className="vital-item abnormal-item">
                                    <div className="vital-header">
                                        <div>
                                            <strong>Patient: {vital.patientId}</strong>
                                            <span className="vital-time">
                                                {new Date(vital.recordedAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => handleMarkReviewed(vital.id)}
                                            className="review-btn"
                                        >
                                            Mark Reviewed
                                        </button>
                                    </div>
                                    <div className="vital-details">
                                        {formatVitals(vital.vitals)}
                                    </div>
                                    {vital.notes && (
                                        <div className="vital-notes">
                                            <strong>Notes:</strong> {vital.notes}
                                        </div>
                                    )}
                                    <div className="alerts">
                                        {vital.alerts && vital.alerts.map((alert, alertIndex) => (
                                            <div 
                                                key={alertIndex} 
                                                className="alert-badge"
                                                style={{ backgroundColor: getAlertColor(alert.severity) }}
                                            >
                                                {alert.message}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>✅ No abnormal vitals requiring review</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'unsynced' && (
                <div className="unsynced-tab">
                    <div className="tab-header">
                        <h3>Vitals Pending EMR Sync</h3>
                        <div className="tab-actions">
                            <button onClick={fetchUnsyncedVitals} className="refresh-btn">
                                🔄 Refresh
                            </button>
                            {unsyncedVitals.length > 0 && (
                                <button 
                                    onClick={handleBulkSync} 
                                    className="bulk-sync-btn"
                                    disabled={loading}
                                >
                                    {loading ? 'Syncing...' : `Sync All (${unsyncedVitals.length})`}
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {unsyncedVitals.length > 0 ? (
                        <div className="vitals-list">
                            {unsyncedVitals.map((vital, index) => (
                                <div key={index} className="vital-item unsynced-item">
                                    <div className="vital-header">
                                        <div>
                                            <strong>Patient: {vital.patientId}</strong>
                                            <span className="vital-time">
                                                {new Date(vital.recordedAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => handleSyncToEMR(vital.id)}
                                            className="sync-btn"
                                        >
                                            Sync to EMR
                                        </button>
                                    </div>
                                    <div className="vital-details">
                                        {formatVitals(vital.vitals)}
                                    </div>
                                    {vital.notes && (
                                        <div className="vital-notes">
                                            <strong>Notes:</strong> {vital.notes}
                                        </div>
                                    )}
                                    <div className="recorded-by">
                                        Recorded by: {vital.recordedBy}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>✅ All vitals are synced to EMR</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VitalsDashboard;