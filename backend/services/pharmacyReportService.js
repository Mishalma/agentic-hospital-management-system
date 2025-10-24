const MockPharmacy = require('../models/MockPharmacy');

class PharmacyReportService {
  // Generate comprehensive sales report
  static async generateSalesReport(pharmacyId, options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        groupBy = 'day' // day, week, month
      } = options;

      const transactions = await MockPharmacy.getTransactions(pharmacyId, {
        type: 'prescription_dispensing',
        dateFrom: startDate,
        dateTo: endDate
      });

      // Group transactions by time period
      const groupedData = this.groupTransactionsByPeriod(transactions, groupBy);
      
      // Calculate metrics
      const totalRevenue = transactions.reduce((sum, txn) => sum + (txn.billing?.totalAmount || 0), 0);
      const totalTransactions = transactions.length;
      const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      
      // Top selling medications
      const medicationSales = {};
      transactions.forEach(txn => {
        txn.items?.forEach(item => {
          const key = item.genericName;
          if (!medicationSales[key]) {
            medicationSales[key] = {
              name: item.genericName,
              brandName: item.brandName,
              quantity: 0,
              revenue: 0,
              transactions: 0
            };
          }
          medicationSales[key].quantity += item.quantityDispensed;
          medicationSales[key].revenue += item.totalPrice;
          medicationSales[key].transactions += 1;
        });
      });

      const topMedications = Object.values(medicationSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Payment method breakdown
      const paymentMethods = {};
      transactions.forEach(txn => {
        const method = txn.billing?.paymentMethod || 'unknown';
        if (!paymentMethods[method]) {
          paymentMethods[method] = { count: 0, amount: 0 };
        }
        paymentMethods[method].count += 1;
        paymentMethods[method].amount += txn.billing?.totalAmount || 0;
      });

      // Hourly distribution
      const hourlyDistribution = new Array(24).fill(0);
      transactions.forEach(txn => {
        const hour = new Date(txn.timestamps?.created).getHours();
        hourlyDistribution[hour] += 1;
      });

      return {
        success: true,
        data: {
          summary: {
            totalRevenue,
            totalTransactions,
            averageTransactionValue,
            period: { startDate, endDate }
          },
          trends: groupedData,
          topMedications,
          paymentMethods,
          hourlyDistribution,
          generatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error generating sales report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate inventory report
  static async generateInventoryReport(pharmacyId, options = {}) {
    try {
      const inventory = await MockPharmacy.getInventory(pharmacyId);
      
      const totalItems = inventory.length;
      const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
      const lowStockItems = inventory.filter(item => item.currentStock <= item.reorderLevel);
      
      // Expiry analysis
      const now = new Date();
      const expiryAnalysis = {
        expired: 0,
        expiring30Days: 0,
        expiring90Days: 0,
        good: 0
      };

      inventory.forEach(item => {
        const daysToExpiry = Math.ceil((item.expiryDate - now) / (1000 * 60 * 60 * 24));
        if (daysToExpiry < 0) {
          expiryAnalysis.expired += 1;
        } else if (daysToExpiry <= 30) {
          expiryAnalysis.expiring30Days += 1;
        } else if (daysToExpiry <= 90) {
          expiryAnalysis.expiring90Days += 1;
        } else {
          expiryAnalysis.good += 1;
        }
      });

      // Category breakdown
      const categoryBreakdown = {};
      inventory.forEach(item => {
        const category = item.category || 'Uncategorized';
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = {
            items: 0,
            value: 0,
            lowStock: 0
          };
        }
        categoryBreakdown[category].items += 1;
        categoryBreakdown[category].value += item.currentStock * item.unitCost;
        if (item.currentStock <= item.reorderLevel) {
          categoryBreakdown[category].lowStock += 1;
        }
      });

      // ABC Analysis (based on value)
      const sortedByValue = inventory
        .map(item => ({
          ...item,
          totalValue: item.currentStock * item.unitCost
        }))
        .sort((a, b) => b.totalValue - a.totalValue);

      const abcAnalysis = {
        A: sortedByValue.slice(0, Math.ceil(sortedByValue.length * 0.2)),
        B: sortedByValue.slice(Math.ceil(sortedByValue.length * 0.2), Math.ceil(sortedByValue.length * 0.5)),
        C: sortedByValue.slice(Math.ceil(sortedByValue.length * 0.5))
      };

      return {
        success: true,
        data: {
          summary: {
            totalItems,
            totalValue,
            lowStockCount: lowStockItems.length,
            categories: Object.keys(categoryBreakdown).length
          },
          expiryAnalysis,
          categoryBreakdown,
          abcAnalysis: {
            A: { count: abcAnalysis.A.length, value: abcAnalysis.A.reduce((sum, item) => sum + item.totalValue, 0) },
            B: { count: abcAnalysis.B.length, value: abcAnalysis.B.reduce((sum, item) => sum + item.totalValue, 0) },
            C: { count: abcAnalysis.C.length, value: abcAnalysis.C.reduce((sum, item) => sum + item.totalValue, 0) }
          },
          lowStockItems: lowStockItems.map(item => ({
            medicationId: item.medicationId,
            genericName: item.genericName,
            currentStock: item.currentStock,
            reorderLevel: item.reorderLevel,
            supplier: item.supplier
          })),
          generatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error generating inventory report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate prescription analysis report
  static async generatePrescriptionReport(pharmacyId, options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date()
      } = options;

      const transactions = await MockPharmacy.getTransactions(pharmacyId, {
        type: 'prescription_dispensing',
        dateFrom: startDate,
        dateTo: endDate
      });

      // Doctor analysis
      const doctorAnalysis = {};
      const prescriptionTypes = {
        acute: 0,
        chronic: 0,
        preventive: 0
      };

      transactions.forEach(txn => {
        // Simulate doctor data (in real implementation, this would come from prescription data)
        const doctorId = `DR${Math.floor(Math.random() * 10) + 1}`;
        if (!doctorAnalysis[doctorId]) {
          doctorAnalysis[doctorId] = {
            prescriptions: 0,
            revenue: 0,
            avgItems: 0,
            totalItems: 0
          };
        }
        
        doctorAnalysis[doctorId].prescriptions += 1;
        doctorAnalysis[doctorId].revenue += txn.billing?.totalAmount || 0;
        doctorAnalysis[doctorId].totalItems += txn.items?.length || 0;
        doctorAnalysis[doctorId].avgItems = doctorAnalysis[doctorId].totalItems / doctorAnalysis[doctorId].prescriptions;

        // Simulate prescription type classification
        const itemCount = txn.items?.length || 0;
        if (itemCount <= 2) {
          prescriptionTypes.acute += 1;
        } else if (itemCount <= 4) {
          prescriptionTypes.chronic += 1;
        } else {
          prescriptionTypes.preventive += 1;
        }
      });

      // Insurance vs cash analysis
      const paymentAnalysis = {
        insurance: { count: 0, amount: 0 },
        cash: { count: 0, amount: 0 },
        other: { count: 0, amount: 0 }
      };

      transactions.forEach(txn => {
        const method = txn.billing?.paymentMethod || 'cash';
        const category = method === 'insurance' ? 'insurance' : 
                        method === 'cash' ? 'cash' : 'other';
        
        paymentAnalysis[category].count += 1;
        paymentAnalysis[category].amount += txn.billing?.totalAmount || 0;
      });

      // Substitution analysis
      let totalSubstitutions = 0;
      let totalItems = 0;
      const substitutionReasons = {};

      transactions.forEach(txn => {
        txn.items?.forEach(item => {
          totalItems += 1;
          if (item.substituted) {
            totalSubstitutions += 1;
            const reason = item.substitutionReason || 'Not specified';
            substitutionReasons[reason] = (substitutionReasons[reason] || 0) + 1;
          }
        });
      });

      const substitutionRate = totalItems > 0 ? (totalSubstitutions / totalItems) * 100 : 0;

      return {
        success: true,
        data: {
          summary: {
            totalPrescriptions: transactions.length,
            totalRevenue: transactions.reduce((sum, txn) => sum + (txn.billing?.totalAmount || 0), 0),
            averageItemsPerPrescription: totalItems / transactions.length || 0,
            substitutionRate
          },
          doctorAnalysis: Object.entries(doctorAnalysis).map(([doctorId, data]) => ({
            doctorId,
            ...data
          })).sort((a, b) => b.prescriptions - a.prescriptions),
          prescriptionTypes,
          paymentAnalysis,
          substitutionAnalysis: {
            rate: substitutionRate,
            reasons: substitutionReasons
          },
          generatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error generating prescription report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate financial report
  static async generateFinancialReport(pharmacyId, options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date()
      } = options;

      const transactions = await MockPharmacy.getTransactions(pharmacyId, {
        dateFrom: startDate,
        dateTo: endDate
      });

      const inventory = await MockPharmacy.getInventory(pharmacyId);

      // Revenue analysis
      const revenue = {
        gross: 0,
        net: 0,
        tax: 0,
        discounts: 0
      };

      transactions.forEach(txn => {
        if (txn.type === 'prescription_dispensing' || txn.type === 'otc_sale') {
          revenue.gross += txn.billing?.subtotal || 0;
          revenue.tax += txn.billing?.totalGST || 0;
          revenue.discounts += txn.billing?.totalDiscount || 0;
        }
      });

      revenue.net = revenue.gross - revenue.discounts;

      // Cost analysis (simplified)
      const costs = {
        cogs: 0, // Cost of goods sold
        inventory: 0,
        operational: revenue.gross * 0.15 // Estimated operational costs
      };

      transactions.forEach(txn => {
        txn.items?.forEach(item => {
          // Estimate COGS as 70% of selling price
          costs.cogs += (item.totalPrice || 0) * 0.7;
        });
      });

      costs.inventory = inventory.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);

      // Profitability
      const grossProfit = revenue.net - costs.cogs;
      const netProfit = grossProfit - costs.operational;
      const grossMargin = revenue.net > 0 ? (grossProfit / revenue.net) * 100 : 0;
      const netMargin = revenue.net > 0 ? (netProfit / revenue.net) * 100 : 0;

      // Cash flow (simplified)
      const cashFlow = {
        inflow: revenue.gross + revenue.tax,
        outflow: costs.cogs + costs.operational,
        net: 0
      };
      cashFlow.net = cashFlow.inflow - cashFlow.outflow;

      return {
        success: true,
        data: {
          revenue,
          costs,
          profitability: {
            grossProfit,
            netProfit,
            grossMargin,
            netMargin
          },
          cashFlow,
          kpis: {
            revenuePerTransaction: transactions.length > 0 ? revenue.gross / transactions.length : 0,
            inventoryTurnover: costs.inventory > 0 ? costs.cogs / costs.inventory : 0,
            averageMargin: grossMargin
          },
          generatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error generating financial report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper method to group transactions by time period
  static groupTransactionsByPeriod(transactions, groupBy) {
    const grouped = {};
    
    transactions.forEach(txn => {
      const date = new Date(txn.timestamps?.created);
      let key;
      
      switch (groupBy) {
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        default:
          key = date.toDateString();
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          transactions: 0,
          revenue: 0,
          items: 0
        };
      }
      
      grouped[key].transactions += 1;
      grouped[key].revenue += txn.billing?.totalAmount || 0;
      grouped[key].items += txn.items?.length || 0;
    });
    
    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
  }

  // Generate comprehensive dashboard data
  static async generateDashboardData(pharmacyId) {
    try {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get today's data
      const todayTransactions = await MockPharmacy.getTransactions(pharmacyId, {
        dateFrom: today.toDateString(),
        dateTo: today.toDateString()
      });

      // Get yesterday's data for comparison
      const yesterdayTransactions = await MockPharmacy.getTransactions(pharmacyId, {
        dateFrom: yesterday.toDateString(),
        dateTo: yesterday.toDateString()
      });

      // Get inventory alerts
      const inventory = await MockPharmacy.getInventory(pharmacyId);
      const lowStockAlerts = inventory.filter(item => item.currentStock <= item.reorderLevel);
      const expiryAlerts = inventory.filter(item => {
        const daysToExpiry = Math.ceil((item.expiryDate - today) / (1000 * 60 * 60 * 24));
        return daysToExpiry <= 30 && daysToExpiry > 0;
      });

      // Calculate metrics
      const todayRevenue = todayTransactions.reduce((sum, txn) => sum + (txn.billing?.totalAmount || 0), 0);
      const yesterdayRevenue = yesterdayTransactions.reduce((sum, txn) => sum + (txn.billing?.totalAmount || 0), 0);
      const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

      return {
        success: true,
        data: {
          todayMetrics: {
            revenue: todayRevenue,
            transactions: todayTransactions.length,
            averageTransaction: todayTransactions.length > 0 ? todayRevenue / todayTransactions.length : 0,
            revenueChange
          },
          alerts: {
            lowStock: lowStockAlerts.length,
            expiring: expiryAlerts.length,
            total: lowStockAlerts.length + expiryAlerts.length
          },
          recentActivity: todayTransactions.slice(-5).map(txn => ({
            id: txn.transactionId,
            type: txn.type,
            amount: txn.billing?.totalAmount,
            time: txn.timestamps?.created,
            customer: txn.customer?.name
          })),
          generatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error generating dashboard data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PharmacyReportService;