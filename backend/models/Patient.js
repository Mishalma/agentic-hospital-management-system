const mongoose = require("mongoose");

// Patient Schema
const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    dob: {
      type: Date,
      required: [true, "Date of birth is required"],
      validate: {
        validator: function (value) {
          return value < new Date();
        },
        message: "Date of birth cannot be in the future",
      },
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          // Allow telegram_ prefixed numbers for external users
          if (v.startsWith("telegram_")) return true;
          return /^\+?[\d\s\-\(\)]{10,15}$/.test(v);
        },
        message: "Please enter a valid phone number",
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: "Please enter a valid email address",
      },
    },
    uniqueId: {
      type: String,
      unique: true,
      required: true,
    },
    insurance: {
      provider: String,
      policyNumber: String,
      groupNumber: String,
      expiryDate: Date,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    medicalHistory: [
      {
        condition: String,
        diagnosedDate: Date,
        status: {
          type: String,
          enum: ["active", "resolved", "chronic"],
          default: "active",
        },
        notes: String,
      },
    ],
    channel: {
      type: String,
      enum: ["web", "kiosk", "whatsapp", "telegram", "sms", "voice"],
      default: "web",
    },
    language: {
      type: String,
      enum: ["en", "hi", "ml", "ta", "te"],
      default: "en",
    },
    whatsappNumber: String,
    telegramChatId: String,
    preferences: {
      notifications: {
        sms: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        whatsapp: { type: Boolean, default: false },
        telegram: { type: Boolean, default: false },
      },
      appointmentReminders: {
        type: Number,
        default: 24, // hours before appointment
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
patientSchema.index({ phone: 1 });
patientSchema.index({ uniqueId: 1 });
patientSchema.index({ email: 1 });
patientSchema.index({ createdAt: -1 });

// Pre-validate middleware to generate uniqueId
patientSchema.pre("validate", function (next) {
  if (!this.uniqueId) {
    this.uniqueId = this.generateUniqueId();
  }
  next();
});

// Instance methods
patientSchema.methods.generateUniqueId = function () {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `PT${year}${random}`;
};

patientSchema.methods.toPublic = function () {
  const obj = this.toObject();
  return {
    id: obj._id,
    name: obj.name,
    uniqueId: obj.uniqueId,
    phone: obj.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"), // Mask phone
    email: obj.email ? obj.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : null, // Mask email
    createdAt: obj.createdAt,
    language: obj.language,
    channel: obj.channel,
  };
};

// Static methods
patientSchema.statics.findByUniqueId = function (uniqueId) {
  return this.findOne({ uniqueId: uniqueId });
};

patientSchema.statics.findByPhone = function (phone) {
  return this.findOne({ phone: phone });
};

patientSchema.statics.findByPhoneFlexible = async function (phone) {
  // Try exact match first
  let patient = await this.findByPhone(phone);
  if (patient) return patient;

  // Generate alternative formats
  const phoneFormats = [
    phone.replace(/[^\d+]/g, ""), // Remove all non-digits except +
    phone.replace(/[^\d]/g, ""), // Remove all non-digits
    "+91" + phone.replace(/^\+?91?/, ""), // Add +91 prefix
    phone.replace(/^\+91/, ""), // Remove +91 prefix
    phone.replace(/^\+/, ""), // Remove + prefix
  ];

  // Try each format
  for (const format of phoneFormats) {
    if (format && format !== phone) {
      patient = await this.findByPhone(format);
      if (patient) return patient;
    }
  }

  return null;
};

// Search patients by name (case-insensitive partial match)
patientSchema.statics.searchByName = function (name, limit = 20) {
  const searchRegex = new RegExp(name.trim(), "i"); // Case-insensitive regex
  return this.find({
    name: { $regex: searchRegex },
  })
    .select("name uniqueId phone email createdAt") // Only return necessary fields
    .sort({ name: 1 }) // Sort alphabetically
    .limit(limit);
};

// Virtual for age calculation
patientSchema.virtual("age").get(function () {
  if (!this.dob) return null;
  const today = new Date();
  const birthDate = new Date(this.dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
});

// Virtual for full name with title
patientSchema.virtual("displayName").get(function () {
  return `${this.name} (${this.uniqueId})`;
});

module.exports = mongoose.model("Patient", patientSchema);
