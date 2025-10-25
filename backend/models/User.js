const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    role: {
      type: String,
      required: true,
      enum: [
        "admin",
        "receptionist",
        "doctor",
        "nurse",
        "pharmacist",
        "lab_technician",
        "billing_staff",
        "hr_manager",
        "inventory_manager",
        "security_guard",
        "user",
      ],
      default: "receptionist",
    },
    department: {
      type: String,
      enum: [
        "administration",
        "emergency",
        "outpatient",
        "inpatient",
        "surgery",
        "laboratory",
        "pharmacy",
        "radiology",
        "billing",
      ],
    },
    permissions: [
      {
        module: {
          type: String,
          required: true,
        },
        actions: [
          {
            type: String,
            enum: ["create", "read", "update", "delete", "manage"],
          },
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Set default permissions based on role
userSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("role")) {
    this.permissions = getDefaultPermissions(this.role);
  }
  next();
});

function getDefaultPermissions(role) {
  const rolePermissions = {
    admin: [{ module: "all", actions: ["create", "read", "update", "delete", "manage"] }],
    receptionist: [
      { module: "appointments", actions: ["create", "read", "update"] },
      { module: "patients", actions: ["create", "read", "update"] },
      { module: "registration", actions: ["create", "read", "update"] },
      { module: "queue_management", actions: ["read", "update"] },
      { module: "billing", actions: ["read"] },
    ],
    doctor: [
      { module: "appointments", actions: ["read", "update"] },
      { module: "patients", actions: ["read", "update"] },
      { module: "medical_records", actions: ["create", "read", "update"] },
      { module: "prescriptions", actions: ["create", "read", "update"] },
      { module: "lab_results", actions: ["read"] },
      { module: "complaints", actions: ["read", "update"] },
    ],
    nurse: [
      { module: "patients", actions: ["read", "update"] },
      { module: "appointments", actions: ["read"] },
      { module: "medical_records", actions: ["read", "update"] },
      { module: "inventory", actions: ["read"] },
      { module: "queue_management", actions: ["read", "update"] },
    ],
    pharmacist: [
      { module: "prescriptions", actions: ["read", "update"] },
      { module: "inventory", actions: ["read", "update"] },
      { module: "patients", actions: ["read"] },
      { module: "billing", actions: ["create", "read"] },
    ],
    lab_technician: [
      { module: "lab_tests", actions: ["create", "read", "update"] },
      { module: "patients", actions: ["read"] },
      { module: "appointments", actions: ["read"] },
      { module: "inventory", actions: ["read"] },
    ],
    billing_staff: [
      { module: "billing", actions: ["create", "read", "update"] },
      { module: "patients", actions: ["read"] },
      { module: "appointments", actions: ["read"] },
      { module: "insurance", actions: ["create", "read", "update"] },
    ],
    hr_manager: [
      { module: "staff_management", actions: ["create", "read", "update"] },
      { module: "payroll", actions: ["create", "read", "update"] },
      { module: "scheduling", actions: ["create", "read", "update"] },
      { module: "reports", actions: ["read"] },
    ],
    inventory_manager: [
      { module: "inventory", actions: ["create", "read", "update", "delete"] },
      { module: "suppliers", actions: ["create", "read", "update"] },
      { module: "procurement", actions: ["create", "read", "update"] },
      { module: "reports", actions: ["read"] },
    ],
    security_guard: [
      { module: "visitor_management", actions: ["create", "read", "update"] },
      { module: "access_control", actions: ["read", "update"] },
      { module: "incidents", actions: ["create", "read"] },
    ],
    user: [
      { module: "kiosk", actions: ["read"] },
      { module: "patient_history", actions: ["read"] },
    ],
  };

  return rolePermissions[role] || [];
}

// Method to check if user has permission for a specific action on a module
userSchema.methods.hasPermission = function (module, action) {
  // Admin has access to everything
  if (this.role === "admin") return true;

  // Check specific permissions
  return this.permissions.some((permission) => {
    return (permission.module === module || permission.module === "all") && permission.actions.includes(action);
  });
};

module.exports = mongoose.model("User", userSchema);
