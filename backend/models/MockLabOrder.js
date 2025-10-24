class MockLabOrder {
  constructor() {
    this.orders = [
      {
        orderId: 'LAB-001',
        patientId: 'P001',
        doctorId: 'D001',
        consultationId: 'C001',
        tests: [
          {
            testCode: 'CBC',
            testName: 'Complete Blood Count',
            category: 'Hematology',
            priority: 'Routine',
            specimen: 'Blood',
            instructions: 'Fasting not required',
            status: 'Completed',
            result: {
              value: 'Normal',
              unit: '',
              referenceRange: 'Within normal limits',
              flag: 'Normal',
              comments: 'All parameters within normal range',
              verifiedBy: 'Dr. Smith',
              verifiedAt: new Date('2024-01-15T10:30:00Z')
            },
            collectedAt: new Date('2024-01-15T08:00:00Z'),
            processedAt: new Date('2024-01-15T09:00:00Z'),
            completedAt: new Date('2024-01-15T10:30:00Z')
          }
        ],
        orderDate: new Date('2024-01-15T07:00:00Z'),
        clinicalInfo: {
          diagnosis: 'Routine checkup',
          symptoms: 'None',
          medications: 'None',
          allergies: 'NKDA'
        },
        sampleCollection: {
          collectedBy: 'Lab Tech A',
          collectionDate: new Date('2024-01-15T08:00:00Z'),
          collectionTime: '08:00',
          collectionNotes: 'Sample collected without issues',
          barcodeId: 'BC001'
        },
        status: 'Completed',
        priority: 'Routine',
        reportGenerated: true,
        reportUrl: '/reports/LAB-001.pdf',
        billingCode: 'LAB001',
        cost: 150.00,
        alerts: [],
        qcChecks: [
          {
            parameter: 'Sample Quality',
            expected: 'Good',
            actual: 'Good',
            status: 'Pass',
            checkedBy: 'QC Tech',
            checkedAt: new Date('2024-01-15T08:30:00Z')
          }
        ],
        createdAt: new Date('2024-01-15T07:00:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z')
      },
      {
        orderId: 'LAB-002',
        patientId: 'P002',
        doctorId: 'D002',
        consultationId: 'C002',
        tests: [
          {
            testCode: 'LIPID',
            testName: 'Lipid Panel',
            category: 'Biochemistry',
            priority: 'Urgent',
            specimen: 'Blood',
            instructions: '12-hour fasting required',
            status: 'Processing',
            result: null,
            collectedAt: new Date('2024-01-16T07:30:00Z'),
            processedAt: new Date('2024-01-16T08:30:00Z'),
            completedAt: null
          }
        ],
        orderDate: new Date('2024-01-16T06:00:00Z'),
        clinicalInfo: {
          diagnosis: 'Hyperlipidemia screening',
          symptoms: 'Chest pain',
          medications: 'Statin',
          allergies: 'None'
        },
        sampleCollection: {
          collectedBy: 'Lab Tech B',
          collectionDate: new Date('2024-01-16T07:30:00Z'),
          collectionTime: '07:30',
          collectionNotes: 'Patient fasted 12 hours',
          barcodeId: 'BC002'
        },
        status: 'Processing',
        priority: 'Urgent',
        reportGenerated: false,
        reportUrl: null,
        billingCode: 'LAB002',
        cost: 200.00,
        alerts: [],
        qcChecks: [],
        createdAt: new Date('2024-01-16T06:00:00Z'),
        updatedAt: new Date('2024-01-16T08:30:00Z')
      }
    ];
    this.nextId = 3;
  }

  async find(query = {}) {
    let results = [...this.orders];
    
    if (query.patientId) {
      results = results.filter(order => order.patientId === query.patientId);
    }
    
    if (query.status) {
      results = results.filter(order => order.status === query.status);
    }
    
    if (query.orderId) {
      results = results.filter(order => order.orderId === query.orderId);
    }
    
    return results;
  }

  async findOne(query) {
    const results = await this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  async create(orderData) {
    const newOrder = {
      orderId: `LAB-${String(this.nextId).padStart(3, '0')}`,
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.orders.push(newOrder);
    this.nextId++;
    
    return newOrder;
  }

  async findByIdAndUpdate(orderId, updateData) {
    const orderIndex = this.orders.findIndex(order => order.orderId === orderId);
    
    if (orderIndex === -1) {
      return null;
    }
    
    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      ...updateData,
      updatedAt: new Date()
    };
    
    return this.orders[orderIndex];
  }

  async deleteOne(query) {
    const orderIndex = this.orders.findIndex(order => {
      return Object.keys(query).every(key => order[key] === query[key]);
    });
    
    if (orderIndex === -1) {
      return { deletedCount: 0 };
    }
    
    this.orders.splice(orderIndex, 1);
    return { deletedCount: 1 };
  }

  async countDocuments(query = {}) {
    const results = await this.find(query);
    return results.length;
  }

  // Aggregate method for statistics
  async aggregate(pipeline) {
    // Simple implementation for basic aggregation
    let results = [...this.orders];
    
    for (const stage of pipeline) {
      if (stage.$match) {
        results = results.filter(order => {
          return Object.keys(stage.$match).every(key => {
            if (key === 'orderDate' && stage.$match[key].$gte) {
              return new Date(order.orderDate) >= new Date(stage.$match[key].$gte);
            }
            return order[key] === stage.$match[key];
          });
        });
      }
      
      if (stage.$group) {
        const grouped = {};
        results.forEach(order => {
          const key = stage.$group._id === '$status' ? order.status : 'all';
          if (!grouped[key]) {
            grouped[key] = { _id: key, count: 0 };
          }
          grouped[key].count++;
        });
        results = Object.values(grouped);
      }
    }
    
    return results;
  }
}

module.exports = MockLabOrder;