import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './PharmacyInventory.css';

const PharmacyInventory = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    stockLevel: 'all'
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockUpdate, setStockUpdate] = useState({
    quantity: '',
    type: 'adjustment',
    reference: '',
    notes: ''
  });

  const pharmacyId = 'PHARM001'; // This would come from user context

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm, filters]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/pharmacy/${pharmacyId}/inventory`);
      setInventory(response.data.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInventory = () => {
    let filtered = [...inventory];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.genericName.toLowerCase().includes(search) ||
        item.brandName?.toLowerCase().includes(search) ||
        item.manufacturer.toLowerCase().includes(search) ||
        item.batchNumber.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Stock level filter
    if (filters.stockLevel !== 'all') {
      switch (filters.stockLevel) {
        case 'low':
          filtered = filtered.filter(item => item.currentStock <= item.reorderLevel);
          break;
        case 'out':
          filtered = filtered.filter(item => item.currentStock <= 0);
          break;
        case 'normal':
          filtered = filtered.filter(item => 
            item.currentStock > item.reorderLevel && item.currentStock < item.maxStockLevel
          );
          break;
        case 'overstock':
          filtered = filtered.filter(item => item.currentStock >= item.maxStockLevel);
          break;
        default:
          break;
      }
    }

    setFilteredInventory(filtered);
  };

  const handleStockUpdate = async () => {
    if (!selectedItem || !stockUpdate.quantity) {
      alert('Please enter a valid quantity');
      return;
    }

    try {
      const response = await axios.post(
        `/api/pharmacy/${pharmacyId}/inventory/${selectedItem.medicationId}/stock`,
        {
          quantity: parseInt(stockUpdate.quantity),
          type: stockUpdate.type,
          reference: stockUpdate.reference || `ADJ${Date.now()}`,
          userId: user.id
        }
      );

      if (response.data.success) {
        alert('Stock updated successfully!');
        setShowStockModal(false);
        setStockUpdate({ quantity: '', type: 'adjustment', reference: '', notes: '' });
        setSelectedItem(null);
        fetchInventory();
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error updating stock: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStockStatus = (item) => {
    if (item.currentStock <= 0) return { status: 'out', color: '#dc3545', text: 'Out of Stock' };
    if (item.currentStock <= item.reorderLevel) return { status: 'low', color: '#fd7e14', text: 'Low Stock' };
    if (item.currentStock >= item.maxStockLevel) return { status: 'over', color: '#6f42c1', text: 'Overstock' };
    return { status: 'normal', color: '#28a745', text: 'Normal' };
  };

  const getExpiryStatus = (expiryDate) => {
    const now = new Date();
    const daysToExpiry = Math.ceil((new Date(expiryDate) - now) / (1000 * 60 * 60 * 24));
    
    if (daysToExpiry < 0) return { status: 'expired', color: '#dc3545', text: 'Expired' };
    if (daysToExpiry <= 30) return { status: 'expiring', color: '#fd7e14', text: `${daysToExpiry} days` };
    if (daysToExpiry <= 90) return { status: 'warning', color: '#ffc107', text: `${daysToExpiry} days` };
    return { status: 'good', color: '#28a745', text: `${daysToExpiry} days` };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="pharmacy-inventory">
        <div className="loading-spinner">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="pharmacy-inventory">
      <div className="inventory-header">
        <h1>Pharmacy Inventory</h1>
        <div className="header-actions">
          <button className="btn-primary">+ Add New Item</button>
          <button className="btn-secondary">📊 Generate Report</button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="inventory-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search medications, brands, manufacturers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filters">
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="all">All Categories</option>
            <option value="prescription">Prescription</option>
            <option value="otc">OTC</option>
            <option value="controlled">Controlled</option>
            <option value="refrigerated">Refrigerated</option>
            <option value="emergency">Emergency</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
            <option value="recalled">Recalled</option>
          </select>

          <select
            value={filters.stockLevel}
            onChange={(e) => setFilters(prev => ({ ...prev, stockLevel: e.target.value }))}
          >
            <option value="all">All Stock Levels</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
            <option value="normal">Normal Stock</option>
            <option value="overstock">Overstock</option>
          </select>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="inventory-summary">
        <div className="summary-card">
          <span className="summary-label">Total Items:</span>
          <span className="summary-value">{filteredInventory.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Low Stock:</span>
          <span className="summary-value warning">
            {filteredInventory.filter(item => item.currentStock <= item.reorderLevel).length}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Out of Stock:</span>
          <span className="summary-value danger">
            {filteredInventory.filter(item => item.currentStock <= 0).length}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Value:</span>
          <span className="summary-value">
            {formatCurrency(filteredInventory.reduce((sum, item) => 
              sum + (item.currentStock * item.unitCost), 0
            ))}
          </span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Medication</th>
              <th>Batch/Expiry</th>
              <th>Stock</th>
              <th>Location</th>
              <th>Pricing</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((item) => {
              const stockStatus = getStockStatus(item);
              const expiryStatus = getExpiryStatus(item.expiryDate);
              
              return (
                <tr key={item.id} className={stockStatus.status}>
                  <td>
                    <div className="medication-info">
                      <strong>{item.genericName}</strong>
                      {item.brandName && <span className="brand">({item.brandName})</span>}
                      <div className="medication-details">
                        <span>{item.strength} • {item.dosageForm}</span>
                        <span className="manufacturer">{item.manufacturer}</span>
                      </div>
                    </div>
                  </td>
                  
                  <td>
                    <div className="batch-info">
                      <span className="batch">Batch: {item.batchNumber}</span>
                      <span 
                        className="expiry"
                        style={{ color: expiryStatus.color }}
                      >
                        Exp: {new Date(item.expiryDate).toLocaleDateString()}
                      </span>
                      <span className="expiry-status">({expiryStatus.text})</span>
                    </div>
                  </td>
                  
                  <td>
                    <div className="stock-info">
                      <span className="current-stock">{item.currentStock}</span>
                      <span className="stock-details">
                        Reorder: {item.reorderLevel} • Max: {item.maxStockLevel}
                      </span>
                      {item.reservedStock > 0 && (
                        <span className="reserved">Reserved: {item.reservedStock}</span>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <div className="location-info">
                      <span>{item.location?.rack}-{item.location?.shelf}-{item.location?.bin}</span>
                    </div>
                  </td>
                  
                  <td>
                    <div className="pricing-info">
                      <span>Cost: {formatCurrency(item.unitCost)}</span>
                      <span>Sell: {formatCurrency(item.sellingPrice)}</span>
                      <span>MRP: {formatCurrency(item.mrp)}</span>
                    </div>
                  </td>
                  
                  <td>
                    <div className="status-badges">
                      <span 
                        className="stock-status"
                        style={{ backgroundColor: stockStatus.color }}
                      >
                        {stockStatus.text}
                      </span>
                      <span className={`category-badge ${item.category}`}>
                        {item.category}
                      </span>
                    </div>
                  </td>
                  
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action update"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowStockModal(true);
                        }}
                        title="Update Stock"
                      >
                        📝
                      </button>
                      <button
                        className="btn-action view"
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button
                        className="btn-action edit"
                        title="Edit Item"
                      >
                        ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredInventory.length === 0 && (
          <div className="no-results">
            <p>No inventory items found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Stock Update Modal */}
      {showStockModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Update Stock - {selectedItem.genericName}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowStockModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="current-stock-info">
                <p><strong>Current Stock:</strong> {selectedItem.currentStock} units</p>
                <p><strong>Reserved:</strong> {selectedItem.reservedStock} units</p>
                <p><strong>Available:</strong> {selectedItem.currentStock - selectedItem.reservedStock} units</p>
              </div>
              
              <div className="form-group">
                <label>Update Type:</label>
                <select
                  value={stockUpdate.type}
                  onChange={(e) => setStockUpdate(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="adjustment">Stock Adjustment</option>
                  <option value="purchase">Purchase/Received</option>
                  <option value="return">Return</option>
                  <option value="damaged">Damaged/Loss</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Quantity Change:</label>
                <input
                  type="number"
                  value={stockUpdate.quantity}
                  onChange={(e) => setStockUpdate(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Enter quantity (+ for increase, - for decrease)"
                />
                <small>Use positive numbers to increase stock, negative to decrease</small>
              </div>
              
              <div className="form-group">
                <label>Reference Number:</label>
                <input
                  type="text"
                  value={stockUpdate.reference}
                  onChange={(e) => setStockUpdate(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="GRN, Invoice, or Reference number"
                />
              </div>
              
              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  value={stockUpdate.notes}
                  onChange={(e) => setStockUpdate(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes (optional)"
                  rows="3"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowStockModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleStockUpdate}
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyInventory;