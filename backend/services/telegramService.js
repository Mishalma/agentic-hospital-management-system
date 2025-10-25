const TelegramBot = require("node-telegram-bot-api");
const { Patient, Appointment } = require("../models");
const { generateQRCode } = require("../utils/notifications");
const { getTranslation, getAvailableLanguages } = require("../utils/translations");

class TelegramService {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.bot = null;
    this.conversations = new Map();

    if (this.token && this.token !== "your-telegram-bot-token") {
      this.initializeBot();
    } else {
      console.log("⚠️  Telegram bot token not configured. Set TELEGRAM_BOT_TOKEN in .env");
    }
  }

  initializeBot() {
    try {
      this.bot = new TelegramBot(this.token, { polling: true });
      console.log("🤖 Telegram bot initialized successfully");

      this.setupMessageHandlers();
      this.setupCallbackHandlers();
    } catch (error) {
      console.error("❌ Failed to initialize Telegram bot:", error.message);
    }
  }

  setupMessageHandlers() {
    // Handle text messages
    this.bot.on("message", async (msg) => {
      try {
        if (msg.text && !msg.text.startsWith("/")) {
          await this.processMessage(msg.chat.id, msg.text, msg.from);
        }
      } catch (error) {
        console.error("Error handling message:", error);
        await this.sendMessage(
          msg.chat.id,
          this.t(msg.chat.id, "somethingWentWrong", "Sorry, something went wrong. Please try again.")
        );
      }
    });

    // Handle commands
    this.bot.onText(/\/start/, async (msg) => {
      await this.handleStartCommand(msg.chat.id, msg.from);
    });

    this.bot.onText(/\/book/, async (msg) => {
      await this.handleBookCommand(msg.chat.id, msg.from);
    });

    this.bot.onText(/\/help/, async (msg) => {
      await this.handleHelpCommand(msg.chat.id);
    });

    this.bot.onText(/\/language/, async (msg) => {
      await this.showLanguageSelection(msg.chat.id, msg.from);
    });

    this.bot.onText(/\/status (.+)/, async (msg, match) => {
      const token = match[1];
      await this.handleStatusCommand(msg.chat.id, token);
    });

    this.bot.onText(/\/complaint/, async (msg) => {
      await this.handleComplaintCommand(msg.chat.id, msg.from);
    });
  }

  setupCallbackHandlers() {
    // Handle inline keyboard callbacks
    this.bot.on("callback_query", async (callbackQuery) => {
      try {
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;

        await this.bot.answerCallbackQuery(callbackQuery.id);
        await this.processCallback(chatId, data, callbackQuery.from);
      } catch (error) {
        console.error("Error handling callback:", error);
      }
    });
  }

  async sendMessage(chatId, text, options = {}) {
    try {
      if (!this.bot) {
        console.log(`📱 Telegram Message to ${chatId}:`, text);
        return { success: true, messageId: "mock-" + Date.now() };
      }

      const result = await this.bot.sendMessage(chatId, text, {
        parse_mode: "HTML",
        ...options,
      });

      return { success: true, messageId: result.message_id };
    } catch (error) {
      console.error("Telegram send error:", error);
      return { success: false, error: error.message };
    }
  }

  async sendPhoto(chatId, photo, caption = "", options = {}) {
    try {
      if (!this.bot) {
        console.log(`📱 Telegram Photo to ${chatId}:`, { photo, caption });
        return { success: true, messageId: "mock-photo-" + Date.now() };
      }

      const result = await this.bot.sendPhoto(chatId, photo, {
        caption,
        parse_mode: "HTML",
        ...options,
      });

      return { success: true, messageId: result.message_id };
    } catch (error) {
      console.error("Telegram photo send error:", error);
      return { success: false, error: error.message };
    }
  }

  getConversationState(chatId) {
    if (!this.conversations.has(chatId)) {
      this.conversations.set(chatId, {
        state: "INITIAL",
        data: {},
        language: "en", // Default language
        lastActivity: new Date(),
      });
    }
    return this.conversations.get(chatId);
  }

  // Get user's preferred language
  getUserLanguage(chatId) {
    const conversation = this.getConversationState(chatId);
    return conversation.language || "en";
  }

  // Set user's language
  setUserLanguage(chatId, language) {
    const conversation = this.getConversationState(chatId);
    conversation.language = language;
    this.conversations.set(chatId, conversation);
  }

  // Get translated text
  t(chatId, key, fallback = null) {
    const language = this.getUserLanguage(chatId);
    return getTranslation(language, key, fallback);
  }

  updateConversationState(chatId, state, data = {}) {
    const conversation = this.getConversationState(chatId);
    conversation.state = state;
    conversation.data = { ...conversation.data, ...data };
    conversation.lastActivity = new Date();
    this.conversations.set(chatId, conversation);
  }

  async handleStartCommand(chatId, user) {
    // Check if user has selected language
    const conversation = this.getConversationState(chatId);

    if (!conversation.language || conversation.language === "en") {
      // Show language selection first
      await this.showLanguageSelection(chatId, user);
    } else {
      // Show main menu in user's language
      await this.showMainMenu(chatId, user);
    }
  }

  async showLanguageSelection(chatId, user) {
    const languages = getAvailableLanguages();

    // Create a more organized keyboard layout
    const keyboard = {
      inline_keyboard: [
        // First row: English and Hindi (most common)
        [
          { text: `🇺🇸 English`, callback_data: `lang_en` },
          { text: `🇮🇳 हिंदी`, callback_data: `lang_hi` },
        ],
        // Second row: South Indian languages
        [
          { text: `🇮🇳 മലയാളം`, callback_data: `lang_ml` },
          { text: `🇮🇳 தமிழ்`, callback_data: `lang_ta` },
        ],
        // Third row: Telugu
        [{ text: `🇮🇳 తెలుగు`, callback_data: `lang_te` }],
      ],
    };

    const welcomeText = `
╔═══════════════════════════════╗
║    🌍 LANGUAGE SELECTION      ║
╚═══════════════════════════════╝

🏥 <b>HealthTech Scheduler</b>
   <i>Your Health, Our Priority</i>

👋 Hello <b>${user.first_name}</b>!

🎯 <b>Choose your preferred language:</b>

┌─────────────────────────────┐
│ 🇮🇳 <b>Indian Languages</b>        │
├─────────────────────────────┤
│ • हिंदी                       │
│ • മലയാളം                 │
│ • தமிழ்                     │
│ • తెలుగు                    │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 🌐 <b>International</b>            │
├─────────────────────────────┤
│ • English        │
└─────────────────────────────┘

💡 <i>Tip: Change anytime with /language</i>
        `;

    await this.sendMessage(chatId, welcomeText, { reply_markup: keyboard });
    this.updateConversationState(chatId, "SELECT_LANGUAGE");
  }

  async showMainMenu(chatId, user) {
    const currentLang = this.getUserLanguage(chatId);
    const langNames = {
      en: "English 🇺🇸",
      hi: "हिंदी 🇮🇳",
      ml: "മലയാളം 🇮🇳",
      ta: "தமிழ் 🇮🇳",
      te: "తെలుగు 🇮🇳",
    };

    const welcomeText = `
╔═══════════════════════════════╗
║      🏥 SRM MEDICAL           ║
╚═══════════════════════════════╝

🎉 <b>${this.t(chatId, "welcome")}</b>

👋 ${this.t(chatId, "hello")} <b>${user.first_name}</b>!
   <i>${this.t(chatId, "readyToBook", "Ready to book your appointment?")}</i>

┌─────────────────────────────┐
│ 🌍 ${this.t(chatId, "language", "Language")}: ${langNames[currentLang]}     │
│ 🕒 ${this.t(chatId, "available", "Available")}: 24/7          │
│ 📱 ${this.t(chatId, "platform", "Platform")}: Telegram       │
└─────────────────────────────┘

🚀 <b>${this.t(chatId, "quickActions", "Quick Actions")}:</b>
• 📅 ${this.t(chatId, "bookNewAppointment", "Book new appointment")}
• 📋 ${this.t(chatId, "checkAppointmentStatus", "Check appointment status")}
• 🌍 ${this.t(chatId, "changeLanguage", "Change language")}
• ❓ ${this.t(chatId, "getHelpSupport", "Get help & support")}

💡 <i>${this.t(chatId, "tipUseBook", "Tip: Use /book for fastest booking!")}</i>
        `;

    const keyboard = {
      inline_keyboard: [
        [{ text: `📅 ${this.t(chatId, "bookAppointment")}`, callback_data: "start_booking" }],
        [
          { text: `📋 ${this.t(chatId, "checkStatus")}`, callback_data: "check_status" },
          { text: `❓ ${this.t(chatId, "help")}`, callback_data: "show_help" },
        ],
        [
          { text: `🌍 ${this.t(chatId, "language", "Language")}`, callback_data: "change_language" },
          { text: `📞 ${this.t(chatId, "contact", "Contact")}`, callback_data: "contact_info" },
        ],
        [{ text: `📝 ${this.t(chatId, "submitComplaint", "Submit Complaint")}`, callback_data: "submit_complaint" }],
      ],
    };

    await this.sendMessage(chatId, welcomeText, { reply_markup: keyboard });
    this.updateConversationState(chatId, "INITIAL");
  }

  async handleBookCommand(chatId, user) {
    await this.startBookingFlow(chatId, user);
  }

  async handleHelpCommand(chatId) {
    const currentLang = this.getUserLanguage(chatId);
    const langNames = {
      en: "English 🇺🇸",
      hi: "हिंदी 🇮🇳",
      ml: "മലയാളം 🇮🇳",
      ta: "தமிழ் 🇮🇳",
      te: "తెలుగు 🇮🇳",
    };

    const helpText = `
🆘 <b>HealthTech Scheduler Help</b>

🌍 <b>Current Language:</b> ${langNames[currentLang]}

<b>How to book an appointment:</b>
1. Type /book or click "${this.t(chatId, "bookAppointment")}"
2. Choose if you're a new or existing patient
3. Provide required information
4. Select doctor and time slot
5. Confirm your booking

<b>Available Commands:</b>
• /start - Start the bot and see main menu
• /book - ${this.t(chatId, "bookAppointment")}
• /language - 🌍 Change your language preference
• /help - Get help and support
• /status [token] - Check appointment (e.g., /status Q12345678)

<b>Supported Languages:</b>
🇺🇸 English | 🇮🇳 हिंदी | 🇮🇳 മലയാളം | 🇮🇳 தமிழ் | 🇮🇳 తెలుగు

<b>Need human assistance?</b>
📞 Call: (555) 123-4567
📧 Email: support@healthtech.com
🕒 Hours: Mon-Fri 8AM-6PM

The bot is available 24/7 for your convenience!
        `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: this.t(chatId, "bookAppointment"), callback_data: "start_booking" },
          { text: "🌍 Language", callback_data: "change_language" },
        ],
        [{ text: "🏠 Main Menu", callback_data: "main_menu" }],
      ],
    };

    await this.sendMessage(chatId, helpText, { reply_markup: keyboard });
  }

  async handleStatusCommand(chatId, token) {
    try {
      const appointment = await Appointment.findByToken(token.toUpperCase());

      if (!appointment) {
        await this.sendMessage(chatId, `❌ Appointment with token <b>${token}</b> not found.`);
        return;
      }

      const statusEmoji = {
        booked: "📅",
        queued: "⏳",
        "in-progress": "🏥",
        completed: "✅",
        canceled: "❌",
      };

      const statusText = `
${statusEmoji[appointment.status]} <b>Appointment Status</b>

🎫 <b>Token:</b> ${appointment.token}
👤 <b>Patient:</b> ${appointment.patientName}
👨‍⚕️ <b>Doctor:</b> ${appointment.doctor}
🏥 <b>Department:</b> ${appointment.department}
📅 <b>Date & Time:</b> ${new Date(appointment.slot).toLocaleString()}
📊 <b>Status:</b> ${appointment.status.toUpperCase()}
${appointment.room ? `🚪 <b>Room:</b> ${appointment.room}` : ""}

${appointment.status === "booked" ? "⏰ Please arrive 15 minutes early" : ""}
${appointment.status === "queued" ? "⏳ You're in the queue, please wait" : ""}
${appointment.status === "in-progress" ? "🏥 Currently with doctor" : ""}
      `;

      await this.sendMessage(chatId, statusText);
    } catch (error) {
      console.error("Status check error:", error);
      await this.sendMessage(chatId, "Sorry, there was an error checking your appointment status.");
    }
  }

  async handleLanguageSelection(chatId, data, user) {
    const languageCode = data.replace("lang_", "");
    const oldLanguage = this.getUserLanguage(chatId);
    this.setUserLanguage(chatId, languageCode);

    const langNames = {
      en: "English 🇺🇸",
      hi: "हिंदी 🇮🇳",
      ml: "മലയാളം 🇮🇳",
      ta: "தமிழ் 🇮🇳",
      te: "తెలుగు 🇮🇳",
    };

    const confirmationMessages = {
      en: "✅ Language set to English",
      hi: "✅ भाषा हिंदी में सेट की गई",
      ml: "✅ ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി",
      ta: "✅ மொழி தமிழுக்கு மாற்றப்பட்டது",
      te: "✅ భాష తెలుగుకు మార్చబడింది",
    };

    await this.sendMessage(
      chatId,
      `
╔═══════════════════════════════╗
║    ✅ LANGUAGE UPDATED        ║
╚═══════════════════════════════╝

${confirmationMessages[languageCode] || confirmationMessages["en"]}

🌍 <b>Language:</b> ${langNames[languageCode]}
🎉 <b>Status:</b> Successfully changed!

${this.t(chatId, "welcome")}

<i>Loading main menu...</i>
        `
    );

    // Show main menu in selected language after a brief delay
    setTimeout(() => {
      this.showMainMenu(chatId, user);
    }, 1500);
  }

  async handleCheckStatusRequest(chatId) {
    await this.sendMessage(
      chatId,
      `
📋 <b>${this.t(chatId, "checkStatus")}</b>

Please send your appointment token in this format:
<code>/status Q12345678</code>

Or type your token number directly (e.g., Q12345678)

${this.t(chatId, "needHelp")}
${this.t(chatId, "phone")}
        `
    );

    this.updateConversationState(chatId, "WAITING_FOR_TOKEN");
  }

  async showContactInfo(chatId) {
    const contactText = `
╔═══════════════════════════════╗
║      📞 CONTACT SUPPORT       ║
╚═══════════════════════════════╝

🏥 <b>HealthTech Scheduler Support</b>

┌─────────────────────────────┐
│ 📞 <b>Phone Support</b>         │
├─────────────────────────────┤
│ • Main: (555) 123-4567      │
│ • Emergency: (555) 911-0000 │
│ • WhatsApp: +91 9778393574  │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 📧 <b>Email Support</b>         │
├─────────────────────────────┤
│ • General: support@health.com│
│ • Appointments: book@health.com│
│ • Emergency: urgent@health.com│
└─────────────────────────────┘

┌─────────────────────────────┐
│ 🕒 <b>Operating Hours</b>       │
├─────────────────────────────┤
│ • Mon-Fri: 8:00 AM - 6:00 PM│
│ • Saturday: 9:00 AM - 4:00 PM│
│ • Sunday: Emergency only     │
│ • Bot: Available 24/7       │
└─────────────────────────────┘

🚨 <b>Emergency:</b> Call 108 or visit ER
💡 <b>Tip:</b> Use this bot for fastest service!
        `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: `📅 Book Appointment`, callback_data: "start_booking" },
          { text: `🏠 Main Menu`, callback_data: "main_menu" },
        ],
      ],
    };

    await this.sendMessage(chatId, contactText, { reply_markup: keyboard });
  }

  async startBookingFlow(chatId, user) {
    const text = `
╔═══════════════════════════════╗
║     📅 APPOINTMENT BOOKING    ║
╚═══════════════════════════════╝

👋 ${this.t(chatId, "hello")} <b>${user.first_name}</b>!

🎯 <b>${this.t(chatId, "patientTypeQuestion")}</b>

┌─────────────────────────────┐
│ 👤 New Patient             │
│ • First time with us        │
│ • Quick registration        │
│ • Get your Patient ID      │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 🔍 Existing Patient        │
│ • Already registered        │
│ • Use Patient ID or Phone   │
│ • Faster booking           │
└─────────────────────────────┘

💡 <i>Choose your option below:</i>
        `;

    const keyboard = {
      inline_keyboard: [
        [{ text: `👤 ${this.t(chatId, "newPatient")}`, callback_data: "new_patient" }],
        [{ text: `🔍 ${this.t(chatId, "existingPatient")}`, callback_data: "existing_patient" }],
        [{ text: `🏠 Back to Main Menu`, callback_data: "main_menu" }],
      ],
    };

    await this.sendMessage(chatId, text, { reply_markup: keyboard });
    this.updateConversationState(chatId, "PATIENT_TYPE_SELECTION", { user });
  }

  async processCallback(chatId, data, user) {
    console.log(`📱 Processing callback from ${chatId}:`, data);

    switch (data) {
      case "start_booking":
        await this.startBookingFlow(chatId, user);
        break;

      case "show_help":
        await this.handleHelpCommand(chatId);
        break;

      case "new_patient":
        await this.handleNewPatientFlow(chatId);
        break;

      case "existing_patient":
        await this.handleExistingPatientFlow(chatId);
        break;

      case "lookup_by_id":
        await this.handleLookupById(chatId);
        break;

      case "lookup_by_phone":
        await this.handleLookupByPhone(chatId);
        break;

      default:
        if (data.startsWith("doctor_")) {
          await this.handleDoctorSelection(chatId, data);
        } else if (data.startsWith("slot_")) {
          await this.handleSlotSelection(chatId, data);
        } else if (data === "confirm_booking") {
          await this.handleBookingConfirmation(chatId);
        } else if (data === "cancel_booking") {
          await this.handleBookingCancellation(chatId);
        } else if (data === "confirm_existing_patient") {
          await this.handleConfirmExistingPatient(chatId);
        } else if (data.startsWith("lang_")) {
          await this.handleLanguageSelection(chatId, data, user);
        } else if (data === "change_language") {
          await this.showLanguageSelection(chatId, user);
        } else if (data === "check_status") {
          await this.handleCheckStatusRequest(chatId);
        } else if (data === "main_menu") {
          await this.showMainMenu(chatId, user);
        } else if (data === "contact_info") {
          await this.showContactInfo(chatId);
        } else if (data === "submit_complaint") {
          await this.startComplaintFlow(chatId, user);
        } else if (data.startsWith("complaint_")) {
          const category = data.replace("complaint_", "");
          await this.handleComplaintCategorySelection(chatId, category);
        } else if (data === "confirm_complaint_submission") {
          await this.handleComplaintSubmission(chatId, user);
        } else if (data === "cancel_complaint") {
          await this.handleComplaintCancellation(chatId);
        }
        break;
    }
  }

  async processMessage(chatId, message, user) {
    const conversation = this.getConversationState(chatId);

    console.log(`📱 Processing message from ${chatId}:`, {
      message,
      currentState: conversation.state,
    });

    switch (conversation.state) {
      case "INITIAL":
        if (message.toLowerCase().includes("book") || message.toLowerCase().includes("appointment")) {
          await this.startBookingFlow(chatId, user);
        } else {
          await this.sendMessage(
            chatId,
            `${this.t(chatId, "hello")}! ${this.t(
              chatId,
              "typeBookHelp",
              "Type /book to start booking an appointment, or /help for assistance."
            )}`
          );
        }
        break;

      case "COLLECT_NEW_PATIENT_PHONE":
        await this.handleNewPatientPhone(chatId, message);
        break;

      case "COLLECT_NEW_PATIENT_NAME":
        await this.handleNewPatientName(chatId, message);
        break;

      case "COLLECT_NEW_PATIENT_DOB":
        await this.handleNewPatientDOB(chatId, message);
        break;

      case "COLLECT_NEW_PATIENT_EMAIL":
        await this.handleNewPatientEmail(chatId, message);
        break;

      case "SELECT_LOOKUP_METHOD":
        await this.sendMessage(
          chatId,
          this.t(chatId, "selectLookupMethod", "Please select a lookup method using the buttons above.")
        );
        break;

      case "COLLECT_EXISTING_PATIENT_ID":
        await this.handleExistingPatientId(chatId, message);
        break;

      case "COLLECT_EXISTING_PATIENT_PHONE":
        await this.handleExistingPatientPhone(chatId, message);
        break;

      case "SELECT_LANGUAGE":
        await this.sendMessage(chatId, this.t(chatId, "selectLanguage"));
        break;

      case "CONFIRM_EXISTING_PATIENT":
        await this.sendMessage(
          chatId,
          this.t(chatId, "useButtonsConfirm", "Please use the buttons above to confirm if this is your record.")
        );
        break;

      case "COLLECT_SYMPTOMS":
        await this.handleSymptoms(chatId, message);
        break;

      case "WAITING_FOR_TOKEN":
        await this.handleTokenInput(chatId, message);
        break;

      case "SELECT_COMPLAINT_CATEGORY":
        await this.sendMessage(
          chatId,
          this.t(chatId, "selectComplaintCategory", "Please select a complaint category using the buttons above.")
        );
        break;

      case "COLLECT_COMPLAINT_TITLE":
        await this.handleComplaintTitle(chatId, message);
        break;

      case "COLLECT_COMPLAINT_DESCRIPTION":
        await this.handleComplaintDescription(chatId, message);
        break;

      case "CONFIRM_COMPLAINT_SUBMISSION":
        await this.sendMessage(
          chatId,
          this.t(
            chatId,
            "useButtonsToConfirm",
            "Please use the buttons above to confirm or cancel your complaint submission."
          )
        );
        break;

      default:
        await this.sendMessage(
          chatId,
          this.t(chatId, "didntUnderstand", "I didn't understand that. Type /help for available commands.")
        );
        break;
    }
  }

  async handleNewPatientFlow(chatId) {
    await this.sendMessage(
      chatId,
      `
👤 <b>${this.t(chatId, "newPatient")}</b>

${this.t(chatId, "enterPhone")}
        `
    );

    this.updateConversationState(chatId, "COLLECT_NEW_PATIENT_PHONE");
  }

  async handleExistingPatientFlow(chatId) {
    const keyboard = {
      inline_keyboard: [
        [{ text: this.t(chatId, "patientId"), callback_data: "lookup_by_id" }],
        [{ text: this.t(chatId, "phoneNumber"), callback_data: "lookup_by_phone" }],
      ],
    };

    await this.sendMessage(
      chatId,
      `
🔍 <b>${this.t(chatId, "existingPatient")}</b>

${this.t(chatId, "lookupMethod")}
        `,
      { reply_markup: keyboard }
    );

    this.updateConversationState(chatId, "SELECT_LOOKUP_METHOD");
  }

  async handleNewPatientPhone(chatId, message) {
    // Format and validate phone number
    let phoneNumber = message.trim();

    // Remove all non-digit characters except +
    phoneNumber = phoneNumber.replace(/[^\d+]/g, "");

    // Validate basic format
    if (phoneNumber.length < 10) {
      await this.sendMessage(chatId, this.t(chatId, "invalidPhone"));
      return;
    }

    // Add +91 if it's a 10-digit number
    if (phoneNumber.length === 10 && !phoneNumber.startsWith("+")) {
      phoneNumber = "+91" + phoneNumber;
    }

    // Add + if it starts with 91 and is 12 digits
    if (phoneNumber.length === 12 && phoneNumber.startsWith("91")) {
      phoneNumber = "+" + phoneNumber;
    }

    try {
      // Check if phone number already exists
      const existingPatient = await Patient.findByPhoneFlexible(phoneNumber);
      if (existingPatient) {
        const keyboard = {
          inline_keyboard: [
            [{ text: this.t(chatId, "yesThatsMe"), callback_data: "confirm_existing_patient" }],
            [{ text: this.t(chatId, "noDifferent"), callback_data: "new_patient" }],
          ],
        };

        this.updateConversationState(chatId, "CONFIRM_EXISTING_PATIENT", {
          existingPatient: existingPatient, // Keep the full Mongoose document with _id
          phoneNumber: phoneNumber,
        });

        await this.sendMessage(
          chatId,
          `
🔍 <b>${this.t(chatId, "patientFound")}</b>

${this.t(chatId, "foundExistingPatient", "We found an existing patient with this phone number:")}

👤 <b>${this.t(chatId, "name", "Name")}:</b> ${existingPatient.name}
🆔 <b>${this.t(chatId, "patientIdLabel")}</b> ${existingPatient.uniqueId}
📅 <b>${this.t(chatId, "registeredLabel")}</b> ${new Date(existingPatient.createdAt).toLocaleDateString("en-IN")}

${this.t(chatId, "isThisYou")}
                `,
          { reply_markup: keyboard }
        );
        return;
      }

      // Phone number is new, continue with registration
      this.updateConversationState(chatId, "COLLECT_NEW_PATIENT_NAME", {
        phoneNumber: phoneNumber,
      });

      await this.sendMessage(
        chatId,
        `
✅ <b>${this.t(chatId, "phoneConfirmed", "Phone Number Confirmed")}</b>

${this.t(chatId, "phone", "Phone")}: <code>${phoneNumber}</code>

${this.t(chatId, "enterName")}
      `
      );
    } catch (error) {
      console.error("Phone validation error:", error);
      await this.sendMessage(
        chatId,
        `
❌ <b>${this.t(chatId, "validationError", "Validation Error")}</b>

${this.t(chatId, "phoneValidationError", "Sorry, there was an error validating your phone number. Please try again.")}
      `
      );
    }
  }

  async handleNewPatientName(chatId, message) {
    if (message.trim().length < 2) {
      await this.sendMessage(chatId, this.t(chatId, "invalidName"));
      return;
    }

    this.updateConversationState(chatId, "COLLECT_NEW_PATIENT_DOB", { name: message.trim() });

    await this.sendMessage(
      chatId,
      `
${this.t(chatId, "great", "Great!")} ${this.t(chatId, "hello")} <b>${message.trim()}</b> 👋

${this.t(chatId, "enterDob")}
    `
    );
  }

  async handleNewPatientDOB(chatId, message) {
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(message.trim())) {
      await this.sendMessage(chatId, this.t(chatId, "invalidDob"));
      return;
    }

    const dob = new Date(message.trim());
    if (dob > new Date()) {
      await this.sendMessage(
        chatId,
        this.t(chatId, "dobFutureError", "Date of birth cannot be in the future. Please try again.")
      );
      return;
    }

    this.updateConversationState(chatId, "COLLECT_NEW_PATIENT_EMAIL", { dob: message.trim() });

    await this.sendMessage(
      chatId,
      `
${this.t(chatId, "perfect", "Perfect!")} 📅

${this.t(chatId, "enterEmail")}
    `
    );
  }

  async handleNewPatientEmail(chatId, message) {
    let email = null;

    if (message.toLowerCase() !== this.t(chatId, "skip").toLowerCase()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(message.trim())) {
        await this.sendMessage(chatId, this.t(chatId, "invalidEmail"));
        return;
      }
      email = message.trim();
    }

    // Create patient record
    try {
      const conversation = this.getConversationState(chatId);
      const patientData = {
        name: conversation.data.name,
        dob: conversation.data.dob,
        phone: conversation.data.phoneNumber || `telegram_${chatId}`,
        email: email,
        channel: "telegram",
        language: this.getUserLanguage(chatId),
      };

      const patient = await Patient.create(patientData);

      this.updateConversationState(chatId, "COLLECT_SYMPTOMS", {
        patient: patient, // Keep the full Mongoose document with _id
        email: email,
      });

      await this.sendMessage(
        chatId,
        `
✅ <b>${this.t(chatId, "registrationComplete", "Registration Complete!")}</b>

${this.t(chatId, "yourPatientId", "Your Patient ID")}: <b>${patient.uniqueId}</b>
<i>${this.t(chatId, "saveIdFuture", "Please save this ID for future appointments")}</i>

${this.t(chatId, "enterSymptoms")}
      `
      );
    } catch (error) {
      console.error("Patient creation error:", error);
      await this.sendMessage(
        chatId,
        this.t(
          chatId,
          "registrationError",
          "Sorry, there was an error creating your patient record. Please try again with /book"
        )
      );
      this.updateConversationState(chatId, "INITIAL");
    }
  }

  async handleLookupById(chatId) {
    await this.sendMessage(
      chatId,
      `
🆔 <b>${this.t(chatId, "patientIdLookup", "Patient ID Lookup")}</b>

${this.t(chatId, "providePatientId", "Please provide your Patient ID.")}

${this.t(chatId, "formatPT", "Format: PT followed by 10 digits")}
${this.t(chatId, "examplePT", "Example: PT2024123456")}

<i>${this.t(
        chatId,
        "findIdLocation",
        "You can find your Patient ID on previous appointment confirmations or discharge papers."
      )}</i>
    `
    );

    this.updateConversationState(chatId, "COLLECT_EXISTING_PATIENT_ID");
  }

  async handleLookupByPhone(chatId) {
    await this.sendMessage(
      chatId,
      `
📱 <b>${this.t(chatId, "phoneNumberLookup", "Phone Number Lookup")}</b>

${this.t(chatId, "provideRegisteredPhone", "Please provide your registered phone number.")}

${this.t(chatId, "formatIncludeCountry", "Format: Include country code")}
${this.t(chatId, "phoneExamples", "Examples:")} 
• +91 9778393574
• +919778393574
• 9778393574

<i>${this.t(chatId, "phoneUsedRegistering", "This should be the phone number you used when registering.")}</i>
    `
    );

    this.updateConversationState(chatId, "COLLECT_EXISTING_PATIENT_PHONE");
  }

  async handleExistingPatientId(chatId, message) {
    const patientIdRegex = /^PT\d{10}$/;
    if (!patientIdRegex.test(message.trim().toUpperCase())) {
      await this.sendMessage(
        chatId,
        `
Please provide a valid Patient ID format:

<b>PT</b> followed by 10 digits
Example: PT2024123456

Or type /book to register as a new patient.
      `
      );
      return;
    }

    try {
      const patient = await Patient.findByUniqueId(message.trim().toUpperCase());
      if (!patient) {
        await this.sendMessage(
          chatId,
          `
❌ Patient ID not found.

Please check your ID or register as a new patient by typing /book and selecting "New Patient".
        `
        );
        this.updateConversationState(chatId, "INITIAL");
        return;
      }

      this.updateConversationState(chatId, "COLLECT_SYMPTOMS", {
        patient: patient, // Keep the full Mongoose document with _id
      });

      await this.sendMessage(
        chatId,
        `
✅ Welcome back, <b>${patient.name}</b>!

Please describe your symptoms or reason for this visit:
      `
      );
    } catch (error) {
      console.error("Patient lookup error:", error);
      await this.sendMessage(chatId, "Sorry, there was an error looking up your patient record. Please try again.");
    }
  }

  async handleExistingPatientPhone(chatId, message) {
    // Format phone number
    let phoneNumber = message.trim();

    // Remove all non-digit characters except +
    phoneNumber = phoneNumber.replace(/[^\d+]/g, "");

    // Add +91 if it's a 10-digit number
    if (phoneNumber.length === 10 && !phoneNumber.startsWith("+")) {
      phoneNumber = "+91" + phoneNumber;
    }

    // Add + if it starts with 91 and is 12 digits
    if (phoneNumber.length === 12 && phoneNumber.startsWith("91")) {
      phoneNumber = "+" + phoneNumber;
    }

    try {
      let patient = await Patient.findByPhoneFlexible(phoneNumber);

      // Also try telegram-specific format
      if (!patient) {
        patient = await Patient.findByPhone(`telegram_${chatId}`);
      }

      if (!patient) {
        const keyboard = {
          inline_keyboard: [
            [{ text: "🆔 Try Patient ID", callback_data: "lookup_by_id" }],
            [{ text: "👤 Register as New Patient", callback_data: "new_patient" }],
          ],
        };

        await this.sendMessage(
          chatId,
          `
❌ <b>Patient Not Found</b>

No patient record found with phone number: <code>${phoneNumber}</code>

This could happen if:
• You used a different phone number when registering
• You haven't registered with us before
• The number format is different

What would you like to do?
          `,
          { reply_markup: keyboard }
        );
        return;
      }

      this.updateConversationState(chatId, "COLLECT_SYMPTOMS", {
        patient: patient, // Keep the full Mongoose document with _id
      });

      await this.sendMessage(
        chatId,
        `
✅ <b>Welcome back, ${patient.name}!</b>

📋 <b>Patient Details:</b>
• Patient ID: <code>${patient.uniqueId}</code>
• Phone: ${patient.phone}
• Registered: ${new Date(patient.createdAt).toLocaleDateString("en-IN")}

Please describe your symptoms or reason for this visit:
      `
      );
    } catch (error) {
      console.error("Patient phone lookup error:", error);
      await this.sendMessage(
        chatId,
        `
❌ <b>Lookup Error</b>

Sorry, there was an error looking up your patient record. 

Please try again or contact our support team at (555) 123-4567.
      `
      );
    }
  }

  async handleSymptoms(chatId, message) {
    if (message.trim().length < 5) {
      await this.sendMessage(chatId, "Please provide more details about your symptoms (at least 5 characters).");
      return;
    }

    this.updateConversationState(chatId, "SELECT_DOCTOR", { symptoms: message.trim() });

    const keyboard = {
      inline_keyboard: [
        [{ text: "👨‍⚕️ Dr. Sarah Johnson (General Medicine)", callback_data: "doctor_johnson" }],
        [{ text: "❤️ Dr. Michael Chen (Cardiology)", callback_data: "doctor_chen" }],
        [{ text: "👶 Dr. Emily Rodriguez (Pediatrics)", callback_data: "doctor_rodriguez" }],
        [{ text: "🦴 Dr. David Kim (Orthopedics)", callback_data: "doctor_kim" }],
      ],
    };

    await this.sendMessage(
      chatId,
      `
╔═══════════════════════════════╗
║      👨‍⚕️ DOCTOR SELECTION      ║
╚═══════════════════════════════╝

🎯 <b>${this.t(chatId, "selectDoctor")}</b>

📝 <b>Your Symptoms:</b> <i>"${message.trim()}"</i>

┌─────────────────────────────┐
│ 🏥 <b>Available Doctors</b>      │
├─────────────────────────────┤
│ 👨‍⚕️ General Medicine        │
│ ❤️ Cardiology               │
│ 👶 Pediatrics               │
│ 🦴 Orthopedics              │
└─────────────────────────────┘

💡 <i>Select the most suitable doctor:</i>
        `,
      { reply_markup: keyboard }
    );
  }

  async handleDoctorSelection(chatId, data) {
    console.log(`🔍 Doctor selection for chat ${chatId}:`, data);

    const doctorMap = {
      doctor_johnson: { name: "Dr. Sarah Johnson", department: "General Medicine" },
      doctor_chen: { name: "Dr. Michael Chen", department: "Cardiology" },
      doctor_rodriguez: { name: "Dr. Emily Rodriguez", department: "Pediatrics" },
      doctor_kim: { name: "Dr. David Kim", department: "Orthopedics" },
    };

    const selectedDoctor = doctorMap[data];
    if (!selectedDoctor) {
      console.log(`❌ Unknown doctor selection: ${data}`);
      return;
    }

    console.log(`✅ Selected doctor: ${selectedDoctor.name}`);

    this.updateConversationState(chatId, "SELECT_SLOT", {
      doctor: selectedDoctor.name,
      department: selectedDoctor.department,
    });

    // Generate available slots
    const slots = this.generateAvailableSlots();
    console.log(`📅 Generated ${slots.length} slots:`, slots);

    if (slots.length === 0) {
      await this.sendMessage(
        chatId,
        `
❌ <b>No Available Slots</b>

Sorry, no slots are available for ${selectedDoctor.name} at the moment.

Please try again later or contact our support team at (555) 123-4567.
      `
      );
      return;
    }

    const keyboard = {
      inline_keyboard: slots
        .slice(0, 6)
        .map((slot, index) => [{ text: `🕐 ${slot.display}`, callback_data: `slot_${index}` }]),
    };

    console.log(`📱 Sending slots keyboard with ${keyboard.inline_keyboard.length} buttons`);

    await this.sendMessage(
      chatId,
      `
📅 <b>Available Slots for ${selectedDoctor.name}</b>

Please select your preferred time:
    `,
      { reply_markup: keyboard }
    );
  }

  async handleSlotSelection(chatId, data) {
    const slotIndex = parseInt(data.split("_")[1]);
    const slots = this.generateAvailableSlots();
    const selectedSlot = slots[slotIndex];

    if (!selectedSlot) return;

    this.updateConversationState(chatId, "CONFIRM_BOOKING", {
      slot: selectedSlot.time,
      slotDisplay: selectedSlot.display,
    });

    const conversation = this.getConversationState(chatId);
    const { patient, doctor, department, symptoms } = conversation.data;

    const keyboard = {
      inline_keyboard: [
        [{ text: "✅ Confirm Booking", callback_data: "confirm_booking" }],
        [{ text: "❌ Cancel", callback_data: "cancel_booking" }],
      ],
    };

    await this.sendMessage(
      chatId,
      `
📋 <b>Booking Summary</b>

👤 <b>Patient:</b> ${patient.name}
👨‍⚕️ <b>Doctor:</b> ${doctor}
🏥 <b>Department:</b> ${department}
📅 <b>Time:</b> ${selectedSlot.display}
💬 <b>Symptoms:</b> ${symptoms}

Please confirm your appointment:
    `,
      { reply_markup: keyboard }
    );
  }

  async handleBookingConfirmation(chatId) {
    try {
      const conversation = this.getConversationState(chatId);
      const { patient, doctor, department, symptoms, slot } = conversation.data;

      // Create appointment
      const appointmentData = {
        patient: patient._id || patient.id, // MongoDB ObjectId reference
        patientName: patient.name,
        doctor: doctor,
        department: department,
        slot: new Date(slot),
        symptoms: symptoms,
        urgency: "medium",
        channel: "telegram",
      };

      const appointment = await Appointment.create(appointmentData);

      // Generate QR code
      const qrCode = await generateQRCode(appointment.token);

      // Send confirmation
      await this.sendMessage(
        chatId,
        `
╔═══════════════════════════════╗
║    ✅ BOOKING CONFIRMED!      ║
╚═══════════════════════════════╝

🎉 <b>${this.t(chatId, "appointmentConfirmed")}</b>

┌─────────────────────────────┐
│ 📋 <b>Appointment Details</b>    │
├─────────────────────────────┤
│ 🎫 Token: <code>${appointment.token}</code>     │
│ 📅 Date: ${new Date(slot).toLocaleDateString("en-IN")}   │
│ 🕒 Time: ${new Date(slot).toLocaleTimeString("en-IN")}   │
│ 👨‍⚕️ Doctor: ${doctor}          │
│ 🏥 Dept: ${department}          │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 📱 <b>Important Instructions</b> │
├─────────────────────────────┤
│ ⏰ Arrive 15 minutes early   │
│ 🆔 Bring valid ID & insurance│
│ 🎫 Show token at reception   │
│ 📱 Keep this message saved   │
└─────────────────────────────┘

🔲 <b>QR Code sending...</b>
            `
      );

      // Send QR code as image
      if (qrCode) {
        // Convert base64 to buffer
        const qrBuffer = Buffer.from(qrCode.split(",")[1], "base64");

        await this.sendPhoto(
          chatId,
          qrBuffer,
          `
╔═══════════════════════════════╗
║       🔲 YOUR QR CODE         ║
╚═══════════════════════════════╝

🎫 <b>Token:</b> <code>${appointment.token}</code>

┌─────────────────────────────┐
│ 📱 <b>How to Use</b>             │
├─────────────────────────────┤
│ 1. Show this QR at reception│
│ 2. Or tell them your token  │
│ 3. Arrive 15 mins early     │
└─────────────────────────────┘

🆘 <b>Need help?</b> /help or call (555) 123-4567

🎉 <b>Thank you for choosing HealthTech!</b>
                `
        );
      }

      // Reset conversation
      this.updateConversationState(chatId, "INITIAL");

      console.log("📡 Telegram booking completed:", appointment.toPublic());
    } catch (error) {
      console.error("Booking finalization error:", error);
      await this.sendMessage(chatId, "Sorry, there was an error finalizing your booking. Please try again with /book");
      this.updateConversationState(chatId, "INITIAL");
    }
  }

  async handleBookingCancellation(chatId) {
    await this.sendMessage(
      chatId,
      `
❌ <b>Booking Cancelled</b>

No problem! You can start over anytime by typing /book

Need help? Type /help for assistance.
    `
    );

    this.updateConversationState(chatId, "INITIAL");
  }

  generateAvailableSlots() {
    const slots = [];
    const now = new Date();
    const startHour = 9;
    const endHour = 17;

    // Try today first
    let targetDate = new Date(now);

    // Generate slots for today
    for (let hour = startHour; hour < endHour; hour += 2) {
      const slotTime = new Date(targetDate);
      slotTime.setHours(hour, 0, 0, 0);

      if (slotTime > now) {
        slots.push({
          time: slotTime.toISOString(),
          display: `Today ${slotTime.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}`,
        });
      }
    }

    // If no slots available today, generate for tomorrow
    if (slots.length === 0) {
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 1);

      for (let hour = startHour; hour < endHour; hour += 2) {
        const slotTime = new Date(targetDate);
        slotTime.setHours(hour, 0, 0, 0);

        slots.push({
          time: slotTime.toISOString(),
          display: `Tomorrow ${slotTime.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}`,
        });
      }
    }

    // Always ensure we have at least some demo slots
    if (slots.length === 0) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const demoSlots = [
        { hour: 10, minute: 0 },
        { hour: 12, minute: 0 },
        { hour: 14, minute: 0 },
        { hour: 16, minute: 0 },
      ];

      demoSlots.forEach(({ hour, minute }) => {
        const slotTime = new Date(tomorrow);
        slotTime.setHours(hour, minute, 0, 0);

        slots.push({
          time: slotTime.toISOString(),
          display: `Tomorrow ${slotTime.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}`,
        });
      });
    }

    return slots.slice(0, 6); // Return max 6 slots for better UI
  }

  // Get bot info
  async getBotInfo() {
    try {
      if (!this.bot) return null;
      return await this.bot.getMe();
    } catch (error) {
      console.error("Get bot info error:", error);
      return null;
    }
  }

  // Get conversation analytics
  getAnalytics() {
    const stats = {
      totalConversations: this.conversations.size,
      activeConversations: 0,
      stateBreakdown: {},
    };

    for (const [chatId, conversation] of this.conversations.entries()) {
      const timeSinceLastActivity = Date.now() - conversation.lastActivity.getTime();
      if (timeSinceLastActivity < 30 * 60 * 1000) {
        // 30 minutes
        stats.activeConversations++;
      }

      const state = conversation.state;
      stats.stateBreakdown[state] = (stats.stateBreakdown[state] || 0) + 1;
    }

    return stats;
  }

  // Clean up old conversations
  cleanupOldConversations() {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour

    for (const [chatId, conversation] of this.conversations.entries()) {
      if (conversation.lastActivity < cutoff) {
        this.conversations.delete(chatId);
      }
    }
  }

  async handleTokenInput(chatId, message) {
    const token = message.trim().toUpperCase();

    // Validate token format (Q followed by 8 digits)
    if (!/^Q\d{8}$/.test(token)) {
      await this.sendMessage(
        chatId,
        `
❌ <b>Invalid Token Format</b>

Please provide a valid token in format: Q12345678

Example: Q12341234

Or use: <code>/status Q12345678</code>
            `
      );
      return;
    }

    // Check appointment status
    await this.handleStatusCommand(chatId, token);
    this.updateConversationState(chatId, "INITIAL");
  }

  async handleConfirmExistingPatient(chatId) {
    try {
      const conversation = this.getConversationState(chatId);
      const { existingPatient } = conversation.data;

      if (!existingPatient) {
        await this.sendMessage(chatId, "Error: Patient data not found. Please start over with /book");
        this.updateConversationState(chatId, "INITIAL");
        return;
      }

      this.updateConversationState(chatId, "COLLECT_SYMPTOMS", {
        patient: existingPatient,
      });

      await this.sendMessage(
        chatId,
        `
✅ <b>${this.t(chatId, "welcomeBack")}, ${existingPatient.name}!</b>

📋 <b>${this.t(chatId, "patientDetails")}</b>
• ${this.t(chatId, "patientIdLabel")} <code>${existingPatient.uniqueId}</code>
• ${this.t(chatId, "phoneLabel")} ${existingPatient.phone}

${this.t(chatId, "enterSymptoms")}
            `
      );
    } catch (error) {
      console.error("Confirm existing patient error:", error);
      await this.sendMessage(chatId, "Sorry, there was an error. Please try again with /book");
      this.updateConversationState(chatId, "INITIAL");
    }
  }

  // Complaint Management Methods
  async handleComplaintCommand(chatId, user) {
    await this.startComplaintFlow(chatId, user);
  }

  async startComplaintFlow(chatId, user) {
    const text = `
╔═══════════════════════════════╗
║     📝 COMPLAINT SUBMISSION   ║
╚═══════════════════════════════╝

👋 ${this.t(chatId, "hello")} <b>${user.first_name}</b>!

🎯 <b>${this.t(chatId, "complaintTypeQuestion", "What type of complaint would you like to submit?")}</b>

┌─────────────────────────────┐
│ 📅 Appointment Issues       │
│ 👨‍⚕️ Doctor/Staff Behavior     │
│ 🏥 Facility & Cleanliness   │
│ 💰 Billing Problems         │
│ ⏰ Waiting Time Issues       │
│ 🔧 Equipment Problems       │
│ 📞 Communication Issues     │
│ 🔒 Privacy Concerns         │
│ 📋 Other Issues             │
└─────────────────────────────┘

💡 <i>${this.t(chatId, "selectComplaintCategory", "Please select the category that best describes your concern:")}</i>
        `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "📅 Appointment", callback_data: "complaint_appointment_scheduling" },
          { text: "👨‍⚕️ Doctor/Staff", callback_data: "complaint_doctor_behavior" },
        ],
        [
          { text: "🏥 Facility", callback_data: "complaint_facility_cleanliness" },
          { text: "💰 Billing", callback_data: "complaint_billing_issues" },
        ],
        [
          { text: "⏰ Wait Time", callback_data: "complaint_waiting_time" },
          { text: "🔧 Equipment", callback_data: "complaint_equipment_malfunction" },
        ],
        [
          { text: "📞 Communication", callback_data: "complaint_communication_issues" },
          { text: "🔒 Privacy", callback_data: "complaint_privacy_concerns" },
        ],
        [{ text: "📋 Other", callback_data: "complaint_other" }],
        [{ text: "🏠 Back to Main Menu", callback_data: "main_menu" }],
      ],
    };

    await this.sendMessage(chatId, text, { reply_markup: keyboard });
    this.updateConversationState(chatId, "SELECT_COMPLAINT_CATEGORY", { user });
  }

  async handleComplaintCategorySelection(chatId, category) {
    const categoryNames = {
      appointment_scheduling: "📅 Appointment Scheduling",
      doctor_behavior: "👨‍⚕️ Doctor/Staff Behavior",
      facility_cleanliness: "🏥 Facility & Cleanliness",
      billing_issues: "💰 Billing Issues",
      waiting_time: "⏰ Waiting Time",
      equipment_malfunction: "🔧 Equipment Problems",
      communication_issues: "📞 Communication Issues",
      privacy_concerns: "🔒 Privacy Concerns",
      other: "📋 Other Issues",
    };

    await this.sendMessage(
      chatId,
      `
✅ <b>${this.t(chatId, "categorySelected", "Category Selected")}</b>

📂 <b>${this.t(chatId, "category", "Category")}:</b> ${categoryNames[category]}

📝 <b>${this.t(chatId, "complaintTitlePrompt", "Please provide a brief title for your complaint:")}</b>

<i>${this.t(chatId, "titleExample", 'Example: "Long waiting time for appointment" or "Billing error on invoice"')}</i>
        `
    );

    this.updateConversationState(chatId, "COLLECT_COMPLAINT_TITLE", { category });
  }

  async handleComplaintTitle(chatId, title) {
    if (title.trim().length < 5) {
      await this.sendMessage(
        chatId,
        this.t(chatId, "titleTooShort", "Please provide a more descriptive title (at least 5 characters).")
      );
      return;
    }

    this.updateConversationState(chatId, "COLLECT_COMPLAINT_DESCRIPTION", { title: title.trim() });

    await this.sendMessage(
      chatId,
      `
✅ <b>${this.t(chatId, "titleReceived", "Title Received")}</b>

📋 <b>${this.t(chatId, "title", "Title")}:</b> ${title.trim()}

📝 <b>${this.t(
        chatId,
        "complaintDescriptionPrompt",
        "Now, please provide a detailed description of your complaint:"
      )}</b>

<i>${this.t(chatId, "descriptionTips", "Please include:")}</i>
• ${this.t(chatId, "whatHappened", "What happened?")}
• ${this.t(chatId, "whenDidItHappen", "When did it happen?")}
• ${this.t(chatId, "whoWasInvolved", "Who was involved?")}
• ${this.t(chatId, "howDidItAffectYou", "How did it affect you?")}
        `
    );
  }

  async handleComplaintDescription(chatId, description) {
    if (description.trim().length < 20) {
      await this.sendMessage(
        chatId,
        this.t(chatId, "descriptionTooShort", "Please provide a more detailed description (at least 20 characters).")
      );
      return;
    }

    const conversation = this.getConversationState(chatId);
    const { category, title } = conversation.data;

    // AI Analysis (mock for demo)
    const aiAnalysis = {
      sentiment: "negative",
      urgency: "medium",
      suggestedCategory: category,
      confidenceScore: 0.85,
    };

    const urgencyEmoji = {
      low: "🟢",
      medium: "🟡",
      high: "🔴",
      critical: "🚨",
    };

    const summaryMessage = `
╔═══════════════════════════════╗
║    📋 COMPLAINT SUMMARY       ║
╚═══════════════════════════════╝

📝 <b>${this.t(chatId, "complaintSummary", "Complaint Summary")}</b>

📂 <b>${this.t(chatId, "category", "Category")}:</b> ${category.replace(/_/g, " ")}
📋 <b>${this.t(chatId, "title", "Title")}:</b> ${title}
📄 <b>${this.t(chatId, "description", "Description")}:</b> ${description.substring(0, 100)}${
      description.length > 100 ? "..." : ""
    }

🤖 <b>${this.t(chatId, "aiAnalysis", "AI Analysis")}:</b>
${urgencyEmoji[aiAnalysis.urgency]} ${this.t(chatId, "urgency", "Urgency")}: ${aiAnalysis.urgency.toUpperCase()}
📊 ${this.t(chatId, "confidence", "Confidence")}: ${Math.round(aiAnalysis.confidenceScore * 100)}%

${this.t(chatId, "confirmSubmission", "Would you like to submit this complaint?")}
        `;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: `✅ ${this.t(chatId, "submitComplaint", "Submit Complaint")}`,
            callback_data: "confirm_complaint_submission",
          },
          { text: `❌ ${this.t(chatId, "cancel", "Cancel")}`, callback_data: "cancel_complaint" },
        ],
      ],
    };

    await this.sendMessage(chatId, summaryMessage, { reply_markup: keyboard });

    this.updateConversationState(chatId, "CONFIRM_COMPLAINT_SUBMISSION", {
      description: description.trim(),
      aiAnalysis,
    });
  }

  async handleComplaintSubmission(chatId, user) {
    try {
      const conversation = this.getConversationState(chatId);
      const { category, title, description } = conversation.data;

      // Create complaint using the Complaint model
      const { Complaint, Patient } = require("../models");

      // Find or create a patient record for external Telegram users
      let patient;
      try {
        // Try to find existing patient by phone (telegram ID format)
        patient = await Patient.findOne({ phone: `telegram_${chatId}` });
        if (!patient) {
          // Create a minimal patient record for external users
          // Use a dummy DOB since it's required but not collected from Telegram
          const dummyDOB = new Date();
          dummyDOB.setFullYear(dummyDOB.getFullYear() - 25); // Default 25 years old

          patient = await Patient.create({
            name: user.first_name + (user.last_name ? ` ${user.last_name}` : ""),
            phone: `telegram_${chatId}`,
            dob: dummyDOB,
            channel: "telegram",
            language: this.getUserLanguage(chatId),
            email: null, // Optional field, can be null
          });
          console.log("📝 Created external patient record for complaint:", patient.uniqueId);
        }
      } catch (patientError) {
        console.error("Error finding/creating patient for complaint:", patientError);
        await this.sendMessage(
          chatId,
          this.t(
            chatId,
            "complaintSubmissionError",
            "Sorry, there was an error processing your complaint. Please try again or contact support."
          )
        );
        this.updateConversationState(chatId, "INITIAL");
        return;
      }

      // Debug logging to inspect patient object
      console.log("🐛 DEBUG: Patient object before complaint creation:", {
        id: patient._id,
        name: patient.name,
        phone: patient.phone,
        uniqueId: patient.uniqueId,
        typeOfId: typeof patient._id,
        isValidObjectId: patient._id && typeof patient._id === "object" && patient._id.toString().length === 24,
      });

      // Ensure patient._id is a valid ObjectId
      const patientId = patient._id;
      if (!patientId || typeof patientId !== "object" || patientId.toString().length !== 24) {
        throw new Error(`Invalid patient ObjectId: ${patientId} (type: ${typeof patientId})`);
      }

      const complaintData = {
        patient: patientId, // Use the actual ObjectId
        patientName: patient.name,
        patientPhone: patient.phone,
        title,
        description,
        category,
        urgency: "medium",
        channel: "telegram",
        language: this.getUserLanguage(chatId),
      };

      console.log("🐛 DEBUG: Complaint data:", complaintData);

      const complaint = await Complaint.create(complaintData);

      await this.sendMessage(
        chatId,
        `
╔═══════════════════════════════╗
║   ✅ COMPLAINT SUBMITTED!     ║
╚═══════════════════════════════╝

🎉 <b>${this.t(chatId, "complaintSubmitted", "Your complaint has been submitted successfully!")}</b>

┌─────────────────────────────┐
│ 📋 <b>${this.t(chatId, "complaintDetails", "Complaint Details")}</b>    │
├─────────────────────────────┤
│ 🎫 ID: <code>${complaint.complaintId}</code>         │
│ 📂 ${this.t(chatId, "category", "Category")}: ${category.replace(/_/g, " ")}     │
│ 🟡 ${this.t(chatId, "urgency", "Urgency")}: ${complaint.urgency}        │
│ 📅 ${this.t(chatId, "submitted", "Submitted")}: ${new Date().toLocaleDateString()}    │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 📱 <b>${this.t(chatId, "nextSteps", "Next Steps")}</b>           │
├─────────────────────────────┤
│ ⏰ ${this.t(chatId, "responseTime", "Response within 24 hours")}   │
│ 📧 ${this.t(chatId, "updateNotifications", "Updates via Telegram")}     │
│ 🎫 ${this.t(chatId, "saveComplaintId", "Save your complaint ID")}      │
│ 📞 ${this.t(chatId, "contactSupport", "Call support if urgent")}      │
└─────────────────────────────┘

🆘 <b>${this.t(chatId, "urgentMatters", "For urgent matters")}:</b> ${this.t(
          chatId,
          "phone",
          "📞 Call: (555) 123-4567"
        )}

🙏 <b>${this.t(chatId, "thankYou", "Thank you for your feedback!")}</b>
            `
      );

      // Reset conversation
      this.updateConversationState(chatId, "INITIAL");

      console.log("📝 Telegram complaint submitted:", complaint.toPublic());
    } catch (error) {
      console.error("Complaint submission error:", error);
      await this.sendMessage(
        chatId,
        this.t(
          chatId,
          "complaintSubmissionError",
          "Sorry, there was an error submitting your complaint. Please try again or contact support."
        )
      );
      this.updateConversationState(chatId, "INITIAL");
    }
  }

  async handleComplaintCancellation(chatId) {
    await this.sendMessage(
      chatId,
      `
❌ <b>${this.t(chatId, "complaintCancelled", "Complaint Cancelled")}</b>

${this.t(chatId, "complaintNotSubmitted", "Your complaint was not submitted.")}

${this.t(chatId, "canSubmitLater", "You can submit a complaint anytime by typing /complaint")}

${this.t(chatId, "needHelp", "Need help?")} ${this.t(chatId, "phone", "📞 Call: (555) 123-4567")}
        `
    );

    this.updateConversationState(chatId, "INITIAL");
  }
}

module.exports = new TelegramService();
