class MockBroughtDeadRecord {
  constructor() {
    this.records = [
      {
        recordId: "BDR-001",
        patientId: "P003",
        patientInfo: {
          name: "Unknown Male",
          age: null,
          gender: "Male",
          phone: "Unknown",
          address: "Found at Railway Station",
          identification: "No identification found",
        },
        arrivalDetails: {
          arrivalDate: new Date("2024-01-20T08:15:00Z"),
          arrivalTime: "08:15",
          arrivedFrom: "Railway Station",
          broughtBy: "Railway Police",
          witnessPresent: true,
          witnessInfo: {
            name: "Constable Rajesh Kumar",
            designation: "Railway Protection Force",
            contact: "+91-9876543260",
          },
        },
        physicalExamination: {
          bodyCondition: "Decomposed",
          estimatedTimeOfDeath: "Approximately 12-18 hours ago",
          externalInjuries: ["Multiple blunt force trauma to head", "Fractured skull"],
          clothing: "Torn shirt and pants, no shoes",
          personalBelongings: ["Empty wallet", "Mobile phone (broken)"],
        },
        causeOfDeath: {
          primaryCause: "Blunt force trauma to head",
          secondaryCauses: [],
          mannerOfDeath: "Homicide",
          causeCode: "X99",
          confidence: "High",
          evidence: ["Skull fractures consistent with impact trauma", "No natural disease signs"],
        },
        policeDetails: {
          firNumber: "FIR/2024/00123",
          policeStation: "Railway Police Station",
          investigatingOfficer: "Inspector Sharma",
          contactNumber: "+91-9876543270",
          notificationSent: true,
          notificationTime: new Date("2024-01-20T09:00:00Z"),
        },
        medicalExamination: {
          examinedBy: "Dr. Patel",
          examinationDate: new Date("2024-01-20T09:30:00Z"),
          findings: "Multiple skull fractures, cerebral hemorrhage, no signs of natural disease",
          autopsyRequired: true,
          autopsyScheduled: new Date("2024-01-21T10:00:00Z"),
        },
        documentation: {
          deathCertificate: {
            issued: false,
            issuedDate: null,
            issuedBy: null,
          },
          policeReport: {
            submitted: true,
            submissionDate: new Date("2024-01-20T10:00:00Z"),
            referenceNumber: "PR/2024/00123",
          },
          authoritySubmission: {
            submitted: false,
            submissionDate: null,
            authority: "District Magistrate Office",
          },
        },
        status: "Under Investigation",
        priority: "High",
        notes: [
          {
            noteId: "NOTE-BDR-001",
            type: "Initial Assessment",
            content: "Body found at railway station with severe head trauma. Police notified.",
            author: "Dr. Patel",
            timestamp: new Date("2024-01-20T09:30:00Z"),
          },
        ],
        auditLog: [
          {
            action: "Record Created",
            performedBy: "Emergency Staff",
            timestamp: new Date("2024-01-20T08:30:00Z"),
            details: "Brought dead record created",
          },
          {
            action: "Police Notified",
            performedBy: "Emergency Staff",
            timestamp: new Date("2024-01-20T09:00:00Z"),
            details: "Railway police informed about unidentified body",
          },
        ],
        createdBy: "emergency_staff",
        createdAt: new Date("2024-01-20T08:30:00Z"),
        updatedAt: new Date("2024-01-20T10:00:00Z"),
      },
      {
        recordId: "BDR-002",
        patientId: "P004",
        patientInfo: {
          name: "Rajesh Verma",
          age: 55,
          gender: "Male",
          phone: "+91-9876543280",
          address: "789 Park Street, City",
          identification: "Driving license found",
        },
        arrivalDetails: {
          arrivalDate: new Date("2024-01-22T14:45:00Z"),
          arrivalTime: "14:45",
          arrivedFrom: "Home",
          broughtBy: "Family members",
          witnessPresent: true,
          witnessInfo: {
            name: "Mrs. Verma",
            designation: "Spouse",
            contact: "+91-9876543281",
          },
        },
        physicalExamination: {
          bodyCondition: "Cold, no signs of life",
          estimatedTimeOfDeath: "Approximately 2 hours ago",
          externalInjuries: ["None visible"],
          clothing: "Casual home wear",
          personalBelongings: ["Wedding ring", "Watch", "Wallet with ID"],
        },
        causeOfDeath: {
          primaryCause: "Cardiac arrest",
          secondaryCauses: ["Hypertension", "Coronary artery disease"],
          mannerOfDeath: "Natural",
          causeCode: "I46.9",
          confidence: "Medium",
          evidence: ["History of heart disease", "No external injuries", "Consistent with cardiac event"],
        },
        policeDetails: {
          firNumber: null,
          policeStation: null,
          investigatingOfficer: null,
          contactNumber: null,
          notificationSent: false,
          notificationTime: null,
        },
        medicalExamination: {
          examinedBy: "Dr. Singh",
          examinationDate: new Date("2024-01-22T15:15:00Z"),
          findings: "No external signs of violence. Consistent with natural cardiac death.",
          autopsyRequired: false,
          autopsyScheduled: null,
        },
        documentation: {
          deathCertificate: {
            issued: true,
            issuedDate: new Date("2024-01-22T16:00:00Z"),
            issuedBy: "Dr. Singh",
          },
          policeReport: {
            submitted: false,
            submissionDate: null,
            referenceNumber: null,
          },
          authoritySubmission: {
            submitted: true,
            submissionDate: new Date("2024-01-22T16:30:00Z"),
            authority: "Municipal Corporation",
          },
        },
        status: "Closed",
        priority: "Low",
        notes: [
          {
            noteId: "NOTE-BDR-002",
            type: "Final Assessment",
            content: "Natural death due to cardiac arrest. Family notified. Death certificate issued.",
            author: "Dr. Singh",
            timestamp: new Date("2024-01-22T16:00:00Z"),
          },
        ],
        auditLog: [
          {
            action: "Record Created",
            performedBy: "Emergency Staff",
            timestamp: new Date("2024-01-22T15:00:00Z"),
            details: "Brought dead record created for identified patient",
          },
          {
            action: "Death Certificate Issued",
            performedBy: "Dr. Singh",
            timestamp: new Date("2024-01-22T16:00:00Z"),
            details: "Death certificate issued for natural cause",
          },
        ],
        createdBy: "emergency_staff",
        createdAt: new Date("2024-01-22T15:00:00Z"),
        updatedAt: new Date("2024-01-22T16:30:00Z"),
      },
    ];
    this.nextId = 3;
  }

  async find(query = {}) {
    let results = [...this.records];

    if (query.status) {
      results = results.filter((record) => record.status === query.status);
    }

    if (query.priority) {
      results = results.filter((record) => record.priority === query.priority);
    }

    if (query.arrivalDetails) {
      if (query.arrivalDetails.arrivalDate) {
        if (query.arrivalDetails.arrivalDate.$gte) {
          results = results.filter(
            (record) => new Date(record.arrivalDetails.arrivalDate) >= new Date(query.arrivalDetails.arrivalDate.$gte)
          );
        }
        if (query.arrivalDetails.arrivalDate.$lte) {
          results = results.filter(
            (record) => new Date(record.arrivalDetails.arrivalDate) <= new Date(query.arrivalDetails.arrivalDate.$lte)
          );
        }
      }
    }

    return results;
  }

  async findOne(query) {
    const results = await this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  async create(recordData) {
    const newRecord = {
      recordId: `BDR-${String(this.nextId).padStart(3, "0")}`,
      ...recordData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.records.push(newRecord);
    this.nextId++;

    return newRecord;
  }

  async findByIdAndUpdate(recordId, updateData) {
    const recordIndex = this.records.findIndex((record) => record.recordId === recordId);

    if (recordIndex === -1) {
      return null;
    }

    this.records[recordIndex] = {
      ...this.records[recordIndex],
      ...updateData,
      updatedAt: new Date(),
    };

    return this.records[recordIndex];
  }

  async deleteOne(query) {
    const recordIndex = this.records.findIndex((record) => {
      return Object.keys(query).every((key) => record[key] === query[key]);
    });

    if (recordIndex === -1) {
      return { deletedCount: 0 };
    }

    this.records.splice(recordIndex, 1);
    return { deletedCount: 1 };
  }

  async countDocuments(query = {}) {
    const results = await this.find(query);
    return results.length;
  }

  async aggregate(pipeline) {
    let results = [...this.records];

    for (const stage of pipeline) {
      if (stage.$match) {
        results = results.filter((record) => {
          return Object.keys(stage.$match).every((key) => {
            if (key === "arrivalDetails.arrivalDate" && stage.$match[key].$gte) {
              return new Date(record.arrivalDetails.arrivalDate) >= new Date(stage.$match[key].$gte);
            }
            return record[key] === stage.$match[key];
          });
        });
      }

      if (stage.$group) {
        const grouped = {};
        results.forEach((record) => {
          let key;
          if (stage.$group._id === "$status") {
            key = record.status;
          } else if (stage.$group._id === "$causeOfDeath.mannerOfDeath") {
            key = record.causeOfDeath.mannerOfDeath;
          } else if (stage.$group._id === "$priority") {
            key = record.priority;
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

module.exports = MockBroughtDeadRecord;
