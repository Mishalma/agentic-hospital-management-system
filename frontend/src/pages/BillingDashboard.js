import React, { useState, useEffect } from 'react';
import './BillingDashboard.css';

const BillingDashboard = () => {
  const [stats, setStats] = useState({
    billsByStatus: [],
    revenueByDepartment: [],
    paymentMethods: [],
    insuranceAnalysis: [],
    totalRevenue: 0,
    outstandingAmount: 0
  });
  const [outstandingBills, setOutstandingBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch billing statistics
      const statsResponse = await fetch('/api/billing/statistics');
      const statsData = await statsResponse.json();
      
      // Fetch outstanding bills
      const outstandingResponse = await fetch('/api/billing/outstanding');
      const outstandingData = await outstandingResponse.json();
      
      if (statsData.success) {
        // Calculate total revenue and outstanding amount
        let totalRevenue = 0;
        let outstandingAmount = 0;
        
        statsData.data.billsByStatus.forEach(status => {
          totalRevenue += status.totalAmount || 0;
          outstandingAmount += status.totalBalance || 0;
        });
        
        setStats({
          ...statsData.data,
          totalRevenue,
          outstandingAmount
        });
      }
      
      if (outstandingData.success) {
        setOutstandingBills(outstandingData.data);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': '#6c757d',
      'Generated': '#ffc107',
      'Sent': '#17a2b8',
      'Paid': '#28a745',
      'Partially Paid': '#fd7e14',
      'Overdue': '#dc3545',
      'Cancelled': '#6c757d'
    };
    return colors[status] || '#6c757d';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Normal': '#28a745',
      'Urgent': '#ffc107',
      'Emergency': '#dc3545'
    };
    return colors[priority] || '#6c757d';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="billing-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading billing dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-dashboard">
      <div className="dashboard-header">
        <h1>Hospital Billing Management</h1>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/billing/bills'}
          >
            View All Bills
          </button>
          <button 
            className="btn btn-success"
            onClick={() => window.location.href = '/billing/new'}
          >
            Create New Bill
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>{formatCurrency(stats.totalRevenue)}</h3>
            <p>Total Revenue (30 days)</p>
          </div>
        </div>
        
        <div className="metric-card outstanding">
          <div className="metric-icon">⏰</div>
          <div className="metric-content">
            <h3>{formatCurrency(stats.outstandingAmount)}</h3>
            <p>Outstanding Amount</p>
          </div>
        </div>
        
        <div className="metric-card bills">
          <div className="metric-icon">📄</div>
          <div className="metric-content">
            <h3>{outstandingBills.length}</h3>
            <p>Pending Bills</p>
          </div>
        </div>
        
        <div className="metric-card collection">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>{((stats.totalRevenue - stats.outstandingAmount) / stats.totalRevenue * 100).toFixed(1)}%</h3>
            <p>Collection Rate</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Bills by Status */}
        <div className="chart-section">
          <h3>Bills by Status</h3>
          <div className="status-chart">
            {stats.billsByStatus.map((status, index) => (
              <div key={index} className="status-item">
                <div className="status-info">
                  <span className="status-name">{status._id}</span>
                  <span className="status-count">{status.count}</span>
                  <span className="status-amount">{formatCurrency(status.totalAmount)}</span>
                </div>
                <div 
                  className="status-bar"
                  style={{
                    backgroundColor: getStatusColor(status._id),
                    width: `${(status.count / Math.max(...stats.billsByStatus.map(s => s.count))) * 100}%`
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Department */}
        <div className="chart-section">
          <h3>Revenue by Department</h3>
          <div className="department-chart">
            {stats.revenueByDepartment.map((dept, index) => (
              <div key={index} className="department-item">
                <div className="department-info">
                  <span className="department-name">{dept.department}</span>
                  <span className="department-revenue">{formatCurrency(dept.revenue)}</span>
                </div>
                <div 
                  className="department-bar"
                  style={{
                    width: `${(dept.revenue / Math.max(...stats.revenueByDepartment.map(d => d.revenue))) * 100}%`
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Methods Analysis */}
      <div className="payment-methods-section">
        <h3>Payment Methods Analysis</h3>
        <div className="payment-methods-grid">
          {stats.paymentMethods.map((method, index) => (
            <div key={index} className="payment-method-card">
              <div className="method-header">
                <span className="method-name">{method.method}</span>
                <span className="method-count">{method.count} transactions</span>
              </div>
              <div className="method-amount">{formatCurrency(method.amount)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Insurance Analysis */}
      {stats.insuranceAnalysis.length > 0 && (
        <div className="insurance-section">
          <h3>Insurance Claims Analysis</h3>
          <div className="insurance-table">
            <table>
              <thead>
                <tr>
                  <th>Insurance Provider</th>
                  <th>Total Claims</th>
                  <th>Total Amount</th>
                  <th>Covered Amount</th>
                  <th>Approved Claims</th>
                  <th>Pending Claims</th>
                </tr>
              </thead>
              <tbody>
                {stats.insuranceAnalysis.map((insurance, index) => (
                  <tr key={index}>
                    <td>{insurance.provider}</td>
                    <td>{insurance.totalClaims}</td>
                    <td>{formatCurrency(insurance.totalAmount)}</td>
                    <td>{formatCurrency(insurance.coveredAmount)}</td>
                    <td>{insurance.approvedClaims}</td>
                    <td>{insurance.pendingClaims}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Outstanding Bills */}
      <div className="outstanding-bills-section">
        <h3>Outstanding Bills</h3>
        {outstandingBills.length === 0 ? (
          <div className="no-data">
            <p>No outstanding bills</p>
          </div>
        ) : (
          <div className="bills-table">
            <table>
              <thead>
                <tr>
                  <th>Bill ID</th>
                  <th>Patient</th>
                  <th>Bill Date</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {outstandingBills.slice(0, 10).map((bill) => (
                  <tr key={bill.billId}>
                    <td><strong>{bill.billId}</strong></td>
                    <td>{bill.patientInfo.name}</td>
                    <td>{new Date(bill.billDate).toLocaleDateString()}</td>
                    <td>{formatCurrency(bill.summary.totalAmount)}</td>
                    <td>{formatCurrency(bill.summary.paidAmount)}</td>
                    <td>{formatCurrency(bill.summary.balanceAmount)}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(bill.status) }}
                      >
                        {bill.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => window.location.href = `/billing/bills/${bill.billId}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="action-btn"
            onClick={() => window.location.href = '/billing/new'}
          >
            <span className="action-icon">➕</span>
            Create New Bill
          </button>
          <button 
            className="action-btn"
            onClick={() => window.location.href = '/billing/payments'}
          >
            <span className="action-icon">💳</span>
            Record Payment
          </button>
          <button 
            className="action-btn"
            onClick={() => window.location.href = '/billing/rates'}
          >
            <span className="action-icon">💰</span>
            Manage Rates
          </button>
          <button 
            className="action-btn"
            onClick={() => window.location.href = '/billing/reports'}
          >
            <span className="action-icon">📊</span>
            Generate Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;