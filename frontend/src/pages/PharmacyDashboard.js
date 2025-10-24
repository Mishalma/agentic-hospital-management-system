import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './PharmacyDashboard.css';

const PharmacyDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  const pharmacyId = 'PHARM001'; // This would come from user context

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics
      const analyticsResponse = await axios.get(`/api/pharmacy/${pharmacyId}/analytics?period=${selectedPeriod}`);
      setAnalytics(analyticsResponse.data.data);
      
      // Fetch alerts
      const [lowStockResponse, expiryResponse] = await Promise.all([
        axios.get(`/api/pharmacy/${pharmacyId}/alerts/low-stock`),
        axios.get(`/api/pharmacy/${pharmacyId}/alerts/expiry`)
      ]);
      
      setLowStockAlerts(lowStockResponse.data.data);
      setExpiryAlerts(expiryResponse.data.data);
      
      // Fetch recent transactions
      const transactionsResponse = await axios.get(`/api/pharmacy/${pharmacyId}/transactions?limit=10`);
      setRecentTransactions(transactionsResponse.data.data);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="pharmacy-dashboard">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="pharmacy-dashboard">
      <div className="dashboard-header">
        <h1>Pharmacy Dashboard</h1>
        <div className="period-selector">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>{formatCurrency(analytics?.revenue?.total || 0)}</h3>
            <p>Total Revenue</p>
            <span className="metric-detail">
              {analytics?.revenue?.transactions || 0} transactions
            </span>
          </div>
        </div>

        <div className="metric-card inventory">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <h3>{analytics?.inventory?.totalItems || 0}</h3>
            <p>Inventory Items</p>
            <span className="metric-detail">
              {formatCurrency(analytics?.inventory?.totalValue || 0)} value
            </span>
          </div>
        </div>

        <div className="metric-card alerts">
          <div className="metric-icon">⚠️</div>
          <div className="metric-content">
            <h3>{(analytics?.alerts?.critical || 0) + (analytics?.alerts?.high || 0)}</h3>
            <p>Active Alerts</p>
            <span className="metric-detail">
              {analytics?.alerts?.critical || 0} critical
            </span>
          </div>
        </div>

        <div className="metric-card stock">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h3>{analytics?.inventory?.lowStock || 0}</h3>
            <p>Low Stock Items</p>
            <span className="metric-detail">
              {analytics?.inventory?.expiring || 0} expiring soon
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Alerts Section */}
        <div className="alerts-section">
          <h2>Critical Alerts</h2>
          
          {/* Low Stock Alerts */}
          {lowStockAlerts.length > 0 && (
            <div className="alert-group">
              <h3>Low Stock Alerts ({lowStockAlerts.length})</h3>
              <div className="alerts-list">
                {lowStockAlerts.slice(0, 5).map((alert, index) => (
                  <div key={index} className="alert-item" style={{ borderLeftColor: getAlertColor(alert.severity) }}>
                    <div className="alert-content">
                      <strong>{alert.genericName}</strong>
                      {alert.brandName && <span> ({alert.brandName})</span>}
                      <p>{alert.message}</p>
                    </div>
                    <div className="alert-meta">
                      <span className={`severity ${alert.severity}`}>{alert.severity}</span>
                      <span className="stock-count">{alert.currentStock} left</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiry Alerts */}
          {expiryAlerts.length > 0 && (
            <div className="alert-group">
              <h3>Expiry Alerts ({expiryAlerts.length})</h3>
              <div className="alerts-list">
                {expiryAlerts.slice(0, 5).map((alert, index) => (
                  <div key={index} className="alert-item" style={{ borderLeftColor: getAlertColor(alert.severity) }}>
                    <div className="alert-content">
                      <strong>{alert.genericName}</strong>
                      {alert.brandName && <span> ({alert.brandName})</span>}
                      <p>{alert.message}</p>
                      <small>Batch: {alert.batchNumber}</small>
                    </div>
                    <div className="alert-meta">
                      <span className={`severity ${alert.severity}`}>{alert.severity}</span>
                      <span className="days-count">{alert.daysToExpiry} days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowStockAlerts.length === 0 && expiryAlerts.length === 0 && (
            <div className="no-alerts">
              <p>✅ No critical alerts at this time</p>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="transactions-section">
          <h2>Recent Transactions</h2>
          
          {recentTransactions.length > 0 ? (
            <div className="transactions-list">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-header">
                    <span className="transaction-id">{transaction.transactionId}</span>
                    <span className={`transaction-type ${transaction.type}`}>
                      {transaction.type.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="transaction-details">
                    <div className="transaction-info">
                      <p><strong>Pharmacist:</strong> {transaction.pharmacist?.name}</p>
                      <p><strong>Items:</strong> {transaction.items?.length || 0}</p>
                      {transaction.customer?.name && (
                        <p><strong>Customer:</strong> {transaction.customer.name}</p>
                      )}
                    </div>
                    
                    <div className="transaction-amount">
                      <span className="amount">{formatCurrency(transaction.billing?.totalAmount || 0)}</span>
                      <span className="date">
                        {new Date(transaction.timestamps?.created).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`transaction-status ${transaction.status}`}>
                    {transaction.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-transactions">
              <p>No recent transactions</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="action-btn primary"
          onClick={() => window.location.href = '/pharmacy/inventory'}
        >
          📦 Manage Inventory
        </button>
        
        <button 
          className="action-btn secondary"
          onClick={() => window.location.href = '/pharmacy/prescriptions'}
        >
          💊 Process Prescriptions
        </button>
        
        <button 
          className="action-btn secondary"
          onClick={() => window.location.href = '/pharmacy/transactions'}
        >
          📊 View Transactions
        </button>
        
        <button 
          className="action-btn secondary"
          onClick={() => window.location.href = '/pharmacy/reports'}
        >
          📈 Generate Reports
        </button>
      </div>
    </div>
  );
};

export default PharmacyDashboard;