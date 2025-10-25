import React, { useState, useEffect, useCallback } from "react";
import "./LabOrderManagement.css";
import LaboratoryDashboard from "../components/LaboratoryDashboard";

const LabOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    patientId: "",
    startDate: "",
    endDate: "",
  });
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [testCatalog, setTestCatalog] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchTestCatalog();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...orders];

    if (filters.status) {
      filtered = filtered.filter((order) => order.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter((order) => order.priority === filters.priority);
    }

    if (filters.patientId) {
      filtered = filtered.filter((order) => order.patientId.toLowerCase().includes(filters.patientId.toLowerCase()));
    }

    if (filters.startDate) {
      filtered = filtered.filter((order) => new Date(order.orderDate) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      filtered = filtered.filter((order) => new Date(order.orderDate) <= new Date(filters.endDate));
    }

    setFilteredOrders(filtered);
  }, [orders, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/laboratory/orders");
      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
      } else {
        setError("Failed to fetch lab orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to fetch lab orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchTestCatalog = async () => {
    try {
      const response = await fetch("/api/laboratory/test-catalog");
      const data = await response.json();

      if (data.success) {
        setTestCatalog(data.data);
      }
    } catch (error) {
      console.error("Error fetching test catalog:", error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/laboratory/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setOrders((prev) =>
          prev.map((order) =>
            order.orderId === orderId ? { ...order, status: newStatus, updatedAt: new Date() } : order
          )
        );
      } else {
        setError("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      setError("Failed to update order status");
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
      <div className="lab-order-management">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading lab orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lab-order-management">
      <div className="page-header">
        <h1>Lab Order Management</h1>
        <button className="btn btn-primary" onClick={() => setShowNewOrderForm(true)}>
          + New Lab Order
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Status</label>
            <select value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Collected">Collected</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priority</label>
            <select value={filters.priority} onChange={(e) => handleFilterChange("priority", e.target.value)}>
              <option value="">All Priorities</option>
              <option value="Routine">Routine</option>
              <option value="Urgent">Urgent</option>
              <option value="STAT">STAT</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Patient ID</label>
            <input
              type="text"
              value={filters.patientId}
              onChange={(e) => handleFilterChange("patientId", e.target.value)}
              placeholder="Search by Patient ID"
            />
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-section">
        <div className="section-header">
          <h3>Lab Orders ({filteredOrders.length})</h3>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="no-data">
            <p>No lab orders found matching the current filters</p>
          </div>
        ) : (
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Patient ID</th>
                  <th>Doctor</th>
                  <th>Tests</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Order Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.orderId}>
                    <td>
                      <strong>{order.orderId}</strong>
                    </td>
                    <td>{order.patientId}</td>
                    <td>{order.doctorId}</td>
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
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.orderId, e.target.value)}
                        className="status-select"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Collected">Collected</option>
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => (window.location.href = `/lab-orders/${order.orderId}`)}
                        >
                          View
                        </button>
                        {order.status === "Pending" && (
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => (window.location.href = `/sample-collection/${order.orderId}`)}
                          >
                            Collect
                          </button>
                        )}
                        {order.status === "Collected" && (
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => (window.location.href = `/result-entry/${order.orderId}`)}
                          >
                            Enter Results
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                <LaboratoryDashboard />
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Order Form Modal */}
      {showNewOrderForm && (
        <NewOrderModal
          testCatalog={testCatalog}
          onClose={() => setShowNewOrderForm(false)}
          onOrderCreated={fetchOrders}
        />
      )}
    </div>
  );
};

// New Order Modal Component
const NewOrderModal = ({ testCatalog, onClose, onOrderCreated }) => {
  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "",
    consultationId: "",
    priority: "Routine",
    clinicalInfo: {
      diagnosis: "",
      symptoms: "",
      medications: "",
      allergies: "",
    },
    selectedTests: [],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleTestSelection = (test, category) => {
    const testWithCategory = { ...test, category };
    setFormData((prev) => ({
      ...prev,
      selectedTests: prev.selectedTests.some((t) => t.testCode === test.testCode)
        ? prev.selectedTests.filter((t) => t.testCode !== test.testCode)
        : [...prev.selectedTests, testWithCategory],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const orderData = {
        ...formData,
        tests: formData.selectedTests.map((test) => ({
          testCode: test.testCode,
          testName: test.testName,
          category: test.category,
          specimen: test.specimen,
          priority: formData.priority,
        })),
      };

      const response = await fetch("/api/laboratory/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (data.success) {
        onOrderCreated();
        onClose();
      } else {
        alert("Failed to create lab order: " + data.message);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create lab order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>New Lab Order</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="order-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Patient ID *</label>
              <input
                type="text"
                value={formData.patientId}
                onChange={(e) => handleInputChange("patientId", e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Doctor ID *</label>
              <input
                type="text"
                value={formData.doctorId}
                onChange={(e) => handleInputChange("doctorId", e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Consultation ID</label>
              <input
                type="text"
                value={formData.consultationId}
                onChange={(e) => handleInputChange("consultationId", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select value={formData.priority} onChange={(e) => handleInputChange("priority", e.target.value)}>
                <option value="Routine">Routine</option>
                <option value="Urgent">Urgent</option>
                <option value="STAT">STAT</option>
              </select>
            </div>
          </div>

          <div className="clinical-info">
            <h4>Clinical Information</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Diagnosis</label>
                <input
                  type="text"
                  value={formData.clinicalInfo.diagnosis}
                  onChange={(e) => handleInputChange("clinicalInfo.diagnosis", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Symptoms</label>
                <input
                  type="text"
                  value={formData.clinicalInfo.symptoms}
                  onChange={(e) => handleInputChange("clinicalInfo.symptoms", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Current Medications</label>
                <input
                  type="text"
                  value={formData.clinicalInfo.medications}
                  onChange={(e) => handleInputChange("clinicalInfo.medications", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Allergies</label>
                <input
                  type="text"
                  value={formData.clinicalInfo.allergies}
                  onChange={(e) => handleInputChange("clinicalInfo.allergies", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="test-selection">
            <h4>Select Tests</h4>
            {testCatalog.map((category) => (
              <div key={category.category} className="test-category">
                <h5>{category.category}</h5>
                <div className="tests-grid">
                  {category.tests.map((test) => (
                    <div
                      key={test.testCode}
                      className={`test-item ${
                        formData.selectedTests.some((t) => t.testCode === test.testCode) ? "selected" : ""
                      }`}
                      onClick={() => handleTestSelection(test, category.category)}
                    >
                      <div className="test-info">
                        <strong>{test.testName}</strong>
                        <p>Specimen: {test.specimen}</p>
                        <p>TAT: {test.turnaroundTime}</p>
                        <p>Cost: ${test.cost}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || formData.selectedTests.length === 0}
            >
              {submitting ? "Creating..." : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LabOrderManagement;
