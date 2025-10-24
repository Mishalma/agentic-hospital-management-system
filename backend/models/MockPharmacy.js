class MockPharmacy {
  constructor() {
    this.inventory = [
      {
        id: 'INV001',
        pharmacyId: 'PHARM001',
        medicationId: 'MED001',
        genericName: 'Amoxicillin',
        brandName: 'Amoxil',
        manufacturer: 'GSK',
        batchNumber: 'AMX2024001',
        expiryDate: new Date('2025-12-31'),
        manufacturingDate: new Date('2024-01-15'),
        dosageForm: 'capsule',
        strength: '500mg',
        packSize: 10,
        currentStock: 150,
        reservedStock: 20,
        reorderLevel: 50,
        maxStockLevel: 500,
        unitCost: 2.50,
        sellingPrice: 4.00,
        mrp: 4.50,
        gstRate: 12,
        location: { rack: 'A1', shelf: '2', bin: '3' },
        category: 'prescription',
        status: 'active',
        stockMovements: [
          {
            type: 'purchase',
            quantity: 200,
            reference: 'GRN001',
            date: new Date('2024-10-01'),
            notes: 'Initial stock',
            userId: 'USER001'
          },
          {
            type: 'sale',
            quantity: -30,
            reference: 'TXN001',
            date: new Date('2024-10-15'),
            notes: 'Prescription dispensing',
            userId: 'PHARM001'
          }
        ],
        alerts: []
      },
      {
        id: 'INV002',
        pharmacyId: 'PHARM001',
        medicationId: 'MED002',
        genericName: 'Metformin',
        brandName: 'Glucophage',
        manufacturer: 'Merck',
        batchNumber: 'MET2024002',
        expiryDate: new Date('2025-06-30'),
        manufacturingDate: new Date('2024-02-10'),
        dosageForm: 'tablet',
        strength: '500mg',
        packSize: 30,
        currentStock: 8,
        reservedStock: 5,
        reorderLevel: 20,
        maxStockLevel: 300,
        unitCost: 1.20,
        sellingPrice: 2.00,
        mrp: 2.25,
        gstRate: 12,
        location: { rack: 'B2', shelf: '1', bin: '5' },
        category: 'prescription',
        status: 'active',
        stockMovements: [],
        alerts: [
          {
            type: 'low_stock',
            message: 'Stock is running low: 8 units remaining',
            severity: 'high',
            acknowledged: false,
            createdAt: new Date()
          }
        ]
      },
      {
        id: 'INV003',
        pharmacyId: 'PHARM001',
        medicationId: 'MED003',
        genericName: 'Paracetamol',
        brandName: 'Crocin',
        manufacturer: 'GSK',
        batchNumber: 'PAR2024003',
        expiryDate: new Date('2024-11-15'),
        manufacturingDate: new Date('2023-11-15'),
        dosageForm: 'tablet',
        strength: '500mg',
        packSize: 15,
        currentStock: 45,
        reservedStock: 0,
        reorderLevel: 30,
        maxStockLevel: 200,
        unitCost: 0.50,
        sellingPrice: 1.00,
        mrp: 1.10,
        gstRate: 12,
        location: { rack: 'C1', shelf: '3', bin: '2' },
        category: 'otc',
        status: 'active',
        stockMovements: [],
        alerts: [
          {
            type: 'expiry_warning',
            message: 'Paracetamol expires in 22 days',
            severity: 'medium',
            acknowledged: false,
            createdAt: new Date()
          }
        ]
      }
    ];

    this.transactions = [
      {
        id: 'TXN001',
        transactionId: 'TXN202410240001',
        pharmacyId: 'PHARM001',
        type: 'prescription_dispensing',
        prescriptionId: 'RX001',
        patientId: 'PAT001',
        doctorId: 'DOC001',
        items: [
          {
            medicationId: 'MED001',
            genericName: 'Amoxicillin',
            brandName: 'Amoxil',
            batchNumber: 'AMX2024001',
            expiryDate: new Date('2025-12-31'),
            quantityDispensed: 21,
            unitPrice: 4.00,
            totalPrice: 84.00,
            gstAmount: 10.08,
            discountAmount: 0,
            substituted: false
          }
        ],
        billing: {
          subtotal: 84.00,
          totalGST: 10.08,
          totalDiscount: 0,
          totalAmount: 94.08,
          amountPaid: 94.08,
          balance: 0,
          paymentMethod: 'cash'
        },
        customer: {
          name: 'John Doe',
          phone: '+1234567890',
          email: 'john@example.com'
        },
        pharmacist: {
          id: 'PHARM001',
          name: 'Dr. Sarah Wilson',
          licenseNumber: 'PH12345'
        },
        counseling: {
          provided: true,
          notes: 'Advised to take with food, complete full course',
          duration: 5,
          counselorId: 'PHARM001'
        },
        status: 'completed',
        timestamps: {
          created: new Date('2024-10-24T10:30:00'),
          processed: new Date('2024-10-24T10:35:00'),
          completed: new Date('2024-10-24T10:40:00')
        },
        audit: {
          createdBy: 'PHARM001',
          version: 1
        }
      }
    ];

    this.pharmacies = [
      {
        id: 'PHARM001',
        name: 'Central Pharmacy',
        address: '123 Main Street, City, State 12345',
        phone: '+1234567890',
        email: 'central@pharmacy.com',
        licenseNumber: 'PH001',
        manager: 'Dr. Sarah Wilson',
        operatingHours: {
          monday: '08:00-20:00',
          tuesday: '08:00-20:00',
          wednesday: '08:00-20:00',
          thursday: '08:00-20:00',
          friday: '08:00-20:00',
          saturday: '09:00-18:00',
          sunday: '10:00-16:00'
        },
        services: ['prescription_dispensing', 'otc_sales', 'counseling', 'home_delivery'],
        status: 'active'
      }
    ];
  }

  // Inventory Management
  async getInventory(pharmacyId, filters = {}) {
    let result = this.inventory.filter(item => item.pharmacyId === pharmacyId);
    
    if (filters.category) {
      result = result.filter(item => item.category === filters.category);
    }
    
    if (filters.status) {
      result = result.filter(item => item.status === filters.status);
    }
    
    if (filters.lowStock) {
      result = result.filter(item => item.currentStock <= item.reorderLevel);
    }
    
    if (filters.expiring) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      result = result.filter(item => item.expiryDate <= thirtyDaysFromNow);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(item => 
        item.genericName.toLowerCase().includes(searchTerm) ||
        item.brandName?.toLowerCase().includes(searchTerm) ||
        item.manufacturer.toLowerCase().includes(searchTerm)
      );
    }
    
    return result;
  }

  async updateStock(pharmacyId, medicationId, quantity, type, reference, userId) {
    const item = this.inventory.find(inv => 
      inv.pharmacyId === pharmacyId && inv.medicationId === medicationId
    );
    
    if (!item) {
      throw new Error('Medication not found in inventory');
    }
    
    const oldStock = item.currentStock;
    item.currentStock += quantity;
    
    if (item.currentStock < 0) {
      throw new Error('Insufficient stock');
    }
    
    // Add stock movement
    item.stockMovements.push({
      type: type,
      quantity: quantity,
      reference: reference,
      date: new Date(),
      notes: `Stock updated from ${oldStock} to ${item.currentStock}`,
      userId: userId
    });
    
    // Update alerts
    this.updateInventoryAlerts(item);
    
    return item;
  }

  updateInventoryAlerts(item) {
    // Clear old alerts
    item.alerts = item.alerts.filter(alert => alert.acknowledged);
    
    // Check for low stock
    if (item.currentStock <= item.reorderLevel && item.currentStock > 0) {
      item.alerts.push({
        type: 'low_stock',
        message: `Stock is running low: ${item.currentStock} units remaining`,
        severity: item.currentStock <= (item.reorderLevel / 2) ? 'high' : 'medium',
        acknowledged: false,
        createdAt: new Date()
      });
    }
    
    // Check for out of stock
    if (item.currentStock <= 0) {
      item.alerts.push({
        type: 'out_of_stock',
        message: `${item.genericName} is out of stock`,
        severity: 'critical',
        acknowledged: false,
        createdAt: new Date()
      });
    }
    
    // Check for expiry
    const now = new Date();
    const daysToExpiry = Math.ceil((item.expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysToExpiry < 0) {
      item.alerts.push({
        type: 'expired',
        message: `${item.genericName} has expired`,
        severity: 'critical',
        acknowledged: false,
        createdAt: new Date()
      });
    } else if (daysToExpiry <= 30) {
      item.alerts.push({
        type: 'expiry_warning',
        message: `${item.genericName} expires in ${daysToExpiry} days`,
        severity: daysToExpiry <= 7 ? 'high' : 'medium',
        acknowledged: false,
        createdAt: new Date()
      });
    }
  }

  // Transaction Management
  async createTransaction(transactionData) {
    const newTransaction = {
      id: `TXN${String(this.transactions.length + 1).padStart(3, '0')}`,
      transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
      ...transactionData,
      timestamps: {
        created: new Date(),
        ...transactionData.timestamps
      },
      audit: {
        createdBy: transactionData.audit?.createdBy || 'SYSTEM',
        version: 1
      }
    };
    
    this.transactions.push(newTransaction);
    
    // Update inventory for each item
    for (const item of newTransaction.items) {
      await this.updateStock(
        newTransaction.pharmacyId,
        item.medicationId,
        -item.quantityDispensed,
        'sale',
        newTransaction.transactionId,
        newTransaction.audit.createdBy
      );
    }
    
    return newTransaction;
  }

  async getTransactions(pharmacyId, filters = {}) {
    let result = this.transactions.filter(txn => txn.pharmacyId === pharmacyId);
    
    if (filters.type) {
      result = result.filter(txn => txn.type === filters.type);
    }
    
    if (filters.status) {
      result = result.filter(txn => txn.status === filters.status);
    }
    
    if (filters.dateFrom) {
      result = result.filter(txn => txn.timestamps.created >= new Date(filters.dateFrom));
    }
    
    if (filters.dateTo) {
      result = result.filter(txn => txn.timestamps.created <= new Date(filters.dateTo));
    }
    
    if (filters.patientId) {
      result = result.filter(txn => txn.patientId === filters.patientId);
    }
    
    return result.sort((a, b) => b.timestamps.created - a.timestamps.created);
  }

  // Analytics
  async getPharmacyAnalytics(pharmacyId, period = '30days') {
    const transactions = await this.getTransactions(pharmacyId);
    const inventory = await this.getInventory(pharmacyId);
    
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    const periodTransactions = transactions.filter(txn => 
      txn.timestamps.created >= startDate
    );
    
    const totalRevenue = periodTransactions.reduce((sum, txn) => 
      sum + (txn.billing?.totalAmount || 0), 0
    );
    
    const totalTransactions = periodTransactions.length;
    
    const lowStockItems = inventory.filter(item => 
      item.currentStock <= item.reorderLevel
    ).length;
    
    const expiringItems = inventory.filter(item => {
      const daysToExpiry = Math.ceil((item.expiryDate - now) / (1000 * 60 * 60 * 24));
      return daysToExpiry <= 30 && daysToExpiry > 0;
    }).length;
    
    const expiredItems = inventory.filter(item => 
      item.expiryDate < now
    ).length;
    
    return {
      period,
      revenue: {
        total: totalRevenue,
        average: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        transactions: totalTransactions
      },
      inventory: {
        totalItems: inventory.length,
        lowStock: lowStockItems,
        expiring: expiringItems,
        expired: expiredItems,
        totalValue: inventory.reduce((sum, item) => 
          sum + (item.currentStock * item.unitCost), 0
        )
      },
      alerts: {
        critical: inventory.reduce((sum, item) => 
          sum + item.alerts.filter(alert => 
            alert.severity === 'critical' && !alert.acknowledged
          ).length, 0
        ),
        high: inventory.reduce((sum, item) => 
          sum + item.alerts.filter(alert => 
            alert.severity === 'high' && !alert.acknowledged
          ).length, 0
        ),
        medium: inventory.reduce((sum, item) => 
          sum + item.alerts.filter(alert => 
            alert.severity === 'medium' && !alert.acknowledged
          ).length, 0
        )
      }
    };
  }

  // E-Prescription Processing
  async processPrescription(prescriptionId, pharmacyId, pharmacistId) {
    // This would integrate with the existing prescription system
    // For now, we'll simulate processing
    
    const prescription = {
      id: prescriptionId,
      patientId: 'PAT001',
      doctorId: 'DOC001',
      medications: [
        {
          genericName: 'Amoxicillin',
          dosage: '500mg',
          quantity: 21,
          instructions: 'Take with food'
        }
      ]
    };
    
    // Check availability
    const availability = [];
    for (const med of prescription.medications) {
      const inventoryItem = this.inventory.find(item => 
        item.pharmacyId === pharmacyId && 
        item.genericName.toLowerCase() === med.genericName.toLowerCase() &&
        item.currentStock >= med.quantity
      );
      
      availability.push({
        medication: med.genericName,
        requested: med.quantity,
        available: inventoryItem ? inventoryItem.currentStock : 0,
        canFulfill: inventoryItem && inventoryItem.currentStock >= med.quantity,
        inventoryItem: inventoryItem
      });
    }
    
    return {
      prescriptionId,
      availability,
      canFulfillCompletely: availability.every(item => item.canFulfill),
      estimatedTotal: availability.reduce((sum, item) => {
        if (item.canFulfill && item.inventoryItem) {
          return sum + (item.requested * item.inventoryItem.sellingPrice);
        }
        return sum;
      }, 0)
    };
  }
}

module.exports = new MockPharmacy();