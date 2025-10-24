class MockBed {
  constructor() {
    this.beds = [
      {
        bedId: 'BED-001',
        bedNumber: 'A101',
        ward: {
          wardId: 'WARD-001',
          wardName: 'General Ward A',
          floor: 1,
          wing: 'East',
          department: 'General Medicine'
        },
        bedType: 'General',
        category: 'Standard',
        status: 'Available',
        specifications: {
          hasOxygen: true,
          hasVentilator: false,
          hasMonitor: true,
          hasPrivateBathroom: false,
          hasAC: true,
          hasTV: true,
          hasWiFi: true,
          hasRefrigerator: false,
          maxOccupancy: 1,
          wheelchairAccessible: true
        },
        pricing: {
          baseRate: 2000,
          currency: 'INR',
          billingUnit: 'per day',
          additionalCharges: [
            { service: 'Oxygen', rate: 500, unit: 'per day' },
            { service: 'TV', rate: 200, unit: 'per day' }
          ]
        },
        currentOccupancy: null,
        reservation: null,
        maintenance: {
          lastCleaned: new Date('2024-01-16T06:00:00Z'),
          cleanedBy: 'Housekeeping Staff A',
          lastMaintenance: new Date('2024-01-10T10:00:00Z'),
          maintenanceBy: 'Maintenance Team',
          nextScheduledMaintenance: new Date('2024-02-10T10:00:00Z'),
          maintenanceNotes: 'All equipment functioning properly',
          equipmentStatus: [
            { equipment: 'Oxygen Outlet', status: 'Working', lastChecked: new Date('2024-01-15'), notes: 'Good condition' },
            { equipment: 'Monitor', status: 'Working', lastChecked: new Date('2024-01-15'), notes: 'Calibrated' }
          ]
        },
        location: {
          coordinates: { x: 10, y: 15, z: 1 },
          mapSection: 'A1',
          nearbyLandmarks: ['Nurses Station A', 'Elevator 1'],
          accessInstructions: 'First door on the right from nurses station'
        },
        analytics: {
          totalOccupancyDays: 280,
          averageStayDuration: 3.5,
          occupancyRate: 85,
          totalRevenue: 560000,
          lastOccupiedDate: new Date('2024-01-14'),
          maintenanceFrequency: 12
        },
        aiInsights: {
          predictedAvailability: new Date('2024-01-17T08:00:00Z'),
          recommendedMaintenance: new Date('2024-02-10T10:00:00Z'),
          utilizationScore: 85,
          patientSatisfactionScore: 4.2,
          optimalPricing: 2200,
          demandForecast: [
            { date: new Date('2024-01-17'), predictedDemand: 'Medium', confidence: 0.8 },
            { date: new Date('2024-01-18'), predictedDemand: 'High', confidence: 0.9 }
          ]
        },
        isActive: true,
        createdBy: 'admin',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-16')
      },
      {
        bedId: 'BED-002',
        bedNumber: 'A102',
        ward: {
          wardId: 'WARD-001',
          wardName: 'General Ward A',
          floor: 1,
          wing: 'East',
          department: 'General Medicine'
        },
        bedType: 'General',
        category: 'Standard',
        status: 'Occupied',
        specifications: {
          hasOxygen: true,
          hasVentilator: false,
          hasMonitor: true,
          hasPrivateBathroom: false,
          hasAC: true,
          hasTV: true,
          hasWiFi: true,
          hasRefrigerator: false,
          maxOccupancy: 1,
          wheelchairAccessible: true
        },
        pricing: {
          baseRate: 2000,
          currency: 'INR',
          billingUnit: 'per day'
        },
        currentOccupancy: {
          patientId: 'P001',
          patientName: 'John Doe',
          admissionId: 'ADM-001',
          admittedAt: new Date('2024-01-15T14:30:00Z'),
          expectedDischarge: new Date('2024-01-18T10:00:00Z'),
          attendingDoctor: 'Dr. Smith',
          emergencyContact: '+91-9876543210',
          specialRequirements: ['Low sodium diet', 'Diabetes monitoring']
        },
        reservation: null,
        maintenance: {
          lastCleaned: new Date('2024-01-15T06:00:00Z'),
          cleanedBy: 'Housekeeping Staff B',
          lastMaintenance: new Date('2024-01-08T10:00:00Z'),
          equipmentStatus: [
            { equipment: 'Oxygen Outlet', status: 'Working', lastChecked: new Date('2024-01-15') },
            { equipment: 'Monitor', status: 'Working', lastChecked: new Date('2024-01-15') }
          ]
        },
        location: {
          coordinates: { x: 12, y: 15, z: 1 },
          mapSection: 'A1',
          nearbyLandmarks: ['Nurses Station A', 'Elevator 1'],
          accessInstructions: 'Second door on the right from nurses station'
        },
        analytics: {
          totalOccupancyDays: 295,
          averageStayDuration: 4.1,
          occupancyRate: 90,
          totalRevenue: 590000,
          lastOccupiedDate: new Date('2024-01-15'),
          maintenanceFrequency: 10
        },
        aiInsights: {
          predictedAvailability: new Date('2024-01-18T10:00:00Z'),
          utilizationScore: 90,
          patientSatisfactionScore: 4.5,
          optimalPricing: 2100
        },
        isActive: true,
        createdBy: 'admin',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15')
      },
      {
        bedId: 'BED-003',
        bedNumber: 'ICU-001',
        ward: {
          wardId: 'WARD-ICU',
          wardName: 'Intensive Care Unit',
          floor: 2,
          wing: 'Central',
          department: 'Critical Care'
        },
        bedType: 'ICU',
        category: 'Deluxe',
        status: 'Available',
        specifications: {
          hasOxygen: true,
          hasVentilator: true,
          hasMonitor: true,
          hasPrivateBathroom: true,
          hasAC: true,
          hasTV: false,
          hasWiFi: true,
          hasRefrigerator: true,
          maxOccupancy: 1,
          wheelchairAccessible: true
        },
        pricing: {
          baseRate: 8000,
          currency: 'INR',
          billingUnit: 'per day',
          additionalCharges: [
            { service: 'Ventilator', rate: 2000, unit: 'per day' },
            { service: 'Intensive Monitoring', rate: 1500, unit: 'per day' }
          ]
        },
        currentOccupancy: null,
        reservation: {
          patientId: 'P003',
          patientName: 'Emergency Patient',
          reservedBy: 'Dr. Johnson',
          reservedAt: new Date('2024-01-16T16:00:00Z'),
          reservedUntil: new Date('2024-01-16T20:00:00Z'),
          purpose: 'Post-surgery monitoring',
          notes: 'Reserved for cardiac surgery patient'
        },
        maintenance: {
          lastCleaned: new Date('2024-01-16T08:00:00Z'),
          cleanedBy: 'ICU Housekeeping',
          lastMaintenance: new Date('2024-01-12T14:00:00Z'),
          equipmentStatus: [
            { equipment: 'Ventilator', status: 'Working', lastChecked: new Date('2024-01-16') },
            { equipment: 'Cardiac Monitor', status: 'Working', lastChecked: new Date('2024-01-16') },
            { equipment: 'Infusion Pumps', status: 'Working', lastChecked: new Date('2024-01-16') }
          ]
        },
        location: {
          coordinates: { x: 25, y: 30, z: 2 },
          mapSection: 'ICU-A',
          nearbyLandmarks: ['ICU Nurses Station', 'Emergency Equipment'],
          accessInstructions: 'First bed in ICU, near central monitoring station'
        },
        analytics: {
          totalOccupancyDays: 320,
          averageStayDuration: 5.2,
          occupancyRate: 95,
          totalRevenue: 2560000,
          lastOccupiedDate: new Date('2024-01-14'),
          maintenanceFrequency: 24
        },
        aiInsights: {
          predictedAvailability: new Date('2024-01-16T20:00:00Z'),
          utilizationScore: 95,
          patientSatisfactionScore: 4.8,
          optimalPricing: 8500,
          demandForecast: [
            { date: new Date('2024-01-17'), predictedDemand: 'High', confidence: 0.95 },
            { date: new Date('2024-01-18'), predictedDemand: 'Critical', confidence: 0.88 }
          ]
        },
        isActive: true,
        createdBy: 'admin',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-16')
      },
      {
        bedId: 'BED-004',
        bedNumber: 'P201',
        ward: {
          wardId: 'WARD-PRIVATE',
          wardName: 'Private Ward',
          floor: 2,
          wing: 'West',
          department: 'General Medicine'
        },
        bedType: 'Private',
        category: 'Super Deluxe',
        status: 'Maintenance',
        specifications: {
          hasOxygen: true,
          hasVentilator: false,
          hasMonitor: true,
          hasPrivateBathroom: true,
          hasAC: true,
          hasTV: true,
          hasWiFi: true,
          hasRefrigerator: true,
          maxOccupancy: 1,
          wheelchairAccessible: true
        },
        pricing: {
          baseRate: 5000,
          currency: 'INR',
          billingUnit: 'per day'
        },
        currentOccupancy: null,
        reservation: null,
        maintenance: {
          lastCleaned: new Date('2024-01-16T10:00:00Z'),
          cleanedBy: 'Housekeeping Supervisor',
          lastMaintenance: new Date('2024-01-16T11:00:00Z'),
          maintenanceBy: 'Electrical Team',
          nextScheduledMaintenance: new Date('2024-01-17T14:00:00Z'),
          maintenanceNotes: 'AC unit repair in progress',
          equipmentStatus: [
            { equipment: 'Air Conditioning', status: 'Under Repair', lastChecked: new Date('2024-01-16'), notes: 'Compressor issue' },
            { equipment: 'TV', status: 'Working', lastChecked: new Date('2024-01-16') }
          ]
        },
        location: {
          coordinates: { x: 40, y: 20, z: 2 },
          mapSection: 'P2',
          nearbyLandmarks: ['Private Ward Reception', 'Elevator 2'],
          accessInstructions: 'Corner room with garden view'
        },
        analytics: {
          totalOccupancyDays: 250,
          averageStayDuration: 2.8,
          occupancyRate: 75,
          totalRevenue: 1250000,
          lastOccupiedDate: new Date('2024-01-13'),
          maintenanceFrequency: 8
        },
        aiInsights: {
          predictedAvailability: new Date('2024-01-17T16:00:00Z'),
          recommendedMaintenance: new Date('2024-01-17T14:00:00Z'),
          utilizationScore: 75,
          patientSatisfactionScore: 4.6,
          optimalPricing: 5200
        },
        isActive: true,
        createdBy: 'admin',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-16')
      }
    ];
    this.nextId = 5;
  }

  async find(query = {}) {
    let results = [...this.beds];
    
    if (query.status) {
      results = results.filter(bed => bed.status === query.status);
    }
    
    if (query.bedType) {
      results = results.filter(bed => bed.bedType === query.bedType);
    }
    
    if (query['ward.wardName']) {
      results = results.filter(bed => bed.ward.wardName === query['ward.wardName']);
    }
    
    if (query['ward.floor']) {
      results = results.filter(bed => bed.ward.floor === query['ward.floor']);
    }
    
    if (query.bedNumber) {
      results = results.filter(bed => bed.bedNumber.toLowerCase().includes(query.bedNumber.toLowerCase()));
    }
    
    if (query.isActive !== undefined) {
      results = results.filter(bed => bed.isActive === query.isActive);
    }
    
    return results;
  }

  async findOne(query) {
    const results = await this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  async create(bedData) {
    const newBed = {
      bedId: `BED-${String(this.nextId).padStart(3, '0')}`,
      ...bedData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.beds.push(newBed);
    this.nextId++;
    
    return newBed;
  }

  async findByIdAndUpdate(bedId, updateData) {
    const bedIndex = this.beds.findIndex(bed => bed.bedId === bedId);
    
    if (bedIndex === -1) {
      return null;
    }
    
    this.beds[bedIndex] = {
      ...this.beds[bedIndex],
      ...updateData,
      updatedAt: new Date()
    };
    
    return this.beds[bedIndex];
  }

  async deleteOne(query) {
    const bedIndex = this.beds.findIndex(bed => {
      return Object.keys(query).every(key => bed[key] === query[key]);
    });
    
    if (bedIndex === -1) {
      return { deletedCount: 0 };
    }
    
    this.beds.splice(bedIndex, 1);
    return { deletedCount: 1 };
  }

  async countDocuments(query = {}) {
    const results = await this.find(query);
    return results.length;
  }

  async aggregate(pipeline) {
    let results = [...this.beds];
    
    for (const stage of pipeline) {
      if (stage.$match) {
        results = results.filter(bed => {
          return Object.keys(stage.$match).every(key => {
            if (key === 'ward.floor') {
              return bed.ward.floor === stage.$match[key];
            }
            return bed[key] === stage.$match[key];
          });
        });
      }
      
      if (stage.$group) {
        const grouped = {};
        results.forEach(bed => {
          let key;
          if (stage.$group._id === '$status') {
            key = bed.status;
          } else if (stage.$group._id === '$bedType') {
            key = bed.bedType;
          } else if (stage.$group._id === '$ward.wardName') {
            key = bed.ward.wardName;
          } else {
            key = 'all';
          }
          
          if (!grouped[key]) {
            grouped[key] = { 
              _id: key, 
              count: 0,
              totalRevenue: 0,
              averageOccupancy: 0
            };
          }
          
          grouped[key].count++;
          grouped[key].totalRevenue += bed.analytics?.totalRevenue || 0;
          grouped[key].averageOccupancy += bed.analytics?.occupancyRate || 0;
        });
        
        // Calculate averages
        Object.values(grouped).forEach(group => {
          group.averageOccupancy = group.averageOccupancy / group.count;
        });
        
        results = Object.values(grouped);
      }
    }
    
    return results;
  }
}

module.exports = MockBed;