// Mock Vitals Model for demo mode
class MockVitals {
  constructor() {
    this.vitals = new Map();
    this.nextId = 1;
    this.seedData();
  }

  seedData() {
    // No sample vitals - empty initialization for testing
    this.nextId = 1;
  }

  async create(vitalsData) {
    const id = this.nextId.toString();
    this.nextId++;

    const newVitals = {
      id,
      ...vitalsData,
      alerts: this.detectAnomalies(vitalsData.vitals),
      status: "recorded",
      syncedToEMR: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.vitals.set(id, newVitals);
    return newVitals;
  }

  async findById(id) {
    return this.vitals.get(id) || null;
  }

  async find(query = {}) {
    let results = Array.from(this.vitals.values());

    // Apply filters
    if (query.patientId) {
      results = results.filter((v) => v.patientId === query.patientId);
    }
    if (query.nurseId) {
      results = results.filter((v) => v.nurseId === query.nurseId);
    }
    if (query.status) {
      results = results.filter((v) => v.status === query.status);
    }
    if (query.syncedToEMR !== undefined) {
      results = results.filter((v) => v.syncedToEMR === query.syncedToEMR);
    }

    // Sort by creation date (newest first)
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return results;
  }

  async findByPatient(patientId, limit = 10) {
    const results = await this.find({ patientId });
    return results.slice(0, limit);
  }

  async findByNurse(nurseId, limit = 50) {
    const results = await this.find({ nurseId });
    return results.slice(0, limit);
  }

  async findAbnormal() {
    const results = await this.find();
    return results.filter((v) => v.alerts.length > 0 && v.status !== "reviewed");
  }

  async findUnsyncedToEMR() {
    return await this.find({ syncedToEMR: false });
  }

  async findByIdAndUpdate(id, update) {
    const vital = this.vitals.get(id);
    if (!vital) return null;

    const updated = {
      ...vital,
      ...update,
      updatedAt: new Date(),
    };

    this.vitals.set(id, updated);
    return updated;
  }

  async deleteMany(query) {
    const results = await this.find(query);
    results.forEach((vital) => {
      this.vitals.delete(vital.id);
    });
    return { deletedCount: results.length };
  }

  detectAnomalies(vitals) {
    const alerts = [];

    // Blood pressure alerts
    if (vitals.bloodPressure && vitals.bloodPressure.systolic && vitals.bloodPressure.diastolic) {
      const sys = vitals.bloodPressure.systolic;
      const dia = vitals.bloodPressure.diastolic;

      if (sys >= 180 || dia >= 120) {
        alerts.push({
          type: "high_bp",
          message: `Critical hypertension: ${sys}/${dia}`,
          severity: "critical",
        });
      } else if (sys >= 140 || dia >= 90) {
        alerts.push({
          type: "high_bp",
          message: `High blood pressure: ${sys}/${dia}`,
          severity: "high",
        });
      } else if (sys < 90 || dia < 60) {
        alerts.push({
          type: "low_bp",
          message: `Low blood pressure: ${sys}/${dia}`,
          severity: "medium",
        });
      }
    }

    // Heart rate alerts
    if (vitals.heartRate) {
      if (vitals.heartRate > 100) {
        alerts.push({
          type: "high_hr",
          message: `Tachycardia: ${vitals.heartRate} bpm`,
          severity: vitals.heartRate > 120 ? "high" : "medium",
        });
      } else if (vitals.heartRate < 60) {
        alerts.push({
          type: "low_hr",
          message: `Bradycardia: ${vitals.heartRate} bpm`,
          severity: vitals.heartRate < 50 ? "high" : "medium",
        });
      }
    }

    // Temperature alerts
    if (vitals.temperature && vitals.temperature.value) {
      const temp = vitals.temperature.value;
      const unit = vitals.temperature.unit;

      // Convert to Fahrenheit for comparison
      const tempF = unit === "C" ? (temp * 9) / 5 + 32 : temp;

      if (tempF >= 103) {
        alerts.push({
          type: "fever",
          message: `High fever: ${temp}°${unit}`,
          severity: "high",
        });
      } else if (tempF >= 100.4) {
        alerts.push({
          type: "fever",
          message: `Fever: ${temp}°${unit}`,
          severity: "medium",
        });
      } else if (tempF < 95) {
        alerts.push({
          type: "low_temp",
          message: `Hypothermia: ${temp}°${unit}`,
          severity: "high",
        });
      }
    }

    // Oxygen saturation alerts
    if (vitals.oxygenSaturation) {
      if (vitals.oxygenSaturation < 90) {
        alerts.push({
          type: "low_oxygen",
          message: `Low oxygen saturation: ${vitals.oxygenSaturation}%`,
          severity: vitals.oxygenSaturation < 85 ? "critical" : "high",
        });
      }
    }

    return alerts;
  }

  getBMI(vitals) {
    const weight = vitals.weight;
    const height = vitals.height;

    if (!weight || !height || !weight.value || !height.value) {
      return null;
    }

    // Convert to metric for calculation
    let weightKg = weight.unit === "lbs" ? weight.value * 0.453592 : weight.value;
    let heightM = height.unit === "in" ? height.value * 0.0254 : height.value / 100;

    const bmi = weightKg / (heightM * heightM);
    return Math.round(bmi * 10) / 10;
  }
}

module.exports = MockVitals;
