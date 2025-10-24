const { LabOrder, LabResult } = require('../models');

class LaboratoryService {
  // Create a new lab order
  async createLabOrder(orderData) {
    try {
      // Generate unique order ID if not provided
      if (!orderData.orderId) {
        orderData.orderId = `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Set default values
      orderData.status = orderData.status || 'Pending';
      orderData.priority = orderData.priority || 'Routine';
      orderData.orderDate = orderData.orderDate || new Date();

      // Initialize test statuses
      if (orderData.tests) {
        orderData.tests = orderData.tests.map(test => ({
          ...test,
          status: test.status || 'Ordered'
        }));
      }

      const labOrder = await LabOrder.create(orderData);
      return { success: true, data: labOrder };
    } catch (error) {
      console.error('Error creating lab order:', error);
      return { success: false, error: error.message };
    }
  }

  // Get lab orders with filtering
  async getLabOrders(filters = {}) {
    try {
      const query = {};
      
      if (filters.patientId) query.patientId = filters.patientId;
      if (filters.status) query.status = filters.status;
      if (filters.priority) query.priority = filters.priority;
      if (filters.doctorId) query.doctorId = filters.doctorId;
      
      // Date range filtering
      if (filters.startDate || filters.endDate) {
        query.orderDate = {};
        if (filters.startDate) query.orderDate.$gte = new Date(filters.startDate);
        if (filters.endDate) query.orderDate.$lte = new Date(filters.endDate);
      }

      const orders = await LabOrder.find(query);
      return { success: true, data: orders };
    } catch (error) {
      console.error('Error fetching lab orders:', error);
      return { success: false, error: error.message };
    }
  }

  // Get a specific lab order
  async getLabOrder(orderId) {
    try {
      const order = await LabOrder.findOne({ orderId });
      if (!order) {
        return { success: false, error: 'Lab order not found' };
      }
      return { success: true, data: order };
    } catch (error) {
      console.error('Error fetching lab order:', error);
      return { success: false, error: error.message };
    }
  }

  // Update lab order status
  async updateLabOrderStatus(orderId, status, updateData = {}) {
    try {
      const updateFields = {
        status,
        ...updateData,
        updatedAt: new Date()
      };

      const order = await LabOrder.findByIdAndUpdate(
        orderId,
        updateFields,
        { new: true }
      );

      if (!order) {
        return { success: false, error: 'Lab order not found' };
      }

      return { success: true, data: order };
    } catch (error) {
      console.error('Error updating lab order:', error);
      return { success: false, error: error.message };
    }
  }

  // Update sample collection information
  async updateSampleCollection(orderId, collectionData) {
    try {
      const updateFields = {
        'sampleCollection': collectionData,
        status: 'Collected',
        updatedAt: new Date()
      };

      // Update individual test statuses
      if (collectionData.tests) {
        updateFields['tests.$[].status'] = 'Collected';
        updateFields['tests.$[].collectedAt'] = new Date();
      }

      const order = await LabOrder.findByIdAndUpdate(
        orderId,
        updateFields,
        { new: true }
      );

      if (!order) {
        return { success: false, error: 'Lab order not found' };
      }

      return { success: true, data: order };
    } catch (error) {
      console.error('Error updating sample collection:', error);
      return { success: false, error: error.message };
    }
  }

  // Create lab result
  async createLabResult(resultData) {
    try {
      // Generate unique result ID if not provided
      if (!resultData.resultId) {
        resultData.resultId = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Set default values
      resultData.status = resultData.status || 'Draft';
      resultData.qcStatus = resultData.qcStatus || 'Pending';
      resultData.performedAt = resultData.performedAt || new Date();

      const labResult = await LabResult.create(resultData);

      // Update corresponding lab order
      await this.updateLabOrderWithResult(resultData.orderId, resultData.testCode, labResult);

      return { success: true, data: labResult };
    } catch (error) {
      console.error('Error creating lab result:', error);
      return { success: false, error: error.message };
    }
  }

  // Update lab order with result information
  async updateLabOrderWithResult(orderId, testCode, result) {
    try {
      const order = await LabOrder.findOne({ orderId });
      if (!order) {
        return { success: false, error: 'Lab order not found' };
      }

      // Find and update the specific test
      const testIndex = order.tests.findIndex(test => test.testCode === testCode);
      if (testIndex !== -1) {
        order.tests[testIndex].status = 'Completed';
        order.tests[testIndex].completedAt = new Date();
        order.tests[testIndex].result = {
          value: result.overallInterpretation || 'See detailed report',
          unit: '',
          referenceRange: 'See individual parameters',
          flag: this.determineOverallFlag(result.results),
          comments: result.technologistComments,
          verifiedBy: result.verifiedBy,
          verifiedAt: result.verifiedAt
        };

        // Check if all tests are completed
        const allCompleted = order.tests.every(test => test.status === 'Completed');
        if (allCompleted) {
          order.status = 'Completed';
          order.reportGenerated = true;
        }

        await LabOrder.findByIdAndUpdate(orderId, order);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating lab order with result:', error);
      return { success: false, error: error.message };
    }
  }

  // Determine overall flag from individual results
  determineOverallFlag(results) {
    if (!results || results.length === 0) return 'Normal';
    
    const flags = results.map(r => r.flag);
    if (flags.includes('Critical')) return 'Critical';
    if (flags.includes('Abnormal')) return 'Abnormal';
    if (flags.includes('High') || flags.includes('Low')) return 'Abnormal';
    return 'Normal';
  }

  // Get lab results
  async getLabResults(filters = {}) {
    try {
      const query = {};
      
      if (filters.patientId) query.patientId = filters.patientId;
      if (filters.orderId) query.orderId = filters.orderId;
      if (filters.status) query.status = filters.status;
      if (filters.category) query.category = filters.category;
      
      // Date range filtering
      if (filters.startDate || filters.endDate) {
        query.performedAt = {};
        if (filters.startDate) query.performedAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.performedAt.$lte = new Date(filters.endDate);
      }

      const results = await LabResult.find(query);
      return { success: true, data: results };
    } catch (error) {
      console.error('Error fetching lab results:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify lab result
  async verifyLabResult(resultId, verificationData) {
    try {
      const updateFields = {
        status: 'Final',
        verifiedBy: verificationData.verifiedBy,
        verifiedAt: new Date(),
        pathologistComments: verificationData.comments,
        updatedAt: new Date()
      };

      const result = await LabResult.findByIdAndUpdate(
        resultId,
        updateFields,
        { new: true }
      );

      if (!result) {
        return { success: false, error: 'Lab result not found' };
      }

      // Check for critical values and create alerts
      await this.checkCriticalValues(result);

      return { success: true, data: result };
    } catch (error) {
      console.error('Error verifying lab result:', error);
      return { success: false, error: error.message };
    }
  }

  // Check for critical values and create alerts
  async checkCriticalValues(result) {
    try {
      const criticalValues = result.results.filter(r => r.flag === 'Critical');
      
      if (criticalValues.length > 0) {
        // Update the result with critical value information
        const criticalData = criticalValues.map(cv => ({
          parameter: cv.parameter,
          value: cv.value,
          threshold: cv.referenceRange,
          notified: false,
          notifiedTo: null,
          notifiedAt: null
        }));

        await LabResult.findByIdAndUpdate(result.resultId, {
          criticalValues: criticalData
        });

        // Here you would typically send notifications to doctors
        console.log(`Critical values detected for result ${result.resultId}:`, criticalValues);
      }
    } catch (error) {
      console.error('Error checking critical values:', error);
    }
  }

  // Get laboratory statistics
  async getLabStatistics(filters = {}) {
    try {
      const startDate = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = filters.endDate ? new Date(filters.endDate) : new Date();

      // Order statistics
      const orderStats = await LabOrder.aggregate([
        {
          $match: {
            orderDate: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Result statistics
      const resultStats = await LabResult.aggregate([
        {
          $match: {
            performedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]);

      // Turnaround time analysis (mock calculation)
      const avgTurnaroundTime = await this.calculateAverageTurnaroundTime(startDate, endDate);

      return {
        success: true,
        data: {
          ordersByStatus: orderStats,
          resultsByCategory: resultStats,
          averageTurnaroundTime: avgTurnaroundTime,
          dateRange: { startDate, endDate }
        }
      };
    } catch (error) {
      console.error('Error fetching lab statistics:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate average turnaround time
  async calculateAverageTurnaroundTime(startDate, endDate) {
    try {
      const completedOrders = await LabOrder.find({
        status: 'Completed',
        orderDate: { $gte: startDate, $lte: endDate }
      });

      if (completedOrders.length === 0) {
        return { hours: 0, minutes: 0 };
      }

      let totalMinutes = 0;
      completedOrders.forEach(order => {
        const orderTime = new Date(order.orderDate);
        const completedTime = new Date(order.updatedAt);
        const diffMinutes = (completedTime - orderTime) / (1000 * 60);
        totalMinutes += diffMinutes;
      });

      const avgMinutes = totalMinutes / completedOrders.length;
      const hours = Math.floor(avgMinutes / 60);
      const minutes = Math.floor(avgMinutes % 60);

      return { hours, minutes, totalOrders: completedOrders.length };
    } catch (error) {
      console.error('Error calculating turnaround time:', error);
      return { hours: 0, minutes: 0, totalOrders: 0 };
    }
  }

  // Get pending orders for lab workflow
  async getPendingOrders() {
    try {
      const pendingOrders = await LabOrder.find({
        status: { $in: ['Pending', 'Collected', 'Processing'] }
      });

      return { success: true, data: pendingOrders };
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      return { success: false, error: error.message };
    }
  }

  // Quality control check
  async performQCCheck(orderId, qcData) {
    try {
      const order = await LabOrder.findOne({ orderId });
      if (!order) {
        return { success: false, error: 'Lab order not found' };
      }

      const qcCheck = {
        parameter: qcData.parameter,
        expected: qcData.expected,
        actual: qcData.actual,
        status: qcData.status,
        checkedBy: qcData.checkedBy,
        checkedAt: new Date()
      };

      order.qcChecks.push(qcCheck);
      await LabOrder.findByIdAndUpdate(orderId, order);

      return { success: true, data: qcCheck };
    } catch (error) {
      console.error('Error performing QC check:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new LaboratoryService();