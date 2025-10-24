const mongoose = require('mongoose');

const pharmacyInventorySchema = new mongoose.Schema({
  pharmacyId: {
    type: String,
    required: true,
    index: true
  },
  medicationId: {
    type: String,
    required: true,
    index: true
  },
  genericName: {
    type: String,
    required: true,
    index: true
  },
  brandName: {
    type: String,
    index: true
  },
  manufacturer: {
    type: String,
    required: true
  },
  batchNumber: {
    type: String,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true,
    index: true
  },
  manufacturingDate: {
    type: Date,
    required: true
  },
  dosageForm: {
    type: String,
    required: true,
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'patch']
  },
  strength: {
    type: String,
    required: true
  },
  packSize: {
    type: Number,
    required: true
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0
  },
  reservedStock: {
    type: Number,
    default: 0,
    min: 0
  },
  availableStock: {
    type: Number,
    default: function() {
      return this.currentStock - this.reservedStock;
    }
  },
  reorderLevel: {
    type: Number,
    required: true,
    default: 10
  },
  maxStockLevel: {
    type: Number,
    required: true,
    default: 1000
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  mrp: {
    type: Number,
    required: true,
    min: 0
  },
  gstRate: {
    type: Number,
    default: 12,
    min: 0,
    max: 28
  },
  location: {
    rack: String,
    shelf: String,
    bin: String
  },
  supplier: {
    name: String,
    contactNumber: String,
    email: String
  },
  category: {
    type: String,
    enum: ['prescription', 'otc', 'controlled', 'refrigerated', 'emergency'],
    default: 'prescription'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'recalled', 'damaged'],
    default: 'active'
  },
  stockMovements: [{
    type: {
      type: String,
      enum: ['purchase', 'sale', 'return', 'adjustment', 'transfer', 'expired', 'damaged'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    reference: String, // GRN number, prescription ID, etc.
    date: {
      type: Date,
      default: Date.now
    },
    notes: String,
    userId: String
  }],
  alerts: [{
    type: {
      type: String,
      enum: ['low_stock', 'expiry_warning', 'expired', 'out_of_stock'],
      required: true
    },
    message: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    acknowledged: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
pharmacyInventorySchema.index({ pharmacyId: 1, genericName: 1 });
pharmacyInventorySchema.index({ expiryDate: 1, status: 1 });
pharmacyInventorySchema.index({ currentStock: 1, reorderLevel: 1 });

// Virtual for stock status
pharmacyInventorySchema.virtual('stockStatus').get(function() {
  if (this.currentStock <= 0) return 'out_of_stock';
  if (this.currentStock <= this.reorderLevel) return 'low_stock';
  if (this.currentStock >= this.maxStockLevel) return 'overstock';
  return 'normal';
});

// Virtual for expiry status
pharmacyInventorySchema.virtual('expiryStatus').get(function() {
  const now = new Date();
  const daysToExpiry = Math.ceil((this.expiryDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysToExpiry < 0) return 'expired';
  if (daysToExpiry <= 30) return 'expiring_soon';
  if (daysToExpiry <= 90) return 'expiring_warning';
  return 'good';
});

// Pre-save middleware to update alerts
pharmacyInventorySchema.pre('save', function(next) {
  this.alerts = this.alerts || [];
  
  // Check for low stock
  if (this.currentStock <= this.reorderLevel && this.currentStock > 0) {
    const existingAlert = this.alerts.find(alert => 
      alert.type === 'low_stock' && !alert.acknowledged
    );
    
    if (!existingAlert) {
      this.alerts.push({
        type: 'low_stock',
        message: `Stock is running low: ${this.currentStock} units remaining`,
        severity: this.currentStock <= (this.reorderLevel / 2) ? 'high' : 'medium'
      });
    }
  }
  
  // Check for out of stock
  if (this.currentStock <= 0) {
    const existingAlert = this.alerts.find(alert => 
      alert.type === 'out_of_stock' && !alert.acknowledged
    );
    
    if (!existingAlert) {
      this.alerts.push({
        type: 'out_of_stock',
        message: `${this.genericName} is out of stock`,
        severity: 'critical'
      });
    }
  }
  
  // Check for expiry
  const now = new Date();
  const daysToExpiry = Math.ceil((this.expiryDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysToExpiry < 0) {
    const existingAlert = this.alerts.find(alert => 
      alert.type === 'expired' && !alert.acknowledged
    );
    
    if (!existingAlert) {
      this.alerts.push({
        type: 'expired',
        message: `${this.genericName} has expired`,
        severity: 'critical'
      });
    }
  } else if (daysToExpiry <= 30) {
    const existingAlert = this.alerts.find(alert => 
      alert.type === 'expiry_warning' && !alert.acknowledged
    );
    
    if (!existingAlert) {
      this.alerts.push({
        type: 'expiry_warning',
        message: `${this.genericName} expires in ${daysToExpiry} days`,
        severity: daysToExpiry <= 7 ? 'high' : 'medium'
      });
    }
  }
  
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('PharmacyInventory', pharmacyInventorySchema);