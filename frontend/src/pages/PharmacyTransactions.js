import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './PharmacyTransactions.css';

const PharmacyTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateRange: 'today',
    paymentMethod: 'all'
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const pharmacyId = 'PHARM001'; // This would come from user context

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, filters, dateRange]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/pharmacy/${pharmacyId}/transactions`);
      setTransactions(response.data.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    // Payment method filter
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(t => t.billing?.paymentMethod === filters.paymentMethod);
    }

    // Date range filter
    switch (filters.dateRange) {
      case 'today':
        const today = new Date().toDateString();
        filtered = filtered.filter(t => 
          new Date(t.timestamps?.created).toDateString() === today
        );
        break;
      case 'week':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(t => 
          new Date(t.timestamps?.created) >= weekAgo
        );
        break;
      case 'month':
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(t => 
          new Date(t.timestamps?.created) >= monthAgo
        );
        break;
      case 'custom':
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.timestamps?.created);
          return transactionDate >= new Date(dateRange.startDate) && 
                 transactionDate <= new Date(dateRange.endDate + 'T23:59:59');
        });
        break;
      default:
        break;
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => 
      new Date(b.timestamps?.created) - new Date(a.timestamps?.created)
    );

    setFilteredTransactions(filtered);
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const handlePrintReceipt = (transaction) => {
    // Generate and print receipt
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(generateReceiptHTML(transaction));
    receiptWindow.document.close();
    receiptWindow.print();
  };

  const generateReceiptHTML = (transaction) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pharmacy Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { border-top: 1px solid #000; padding-top: 10px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Central Pharmacy</h2>
          <p>123 Main Street, City, State</p>
          <p>Phone: (555) 123-4567</p>
        </div>
        
        <div class="transaction-info">
          <p><strong>Receipt #:</strong> ${transaction.transactionId}</p>
          <p><strong>Date:</strong> ${new Date(transaction.timestamps?.created).toLocaleString()}</p>
          <p><strong>Pharmacist:</strong> ${transaction.pharmacist?.name}</p>
          ${transaction.customer?.name ? `<p><strong>Customer:</strong> ${transaction.customer.name}</p>` : ''}
        </div>
        
        <div class="items">
          <h3>Items:</h3>
          ${transaction.items?.map(item => `
            <div class="item">
              <span>${item.genericName} ${item.quantityDispensed}x</span>
              <span>$${item.totalPrice?.toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="total">
          <div class="item">
            <span>Subtotal:</span>
            <span>$${transaction.billing?.subtotal?.toFixed(2)}</span>
          </div>
          <div class="item">
            <span>Tax:</span>
            <span>$${transaction.billing?.totalGST?.toFixed(2)}</span>
          </div>
          <div class="item">
            <span>Total:</span>
            <span>$${transaction.billing?.totalAmount?.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for choosing Central Pharmacy!</p>
          <p>Keep this receipt for your records</p>
        </div>
      </body>
      </html>
    `;
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'prescription_dispensing': return '#28a745';
      case 'otc_sale': return '#007bff';
      case 'return': return '#fd7e14';
      case 'adjustment': return '#6c757d';
      default: return '#495057';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'pending': return '#ffc107';
      case 'processing': return '#007bff';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const calculateSummary = () => {
    const summary = {
      totalTransactions: filteredTransactions.length,
      totalRevenue: filteredTransactions.reduce((sum, t) => sum + (t.billing?.totalAmount || 0), 0),
      averageTransaction: 0,
      completedTransactions: filteredTransactions.filter(t => t.status === 'completed').length
    };
    
    summary.averageTransaction = summary.totalTransactions > 0 
      ? summary.totalRevenue / summary.totalTransactions 
      : 0;
    
    return summary;
  };

  const summary = calculateSummary();

  if (loading) {
    return (
      <div className="pharmacy-transactions">
        <div className="loading-spinner">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="pharmacy-transactions">
      <div className="transactions-header">
        <h1>Transaction Management</h1>
        <div className="header-actions">
          <button className="btn-primary">+ New Sale</button>
          <button className="btn-secondary">📊 Export Data</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <h3>{formatCurrency(summary.totalRevenue)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <h3>{summary.totalTransactions}</h3>
            <p>Total Transactions</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">📈</div>
          <div className="summary-content">
            <h3>{formatCurrency(summary.averageTransaction)}</h3>
            <p>Average Transaction</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">✅</div>
          <div className="summary-content">
            <h3>{summary.completedTransactions}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="transaction-filters">
        <select
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
        >
          <option value="all">All Types</option>
          <option value="prescription_dispensing">Prescription</option>
          <option value="otc_sale">OTC Sale</option>
          <option value="return">Return</option>
          <option value="adjustment">Adjustment</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={filters.paymentMethod}
          onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
        >
          <option value="all">All Payment Methods</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="upi">UPI</option>
          <option value="insurance">Insurance</option>
        </select>

        <select
          value={filters.dateRange}
          onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="custom">Custom Range</option>
        </select>

        {filters.dateRange === 'custom' && (
          <div className="date-range-inputs">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="transactions-list">
        {filteredTransactions.length === 0 ? (
          <div className="no-transactions">
            <p>No transactions found matching your criteria.</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="transaction-card">
              <div className="transaction-header">
                <div className="transaction-info">
                  <h3>#{transaction.transactionId}</h3>
                  <div className="transaction-meta">
                    <span className="date">
                      {new Date(transaction.timestamps?.created).toLocaleString()}
                    </span>
                    <span className="pharmacist">
                      Pharmacist: {transaction.pharmacist?.name}
                    </span>
                  </div>
                </div>
                
                <div className="transaction-badges">
                  <span 
                    className="type-badge"
                    style={{ backgroundColor: getTransactionTypeColor(transaction.type) }}
                  >
                    {transaction.type?.replace('_', ' ')}
                  </span>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(transaction.status) }}
                  >
                    {transaction.status}
                  </span>
                </div>
              </div>

              <div className="transaction-content">
                <div className="transaction-details">
                  <div className="items-summary">
                    <h4>Items ({transaction.items?.length || 0})</h4>
                    <div className="items-preview">
                      {transaction.items?.slice(0, 3).map((item, index) => (
                        <div key={index} className="item-preview">
                          <span className="item-name">{item.genericName}</span>
                          <span className="item-qty">Qty: {item.quantityDispensed}</span>
                          <span className="item-price">{formatCurrency(item.totalPrice)}</span>
                        </div>
                      ))}
                      {transaction.items?.length > 3 && (
                        <div className="more-items">
                          +{transaction.items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="customer-info">
                    {transaction.customer?.name && (
                      <div>
                        <strong>Customer:</strong> {transaction.customer.name}
                        {transaction.customer.phone && (
                          <div className="customer-phone">{transaction.customer.phone}</div>
                        )}
                      </div>
                    )}
                    
                    {transaction.prescriptionId && (
                      <div className="prescription-ref">
                        <strong>Prescription:</strong> {transaction.prescriptionId}
                      </div>
                    )}
                  </div>
                </div>

                <div className="transaction-summary">
                  <div className="billing-info">
                    <div className="billing-line">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(transaction.billing?.subtotal)}</span>
                    </div>
                    <div className="billing-line">
                      <span>Tax:</span>
                      <span>{formatCurrency(transaction.billing?.totalGST)}</span>
                    </div>
                    <div className="billing-line total">
                      <span>Total:</span>
                      <span>{formatCurrency(transaction.billing?.totalAmount)}</span>
                    </div>
                    
                    <div className="payment-info">
                      <span className="payment-method">
                        {transaction.billing?.paymentMethod?.toUpperCase()}
                      </span>
                      {transaction.billing?.balance > 0 && (
                        <span className="balance-due">
                          Balance: {formatCurrency(transaction.billing.balance)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="transaction-actions">
                    <button
                      className="btn-action view"
                      onClick={() => handleViewDetails(transaction)}
                    >
                      👁️ View
                    </button>
                    <button
                      className="btn-action print"
                      onClick={() => handlePrintReceipt(transaction)}
                    >
                      🖨️ Print
                    </button>
                    {transaction.status === 'completed' && (
                      <button className="btn-action return">
                        ↩️ Return
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h3>Transaction Details - #{selectedTransaction.transactionId}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDetailsModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="transaction-full-details">
                {/* Transaction Info */}
                <div className="detail-section">
                  <h4>Transaction Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Transaction ID:</label>
                      <span>{selectedTransaction.transactionId}</span>
                    </div>
                    <div className="detail-item">
                      <label>Type:</label>
                      <span>{selectedTransaction.type?.replace('_', ' ')}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span>{selectedTransaction.status}</span>
                    </div>
                    <div className="detail-item">
                      <label>Date:</label>
                      <span>{new Date(selectedTransaction.timestamps?.created).toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <label>Pharmacist:</label>
                      <span>{selectedTransaction.pharmacist?.name}</span>
                    </div>
                    {selectedTransaction.prescriptionId && (
                      <div className="detail-item">
                        <label>Prescription ID:</label>
                        <span>{selectedTransaction.prescriptionId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Info */}
                {selectedTransaction.customer && (
                  <div className="detail-section">
                    <h4>Customer Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Name:</label>
                        <span>{selectedTransaction.customer.name}</span>
                      </div>
                      {selectedTransaction.customer.phone && (
                        <div className="detail-item">
                          <label>Phone:</label>
                          <span>{selectedTransaction.customer.phone}</span>
                        </div>
                      )}
                      {selectedTransaction.customer.email && (
                        <div className="detail-item">
                          <label>Email:</label>
                          <span>{selectedTransaction.customer.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="detail-section">
                  <h4>Items ({selectedTransaction.items?.length || 0})</h4>
                  <div className="items-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Medication</th>
                          <th>Batch</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTransaction.items?.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <div>
                                <strong>{item.genericName}</strong>
                                {item.brandName && <div className="brand-name">{item.brandName}</div>}
                                {item.substituted && (
                                  <div className="substitution-note">
                                    Substituted from: {item.originalMedication}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>{item.batchNumber}</td>
                            <td>{item.quantityDispensed}</td>
                            <td>{formatCurrency(item.unitPrice)}</td>
                            <td>{formatCurrency(item.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Billing */}
                <div className="detail-section">
                  <h4>Billing Information</h4>
                  <div className="billing-details">
                    <div className="billing-row">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedTransaction.billing?.subtotal)}</span>
                    </div>
                    <div className="billing-row">
                      <span>Tax (GST):</span>
                      <span>{formatCurrency(selectedTransaction.billing?.totalGST)}</span>
                    </div>
                    {selectedTransaction.billing?.totalDiscount > 0 && (
                      <div className="billing-row">
                        <span>Discount:</span>
                        <span>-{formatCurrency(selectedTransaction.billing.totalDiscount)}</span>
                      </div>
                    )}
                    <div className="billing-row total">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(selectedTransaction.billing?.totalAmount)}</span>
                    </div>
                    <div className="billing-row">
                      <span>Amount Paid:</span>
                      <span>{formatCurrency(selectedTransaction.billing?.amountPaid)}</span>
                    </div>
                    {selectedTransaction.billing?.balance > 0 && (
                      <div className="billing-row balance">
                        <span>Balance Due:</span>
                        <span>{formatCurrency(selectedTransaction.billing.balance)}</span>
                      </div>
                    )}
                    <div className="payment-method-info">
                      Payment Method: {selectedTransaction.billing?.paymentMethod?.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Counseling */}
                {selectedTransaction.counseling?.provided && (
                  <div className="detail-section">
                    <h4>Patient Counseling</h4>
                    <div className="counseling-info">
                      <p><strong>Duration:</strong> {selectedTransaction.counseling.duration} minutes</p>
                      {selectedTransaction.counseling.notes && (
                        <div>
                          <strong>Notes:</strong>
                          <p>{selectedTransaction.counseling.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
              <button 
                className="btn-primary"
                onClick={() => handlePrintReceipt(selectedTransaction)}
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyTransactions;