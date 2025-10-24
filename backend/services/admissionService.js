const { Bed, Admission } = require('../models');
const geminiConfig = require('../config/gemini');

class AdmissionService {
  // Create a new admission
  async createAdmission(admissionData) {
    try {
      // Generate unique admission ID if not provided
      if (!admissionData.admissionId) {
        admissionData.admissionId = `ADM-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      }

      // Set default values
      admissionData.status = admissionData.status || 'Pending';
      admissionData.admissionDate = admissionData.admissionDate || new Date();
      admissionData.priority = admissionData.priority || 'Normal';

      // Check bed availability if bed is specified
      if (admissionData.bedId) {
        const bed = await Bed.findById(admissionData.bedId);
        if (!bed || bed.status !== 'Available') {
          return { success: false, error: 'Bed not available' };
        }
      }

      const admission = await Admission.create(admissionData);

      // Update bed status if bed is assigned
      if (admissionData.bedId) {
        await Bed.findByIdAndUpdate(admissionData.bedId, {
          status: 'Occupied',
          currentPatient: admissionData.patientId
        });
      }

      return { success: true, data: admission };
    } catch (error) {
      console.error('Error creating admission:', error);
      return { success: false, error: error.message };
    }
  }

  // Get admissions with filtering
  async getAdmissions(filters = {}) {
    try {
      const query = {};

      if (filters.patientId) query.patientId = filters.patientId;
      if (filters.status) query.status = filters.status;
      if (filters.department) query.department = filters.department;

      const admissions = await Admission.find(query);
      return { success: true, data: admissions };
    } catch (error) {
      console.error('Error fetching admissions:', error);
      return { success: false, error: error.message };
    }
  }

  // Update admission status
  async updateAdmissionStatus(admissionId, status) {
    try {
      const admission = await Admission.findByIdAndUpdate(
        admissionId,
        { status, updatedAt: new Date() },
        { new: true }
      );

      if (!admission) {
        return { success: false, error: 'Admission not found' };
      }

      return { success: true, data: admission };
    } catch (error) {
      console.error('Error updating admission status:', error);
      return { success: false, error: error.message };
    }
  }

  // Discharge patient
  async dischargePatient(admissionId, dischargeData) {
    try {
      const admission = await Admission.findById(admissionId);
      if (!admission) {
        return { success: false, error: 'Admission not found' };
      }

      // Update admission with discharge information
      admission.status = 'Discharged';
      admission.dischargeDate = dischargeData.dischargeDate || new Date();
      admission.dischargeSummary = dischargeData.dischargeSummary;
      admission.dischargedBy = dischargeData.dischargedBy;

      await admission.save();

      // Free up the bed
      if (admission.bedId) {
        await Bed.findByIdAndUpdate(admission.bedId, {
          status: 'Available',
          currentPatient: null
        });
      }

      return { success: true, data: admission };
    } catch (error) {
      console.error('Error discharging patient:', error);
      return { success: false, error: error.message };
    }
  }

  // Get available beds
  async getAvailableBeds(filters = {}) {
    try {
      const query = { status: 'Available' };

      if (filters.department) query.department = filters.department;
      if (filters.bedType) query.bedType = filters.bedType;

      const beds = await Bed.find(query);
      return { success: true, data: beds };
    } catch (error) {
      console.error('Error fetching available beds:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AdmissionService();