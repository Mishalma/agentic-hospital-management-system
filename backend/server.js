const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();
const geminiConfig = require("./config/gemini");

// Import MongoDB connection
const database = require("./config/database");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const { router: authRouter } = require("./routes/auth");
app.use("/api/auth", authRouter);
app.use("/api/patients", require("./routes/patients"));
app.use("/api/appointments", require("./routes/appointments"));
app.use("/api/queue", require("./routes/queue"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/whatsapp", require("./routes/whatsapp"));
app.use("/api/telegram", require("./routes/telegram"));
app.use("/api/sms", require("./routes/sms"));
app.use("/api/complaints", require("./routes/complaints"));
app.use("/api/vitals", require("./routes/vitals"));
app.use("/api/triage", require("./routes/triage"));
app.use("/api/consultations", require("./routes/consultations"));
app.use("/api/prescriptions", require("./routes/prescriptions"));
app.use("/api/pharmacy", require("./routes/pharmacy"));
app.use("/api/drug-info", require("./routes/drugInfo"));
app.use("/api/laboratory", require("./routes/laboratory"));
app.use("/api/billing", require("./routes/billing"));
app.use("/api/emergency", require("./routes/emergency"));
app.use("/api/er-queue", require("./routes/erQueue"));
app.use("/api/brought-dead-records", require("./routes/broughtDeadRecords"));
app.use("/api/security-logs", require("./routes/securityLogs"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Socket.io for real-time updates
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-queue", (data) => {
    socket.join("queue-updates");
  });

  socket.on("join-admin", (data) => {
    socket.join("admin-updates");
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make io available to routes
app.set("io", io);

const PORT = process.env.PORT || 5001;

// Initialize MongoDB connection and start server
async function startServer() {
  try {
    // Try to connect to MongoDB (graceful fallback if fails)
    const dbConnection = await database.connect();

    // Initialize models based on database connection status
    const { initializeModels } = require("./models");

    // Force re-initialization after database connection
    setTimeout(() => {
      const reinitResult = initializeModels();
      console.log("🔄 Models re-initialized after database connection");
      if (reinitResult) {
        console.log("📊 Using real database models");
      } else {
        console.log("📝 Still using mock models");
      }
    }, 2000);

    // Start the server regardless of database connection
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);

      if (dbConnection) {
        console.log("✅ Running with MongoDB Atlas database");
      } else {
        console.log("⚠️  Running in demo mode (add your IP to MongoDB Atlas whitelist for full functionality)");
      }
    });

    // Production ready - no demo data
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, io };

// Initialize Telegram service
const telegramService = require("./services/telegramService");

async function startApplication() {
  // 1. Initialize MongoDB (as per your logs, this happens successfully)
  // await mongoose.connect(process.env.MONGO_URI);
  // console.log('🗄️  MongoDB Atlas connected successfully!');
  // console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  // console.log(`🌐 Host: ${mongoose.connection.host}`);
  // ... other MongoDB logs ...

  // 2. Initialize other services (Twilio, Telegram, etc.)
  // console.log('📱 Twilio SMS service initialized successfully');
  // console.log('🤖 Telegram bot initialized successfully');
  // ...

  // 3. --- CRITICAL: Initialize Gemini AI ---
  console.log("\n--- Initializing Gemini AI ---");
  const geminiInitialized = await geminiConfig.init(); // <--- This is the missing piece!
  if (geminiInitialized) {
    console.log("✅ Gemini AI client and model successfully initialized.");
    // Now that it's initialized, you can test the connection if desired
    const testResult = await geminiConfig.testConnection();
    if (testResult.success) {
      console.log("✅ Gemini AI is ready and connected!");
    } else {
      console.error("⚠️  Gemini AI connection test failed after initialization:", testResult.message);
    }
  } else {
    console.error("❌ Gemini AI FAILED to initialize. AI features will be unavailable.");
    console.error("Please check your GEMINI_API_KEY and network connection.");
    // You might want to exit the application or disable AI-dependent routes here.
  }
  console.log("\n--- Gemini AI Status After Init Attempt ---");
  console.log(geminiConfig.getStatus());

  // 4. Set up Express middleware and routes
}

startApplication();
