import React, { useState, useEffect } from "react";
import "./LaboratoryDashboard.css";

const LaboratoryDashboard = () => {
  const [stats, setStats] = useState({
    ordersByStatus: [],
    resultsByCategory: [],
    averageTurnaroundTime: { hours: 0, minutes: 0 },
    totalOrders: 0,
  });
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch statistics
      const statsResponse = await fetch("/api/laboratory/statistics");
      const statsData = await statsResponse.json();

      // Fetch pending orders
      const pendingResponse = await fetch("/api/laboratory/pending");
      const pendingData = await pendingResponse.json();

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (pendingData.success) {
        setPendingOrders(pendingData.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "#ffc107",
      Collected: "#17a2b8",
      Processing: "#fd7e14",
      Completed: "#28a745",
      Cancelled: "#dc3545",
    };
    return colors[status] || "#6c757d";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Routine: "#28a745",
      Urgent: "#ffc107",
      STAT: "#dc3545",
    };
    return colors[priority] || "#6c757d";
  };

  if (loading) {
    return (
      <div className="laboratory-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading laboratory dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="laboratory-dashboard">
      <div className="dashboard-header">
        <h1>Laboratory Information System</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => (window.location.href = "/lab-orders")}>
            View All Orders
          </button>
          <button className="btn btn-success" onClick={() => (window.location.href = "/lab-results")}>
            View Results
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🧪</div>
          <div className="stat-content">
            <h3>{pendingOrders.length}</h3>
            <p>Pending Orders</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>
              {stats.averageTurnaroundTime.hours}h {stats.averageTurnaroundTime.minutes}m
            </h3>
            <p>Avg Turnaround Time</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalOrders || 0}</h3>
            <p>Total Orders (30 days)</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.ordersByStatus.find((s) => s._id === "Completed")?.count || 0}</h3>
            <p>Completed Today</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Orders by Status Chart */}
        <div className="chart-section">
          <h3>Orders by Status</h3>
          <div className="status-chart">
            {stats.ordersByStatus.map((status, index) => (
              <div key={index} className="status-item">
                <div
                  className="status-bar"
                  style={{
                    backgroundColor: getStatusColor(status._id),
                    width: `${(status.count / Math.max(...stats.ordersByStatus.map((s) => s.count))) * 100}%`,
                  }}
                ></div>
                <div className="status-label">
                  <span className="status-name">{status._id}</span>
                  <span className="status-count">{status.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results by Category */}
        <div className="chart-section">
          <h3>Results by Category</h3>
          <div className="category-chart">
            {stats.resultsByCategory.map((category, index) => (
              <div key={index} className="category-item">
                <div className="category-info">
                  <span className="category-name">{category._id}</span>
                  <span className="category-count">{category.count}</span>
                </div>
                <div
                  className="category-bar"
                  style={{
                    width: `${(category.count / Math.max(...stats.resultsByCategory.map((c) => c.count))) * 100}%`,
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Orders Table */}
      <div className="pending-orders-section">
        <h3>Pending Orders</h3>
        {pendingOrders.length === 0 ? (
          <div className="no-data">
            <p>No pending orders</p>
          </div>
        ) : (
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Patient ID</th>
                  <th>Tests</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Order Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.slice(0, 10).map((order) => (
                  <tr key={order.orderId}>
                    <td>{order.orderId}</td>
                    <td>{order.patientId}</td>
                    <td>
                      <div className="tests-list">
                        {order.tests.map((test, index) => (
                          <span key={index} className="test-badge">
                            {test.testName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="priority-badge" style={{ backgroundColor: getPriorityColor(order.priority) }}>
                        {order.priority}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => (window.location.href = `/lab-orders/${order.orderId}`)}
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
          <button className="action-btn" onClick={() => (window.location.href = "/lab-orders/new")}>
            <span className="action-icon">➕</span>
            New Lab Order
          </button>
          <button className="action-btn" onClick={() => (window.location.href = "/sample-collection")}>
            <span className="action-icon">🧪</span>
            Sample Collection
          </button>
          <button className="action-btn" onClick={() => (window.location.href = "/result-entry")}>
            <span className="action-icon">📝</span>
            Result Entry
          </button>
          <button className="action-btn" onClick={() => (window.location.href = "/lab-reports")}>
            <span className="action-icon">📊</span>
            Lab Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaboratoryDashboard;
