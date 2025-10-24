import React, { useState, useEffect } from 'react';
import './VitalsLogging.css';

const VitalsLogging = () => {
    const [patientId, setPatientId] = useState('');
    const [patientName, setPatientName] = useState('');
    const [nurseId, setNurseId] = useState('NURSE001'); // Default nurse ID
    const [vitals, setVitals] = useState({
        bloodPressure: { systolic: '', diastolic: '' },
        heartRate: '',
        temperature: { value: '', unit: 'F' },
        respiratoryRate: '',
        oxygenSaturation: '',
        weight: { value: '', unit: 'lbs' },
        height: { value: '', unit: 'in' }
    });
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [alerts, setAlerts] = useState([]);
    const [recentVitals, setRecentVitals] = useState([]);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        // Listen for online/offline events
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        // Load cached data if offline
        if (isOffline) {
            loadCachedVitals();
        } else {
            fetchRecentVitals();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isOffline]);

    const loadCachedVitals = () => {
        const cached = localStorage.getItem('cachedVitals');
        if (cached) {
            setRecentVitals(JSON.parse(cached));
        }
    };

    const fetchRecentVitals = async () => {
        try {
            const response = await fetch('/api/vitals/dashboard');
            const data = await response.json();
            if (data.success) {
                setRecentVitals(data.data.recentAbnormal || []);
                // Cache for offline use
                localStorage.setItem('cachedVitals', JSON.stringify(data.data.recentAbnormal || []));
            }
        } catch (error) {
            console.error('Error fetching recent vitals:', error);
        }
    };

    const handleVitalChange = (field, value, subfield = null) => {
        setVitals(prev => {
            if (subfield) {
                return {
                    ...prev,
                    [field]: {
                        ...prev[field],
                        [subfield]: value
                    }
                };
            }
            return {
                ...prev,
                [field]: value
            };
        });
    };

    const fetchPatientName = async (id) => {
        if (!id || id.length < 10) {
            setPatientName('');
            return;
        }

        try {
            const response = await fetch(`/api/patients/${id}/basic`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setPatientName(data.name || '');
                } else {
                    setPatientName('');
                }
            } else {
                setPatientName('');
            }
        } catch (error) {
            console.error('Error fetching patient name:', error);
            setPatientName('');
        }
    };

    const handlePatientIdChange = (e) => {
        const value = e.target.value;
        setPatientId(value);
        fetchPatientName(value);
    };

    const validateVitals = () => {
        const errors = [];
        
        // Blood pressure validation
        if (vitals.bloodPressure.systolic && vitals.bloodPressure.diastolic) {
            const sys = parseInt(vitals.bloodPressure.systolic);
            const dia = parseInt(vitals.bloodPressure.diastolic);
            if (sys < 60 || sys > 300) errors.push('Systolic BP must be between 60-300');
            if (dia < 30 || dia > 200) errors.push('Diastolic BP must be between 30-200');
            if (sys <= dia) errors.push('Systolic BP must be higher than diastolic');
        }
        
        // Heart rate validation
        if (vitals.heartRate && (vitals.heartRate < 30 || vitals.heartRate > 250)) {
            errors.push('Heart rate must be between 30-250 bpm');
        }
        
        // Temperature validation
        if (vitals.temperature.value) {
            const temp = parseFloat(vitals.temperature.value);
            const unit = vitals.temperature.unit;
            const tempF = unit === 'C' ? (temp * 9/5) + 32 : temp;
            if (tempF < 90 || tempF > 110) {
                errors.push(`Temperature seems unusual: ${temp}°${unit}`);
            }
        }
        
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!patientId.trim()) {
            setMessage('Patient ID is required');
            return;
        }

        const validationErrors = validateVitals();
        if (validationErrors.length > 0) {
            setMessage('Validation errors: ' + validationErrors.join(', '));
            return;
        }

        setLoading(true);
        setMessage('');
        setAlerts([]);

        try {
            // If offline, cache the data
            if (isOffline) {
                const vitalsData = {
                    patientId,
                    nurseId,
                    vitals,
                    notes,
                    timestamp: new Date().toISOString(),
                    cached: true
                };
                
                const cachedData = JSON.parse(localStorage.getItem('offlineVitals') || '[]');
                cachedData.push(vitalsData);
                localStorage.setItem('offlineVitals', JSON.stringify(cachedData));
                
                setMessage('Vitals cached offline. Will sync when connection is restored.');
                resetForm();
                return;
            }

            const response = await fetch('/api/vitals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    patientId,
                    nurseId,
                    vitals,
                    notes,
                    deviceInfo: {
                        deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'tablet',
                        deviceId: localStorage.getItem('deviceId') || 'unknown'
                    }
                }),
            });

            const data = await response.json();

            if (data.success) {
                setMessage('Vitals recorded successfully!');
                setAlerts(data.alerts || []);
                resetForm();
                fetchRecentVitals(); // Refresh recent vitals
            } else {
                setMessage(data.message || 'Failed to record vitals');
            }
        } catch (error) {
            console.error('Error recording vitals:', error);
            setMessage('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setPatientId('');
        setPatientName('');
        setVitals({
            bloodPressure: { systolic: '', diastolic: '' },
            heartRate: '',
            temperature: { value: '', unit: 'F' },
            respiratoryRate: '',
            oxygenSaturation: '',
            weight: { value: '', unit: 'lbs' },
            height: { value: '', unit: 'in' }
        });
        setNotes('');
    };

    const syncOfflineData = async () => {
        const offlineData = JSON.parse(localStorage.getItem('offlineVitals') || '[]');
        if (offlineData.length === 0) return;

        setLoading(true);
        let syncedCount = 0;

        for (const vitalsData of offlineData) {
            try {
                const response = await fetch('/api/vitals', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(vitalsData),
                });

                if (response.ok) {
                    syncedCount++;
                }
            } catch (error) {
                console.error('Error syncing offline data:', error);
            }
        }

        if (syncedCount > 0) {
            localStorage.removeItem('offlineVitals');
            setMessage(`Synced ${syncedCount} offline vitals records`);
            fetchRecentVitals();
        }

        setLoading(false);
    };

    // Auto-sync when coming back online
    useEffect(() => {
        if (!isOffline) {
            syncOfflineData();
        }
    }, [isOffline]);

    const getAlertColor = (severity) => {
        switch (severity) {
            case 'critical': return '#dc3545';
            case 'high': return '#fd7e14';
            case 'medium': return '#ffc107';
            case 'low': return '#28a745';
            default: return '#6c757d';
        }
    };

    return (
        <div className="vitals-logging">
            <div className="vitals-header">
                <h2>Digital Vitals Logging</h2>
                {isOffline && (
                    <div className="offline-indicator">
                        📱 Offline Mode - Data will sync when connected
                    </div>
                )}
            </div>

            <div className="vitals-container">
                <div className="vitals-form-section">
                    <form onSubmit={handleSubmit} className="vitals-form">
                        <div className="form-group">
                            <label>Patient ID *</label>
                            <input
                                type="text"
                                value={patientId}
                                onChange={handlePatientIdChange}
                                placeholder="Enter Patient ID (e.g., PT2024123456)"
                                required
                            />
                            {patientName && (
                                <small className="patient-name-display">Patient: {patientName}</small>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Nurse ID</label>
                            <select
                                value={nurseId}
                                onChange={(e) => setNurseId(e.target.value)}
                            >
                                <option value="NURSE001">NURSE001 - Sarah Johnson</option>
                                <option value="NURSE002">NURSE002 - Michael Chen</option>
                                <option value="NURSE003">NURSE003 - Emily Davis</option>
                            </select>
                        </div>

                        <div className="vitals-grid">
                            <div className="vital-group">
                                <label>Blood Pressure</label>
                                <div className="bp-inputs">
                                    <input
                                        type="number"
                                        placeholder="Systolic"
                                        value={vitals.bloodPressure.systolic}
                                        onChange={(e) => handleVitalChange('bloodPressure', e.target.value, 'systolic')}
                                    />
                                    <span>/</span>
                                    <input
                                        type="number"
                                        placeholder="Diastolic"
                                        value={vitals.bloodPressure.diastolic}
                                        onChange={(e) => handleVitalChange('bloodPressure', e.target.value, 'diastolic')}
                                    />
                                    <span>mmHg</span>
                                </div>
                            </div>

                            <div className="vital-group">
                                <label>Heart Rate</label>
                                <div className="input-with-unit">
                                    <input
                                        type="number"
                                        placeholder="72"
                                        value={vitals.heartRate}
                                        onChange={(e) => handleVitalChange('heartRate', e.target.value)}
                                    />
                                    <span>bpm</span>
                                </div>
                            </div>

                            <div className="vital-group">
                                <label>Temperature</label>
                                <div className="temp-inputs">
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="98.6"
                                        value={vitals.temperature.value}
                                        onChange={(e) => handleVitalChange('temperature', e.target.value, 'value')}
                                    />
                                    <select
                                        value={vitals.temperature.unit}
                                        onChange={(e) => handleVitalChange('temperature', e.target.value, 'unit')}
                                    >
                                        <option value="F">°F</option>
                                        <option value="C">°C</option>
                                    </select>
                                </div>
                            </div>

                            <div className="vital-group">
                                <label>Respiratory Rate</label>
                                <div className="input-with-unit">
                                    <input
                                        type="number"
                                        placeholder="16"
                                        value={vitals.respiratoryRate}
                                        onChange={(e) => handleVitalChange('respiratoryRate', e.target.value)}
                                    />
                                    <span>breaths/min</span>
                                </div>
                            </div>

                            <div className="vital-group">
                                <label>Oxygen Saturation</label>
                                <div className="input-with-unit">
                                    <input
                                        type="number"
                                        placeholder="98"
                                        value={vitals.oxygenSaturation}
                                        onChange={(e) => handleVitalChange('oxygenSaturation', e.target.value)}
                                    />
                                    <span>%</span>
                                </div>
                            </div>

                            <div className="vital-group">
                                <label>Weight</label>
                                <div className="weight-inputs">
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="150"
                                        value={vitals.weight.value}
                                        onChange={(e) => handleVitalChange('weight', e.target.value, 'value')}
                                    />
                                    <select
                                        value={vitals.weight.unit}
                                        onChange={(e) => handleVitalChange('weight', e.target.value, 'unit')}
                                    >
                                        <option value="lbs">lbs</option>
                                        <option value="kg">kg</option>
                                    </select>
                                </div>
                            </div>

                            <div className="vital-group">
                                <label>Height</label>
                                <div className="height-inputs">
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="68"
                                        value={vitals.height.value}
                                        onChange={(e) => handleVitalChange('height', e.target.value, 'value')}
                                    />
                                    <select
                                        value={vitals.height.unit}
                                        onChange={(e) => handleVitalChange('height', e.target.value, 'unit')}
                                    >
                                        <option value="in">inches</option>
                                        <option value="cm">cm</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Additional notes about patient condition..."
                                rows="3"
                                maxLength="500"
                            />
                            <small>{notes.length}/500 characters</small>
                        </div>

                        <div className="form-actions">
                            <button type="button" onClick={resetForm} className="btn-secondary">
                                Clear Form
                            </button>
                            <button type="submit" disabled={loading} className="btn-primary">
                                {loading ? 'Recording...' : 'Record Vitals'}
                            </button>
                        </div>
                    </form>

                    {message && (
                        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}

                    {alerts.length > 0 && (
                        <div className="alerts-section">
                            <h3>⚠️ Alerts Detected</h3>
                            {alerts.map((alert, index) => (
                                <div 
                                    key={index} 
                                    className="alert"
                                    style={{ borderLeftColor: getAlertColor(alert.severity) }}
                                >
                                    <strong>{alert.severity.toUpperCase()}:</strong> {alert.message}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="recent-vitals-section">
                    <h3>Recent Abnormal Vitals</h3>
                    {recentVitals.length > 0 ? (
                        <div className="recent-vitals-list">
                            {recentVitals.map((vital, index) => (
                                <div key={index} className="vital-card">
                                    <div className="vital-header">
                                        <strong>Patient: {vital.patientId}</strong>
                                        <span className="vital-time">
                                            {new Date(vital.recordedAt).toLocaleString()}
                                        </span>
                                    </div>
                                    {vital.alerts && vital.alerts.map((alert, alertIndex) => (
                                        <div 
                                            key={alertIndex} 
                                            className="vital-alert"
                                            style={{ color: getAlertColor(alert.severity) }}
                                        >
                                            {alert.message}
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
        </div>
    );
};

export default VitalsLogging;