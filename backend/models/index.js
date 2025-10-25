// Model factory that chooses between MongoDB and Mock models based on connection status
const mongoose = require("mongoose");

let Patient,
  Appointment,
  Complaint,
  User,
  Vitals,
  Triage,
  LabOrder,
  LabResult,
  Bill,
  BillingRate,
  Bed,
  Admission,
  BroughtDeadRecord,
  SecurityLog;
let modelsInitialized = false;

function initializeModels() {
  // Always use MongoDB models
  Patient = require("./Patient");
  Appointment = require("./Appointment");
  Complaint = require("./Complaint");
  User = require("./User");
  Vitals = require("./Vitals");
  Triage = require("./Triage");
  LabOrder = require("./LabOrder");
  LabResult = require("./LabResult");
  Bill = require("./Bill");
  BillingRate = require("./BillingRate");
  Bed = require("./Bed");
  Admission = require("./Admission");
  BroughtDeadRecord = require("./BroughtDeadRecord");
  SecurityLog = require("./SecurityLog");
  console.log("📊 Using MongoDB models");
  modelsInitialized = true;
  return {
    Patient,
    Appointment,
    Complaint,
    User,
    Vitals,
    Triage,
    LabOrder,
    LabResult,
    Bill,
    BillingRate,
    Bed,
    Admission,
    BroughtDeadRecord,
    SecurityLog,
  };
}

// Lazy initialization - don't initialize until first access
function getModels() {
  if (!modelsInitialized) {
    const models = initializeModels();
    Patient = models.Patient;
    Appointment = models.Appointment;
    Complaint = models.Complaint;
    User = models.User;
    Vitals = models.Vitals;
    Triage = models.Triage;
    LabOrder = models.LabOrder;
    LabResult = models.LabResult;
    Bill = models.Bill;
    BillingRate = models.BillingRate;
    Bed = models.Bed;
    Admission = models.Admission;
    BroughtDeadRecord = models.BroughtDeadRecord;
    SecurityLog = models.SecurityLog;
  }
  return {
    Patient,
    Appointment,
    Complaint,
    User,
    Vitals,
    Triage,
    LabOrder,
    LabResult,
    Bill,
    BillingRate,
    Bed,
    Admission,
    BroughtDeadRecord,
    SecurityLog,
  };
}

// Re-export with lazy loading
module.exports = {
  get Patient() {
    return getModels().Patient;
  },
  get Appointment() {
    return getModels().Appointment;
  },
  get Complaint() {
    return getModels().Complaint;
  },
  get User() {
    return getModels().User;
  },
  get Vitals() {
    return getModels().Vitals;
  },
  get Triage() {
    return getModels().Triage;
  },
  get LabOrder() {
    return getModels().LabOrder;
  },
  get LabResult() {
    return getModels().LabResult;
  },
  get Bill() {
    return getModels().Bill;
  },
  get BillingRate() {
    return getModels().BillingRate;
  },
  get Bed() {
    return getModels().Bed;
  },
  get Admission() {
    return getModels().Admission;
  },
  get BroughtDeadRecord() {
    return getModels().BroughtDeadRecord;
  },
  get SecurityLog() {
    return getModels().SecurityLog;
  },
  initializeModels, // Allow manual re-initialization
};
