import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './EPrescriptionQueue.css';

const EPrescriptionQueue = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processingData, setProcessingData] = useState({
    substitutions: {},
    counselingNotes: '',
    pharmacistNotes: ''
  });
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    dateRange: 'today'
  });

  const pharmacyId = 'PHARM001'; // This would come from user context

  useEffect(() => {
    fetchPrescriptions();
    // Set up real-time updates
    const interval = setInterval(fetchPrescriptions, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [prescriptions, filters]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      // Fetch prescriptions from the existing prescription API
      const response = await axios.get('/api/prescriptions', {
        params: {
          pharmacyId: pharmacyId,
          status: 'sent' // Only show prescriptions sent to pharmacy
        }
      });
      
      // Transform the data to include pharmacy-specific information
      const prescriptionsWithPharmacyData = await Promise.all(
        response.data.data.map(async (prescription) => {
          try {
            // Check availability for each prescription
            const availabilityResponse = await axios.post(
              `/api/pharmacy/${pharmacyId}/prescriptions/${prescription.id}/process`,
              { pharmacistId: user.id }
            );
            
            return {
              ...prescription,
              pharmacyData: availabilityResponse.data.data,
              receivedAt: new Date(prescription.transmissionInfo?.transmittedDate || prescription.createdAt),
              priority: prescription.priority || 'routine'
            };
          } catch (error) {
            console.error('Error checking availability:', error);
            return {
              ...prescription,
              pharmacyData: { canFulfillCompletely: false, availability: [] },
              receivedAt: new Date(prescription.createdAt),
              priority: prescription.priority || 'routine'
            };
          }
        })
      );
      
      setPrescriptions(prescriptionsWithPharmacyData);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    let filtered = [...prescriptions];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(p => p.priority === filters.priority);
    }

    // Date range filter
    const now = new Date();
    switch (filters.dateRange) {
      case 'today':
        filtered = filtered.filter(p => {
          const prescDate = new Date(p.receivedAt);
          return prescDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(p => new Date(p.receivedAt) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(p => new Date(p.receivedAt) >= monthAgo);
        break;
      default:
        break;
    }

    // Sort by priority and received time
    filtered.sort((a, b) => {
      const priorityOrder = { 'stat': 0, 'urgent': 1, 'routine': 2 };
      const aPriority = priorityOrder[a.priority] || 2;
      const bPriority = priorityOrder[b.priority] || 2;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      return new Date(b.receivedAt) - new Date(a.receivedAt);
    });

    setFilteredPrescriptions(filtered);
  };

  const handleProcessPrescription = (prescription) => {
    setSelectedPrescription(prescription);
    setShowProcessModal(true);
    
    // Initialize substitutions object
    const substitutions = {};
    prescription.medications?.forEach((med, index) => {
      substitutions[index] = {
        substitute: false,
        alternativeMedication: '',
        reason: ''
      };
    });
    
    setProcessingData({
      substitutions,
      counselingNotes: '',
      pharmacistNotes: ''
    });
  };

  const handleDispensePrescription = async () => {
    if (!selectedPrescription) return;

    try {
      // Prepare dispensing data
      const dispensingData = {
        items: selectedPrescription.medications.map((med, index) => {
          const substitution = processingData.substitutions[index];
          const availability = selectedPrescription.pharmacyData?.availability?.find(
            a => a.medication.toLowerCase() === med.genericName.toLowerCase()
          );
          
          return {
            medicationId: `MED${index + 1}`,
            genericName: substitution.substitute ? substitution.alternativeMedication : med.genericName,
            brandName: med.brandName,
            batchNumber: availability?.inventoryItem?.batchNumber || 'BATCH001',
            expiryDate: availability?.inventoryItem?.expiryDate || new Date('2025-12-31'),
            quantityDispensed: med.quantity,
            unitPrice: availability?.inventoryItem?.sellingPrice || 5.00,
            totalPrice: (availability?.inventoryItem?.sellingPrice || 5.00) * med.quantity,
            gstAmount: ((availability?.inventoryItem?.sellingPrice || 5.00) * med.quantity * 0.12),
            discountAmount: 0,
            substituted: substitution.substitute,
            substitutionReason: substitution.reason,
            originalMedication: substitution.substitute ? med.genericName : null
          };
        }),
        billing: {
          subtotal: selectedPrescription.pharmacyData?.estimatedTotal || 0,
          totalGST: (selectedPrescription.pharmacyData?.estimatedTotal || 0) * 0.12,
          totalDiscount: 0,
          totalAmount: (selectedPrescription.pharmacyData?.estimatedTotal || 0) * 1.12,
          amountPaid: (selectedPrescription.pharmacyData?.estimatedTotal || 0) * 1.12,
          balance: 0,
          paymentMethod: 'cash'
        },
        customer: {
          name: selectedPrescription.patientId, // This would be actual patient name
          phone: '+1234567890',
          email: 'patient@example.com'
        },
        pharmacist: {
          id: user.id,
          name: user.fullName || user.username,
          licenseNumber: 'PH12345'
        },
        counseling: {
          provided: true,
          notes: processingData.counselingNotes,
          duration: 5,
          counselorId: user.id
        }
      };

      // Dispense the prescription
      const response = await axios.post(
        `/api/pharmacy/${pharmacyId}/prescriptions/${selectedPrescription.id}/dispense`,
        dispensingData
      );

      if (response.data.success) {
        alert('Prescription dispensed successfully!');
        setShowProcessModal(false);
        setSelectedPrescription(null);
        fetchPrescriptions(); // Refresh the list
      }
    } catch (error) {
      console.error('Error dispensing prescription:', error);
      alert('Error dispensing prescription: ' + (error.response?.data?.message || error.message));
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'stat': return '#dc3545';
      case 'urgent': return '#fd7e14';
      case 'routine': return '#28a745';
      default: return '#6c757d';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="eprescription-queue">
        <div className="loading-spinner">Loading e-prescriptions...</div>
      </div>
    );
  }

  return (
    <div className="eprescription-queue">
      <div className="queue-header">
        <h1>E-Prescription Queue</h1>
        <div className="queue-stats">
          <div className="stat-item">
            <span className="stat-number">{filteredPrescriptions.length}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {filteredPrescriptions.filter(p => p.priority === 'stat' || p.priority === 'urgent').length}
            </span>
            <span className="stat-label">Urgent</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {filteredPrescriptions.filter(p => p.pharmacyData?.canFulfillCompletely).length}
            </span>
            <span className="stat-label">Ready</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="queue-filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
        >
          <option value="all">All Status</option>
          <option value="sent">Received</option>
          <option value="processing">Processing</option>
          <option value="ready">Ready</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
        >
          <option value="all">All Priorities</option>
          <option value="stat">STAT</option>
          <option value="urgent">Urgent</option>
          <option value="routine">Routine</option>
        </select>

        <select
          value={filters.dateRange}
          onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Prescription Queue */}
      <div className="prescription-queue">
        {filteredPrescriptions.length === 0 ? (
          <div className="no-prescriptions">
            <p>No e-prescriptions in queue</p>
          </div>
        ) : (
          filteredPrescriptions.map((prescription) => (
            <div key={prescription.id} className="prescription-card">
              <div className="prescription-header">
                <div className="prescription-info">
                  <h3>Rx #{prescription.prescriptionNumber}</h3>
                  <div className="prescription-meta">
                    <span className="doctor">Dr. {prescription.doctorId}</span>
                    <span className="patient">Patient: {prescription.patientId}</span>
                    <span className="received-time">
                      Received: {new Date(prescription.receivedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="prescription-badges">
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(prescription.priority) }}
                  >
                    {prescription.priority?.toUpperCase()}
                  </span>
                  
                  {prescription.pharmacyData?.canFulfillCompletely ? (
                    <span className="availability-badge available">✓ Available</span>
                  ) : (
                    <span className="availability-badge unavailable">⚠ Partial</span>
                  )}
                </div>
              </div>

              <div className="prescription-content">
                <div className="medications-list">
                  <h4>Medications ({prescription.medications?.length || 0})</h4>
                  {prescription.medications?.map((med, index) => {
                    const availability = prescription.pharmacyData?.availability?.find(
                      a => a.medication.toLowerCase() === med.genericName.toLowerCase()
                    );
                    
                    return (
                      <div key={index} className="medication-item">
                        <div className="medication-details">
                          <strong>{med.genericName}</strong>
                          {med.brandName && <span> ({med.brandName})</span>}
                          <div className="medication-specs">
                            <span>{med.dosage} • {med.frequency}</span>
                            <span>Qty: {med.quantity}</span>
                            {med.duration && (
                              <span>Duration: {med.duration.value} {med.duration.unit}</span>
                            )}
                          </div>
                          {med.instructions && (
                            <div className="instructions">{med.instructions}</div>
                          )}
                        </div>
                        
                        <div className="availability-status">
                          {availability ? (
                            <div className={`stock-status ${availability.canFulfill ? 'available' : 'unavailable'}`}>
                              <span>Stock: {availability.available}</span>
                              <span className={availability.canFulfill ? 'can-fulfill' : 'cannot-fulfill'}>
                                {availability.canFulfill ? '✓ Available' : '⚠ Insufficient'}
                              </span>
                            </div>
                          ) : (
                            <div className="stock-status unavailable">
                              <span>❌ Not in stock</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="prescription-summary">
                  <div className="estimated-total">
                    <strong>Estimated Total: {formatCurrency(prescription.pharmacyData?.estimatedTotal || 0)}</strong>
                  </div>
                  
                  <div className="prescription-actions">
                    <button
                      className="btn-process"
                      onClick={() => handleProcessPrescription(prescription)}
                      disabled={!prescription.pharmacyData?.canFulfillCompletely}
                    >
                      {prescription.pharmacyData?.canFulfillCompletely ? 'Process' : 'Review'}
                    </button>
                    
                    <button className="btn-contact">
                      📞 Contact Doctor
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Processing Modal */}
      {showProcessModal && selectedPrescription && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h3>Process Prescription - Rx #{selectedPrescription.prescriptionNumber}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowProcessModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="prescription-details">
                <div className="patient-info">
                  <h4>Patient Information</h4>
                  <p><strong>Patient ID:</strong> {selectedPrescription.patientId}</p>
                  <p><strong>Doctor:</strong> Dr. {selectedPrescription.doctorId}</p>
                  <p><strong>Diagnosis:</strong> {selectedPrescription.diagnosis?.primary}</p>
                </div>

                <div className="medications-processing">
                  <h4>Medications to Dispense</h4>
                  {selectedPrescription.medications?.map((med, index) => (
                    <div key={index} className="medication-processing-item">
                      <div className="medication-header">
                        <strong>{med.genericName}</strong>
                        <span className="quantity">Qty: {med.quantity}</span>
                      </div>
                      
                      <div className="substitution-options">
                        <label>
                          <input
                            type="checkbox"
                            checked={processingData.substitutions[index]?.substitute || false}
                            onChange={(e) => setProcessingData(prev => ({
                              ...prev,
                              substitutions: {
                                ...prev.substitutions,
                                [index]: {
                                  ...prev.substitutions[index],
                                  substitute: e.target.checked
                                }
                              }
                            }))}
                          />
                          Substitute with alternative
                        </label>
                        
                        {processingData.substitutions[index]?.substitute && (
                          <div className="substitution-details">
                            <input
                              type="text"
                              placeholder="Alternative medication"
                              value={processingData.substitutions[index]?.alternativeMedication || ''}
                              onChange={(e) => setProcessingData(prev => ({
                                ...prev,
                                substitutions: {
                                  ...prev.substitutions,
                                  [index]: {
                                    ...prev.substitutions[index],
                                    alternativeMedication: e.target.value
                                  }
                                }
                              }))}
                            />
                            <input
                              type="text"
                              placeholder="Reason for substitution"
                              value={processingData.substitutions[index]?.reason || ''}
                              onChange={(e) => setProcessingData(prev => ({
                                ...prev,
                                substitutions: {
                                  ...prev.substitutions,
                                  [index]: {
                                    ...prev.substitutions[index],
                                    reason: e.target.value
                                  }
                                }
                              }))}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="counseling-section">
                  <h4>Patient Counseling</h4>
                  <textarea
                    placeholder="Counseling notes and instructions given to patient..."
                    value={processingData.counselingNotes}
                    onChange={(e) => setProcessingData(prev => ({
                      ...prev,
                      counselingNotes: e.target.value
                    }))}
                    rows="4"
                  />
                </div>

                <div className="pharmacist-notes">
                  <h4>Pharmacist Notes</h4>
                  <textarea
                    placeholder="Internal notes for pharmacy records..."
                    value={processingData.pharmacistNotes}
                    onChange={(e) => setProcessingData(prev => ({
                      ...prev,
                      pharmacistNotes: e.target.value
                    }))}
                    rows="3"
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowProcessModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleDispensePrescription}
              >
                Dispense Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EPrescriptionQueue;