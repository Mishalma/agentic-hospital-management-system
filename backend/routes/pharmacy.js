const express = require('express');
const router = express.Router();
const MockPharmacy = require('../models/MockPharmacy');
const PharmacyReportService = require('../services/pharmacyReportService');

// Get pharmacy inventory
router.get('/:pharmacyId/inventory', async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const filters = req.query;
    
    const inventory = await MockPharmacy.getInventory(pharmacyId, filters);
    
    res.json({
      success: true,
      data: inventory,
      count: inventory.length
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory',
      error: error.message
    });
  }
});

// Update stock
router.post('/:pharmacyId/inventory/:medicationId/stock', async (req, res) => {
  try {
    const { pharmacyId, medicationId } = req.params;
    const { quantity, type, reference, userId } = req.body;
    
    if (!quantity || !type || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: quantity, type, userId'
      });
    }
    
    const updatedItem = await MockPharmacy.updateStock(
      pharmacyId, 
      medicationId, 
      quantity, 
      type, 
      reference || `ADJ${Date.now()}`, 
      userId
    );
    
    res.json({
      success: true,
      data: updatedItem,
      message: 'Stock updated successfully'
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get pharmacy transactions
router.get('/:pharmacyId/transactions', async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const filters = req.query;
    
    const transactions = await MockPharmacy.getTransactions(pharmacyId, filters);
    
    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// Create new transaction (dispensing)
router.post('/:pharmacyId/transactions', async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const transactionData = {
      ...req.body,
      pharmacyId
    };
    
    // Validate required fields
    if (!transactionData.type || !transactionData.items || !transactionData.pharmacist) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, items, pharmacist'
      });
    }
    
    const transaction = await MockPharmacy.createTransaction(transactionData);
    
    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction created successfully'
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Process e-prescription
router.post('/:pharmacyId/prescriptions/:prescriptionId/process', async (req, res) => {
  try {
    const { pharmacyId, prescriptionId } = req.params;
    const { pharmacistId } = req.body;
    
    if (!pharmacistId) {
      return res.status(400).json({
        success: false,
        message: 'Pharmacist ID is required'
      });
    }
    
    const result = await MockPharmacy.processPrescription(
      prescriptionId, 
      pharmacyId, 
      pharmacistId
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error processing prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process prescription',
      error: error.message
    });
  }
});

// Dispense prescription
router.post('/:pharmacyId/prescriptions/:prescriptionId/dispense', async (req, res) => {
  try {
    const { pharmacyId, prescriptionId } = req.params;
    const { items, billing, customer, pharmacist, counseling } = req.body;
    
    const transactionData = {
      type: 'prescription_dispensing',
      prescriptionId,
      items,
      billing,
      customer,
      pharmacist,
      counseling,
      status: 'completed',
      timestamps: {
        processed: new Date(),
        completed: new Date()
      },
      audit: {
        createdBy: pharmacist.id
      }
    };
    
    const transaction = await MockPharmacy.createTransaction(transactionData);
    
    res.json({
      success: true,
      data: transaction,
      message: 'Prescription dispensed successfully'
    });
  } catch (error) {
    console.error('Error dispensing prescription:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get pharmacy analytics
router.get('/:pharmacyId/analytics', async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { period = '30days' } = req.query;
    
    const analytics = await MockPharmacy.getPharmacyAnalytics(pharmacyId, period);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

// Get low stock alerts
router.get('/:pharmacyId/alerts/low-stock', async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    
    const inventory = await MockPharmacy.getInventory(pharmacyId, { lowStock: true });
    
    const alerts = inventory.map(item => ({
      medicationId: item.medicationId,
      genericName: item.genericName,
      brandName: item.brandName,
      currentStock: item.currentStock,
      reorderLevel: item.reorderLevel,
      severity: item.currentStock <= (item.reorderLevel / 2) ? 'critical' : 'high',
      message: `${item.genericName} is running low: ${item.currentStock} units remaining`
    }));
    
    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message
    });
  }
});

// Get expiry alerts
router.get('/:pharmacyId/alerts/expiry', async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    
    const inventory = await MockPharmacy.getInventory(pharmacyId, { expiring: true });
    
    const now = new Date();
    const alerts = inventory.map(item => {
      const daysToExpiry = Math.ceil((item.expiryDate - now) / (1000 * 60 * 60 * 24));
      return {
        medicationId: item.medicationId,
        genericName: item.genericName,
        brandName: item.brandName,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        daysToExpiry,
        currentStock: item.currentStock,
        severity: daysToExpiry <= 7 ? 'critical' : daysToExpiry <= 30 ? 'high' : 'medium',
        message: daysToExpiry < 0 
          ? `${item.genericName} has expired` 
          : `${item.genericName} expires in ${daysToExpiry} days`
      };
    });
    
    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Error fetching expiry alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiry alerts',
      error: error.message
    });
  }
});

// Search medications
router.get('/:pharmacyId/search', async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { q: query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const inventory = await MockPharmacy.getInventory(pharmacyId, { search: query });
    
    const results = inventory.map(item => ({
      medicationId: item.medicationId,
      genericName: item.genericName,
      brandName: item.brandName,
      strength: item.strength,
      dosageForm: item.dosageForm,
      currentStock: item.currentStock,
      sellingPrice: item.sellingPrice,
      location: item.location,
      status: item.status
    }));
    
    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error('Error searching medications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search medications',
      error: error.message
    });
  }
});

// Generate comprehensive reports
router.get('/:pharmacyId/reports/:reportType', async (req, res) => {
  try {
    const { pharmacyId, reportType } = req.params;
    const { startDate, endDate, groupBy } = req.query;
    
    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      groupBy
    };
    
    let result = {};
    
    switch (reportType) {
      case 'sales':
        result = await PharmacyReportService.generateSalesReport(pharmacyId, options);
        break;
        
      case 'inventory':
        result = await PharmacyReportService.generateInventoryReport(pharmacyId, options);
        break;
        
      case 'prescriptions':
        result = await PharmacyReportService.generatePrescriptionReport(pharmacyId, options);
        break;
        
      case 'financial':
        result = await PharmacyReportService.generateFinancialReport(pharmacyId, options);
        break;
        
      case 'dashboard':
        result = await PharmacyReportService.generateDashboardData(pharmacyId);
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type. Available types: sales, inventory, prescriptions, financial, dashboard'
        });
    }
    
    if (result.success) {
      res.json({
        success: true,
        reportType,
        ...result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
});

// Get pharmacy dashboard data
router.get('/:pharmacyId/dashboard', async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const result = await PharmacyReportService.generateDashboardData(pharmacyId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// Export report data
router.get('/:pharmacyId/reports/:reportType/export', async (req, res) => {
  try {
    const { pharmacyId, reportType } = req.params;
    const { format = 'json', startDate, endDate } = req.query;
    
    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };
    
    let result = {};
    
    switch (reportType) {
      case 'sales':
        result = await PharmacyReportService.generateSalesReport(pharmacyId, options);
        break;
      case 'inventory':
        result = await PharmacyReportService.generateInventoryReport(pharmacyId, options);
        break;
      case 'prescriptions':
        result = await PharmacyReportService.generatePrescriptionReport(pharmacyId, options);
        break;
      case 'financial':
        result = await PharmacyReportService.generateFinancialReport(pharmacyId, options);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type for export'
        });
    }
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate report for export',
        error: result.error
      });
    }
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = this.convertToCSV(result.data, reportType);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      // Return JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(result);
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report',
      error: error.message
    });
  }
});

module.exports = router;