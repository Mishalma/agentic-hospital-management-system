const { Bill, BillingRate } = require('../models');

class BillingService {
  // Create a new bill
  async createBill(billData) {
    try {
      // Generate unique bill ID if not provided
      if (!billData.billId) {
        billData.billId = `BILL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Set default values
      billData.status = billData.status || 'Draft';
      billData.priority = billData.priority || 'Normal';
      billData.billDate = billData.billDate || new Date();

      // Calculate charges if not provided
      if (billData.charges) {
        await this.calculateCharges(billData);
      }

      const bill = await Bill.create(billData);
      return { success: true, data: bill };
    } catch (error) {
      console.error('Error creating bill:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate charges for all services
  async calculateCharges(billData) {
    try {
      // Calculate consultation charges
      if (billData.charges.consultation) {
        for (let charge of billData.charges.consultation) {
          const rate = await this.getServiceRate('Consultation', charge.serviceCode);
          if (rate) {
            charge.unitPrice = rate.pricing.basePrice;
            charge.tax = (charge.unitPrice * rate.tax.taxPercentage) / 100;
            charge.totalAmount = (charge.unitPrice * charge.quantity) - charge.discount + charge.tax;
          }
        }
      }

      // Calculate laboratory charges
      if (billData.charges.laboratory) {
        for (let charge of billData.charges.laboratory) {
          const rate = await this.getServiceRate('Laboratory', charge.testCode);
          if (rate) {
            charge.unitPrice = rate.pricing.basePrice;
            charge.tax = (charge.unitPrice * rate.tax.taxPercentage) / 100;
            charge.totalAmount = (charge.unitPrice * charge.quantity) - charge.discount + charge.tax;
          }
        }
      }

      // Calculate pharmacy charges
      if (billData.charges.pharmacy) {
        for (let charge of billData.charges.pharmacy) {
          const rate = await this.getServiceRate('Pharmacy', charge.medicationCode);
          if (rate) {
            charge.unitPrice = rate.pricing.basePrice;
            // Apply volume discounts
            const discount = this.calculateVolumeDiscount(rate, charge.quantity);
            charge.discount = discount;
            charge.tax = ((charge.unitPrice * charge.quantity - discount) * rate.tax.taxPercentage) / 100;
            charge.totalAmount = (charge.unitPrice * charge.quantity) - charge.discount + charge.tax;
          }
        }
      }

      // Calculate procedure charges
      if (billData.charges.procedures) {
        for (let charge of billData.charges.procedures) {
          const rate = await this.getServiceRate('Procedure', charge.procedureCode);
          if (rate) {
            charge.unitPrice = rate.pricing.basePrice;
            charge.tax = (charge.unitPrice * rate.tax.taxPercentage) / 100;
            charge.totalAmount = (charge.unitPrice * charge.quantity) - charge.discount + charge.tax;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error calculating charges:', error);
      return false;
    }
  }

  // Get service rate
  async getServiceRate(category, serviceCode) {
    try {
      const rate = await BillingRate.findOne({ 
        category, 
        serviceCode, 
        'validity.isActive': true 
      });
      return rate;
    } catch (error) {
      console.error('Error getting service rate:', error);
      return null;
    }
  }

  // Calculate volume discount
  calculateVolumeDiscount(rate, quantity) {
    if (!rate.pricing.volumeDiscounts) return 0;

    for (let discount of rate.pricing.volumeDiscounts) {
      if (quantity >= discount.minQuantity && quantity <= discount.maxQuantity) {
        return (rate.pricing.basePrice * quantity * discount.discountPercentage) / 100;
      }
    }
    return 0;
  }

  // Get bills with filtering
  async getBills(filters = {}) {
    try {
      const query = {};
      
      if (filters.patientId) query.patientId = filters.patientId;
      if (filters.status) query.status = filters.status;
      if (filters.priority) query.priority = filters.priority;
      
      // Date range filtering
      if (filters.startDate || filters.endDate) {
        query.billDate = {};
        if (filters.startDate) query.billDate.$gte = new Date(filters.startDate);
        if (filters.endDate) query.billDate.$lte = new Date(filters.endDate);
      }

      const bills = await Bill.find(query);
      return { success: true, data: bills };
    } catch (error) {
      console.error('Error fetching bills:', error);
      return { success: false, error: error.message };
    }
  }

  // Get a specific bill
  async getBill(billId) {
    try {
      const bill = await Bill.findOne({ billId });
      if (!bill) {
        return { success: false, error: 'Bill not found' };
      }
      return { success: true, data: bill };
    } catch (error) {
      console.error('Error fetching bill:', error);
      return { success: false, error: error.message };
    }
  }

  // Update bill status
  async updateBillStatus(billId, status, updateData = {}) {
    try {
      const updateFields = {
        status,
        ...updateData,
        updatedAt: new Date()
      };

      // Add audit log entry
      const auditEntry = {
        action: `Status changed to ${status}`,
        performedBy: updateData.updatedBy || 'system',
        timestamp: new Date(),
        details: `Bill status updated from previous status to ${status}`
      };

      updateFields.$push = { auditLog: auditEntry };

      const bill = await Bill.findByIdAndUpdate(
        billId,
        updateFields,
        { new: true }
      );

      if (!bill) {
        return { success: false, error: 'Bill not found' };
      }

      return { success: true, data: bill };
    } catch (error) {
      console.error('Error updating bill status:', error);
      return { success: false, error: error.message };
    }
  }

  // Add payment to bill
  async addPayment(billId, paymentData) {
    try {
      const bill = await Bill.findOne({ billId });
      if (!bill) {
        return { success: false, error: 'Bill not found' };
      }

      // Generate payment ID
      const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const payment = {
        paymentId,
        paymentDate: paymentData.paymentDate || new Date(),
        amount: paymentData.amount,
        method: paymentData.method,
        transactionId: paymentData.transactionId,
        reference: paymentData.reference,
        receivedBy: paymentData.receivedBy,
        notes: paymentData.notes,
        status: paymentData.status || 'Completed'
      };

      bill.payments.push(payment);
      
      // Update paid amount
      bill.summary.paidAmount += paymentData.amount;
      bill.summary.balanceAmount = bill.summary.totalAmount - bill.summary.paidAmount;

      // Add audit log
      bill.auditLog.push({
        action: 'Payment Added',
        performedBy: paymentData.receivedBy || 'system',
        timestamp: new Date(),
        details: `Payment of ${paymentData.amount} received via ${paymentData.method}`
      });

      await Bill.findByIdAndUpdate(billId, bill);

      return { success: true, data: payment };
    } catch (error) {
      console.error('Error adding payment:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate bill from services
  async generateBillFromServices(patientId, services) {
    try {
      const billData = {
        patientId,
        charges: {
          consultation: [],
          laboratory: [],
          pharmacy: [],
          procedures: [],
          accommodation: [],
          miscellaneous: []
        }
      };

      // Process consultation services
      if (services.consultations) {
        for (let consultation of services.consultations) {
          billData.charges.consultation.push({
            consultationId: consultation.consultationId,
            doctorId: consultation.doctorId,
            doctorName: consultation.doctorName,
            department: consultation.department,
            serviceCode: consultation.serviceCode || 'CONS_GEN',
            serviceName: consultation.serviceName || 'General Consultation',
            quantity: 1,
            date: consultation.date || new Date(),
            notes: consultation.notes
          });
        }
      }

      // Process laboratory services
      if (services.labOrders) {
        for (let labOrder of services.labOrders) {
          for (let test of labOrder.tests) {
            billData.charges.laboratory.push({
              orderId: labOrder.orderId,
              testCode: test.testCode,
              testName: test.testName,
              category: test.category,
              quantity: 1,
              date: labOrder.orderDate,
              urgency: test.priority,
              notes: test.instructions
            });
          }
        }
      }

      // Process pharmacy services
      if (services.prescriptions) {
        for (let prescription of services.prescriptions) {
          for (let medication of prescription.medications) {
            billData.charges.pharmacy.push({
              prescriptionId: prescription.prescriptionId,
              medicationCode: medication.medicationCode,
              medicationName: medication.medicationName,
              strength: medication.strength,
              quantity: medication.quantity,
              date: prescription.date,
              pharmacistId: prescription.pharmacistId,
              notes: medication.instructions
            });
          }
        }
      }

      // Process procedures
      if (services.procedures) {
        for (let procedure of services.procedures) {
          billData.charges.procedures.push({
            procedureId: procedure.procedureId,
            procedureCode: procedure.procedureCode,
            procedureName: procedure.procedureName,
            department: procedure.department,
            performedBy: procedure.performedBy,
            quantity: 1,
            date: procedure.date,
            duration: procedure.duration,
            notes: procedure.notes
          });
        }
      }

      return await this.createBill(billData);
    } catch (error) {
      console.error('Error generating bill from services:', error);
      return { success: false, error: error.message };
    }
  }

  // Get billing statistics
  async getBillingStatistics(filters = {}) {
    try {
      const startDate = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = filters.endDate ? new Date(filters.endDate) : new Date();

      // Bills by status
      const billsByStatus = await Bill.aggregate([
        {
          $match: {
            billDate: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$summary.totalAmount' },
            totalPaid: { $sum: '$summary.paidAmount' },
            totalBalance: { $sum: '$summary.balanceAmount' }
          }
        }
      ]);

      // Revenue by department
      const revenueByDepartment = await this.getRevenueByDepartment(startDate, endDate);

      // Payment methods analysis
      const paymentMethods = await this.getPaymentMethodsAnalysis(startDate, endDate);

      // Insurance claims analysis
      const insuranceAnalysis = await this.getInsuranceAnalysis(startDate, endDate);

      return {
        success: true,
        data: {
          billsByStatus,
          revenueByDepartment,
          paymentMethods,
          insuranceAnalysis,
          dateRange: { startDate, endDate }
        }
      };
    } catch (error) {
      console.error('Error fetching billing statistics:', error);
      return { success: false, error: error.message };
    }
  }

  // Get revenue by department
  async getRevenueByDepartment(startDate, endDate) {
    try {
      const bills = await Bill.find({
        billDate: { $gte: startDate, $lte: endDate }
      });

      const departmentRevenue = {};

      bills.forEach(bill => {
        // Consultation revenue
        bill.charges.consultation.forEach(charge => {
          const dept = charge.department || 'General';
          if (!departmentRevenue[dept]) departmentRevenue[dept] = 0;
          departmentRevenue[dept] += charge.totalAmount || 0;
        });

        // Laboratory revenue
        bill.charges.laboratory.forEach(charge => {
          const dept = 'Laboratory';
          if (!departmentRevenue[dept]) departmentRevenue[dept] = 0;
          departmentRevenue[dept] += charge.totalAmount || 0;
        });

        // Pharmacy revenue
        bill.charges.pharmacy.forEach(charge => {
          const dept = 'Pharmacy';
          if (!departmentRevenue[dept]) departmentRevenue[dept] = 0;
          departmentRevenue[dept] += charge.totalAmount || 0;
        });

        // Procedure revenue
        bill.charges.procedures.forEach(charge => {
          const dept = charge.department || 'General';
          if (!departmentRevenue[dept]) departmentRevenue[dept] = 0;
          departmentRevenue[dept] += charge.totalAmount || 0;
        });
      });

      return Object.entries(departmentRevenue).map(([department, revenue]) => ({
        department,
        revenue
      }));
    } catch (error) {
      console.error('Error getting revenue by department:', error);
      return [];
    }
  }

  // Get payment methods analysis
  async getPaymentMethodsAnalysis(startDate, endDate) {
    try {
      const bills = await Bill.find({
        billDate: { $gte: startDate, $lte: endDate }
      });

      const paymentMethods = {};

      bills.forEach(bill => {
        bill.payments.forEach(payment => {
          if (!paymentMethods[payment.method]) {
            paymentMethods[payment.method] = { count: 0, amount: 0 };
          }
          paymentMethods[payment.method].count++;
          paymentMethods[payment.method].amount += payment.amount;
        });
      });

      return Object.entries(paymentMethods).map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount
      }));
    } catch (error) {
      console.error('Error getting payment methods analysis:', error);
      return [];
    }
  }

  // Get insurance analysis
  async getInsuranceAnalysis(startDate, endDate) {
    try {
      const bills = await Bill.find({
        billDate: { $gte: startDate, $lte: endDate },
        'insurance.provider': { $exists: true, $ne: '' }
      });

      const insuranceData = {};

      bills.forEach(bill => {
        const provider = bill.insurance.provider;
        if (!insuranceData[provider]) {
          insuranceData[provider] = {
            totalClaims: 0,
            totalAmount: 0,
            coveredAmount: 0,
            pendingClaims: 0,
            approvedClaims: 0
          };
        }

        insuranceData[provider].totalClaims++;
        insuranceData[provider].totalAmount += bill.summary.totalAmount;
        insuranceData[provider].coveredAmount += bill.insurance.coveredAmount || 0;

        if (bill.insurance.claimStatus === 'Approved') {
          insuranceData[provider].approvedClaims++;
        } else if (['Not Submitted', 'Submitted', 'Under Review'].includes(bill.insurance.claimStatus)) {
          insuranceData[provider].pendingClaims++;
        }
      });

      return Object.entries(insuranceData).map(([provider, data]) => ({
        provider,
        ...data
      }));
    } catch (error) {
      console.error('Error getting insurance analysis:', error);
      return [];
    }
  }

  // Get outstanding bills
  async getOutstandingBills() {
    try {
      const bills = await Bill.find({
        status: { $in: ['Generated', 'Sent', 'Partially Paid'] },
        'summary.balanceAmount': { $gt: 0 }
      });

      return { success: true, data: bills };
    } catch (error) {
      console.error('Error fetching outstanding bills:', error);
      return { success: false, error: error.message };
    }
  }

  // Create billing rate
  async createBillingRate(rateData) {
    try {
      if (!rateData.rateId) {
        rateData.rateId = `RATE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      const rate = await BillingRate.create(rateData);
      return { success: true, data: rate };
    } catch (error) {
      console.error('Error creating billing rate:', error);
      return { success: false, error: error.message };
    }
  }

  // Get billing rates
  async getBillingRates(filters = {}) {
    try {
      const query = {};
      
      if (filters.category) query.category = filters.category;
      if (filters.department) query.department = filters.department;
      if (filters.isActive !== undefined) query['validity.isActive'] = filters.isActive;

      const rates = await BillingRate.find(query);
      return { success: true, data: rates };
    } catch (error) {
      console.error('Error fetching billing rates:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new BillingService();