import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './PharmacyReports.css';

const PharmacyReports = () => {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState('dashboard');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    groupBy: 'day'
  });

  const pharmacyId = 'PHARM001'; // This would come from user context

  const reportTypes = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'sales', name: 'Sales Report', icon: '💰' },
    { id: 'inventory', name: 'Inventory Report', icon: '📦' },
    { id: 'prescriptions', name: 'Prescription Analysis', icon: '💊' },
    { id: 'financial', name: 'Financial Report', icon: '📈' }
  ];

  useEffect(() => {
    fetchReportData();
  }, [activeReport, dateRange, filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      let url = `/api/pharmacy/${pharmacyId}/reports/${activeReport}`;
      
      const params = new URLSearchParams();
      if (activeReport !== 'dashboard') {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
        if (filters.groupBy) {
          params.append('groupBy', filters.groupBy);
        }
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      setReportData(response.data.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format = 'json') => {
    try {
      const params = new URLSearchParams({
        format,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      const response = await axios.get(
        `/api/pharmacy/${pharmacyId}/reports/${activeReport}/export?${params.toString()}`,
        { responseType: format === 'csv' ? 'blob' : 'json' }
      );
      
      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeReport}-report-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeReport}-report-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const renderDashboard = () => {
    if (!reportData) return null;

    return (
      <div className="dashboard-report">
        <div className="dashboard-metrics">
          <div className="metric-card">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <h3>{formatCurrency(reportData.todayMetrics?.revenue)}</h3>
              <p>Today's Revenue</p>
              <span className={`change ${reportData.todayMetrics?.revenueChange >= 0 ? 'positive' : 'negative'}`}>
                {reportData.todayMetrics?.revenueChange >= 0 ? '↗' : '↘'} {formatPercentage(Math.abs(reportData.todayMetrics?.revenueChange))}
              </span>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">🛒</div>
            <div className="metric-content">
              <h3>{reportData.todayMetrics?.transactions}</h3>
              <p>Transactions Today</p>
              <span className="average">
                Avg: {formatCurrency(reportData.todayMetrics?.averageTransaction)}
              </span>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">⚠️</div>
            <div className="metric-content">
              <h3>{reportData.alerts?.total}</h3>
              <p>Active Alerts</p>
              <div className="alert-breakdown">
                <span>Low Stock: {reportData.alerts?.lowStock}</span>
                <span>Expiring: {reportData.alerts?.expiring}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {reportData.recentActivity?.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-info">
                  <span className="activity-type">{activity.type?.replace('_', ' ')}</span>
                  <span className="activity-customer">{activity.customer || 'Walk-in'}</span>
                </div>
                <div className="activity-details">
                  <span className="activity-amount">{formatCurrency(activity.amount)}</span>
                  <span className="activity-time">
                    {new Date(activity.time).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSalesReport = () => {
    if (!reportData) return null;

    return (
      <div className="sales-report">
        <div className="report-summary">
          <div className="summary-cards">
            <div className="summary-card">
              <h4>Total Revenue</h4>
              <p className="summary-value">{formatCurrency(reportData.summary?.totalRevenue)}</p>
            </div>
            <div className="summary-card">
              <h4>Total Transactions</h4>
              <p className="summary-value">{reportData.summary?.totalTransactions}</p>
            </div>
            <div className="summary-card">
              <h4>Average Transaction</h4>
              <p className="summary-value">{formatCurrency(reportData.summary?.averageTransactionValue)}</p>
            </div>
          </div>
        </div>

        <div className="report-charts">
          <div className="chart-section">
            <h4>Sales Trends</h4>
            <div className="trends-chart">
              {reportData.trends?.map((trend, index) => (
                <div key={index} className="trend-bar">
                  <div className="trend-label">{trend.period}</div>
                  <div className="trend-value">
                    <div 
                      className="trend-fill"
                      style={{ 
                        width: `${(trend.revenue / Math.max(...reportData.trends.map(t => t.revenue))) * 100}%` 
                      }}
                    ></div>
                    <span>{formatCurrency(trend.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-section">
            <h4>Top Medications</h4>
            <div className="top-medications">
              {reportData.topMedications?.slice(0, 10).map((med, index) => (
                <div key={index} className="medication-item">
                  <div className="medication-rank">#{index + 1}</div>
                  <div className="medication-info">
                    <strong>{med.name}</strong>
                    {med.brandName && <span className="brand">({med.brandName})</span>}
                    <div className="medication-stats">
                      <span>Qty: {med.quantity}</span>
                      <span>Revenue: {formatCurrency(med.revenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="payment-analysis">
          <h4>Payment Methods</h4>
          <div className="payment-breakdown">
            {Object.entries(reportData.paymentMethods || {}).map(([method, data]) => (
              <div key={method} className="payment-method">
                <div className="payment-header">
                  <span className="method-name">{method.toUpperCase()}</span>
                  <span className="method-amount">{formatCurrency(data.amount)}</span>
                </div>
                <div className="payment-details">
                  <span>{data.count} transactions</span>
                  <span>Avg: {formatCurrency(data.amount / data.count)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderInventoryReport = () => {
    if (!reportData) return null;

    return (
      <div className="inventory-report">
        <div className="inventory-summary">
          <div className="summary-cards">
            <div className="summary-card">
              <h4>Total Items</h4>
              <p className="summary-value">{reportData.summary?.totalItems}</p>
            </div>
            <div className="summary-card">
              <h4>Total Value</h4>
              <p className="summary-value">{formatCurrency(reportData.summary?.totalValue)}</p>
            </div>
            <div className="summary-card">
              <h4>Low Stock Items</h4>
              <p className="summary-value alert">{reportData.summary?.lowStockCount}</p>
            </div>
            <div className="summary-card">
              <h4>Categories</h4>
              <p className="summary-value">{reportData.summary?.categories}</p>
            </div>
          </div>
        </div>

        <div className="inventory-analysis">
          <div className="analysis-section">
            <h4>Expiry Analysis</h4>
            <div className="expiry-breakdown">
              <div className="expiry-item expired">
                <span className="expiry-label">Expired</span>
                <span className="expiry-count">{reportData.expiryAnalysis?.expired}</span>
              </div>
              <div className="expiry-item expiring-soon">
                <span className="expiry-label">Expiring (30 days)</span>
                <span className="expiry-count">{reportData.expiryAnalysis?.expiring30Days}</span>
              </div>
              <div className="expiry-item expiring-later">
                <span className="expiry-label">Expiring (90 days)</span>
                <span className="expiry-count">{reportData.expiryAnalysis?.expiring90Days}</span>
              </div>
              <div className="expiry-item good">
                <span className="expiry-label">Good</span>
                <span className="expiry-count">{reportData.expiryAnalysis?.good}</span>
              </div>
            </div>
          </div>

          <div className="analysis-section">
            <h4>ABC Analysis</h4>
            <div className="abc-analysis">
              <div className="abc-category category-a">
                <h5>Category A (High Value)</h5>
                <p>{reportData.abcAnalysis?.A?.count} items</p>
                <p>{formatCurrency(reportData.abcAnalysis?.A?.value)}</p>
              </div>
              <div className="abc-category category-b">
                <h5>Category B (Medium Value)</h5>
                <p>{reportData.abcAnalysis?.B?.count} items</p>
                <p>{formatCurrency(reportData.abcAnalysis?.B?.value)}</p>
              </div>
              <div className="abc-category category-c">
                <h5>Category C (Low Value)</h5>
                <p>{reportData.abcAnalysis?.C?.count} items</p>
                <p>{formatCurrency(reportData.abcAnalysis?.C?.value)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="low-stock-alerts">
          <h4>Low Stock Items</h4>
          <div className="low-stock-list">
            {reportData.lowStockItems?.map((item, index) => (
              <div key={index} className="low-stock-item">
                <div className="item-info">
                  <strong>{item.genericName}</strong>
                  <span className="supplier">Supplier: {item.supplier}</span>
                </div>
                <div className="stock-info">
                  <span className="current-stock">Current: {item.currentStock}</span>
                  <span className="reorder-level">Reorder: {item.reorderLevel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPrescriptionReport = () => {
    if (!reportData) return null;

    return (
      <div className="prescription-report">
        <div className="prescription-summary">
          <div className="summary-cards">
            <div className="summary-card">
              <h4>Total Prescriptions</h4>
              <p className="summary-value">{reportData.summary?.totalPrescriptions}</p>
            </div>
            <div className="summary-card">
              <h4>Total Revenue</h4>
              <p className="summary-value">{formatCurrency(reportData.summary?.totalRevenue)}</p>
            </div>
            <div className="summary-card">
              <h4>Avg Items/Prescription</h4>
              <p className="summary-value">{reportData.summary?.averageItemsPerPrescription?.toFixed(1)}</p>
            </div>
            <div className="summary-card">
              <h4>Substitution Rate</h4>
              <p className="summary-value">{formatPercentage(reportData.summary?.substitutionRate)}</p>
            </div>
          </div>
        </div>

        <div className="prescription-analysis">
          <div className="analysis-section">
            <h4>Top Prescribing Doctors</h4>
            <div className="doctor-list">
              {reportData.doctorAnalysis?.slice(0, 10).map((doctor, index) => (
                <div key={index} className="doctor-item">
                  <div className="doctor-rank">#{index + 1}</div>
                  <div className="doctor-info">
                    <strong>{doctor.doctorId}</strong>
                    <div className="doctor-stats">
                      <span>{doctor.prescriptions} prescriptions</span>
                      <span>{formatCurrency(doctor.revenue)} revenue</span>
                      <span>{doctor.avgItems.toFixed(1)} avg items</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="analysis-section">
            <h4>Prescription Types</h4>
            <div className="prescription-types">
              <div className="type-item">
                <span className="type-label">Acute Care</span>
                <span className="type-count">{reportData.prescriptionTypes?.acute}</span>
              </div>
              <div className="type-item">
                <span className="type-label">Chronic Care</span>
                <span className="type-count">{reportData.prescriptionTypes?.chronic}</span>
              </div>
              <div className="type-item">
                <span className="type-label">Preventive</span>
                <span className="type-count">{reportData.prescriptionTypes?.preventive}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="substitution-analysis">
          <h4>Substitution Analysis</h4>
          <div className="substitution-details">
            <div className="substitution-rate">
              <h5>Overall Rate: {formatPercentage(reportData.substitutionAnalysis?.rate)}</h5>
            </div>
            <div className="substitution-reasons">
              <h5>Common Reasons:</h5>
              {Object.entries(reportData.substitutionAnalysis?.reasons || {}).map(([reason, count]) => (
                <div key={reason} className="reason-item">
                  <span className="reason-text">{reason}</span>
                  <span className="reason-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFinancialReport = () => {
    if (!reportData) return null;

    return (
      <div className="financial-report">
        <div className="financial-summary">
          <div className="summary-cards">
            <div className="summary-card">
              <h4>Gross Revenue</h4>
              <p className="summary-value">{formatCurrency(reportData.revenue?.gross)}</p>
            </div>
            <div className="summary-card">
              <h4>Net Revenue</h4>
              <p className="summary-value">{formatCurrency(reportData.revenue?.net)}</p>
            </div>
            <div className="summary-card">
              <h4>Gross Profit</h4>
              <p className="summary-value">{formatCurrency(reportData.profitability?.grossProfit)}</p>
            </div>
            <div className="summary-card">
              <h4>Net Profit</h4>
              <p className="summary-value">{formatCurrency(reportData.profitability?.netProfit)}</p>
            </div>
          </div>
        </div>

        <div className="financial-analysis">
          <div className="analysis-section">
            <h4>Profitability Metrics</h4>
            <div className="profitability-metrics">
              <div className="metric-item">
                <span className="metric-label">Gross Margin</span>
                <span className="metric-value">{formatPercentage(reportData.profitability?.grossMargin)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Net Margin</span>
                <span className="metric-value">{formatPercentage(reportData.profitability?.netMargin)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Inventory Turnover</span>
                <span className="metric-value">{reportData.kpis?.inventoryTurnover?.toFixed(2)}x</span>
              </div>
            </div>
          </div>

          <div className="analysis-section">
            <h4>Cost Breakdown</h4>
            <div className="cost-breakdown">
              <div className="cost-item">
                <span className="cost-label">Cost of Goods Sold</span>
                <span className="cost-value">{formatCurrency(reportData.costs?.cogs)}</span>
              </div>
              <div className="cost-item">
                <span className="cost-label">Operational Costs</span>
                <span className="cost-value">{formatCurrency(reportData.costs?.operational)}</span>
              </div>
              <div className="cost-item">
                <span className="cost-label">Inventory Value</span>
                <span className="cost-value">{formatCurrency(reportData.costs?.inventory)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="cash-flow">
          <h4>Cash Flow</h4>
          <div className="cash-flow-items">
            <div className="cash-flow-item inflow">
              <span className="flow-label">Cash Inflow</span>
              <span className="flow-value">{formatCurrency(reportData.cashFlow?.inflow)}</span>
            </div>
            <div className="cash-flow-item outflow">
              <span className="flow-label">Cash Outflow</span>
              <span className="flow-value">{formatCurrency(reportData.cashFlow?.outflow)}</span>
            </div>
            <div className="cash-flow-item net">
              <span className="flow-label">Net Cash Flow</span>
              <span className="flow-value">{formatCurrency(reportData.cashFlow?.net)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReportContent = () => {
    if (loading) {
      return <div className="loading-spinner">Loading report data...</div>;
    }

    switch (activeReport) {
      case 'dashboard':
        return renderDashboard();
      case 'sales':
        return renderSalesReport();
      case 'inventory':
        return renderInventoryReport();
      case 'prescriptions':
        return renderPrescriptionReport();
      case 'financial':
        return renderFinancialReport();
      default:
        return <div>Report not found</div>;
    }
  };

  return (
    <div className="pharmacy-reports">
      <div className="reports-header">
        <h1>Pharmacy Reports & Analytics</h1>
        <div className="header-actions">
          <button 
            className="btn-export"
            onClick={() => handleExportReport('json')}
            disabled={activeReport === 'dashboard'}
          >
            📄 Export JSON
          </button>
          <button 
            className="btn-export"
            onClick={() => handleExportReport('csv')}
            disabled={activeReport === 'dashboard'}
          >
            📊 Export CSV
          </button>
        </div>
      </div>

      <div className="reports-navigation">
        {reportTypes.map(report => (
          <button
            key={report.id}
            className={`nav-button ${activeReport === report.id ? 'active' : ''}`}
            onClick={() => setActiveReport(report.id)}
          >
            <span className="nav-icon">{report.icon}</span>
            <span className="nav-label">{report.name}</span>
          </button>
        ))}
      </div>

      {activeReport !== 'dashboard' && (
        <div className="report-filters">
          <div className="date-range">
            <label>Start Date:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
            <label>End Date:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>

          {activeReport === 'sales' && (
            <div className="additional-filters">
              <label>Group By:</label>
              <select
                value={filters.groupBy}
                onChange={(e) => setFilters(prev => ({ ...prev, groupBy: e.target.value }))}
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
          )}

          <button className="btn-refresh" onClick={fetchReportData}>
            🔄 Refresh
          </button>
        </div>
      )}

      <div className="report-content">
        {renderReportContent()}
      </div>
    </div>
  );
};

export default PharmacyReports;