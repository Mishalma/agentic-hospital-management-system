const express = require("express");
const Joi = require("joi");
const moment = require("moment");
const models = require("../models");
const { generateQRCode, sendConfirmation } = require("../utils/notifications");
const router = express.Router();

// Get models dynamically to ensure MongoDB connection
const getModels = () => {
  return {
    Appointment: models.Appointment,
    Patient: models.Patient,
  };
};

// Validation schema
const appointmentSchema = Joi.object({
  patientId: Joi.string().required(),
  doctor: Joi.string().required(),
  department: Joi.string().required(),
  slot: Joi.date().required().min("now"),
  symptoms: Joi.string().required().min(5).max(500),
  urgency: Joi.string().valid("low", "medium", "high").default("low"),
  channel: Joi.string()
    .valid("web", "kiosk", "whatsapp", "voice")
    .default("web"),
});

// Get available slots for a doctor
router.get("/slots/:doctor", async (req, res) => {
  try {
    const { Appointment } = getModels();
    const { doctor } = req.params;
    const { date } = req.query;

    const targetDate = date ? moment(date) : moment();
    if (!targetDate.isValid()) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    // Generate available slots (9 AM to 5 PM, 30-min intervals)
    const slots = [];
    const startHour = 9;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = moment(targetDate).hour(hour).minute(minute).second(0);
        if (slotTime.isAfter(moment())) {
          // Only future slots
          slots.push({
            time: slotTime.toDate(),
            available: Math.random() > 0.3, // Mock availability (70% available)
          });
        }
      }
    }

    // Get existing appointments for this doctor on this date
    const existingAppointments = await Appointment.findByDoctor(
      doctor,
      targetDate.toDate()
    );
    const bookedSlots = existingAppointments.map((apt) =>
      moment(apt.slot).format()
    );

    // Mark booked slots as unavailable
    slots.forEach((slot) => {
      if (bookedSlots.includes(moment(slot.time).format())) {
        slot.available = false;
      }
    });

    res.json({
      success: true,
      doctor,
      date: targetDate.format("YYYY-MM-DD"),
      slots: slots.filter((slot) => slot.available).slice(0, 20), // Return max 20 slots
    });
  } catch (error) {
    console.error("Slots fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Book appointment
router.post("/book", async (req, res) => {
  try {
    const { Appointment, Patient } = getModels();
    const { error, value } = appointmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((d) => d.message),
      });
    }

    // Verify patient exists
    const patient = await Patient.findById(value.patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Check slot availability
    const slotTime = moment(value.slot);
    const existingAppointments = await Appointment.findByDoctor(
      value.doctor,
      slotTime.toDate()
    );
    const isSlotTaken = existingAppointments.some(
      (apt) =>
        moment(apt.slot).format() === slotTime.format() &&
        apt.status !== "canceled"
    );

    if (isSlotTaken) {
      return res.status(409).json({
        success: false,
        message: "Selected slot is no longer available",
      });
    }

    // Create appointment
    const appointmentData = {
      patient: patient._id, // Use patient ObjectId for the patient field
      patientName: patient.name,
      ...value,
      status: "booked",
    };

    const appointment = await Appointment.create(appointmentData);

    // Generate QR code and send confirmation
    try {
      const qrCode = await generateQRCode(appointment.token);
      await sendConfirmation(patient, appointment, qrCode);
    } catch (notificationError) {
      console.error("Notification error:", notificationError);
      // Don't fail the appointment booking if notifications fail
    }

    // Emit real-time update
    const io = req.app.get("io");
    io.to("queue-updates").emit("appointment-booked", appointment.toPublic());
    io.to("admin-updates").emit("new-appointment", appointment.toPublic());

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment: appointment.toPublic(),
    });
  } catch (error) {
    console.error("Appointment booking error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get appointment by token
router.get("/token/:token", async (req, res) => {
  try {
    const appointment = await Appointment.findByToken(req.params.token);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({
      success: true,
      appointment: appointment.toPublic(),
    });
  } catch (error) {
    console.error("Appointment fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update appointment status
router.put("/:id/status", async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = [
      "booked",
      "queued",
      "in-progress",
      "completed",
      "canceled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    await appointment.updateStatus(status, notes);

    // Emit real-time update
    const io = req.app.get("io");
    io.to("queue-updates").emit("appointment-updated", appointment.toPublic());
    io.to("admin-updates").emit(
      "appointment-status-changed",
      appointment.toPublic()
    );

    res.json({
      success: true,
      message: "Appointment status updated",
      appointment: appointment.toPublic(),
    });
  } catch (error) {
    console.error("Appointment update error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get patient appointments
router.get("/patient/:patientId", async (req, res) => {
  try {
    const { status } = req.query;
    const appointments = await Appointment.findByPatient(
      req.params.patientId,
      status
    );

    res.json({
      success: true,
      appointments: appointments.map((apt) => apt.toPublic()),
    });
  } catch (error) {
    console.error("Patient appointments fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Integrated booking - Create patient and book appointment in one request
router.post("/book-integrated", async (req, res) => {
  console.log("[INTEGRATED BOOKING] Starting integrated booking process");
  console.log(
    "[INTEGRATED BOOKING] Request body:",
    JSON.stringify(req.body, null, 2)
  );

  try {
    const { Appointment, Patient } = getModels();
    const { patient: patientData, appointment: appointmentData } = req.body;

    if (!patientData || !appointmentData) {
      console.log("[INTEGRATED BOOKING] Missing patient or appointment data");
      return res.status(400).json({
        success: false,
        message: "Both patient and appointment data are required",
      });
    }

    // Validate required patient fields
    if (!patientData.name || !patientData.phone || !patientData.dob) {
      console.log("[INTEGRATED BOOKING] Missing required patient fields:", {
        hasName: !!patientData.name,
        hasPhone: !!patientData.phone,
        hasDob: !!patientData.dob,
      });
      return res.status(400).json({
        success: false,
        message: "Patient name, phone, and date of birth are required",
      });
    }

    // Validate required appointment fields
    if (
      !appointmentData.department ||
      !appointmentData.doctor ||
      !appointmentData.date ||
      !appointmentData.time ||
      !appointmentData.symptoms
    ) {
      console.log("[INTEGRATED BOOKING] Missing required appointment fields:", {
        hasDepartment: !!appointmentData.department,
        hasDoctor: !!appointmentData.doctor,
        hasDate: !!appointmentData.date,
        hasTime: !!appointmentData.time,
        hasSymptoms: !!appointmentData.symptoms,
      });
      return res.status(400).json({
        success: false,
        message: "Department, doctor, date, time, and symptoms are required",
      });
    }

    let patient;
    let isNewPatient = false;

    console.log(
      `[INTEGRATED BOOKING] Looking up patient by phone: ${patientData.phone}`
    );

    // Check if patient already exists by phone
    console.log('[INTEGRATED BOOKING] Checking patient existence with available methods:', {
      hasFindByPhoneFlexible: typeof Patient.findByPhoneFlexible === 'function',
      hasFindByPhone: typeof Patient.findByPhone === 'function',
      hasFindOne: typeof Patient.findOne === 'function',
      hasFind: typeof Patient.find === 'function'
    });

    const existingPatient = await (Patient.findByPhoneFlexible
      ? Patient.findByPhoneFlexible(patientData.phone)
      : Patient.findByPhone
      ? Patient.findByPhone(patientData.phone)
      : Patient.findOne
      ? Patient.findOne({ phone: patientData.phone })
      : Patient.find({ phone: patientData.phone })[0]);

    console.log(
      "[INTEGRATED BOOKING] Patient lookup result:",
      existingPatient ? `Found ${existingPatient.name}` : "Not found"
    );

    if (existingPatient) {
      patient = existingPatient;
      console.log(
        "[INTEGRATED BOOKING] Using existing patient:",
        patient.uniqueId || patient.id
      );
    } else {
      console.log("[INTEGRATED BOOKING] Creating new patient");
      // Create new patient
      console.log('[INTEGRATED BOOKING] Patient creation data:', JSON.stringify({
        ...patientData,
        channel: "web",
      }, null, 2));

      try {
        patient = await Patient.create({
          ...patientData,
          channel: "web",
        });
        isNewPatient = true;
        console.log(
          "[INTEGRATED BOOKING] Created new patient:",
          patient.uniqueId || patient.id
        );
        console.log('[INTEGRATED BOOKING] Patient object type:', typeof patient);
        console.log('[INTEGRATED BOOKING] Patient has _id:', !!patient._id);
        console.log('[INTEGRATED BOOKING] Patient has id:', !!patient.id);
      } catch (patientError) {
        console.error(
          "[INTEGRATED BOOKING] Patient creation error:",
          patientError
        );
        console.error(
          "[INTEGRATED BOOKING] Patient creation error stack:",
          patientError.stack
        );
        return res.status(500).json({
          success: false,
          message: "Failed to create patient record",
        });
      }
    }

    console.log(
      `[INTEGRATED BOOKING] Processing appointment for date: ${appointmentData.date}, time: ${appointmentData.time}`
    );

    // Convert appointment date and time to proper format
    const appointmentDateTime = moment(
      `${appointmentData.date} ${appointmentData.time}`,
      "YYYY-MM-DD hh:mm A"
    );

    console.log(
      `[INTEGRATED BOOKING] Parsed appointment datetime: ${appointmentDateTime.format()}`
    );
    console.log(
      `[INTEGRATED BOOKING] Is valid datetime: ${appointmentDateTime.isValid()}`
    );
    console.log(
      `[INTEGRATED BOOKING] Is before now: ${appointmentDateTime.isBefore(
        moment()
      )}`
    );

    if (
      !appointmentDateTime.isValid() ||
      appointmentDateTime.isBefore(moment())
    ) {
      console.log(
        "[INTEGRATED BOOKING] Invalid datetime or appointment in past"
      );
      return res.status(400).json({
        success: false,
        message: "Invalid appointment date/time or appointment is in the past",
      });
    }

    console.log(
      `[INTEGRATED BOOKING] Checking slot availability for doctor: ${appointmentData.doctor}`
    );

    // Check slot availability
    const existingAppointments = await (Appointment.findByDoctor
      ? Appointment.findByDoctor(
          appointmentData.doctor,
          appointmentDateTime.toDate()
        )
      : Appointment.find
      ? Appointment.find({
          doctor: appointmentData.doctor,
          slot: appointmentDateTime.toDate(),
        })
      : []);

    console.log(
      `[INTEGRATED BOOKING] Found ${existingAppointments.length} existing appointments for this slot`
    );

    const isSlotTaken = existingAppointments.some(
      (apt) =>
        moment(apt.slot).format() === appointmentDateTime.format() &&
        apt.status !== "canceled"
    );

    console.log(`[INTEGRATED BOOKING] Is slot taken: ${isSlotTaken}`);

    if (isSlotTaken) {
      console.log("[INTEGRATED BOOKING] Slot is taken, rejecting booking");
      return res.status(409).json({
        success: false,
        message: "Selected time slot is no longer available",
      });
    }

    console.log("[INTEGRATED BOOKING] Creating appointment");

    // Create appointment
    console.log('[INTEGRATED BOOKING] Patient data for appointment:', {
      uniqueId: patient.uniqueId,
      id: patient.id,
      _id: patient._id,
      name: patient.name
    });

    const appointmentPayload = {
      patient: patient._id, // Use patient ObjectId for the patient field
      patientName: patient.name,
      doctor: appointmentData.doctor,
      department: appointmentData.department,
      slot: appointmentDateTime.toDate(),
      symptoms: appointmentData.symptoms,
      urgency: appointmentData.urgency || "low",
      channel: "web",
      status: "booked",
    };

    console.log(
      "[INTEGRATED BOOKING] Appointment payload:",
      JSON.stringify(appointmentPayload, null, 2)
    );

    console.log('[INTEGRATED BOOKING] Checking Appointment model methods:', {
      hasCreate: typeof Appointment.create === 'function',
      hasFind: typeof Appointment.find === 'function',
      hasFindByDoctor: typeof Appointment.findByDoctor === 'function'
    });

    let appointment;
    try {
      appointment = await Appointment.create(appointmentPayload);
      console.log(
        "[INTEGRATED BOOKING] Created appointment:",
        appointment.token || appointment.id
      );
    } catch (appointmentError) {
      console.error(
        "[INTEGRATED BOOKING] Appointment creation error:",
        appointmentError
      );
      console.error(
        "[INTEGRATED BOOKING] Appointment creation error stack:",
        appointmentError.stack
      );
      return res.status(500).json({
        success: false,
        message: "Failed to create appointment",
      });
    }

    console.log(
      "[INTEGRATED BOOKING] Processing notifications and real-time updates"
    );

    // Generate QR code and send confirmation (optional)
    let smsStatus = "not_sent";
    try {
      if (generateQRCode && sendConfirmation) {
        console.log(
          "[INTEGRATED BOOKING] Generating QR code and sending confirmation"
        );
        const qrCode = await generateQRCode(
          appointment.token || appointment.id
        );
        await sendConfirmation(patient, appointment, qrCode);
        smsStatus = "sent";
        console.log("[INTEGRATED BOOKING] SMS sent successfully");
      } else {
        console.log(
          "[INTEGRATED BOOKING] QR code or sendConfirmation function not available"
        );
      }
    } catch (notificationError) {
      console.error(
        "[INTEGRATED BOOKING] Notification error:",
        notificationError
      );
      smsStatus = "failed";
      // Don't fail the booking if notifications fail
    }

    // Emit real-time updates
    try {
      const io = req.app.get("io");
      if (io) {
        console.log("[INTEGRATED BOOKING] Emitting real-time updates");
        const appointmentPublic = appointment.toPublic
          ? appointment.toPublic()
          : appointment;
        io.to("queue-updates").emit("appointment-booked", appointmentPublic);
        io.to("admin-updates").emit("new-appointment", appointmentPublic);
        console.log("[INTEGRATED BOOKING] Appointment updates emitted");

        if (isNewPatient) {
          const patientPublic = patient.toPublic ? patient.toPublic() : patient;
          io.to("admin-updates").emit("new-patient", patientPublic);
          console.log("[INTEGRATED BOOKING] New patient update emitted");
        }
      } else {
        console.log(
          "[INTEGRATED BOOKING] Socket.io not available, skipping real-time updates"
        );
      }
    } catch (socketError) {
      console.error("[INTEGRATED BOOKING] Socket emission error:", socketError);
      // Don't fail the booking if socket fails
    }

    console.log("[INTEGRATED BOOKING] Sending success response");
    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: {
        patient: patient.toPublic
          ? patient.toPublic()
          : {
              id: patient.id || patient._id,
              uniqueId: patient.uniqueId,
              name: patient.name,
              phone: patient.phone,
            },
        appointment: appointment.toPublic
          ? appointment.toPublic()
          : {
              id: appointment.id || appointment._id,
              token: appointment.token,
              patientId: appointment.patientId,
              doctor: appointment.doctor,
              department: appointment.department,
              slot: appointment.slot,
              status: appointment.status,
            },
        smsStatus,
        isNewPatient,
      },
    });
  } catch (error) {
    console.error("Integrated booking error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
});

module.exports = router;
