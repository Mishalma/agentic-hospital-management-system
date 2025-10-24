class MockBillingRate {
  constructor() {
    this.rates = [
      // Consultation Rates
      {
        rateId: 'RATE-001',
        category: 'Consultation',
        serviceCode: 'CONS_GEN',
        serviceName: 'General Consultation',
        description: 'General physician consultation',
        department: 'General Medicine',
        pricing: {
          basePrice: 800,
          currency: 'INR',
          unit: 'per consultation',
          patientTypeRates: [
            { patientType: 'General', rate: 800, discountPercentage: 0 },
            { patientType: 'Senior Citizen', rate: 800, discountPercentage: 20 },
            { patientType: 'Child', rate: 800, discountPercentage: 10 },
            { patientType: 'Emergency', rate: 1200, discountPercentage: 0 }
          ],
          insuranceRates: [
            { insuranceProvider: 'Star Health', rate: 800, coveragePercentage: 80, copayAmount: 160 },
            { insuranceProvider: 'HDFC ERGO', rate: 800, coveragePercentage: 90, copayAmount: 80 }
          ]
        },
        tax: { taxable: true, taxPercentage: 18, taxCode: 'GST18' },
        validity: { effectiveFrom: new Date('2024-01-01'), isActive: true },
        configuration: { allowPartialPayment: true, requirePreAuthorization: false },
        approval: { status: 'Approved', approvedBy: 'admin', approvedAt: new Date('2024-01-01') },
        statistics: { totalUsage: 150, monthlyUsage: 45, totalRevenue: 120000 },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        rateId: 'RATE-002',
        category: 'Consultation',
        serviceCode: 'CONS_CARD',
        serviceName: 'Cardiology Consultation',
        description: 'Specialist cardiology consultation',
        department: 'Cardiology',
        pricing: {
          basePrice: 1500,
          currency: 'INR',
          unit: 'per consultation',
          patientTypeRates: [
            { patientType: 'General', rate: 1500, discountPercentage: 0 },
            { patientType: 'Senior Citizen', rate: 1500, discountPercentage: 15 },
            { patientType: 'Emergency', rate: 2500, discountPercentage: 0 }
          ]
        },
        tax: { taxable: true, taxPercentage: 18, taxCode: 'GST18' },
        validity: { effectiveFrom: new Date('2024-01-01'), isActive: true },
        approval: { status: 'Approved' },
        statistics: { totalUsage: 89, monthlyUsage: 25, totalRevenue: 133500 },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      
      // Laboratory Rates
      {
        rateId: 'RATE-003',
        category: 'Laboratory',
        serviceCode: 'LAB_CBC',
        serviceName: 'Complete Blood Count',
        description: 'Full blood count analysis',
        department: 'Laboratory',
        pricing: {
          basePrice: 500,
          currency: 'INR',
          unit: 'per test',
          patientTypeRates: [
            { patientType: 'General', rate: 500, discountPercentage: 0 },
            { patientType: 'Senior Citizen', rate: 500, discountPercentage: 25 },
            { patientType: 'Child', rate: 500, discountPercentage: 15 }
          ]
        },
        tax: { taxable: true, taxPercentage: 18, taxCode: 'GST18' },
        validity: { effectiveFrom: new Date('2024-01-01'), isActive: true },
        approval: { status: 'Approved' },
        statistics: { totalUsage: 320, monthlyUsage: 95, totalRevenue: 160000 },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        rateId: 'RATE-004',
        category: 'Laboratory',
        serviceCode: 'LAB_LIPID',
        serviceName: 'Lipid Profile',
        description: 'Cholesterol and lipid analysis',
        department: 'Laboratory',
        pricing: {
          basePrice: 800,
          currency: 'INR',
          unit: 'per test',
          patientTypeRates: [
            { patientType: 'General', rate: 800, discountPercentage: 0 },
            { patientType: 'Senior Citizen', rate: 800, discountPercentage: 20 }
          ]
        },
        tax: { taxable: true, taxPercentage: 18, taxCode: 'GST18' },
        validity: { effectiveFrom: new Date('2024-01-01'), isActive: true },
        approval: { status: 'Approved' },
        statistics: { totalUsage: 180, monthlyUsage: 52, totalRevenue: 144000 },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      
      // Pharmacy Rates
      {
        rateId: 'RATE-005',
        category: 'Pharmacy',
        serviceCode: 'MED_ATORVA',
        serviceName: 'Atorvastatin 20mg',
        description: 'Cholesterol medication',
        department: 'Pharmacy',
        pricing: {
          basePrice: 15,
          currency: 'INR',
          unit: 'per tablet',
          volumeDiscounts: [
            { minQuantity: 30, maxQuantity: 60, discountPercentage: 10 },
            { minQuantity: 61, maxQuantity: 90, discountPercentage: 15 }
          ]
        },
        tax: { taxable: true, taxPercentage: 12, taxCode: 'GST12' },
        validity: { effectiveFrom: new Date('2024-01-01'), isActive: true },
        approval: { status: 'Approved' },
        statistics: { totalUsage: 2500, monthlyUsage: 750, totalRevenue: 37500 },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      
      // Procedure Rates
      {
        rateId: 'RATE-006',
        category: 'Procedure',
        serviceCode: 'PROC_ECG',
        serviceName: 'Electrocardiogram',
        description: 'Heart rhythm analysis',
        department: 'Cardiology',
        pricing: {
          basePrice: 800,
          currency: 'INR',
          unit: 'per procedure',
          patientTypeRates: [
            { patientType: 'General', rate: 800, discountPercentage: 0 },
            { patientType: 'Emergency', rate: 1200, discountPercentage: 0 }
          ]
        },
        tax: { taxable: true, taxPercentage: 18, taxCode: 'GST18' },
        validity: { effectiveFrom: new Date('2024-01-01'), isActive: true },
        approval: { status: 'Approved' },
        statistics: { totalUsage: 125, monthlyUsage: 38, totalRevenue: 100000 },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      
      // Accommodation Rates
      {
        rateId: 'RATE-007',
        category: 'Accommodation',
        serviceCode: 'ROOM_GEN',
        serviceName: 'General Ward',
        description: 'General ward accommodation',
        department: 'Administration',
        pricing: {
          basePrice: 2000,
          currency: 'INR',
          unit: 'per day',
          patientTypeRates: [
            { patientType: 'General', rate: 2000, discountPercentage: 0 },
            { patientType: 'Corporate', rate: 2000, discountPercentage: 15 }
          ]
        },
        tax: { taxable: true, taxPercentage: 18, taxCode: 'GST18' },
        validity: { effectiveFrom: new Date('2024-01-01'), isActive: true },
        approval: { status: 'Approved' },
        statistics: { totalUsage: 45, monthlyUsage: 12, totalRevenue: 90000 },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];
    this.nextId = 8;
  }

  async find(query = {}) {
    let results = [...this.rates];
    
    if (query.category) {
      results = results.filter(rate => rate.category === query.category);
    }
    
    if (query.serviceCode) {
      results = results.filter(rate => rate.serviceCode === query.serviceCode);
    }
    
    if (query.department) {
      results = results.filter(rate => rate.department === query.department);
    }
    
    if (query['validity.isActive']) {
      results = results.filter(rate => rate.validity.isActive === query['validity.isActive']);
    }
    
    return results;
  }

  async findOne(query) {
    const results = await this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  async create(rateData) {
    const newRate = {
      rateId: `RATE-${String(this.nextId).padStart(3, '0')}`,
      ...rateData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.rates.push(newRate);
    this.nextId++;
    
    return newRate;
  }

  async findByIdAndUpdate(rateId, updateData) {
    const rateIndex = this.rates.findIndex(rate => rate.rateId === rateId);
    
    if (rateIndex === -1) {
      return null;
    }
    
    this.rates[rateIndex] = {
      ...this.rates[rateIndex],
      ...updateData,
      updatedAt: new Date()
    };
    
    return this.rates[rateIndex];
  }

  async deleteOne(query) {
    const rateIndex = this.rates.findIndex(rate => {
      return Object.keys(query).every(key => rate[key] === query[key]);
    });
    
    if (rateIndex === -1) {
      return { deletedCount: 0 };
    }
    
    this.rates.splice(rateIndex, 1);
    return { deletedCount: 1 };
  }

  async countDocuments(query = {}) {
    const results = await this.find(query);
    return results.length;
  }

  async aggregate(pipeline) {
    let results = [...this.rates];
    
    for (const stage of pipeline) {
      if (stage.$match) {
        results = results.filter(rate => {
          return Object.keys(stage.$match).every(key => rate[key] === stage.$match[key]);
        });
      }
      
      if (stage.$group) {
        const grouped = {};
        results.forEach(rate => {
          const key = stage.$group._id === '$category' ? rate.category : 'all';
          if (!grouped[key]) {
            grouped[key] = { _id: key, count: 0, totalRevenue: 0 };
          }
          grouped[key].count++;
          grouped[key].totalRevenue += rate.statistics?.totalRevenue || 0;
        });
        results = Object.values(grouped);
      }
    }
    
    return results;
  }
}

module.exports = MockBillingRate;