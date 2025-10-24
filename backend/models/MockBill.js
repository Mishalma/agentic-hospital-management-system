class MockBill {
  constructor() {
    this.bills = [
      {
        billId: 'BILL-001',
        patientId: 'P001',
        patientInfo: {
          name: 'John Doe',
          phone: '+91-9876543210',
          email: 'john.doe@email.com',
          address: '123 Main Street, City',
          insuranceProvider: 'Star Health',
          policyNumber: 'SH123456789'
        },
        visitId: 'V001',
        billDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-14'),
        status: 'Generated',
        priority: 'Normal',
        charges: {
          consultation: [{
            consultationId: 'C001',
            doctorId: 'D001',
            doctorName: 'Dr. Smith',
            department: 'Cardiology',
            serviceCode: 'CONS_CARD',
            serviceName: 'Cardiology Consultation',
            quantity: 1,
            unitPrice: 1500,
            discount: 150,
            tax: 243,
            totalAmount: 1593,
            date: new Date('2024-01-15'),
            notes: 'Follow-up consultation'
          }],
          laboratory: [{
            orderId: 'LAB-001',
            testCode: 'CBC',
            testName: 'Complete Blood Count',
            category: 'Hematology',
            quantity: 1,
            unitPrice: 500,
            discount: 0,
            tax: 90,
            totalAmount: 590,
            date: new Date('2024-01-15'),
            urgency: 'Routine',
            notes: 'Fasting not required'
          }],
          pharmacy: [{
            prescriptionId: 'RX001',
            medicationCode: 'MED001',
            medicationName: 'Atorvastatin 20mg',
            strength: '20mg',
            quantity: 30,
            unitPrice: 15,
            discount: 45,
            tax: 72,
            totalAmount: 477,
            date: new Date('2024-01-15'),
            pharmacistId: 'PH001',
            notes: '30 days supply'
          }],
          procedures: [],
          accommodation: [],
          miscellaneous: []
        },
        summary: {
          subtotal: 2660,
          totalDiscount: 195,
          totalTax: 405,
          totalAmount: 2660,
          paidAmount: 0,
          balanceAmount: 2660,
          advanceAmount: 0
        },
        insurance: {
          provider: 'Star Health',
          policyNumber: 'SH123456789',
          coveragePercentage: 80,
          coveredAmount: 2128,
          deductible: 500,
          copayAmount: 532,
          claimNumber: 'CLM001',
          claimStatus: 'Not Submitted',
          preAuthorizationNumber: ''
        },
        payments: [],
        workflow: {
          generatedBy: 'billing_clerk_001',
          generatedAt: new Date('2024-01-15T10:30:00Z'),
          reviewedBy: null,
          reviewedAt: null,
          approvedBy: null,
          approvedAt: null,
          sentBy: null,
          sentAt: null,
          paidAt: null
        },
        notes: 'Regular follow-up visit',
        internalNotes: 'Patient has good insurance coverage',
        tags: ['cardiology', 'follow-up'],
        auditLog: [
          {
            action: 'Bill Generated',
            performedBy: 'billing_clerk_001',
            timestamp: new Date('2024-01-15T10:30:00Z'),
            details: 'Bill automatically generated from consultation and lab charges'
          }
        ],
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z')
      },
      {
        billId: 'BILL-002',
        patientId: 'P002',
        patientInfo: {
          name: 'Jane Smith',
          phone: '+91-9876543211',
          email: 'jane.smith@email.com',
          address: '456 Oak Avenue, City',
          insuranceProvider: 'HDFC ERGO',
          policyNumber: 'HE987654321'
        },
        visitId: 'V002',
        billDate: new Date('2024-01-16'),
        dueDate: new Date('2024-02-15'),
        status: 'Paid',
        priority: 'Urgent',
        charges: {
          consultation: [{
            consultationId: 'C002',
            doctorId: 'D002',
            doctorName: 'Dr. Johnson',
            department: 'Emergency',
            serviceCode: 'CONS_EMER',
            serviceName: 'Emergency Consultation',
            quantity: 1,
            unitPrice: 2500,
            discount: 0,
            tax: 450,
            totalAmount: 2950,
            date: new Date('2024-01-16'),
            notes: 'Emergency visit - chest pain'
          }],
          laboratory: [{
            orderId: 'LAB-002',
            testCode: 'TROP',
            testName: 'Troponin I',
            category: 'Biochemistry',
            quantity: 1,
            unitPrice: 1200,
            discount: 0,
            tax: 216,
            totalAmount: 1416,
            date: new Date('2024-01-16'),
            urgency: 'STAT',
            notes: 'Emergency cardiac marker'
          }],
          pharmacy: [{
            prescriptionId: 'RX002',
            medicationCode: 'MED002',
            medicationName: 'Aspirin 75mg',
            strength: '75mg',
            quantity: 10,
            unitPrice: 2,
            discount: 0,
            tax: 3.6,
            totalAmount: 23.6,
            date: new Date('2024-01-16'),
            pharmacistId: 'PH001',
            notes: 'Emergency supply'
          }],
          procedures: [{
            procedureId: 'PROC001',
            procedureCode: 'ECG',
            procedureName: 'Electrocardiogram',
            department: 'Cardiology',
            performedBy: 'Tech001',
            quantity: 1,
            unitPrice: 800,
            discount: 0,
            tax: 144,
            totalAmount: 944,
            date: new Date('2024-01-16'),
            duration: '15 minutes',
            notes: 'Emergency ECG'
          }],
          accommodation: [],
          miscellaneous: []
        },
        summary: {
          subtotal: 5333.6,
          totalDiscount: 0,
          totalTax: 813.6,
          totalAmount: 5333.6,
          paidAmount: 5333.6,
          balanceAmount: 0,
          advanceAmount: 0
        },
        insurance: {
          provider: 'HDFC ERGO',
          policyNumber: 'HE987654321',
          coveragePercentage: 90,
          coveredAmount: 4800.24,
          deductible: 1000,
          copayAmount: 533.36,
          claimNumber: 'CLM002',
          claimStatus: 'Approved',
          preAuthorizationNumber: 'PA123456'
        },
        payments: [{
          paymentId: 'PAY001',
          paymentDate: new Date('2024-01-16T14:30:00Z'),
          amount: 533.36,
          method: 'Card',
          transactionId: 'TXN123456789',
          reference: 'Emergency payment',
          receivedBy: 'cashier_001',
          notes: 'Patient copay amount',
          status: 'Completed'
        }, {
          paymentId: 'PAY002',
          paymentDate: new Date('2024-01-18T10:00:00Z'),
          amount: 4800.24,
          method: 'Insurance',
          transactionId: 'INS123456789',
          reference: 'Insurance settlement',
          receivedBy: 'billing_manager',
          notes: 'Insurance claim settlement',
          status: 'Completed'
        }],
        workflow: {
          generatedBy: 'billing_clerk_002',
          generatedAt: new Date('2024-01-16T12:00:00Z'),
          reviewedBy: 'billing_supervisor',
          reviewedAt: new Date('2024-01-16T12:30:00Z'),
          approvedBy: 'billing_manager',
          approvedAt: new Date('2024-01-16T13:00:00Z'),
          sentBy: 'billing_clerk_002',
          sentAt: new Date('2024-01-16T13:30:00Z'),
          paidAt: new Date('2024-01-18T10:00:00Z')
        },
        notes: 'Emergency visit - fully covered by insurance',
        internalNotes: 'Pre-authorization obtained',
        tags: ['emergency', 'cardiac', 'insurance'],
        auditLog: [
          {
            action: 'Bill Generated',
            performedBy: 'billing_clerk_002',
            timestamp: new Date('2024-01-16T12:00:00Z'),
            details: 'Emergency bill generated'
          },
          {
            action: 'Payment Received',
            performedBy: 'cashier_001',
            timestamp: new Date('2024-01-16T14:30:00Z'),
            details: 'Copay amount received'
          },
          {
            action: 'Insurance Settlement',
            performedBy: 'billing_manager',
            timestamp: new Date('2024-01-18T10:00:00Z'),
            details: 'Insurance claim settled'
          }
        ],
        createdAt: new Date('2024-01-16T12:00:00Z'),
        updatedAt: new Date('2024-01-18T10:00:00Z')
      }
    ];
    this.nextId = 3;
  }

  async find(query = {}) {
    let results = [...this.bills];
    
    if (query.patientId) {
      results = results.filter(bill => bill.patientId === query.patientId);
    }
    
    if (query.status) {
      results = results.filter(bill => bill.status === query.status);
    }
    
    if (query.billId) {
      results = results.filter(bill => bill.billId === query.billId);
    }
    
    if (query.billDate) {
      if (query.billDate.$gte) {
        results = results.filter(bill => new Date(bill.billDate) >= new Date(query.billDate.$gte));
      }
      if (query.billDate.$lte) {
        results = results.filter(bill => new Date(bill.billDate) <= new Date(query.billDate.$lte));
      }
    }
    
    return results;
  }

  async findOne(query) {
    const results = await this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  async create(billData) {
    const newBill = {
      billId: `BILL-${String(this.nextId).padStart(3, '0')}`,
      ...billData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.bills.push(newBill);
    this.nextId++;
    
    return newBill;
  }

  async findByIdAndUpdate(billId, updateData) {
    const billIndex = this.bills.findIndex(bill => bill.billId === billId);
    
    if (billIndex === -1) {
      return null;
    }
    
    this.bills[billIndex] = {
      ...this.bills[billIndex],
      ...updateData,
      updatedAt: new Date()
    };
    
    return this.bills[billIndex];
  }

  async deleteOne(query) {
    const billIndex = this.bills.findIndex(bill => {
      return Object.keys(query).every(key => bill[key] === query[key]);
    });
    
    if (billIndex === -1) {
      return { deletedCount: 0 };
    }
    
    this.bills.splice(billIndex, 1);
    return { deletedCount: 1 };
  }

  async countDocuments(query = {}) {
    const results = await this.find(query);
    return results.length;
  }

  async aggregate(pipeline) {
    let results = [...this.bills];
    
    for (const stage of pipeline) {
      if (stage.$match) {
        results = results.filter(bill => {
          return Object.keys(stage.$match).every(key => {
            if (key === 'billDate' && stage.$match[key].$gte) {
              return new Date(bill.billDate) >= new Date(stage.$match[key].$gte);
            }
            return bill[key] === stage.$match[key];
          });
        });
      }
      
      if (stage.$group) {
        const grouped = {};
        results.forEach(bill => {
          let key;
          if (stage.$group._id === '$status') {
            key = bill.status;
          } else if (stage.$group._id === null) {
            key = 'total';
          } else {
            key = 'all';
          }
          
          if (!grouped[key]) {
            grouped[key] = { 
              _id: key, 
              count: 0, 
              totalAmount: 0,
              totalPaid: 0,
              totalBalance: 0
            };
          }
          
          grouped[key].count++;
          grouped[key].totalAmount += bill.summary.totalAmount || 0;
          grouped[key].totalPaid += bill.summary.paidAmount || 0;
          grouped[key].totalBalance += bill.summary.balanceAmount || 0;
        });
        results = Object.values(grouped);
      }
    }
    
    return results;
  }
}

module.exports = MockBill;