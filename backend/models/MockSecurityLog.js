class MockSecurityLog {
  constructor() {
    this.logs = [
      {
        logId: "SEC-001",
        entryType: "visitor_checkin",
        timestamp: new Date("2024-01-20T09:00:00Z"),
        location: "Main Entrance",
        personDetails: {
          type: "visitor",
          name: "Rajesh Kumar",
          contactNumber: "+91-9876543210",
          purpose: "Patient Visit",
          visitingPatient: "John Doe",
          relationship: "Family Member",
        },
        accessControl: {
          badgeIssued: true,
          badgeNumber: "VST-2024-001",
          authorizedBy: "Reception Staff",
          accessLevel: "Visitor",
          areasAllowed: ["Waiting Area", "Patient Room 101"],
        },
        securityCheck: {
          idVerified: true,
          itemsChecked: true,
          prohibitedItems: [],
          notes: "ID verified. No prohibited items found.",
        },
        status: "active",
        checkoutTime: null,
        createdBy: "security_staff",
        createdAt: new Date("2024-01-20T09:00:00Z"),
        updatedAt: new Date("2024-01-20T09:00:00Z"),
      },
      {
        logId: "SEC-002",
        entryType: "staff_entry",
        timestamp: new Date("2024-01-20T08:30:00Z"),
        location: "Staff Entrance",
        personDetails: {
          type: "staff",
          employeeId: "EMP-001",
          name: "Dr. Smith",
          department: "Cardiology",
          designation: "Senior Consultant",
        },
        accessControl: {
          badgeIssued: false,
          badgeNumber: "EMP-001",
          authorizedBy: "System",
          accessLevel: "Medical Staff",
          areasAllowed: ["All Medical Areas", "Admin Offices"],
        },
        securityCheck: {
          idVerified: true,
          itemsChecked: true,
          prohibitedItems: [],
          notes: "Regular staff entry. All checks passed.",
        },
        status: "active",
        checkoutTime: null,
        createdBy: "system",
        createdAt: new Date("2024-01-20T08:30:00Z"),
        updatedAt: new Date("2024-01-20T08:30:00Z"),
      },
      {
        logId: "SEC-003",
        entryType: "incident_report",
        timestamp: new Date("2024-01-19T15:30:00Z"),
        location: "Parking Area",
        incidentDetails: {
          incidentType: "Suspicious Activity",
          severity: "Medium",
          description: "Unknown person observed taking photographs of hospital entrance",
          reportedBy: "Security Guard - Post 3",
          witnesses: ["Nurse Mary", "Patient Visitor"],
          actionsTaken: [
            "Individual approached and questioned",
            "Police notified",
            "CCTV footage reviewed",
            "Individual escorted out of premises",
          ],
          resolution: "Individual identified as journalist. Warning issued.",
          followUpRequired: false,
        },
        personDetails: {
          type: "unknown",
          description: "Male, approximately 35 years, carrying camera",
        },
        securityCheck: {
          investigationRequired: true,
          policeInvolved: true,
          reportFiled: true,
        },
        status: "resolved",
        createdBy: "security_staff",
        createdAt: new Date("2024-01-19T15:30:00Z"),
        updatedAt: new Date("2024-01-19T17:00:00Z"),
      },
      {
        logId: "SEC-004",
        entryType: "visitor_checkout",
        timestamp: new Date("2024-01-20T11:00:00Z"),
        location: "Main Entrance",
        personDetails: {
          type: "visitor",
          name: "Priya Sharma",
          contactNumber: "+91-9876543211",
          purpose: "Medical Consultation",
          visitingDoctor: "Dr. Johnson",
          relationship: "Patient",
        },
        accessControl: {
          badgeReturned: true,
          badgeNumber: "VST-2024-002",
          checkoutProcessedBy: "Reception Staff",
        },
        status: "completed",
        checkoutTime: new Date("2024-01-20T11:00:00Z"),
        duration: "2 hours 30 minutes",
        createdBy: "security_staff",
        createdAt: new Date("2024-01-20T08:30:00Z"),
        updatedAt: new Date("2024-01-20T11:00:00Z"),
      },
      {
        logId: "SEC-005",
        entryType: "emergency_access",
        timestamp: new Date("2024-01-20T02:15:00Z"),
        location: "Emergency Entrance",
        personDetails: {
          type: "emergency",
          description: "Ambulance crew with critical patient",
        },
        accessControl: {
          emergencyAccess: true,
          authorizedBy: "Emergency Staff",
          accessLevel: "Emergency",
          areasAllowed: ["Emergency Room", "ICU Access"],
        },
        securityCheck: {
          bypassed: true,
          reason: "Medical emergency - patient critical",
          notes: "Ambulance crew verified. Immediate access granted.",
        },
        status: "completed",
        createdBy: "emergency_staff",
        createdAt: new Date("2024-01-20T02:15:00Z"),
        updatedAt: new Date("2024-01-20T02:30:00Z"),
      },
    ];
    this.nextId = 6;
  }

  async find(query = {}) {
    let results = [...this.logs];

    if (query.entryType) {
      results = results.filter((log) => log.entryType === query.entryType);
    }

    if (query.status) {
      results = results.filter((log) => log.status === query.status);
    }

    if (query.location) {
      results = results.filter((log) => log.location === query.location);
    }

    if (query.timestamp) {
      if (query.timestamp.$gte) {
        results = results.filter((log) => new Date(log.timestamp) >= new Date(query.timestamp.$gte));
      }
      if (query.timestamp.$lte) {
        results = results.filter((log) => new Date(log.timestamp) <= new Date(query.timestamp.$lte));
      }
    }

    return results;
  }

  async findOne(query) {
    const results = await this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  async create(logData) {
    const newLog = {
      logId: `SEC-${String(this.nextId).padStart(3, "0")}`,
      ...logData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.logs.push(newLog);
    this.nextId++;

    return newLog;
  }

  async findByIdAndUpdate(logId, updateData) {
    const logIndex = this.logs.findIndex((log) => log.logId === logId);

    if (logIndex === -1) {
      return null;
    }

    this.logs[logIndex] = {
      ...this.logs[logIndex],
      ...updateData,
      updatedAt: new Date(),
    };

    return this.logs[logIndex];
  }

  async deleteOne(query) {
    const logIndex = this.logs.findIndex((log) => {
      return Object.keys(query).every((key) => log[key] === query[key]);
    });

    if (logIndex === -1) {
      return { deletedCount: 0 };
    }

    this.logs.splice(logIndex, 1);
    return { deletedCount: 1 };
  }

  async countDocuments(query = {}) {
    const results = await this.find(query);
    return results.length;
  }

  async aggregate(pipeline) {
    let results = [...this.logs];

    for (const stage of pipeline) {
      if (stage.$match) {
        results = results.filter((log) => {
          return Object.keys(stage.$match).every((key) => {
            if (key === "timestamp" && stage.$match[key].$gte) {
              return new Date(log.timestamp) >= new Date(stage.$match[key].$gte);
            }
            return log[key] === stage.$match[key];
          });
        });
      }

      if (stage.$group) {
        const grouped = {};
        results.forEach((log) => {
          let key;
          if (stage.$group._id === "$entryType") {
            key = log.entryType;
          } else if (stage.$group._id === "$status") {
            key = log.status;
          } else if (stage.$group._id === "$location") {
            key = log.location;
          } else {
            key = "all";
          }

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

module.exports = MockSecurityLog;
