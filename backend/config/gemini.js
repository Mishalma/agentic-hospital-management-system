require("dotenv").config();
let GoogleGenerativeAI;

try {
  const { GoogleGenerativeAI: GenAI } = require("@google/generative-ai");
  GoogleGenerativeAI = GenAI;
  console.log("✅ Loaded @google/generative-ai successfully");
} catch (err) {
  console.warn("⚠️  @google/generative-ai not found. Install it with: npm install @google/generative-ai");
  GoogleGenerativeAI = null;
}

class GeminiConfig {
  constructor({ preferredModel } = {}) {
    this.apiKey = process.env.GEMINI_API_KEY || null;
    this.modelName = preferredModel || null;
    this.genAI = null;
    this.isInitialized = false;
    this.packageAvailable = !!GoogleGenerativeAI;

    // quick API key sanity check
    if (this.apiKey && (!this.apiKey.startsWith("AIza") || this.apiKey.length < 30)) {
      console.error("❌ Invalid GEMINI_API_KEY format.");
      this.apiKey = null;
    }

    console.log("🔑 GEMINI_API_KEY prefix:", this.apiKey?.slice(0, 10) || "(none)");
  }

  async init() {
    if (this.isInitialized) {
      console.log("ℹ️ Gemini already initialized.");
      return this.isAvailable();
    }

    if (!this.packageAvailable) return this._fail("Package not installed.");
    if (!this.apiKey) return this._fail("API key missing or invalid.");

    try {
      console.log("🚀 Initializing Gemini client...");
      this.genAI = new GoogleGenerativeAI(this.apiKey);

      await this._selectModel();
      if (!this.modelName) return this._fail("No valid model found.");

      this.isInitialized = true;
      console.log(`✅ Gemini ready with model: ${this.modelName}`);
      return true;
    } catch (err) {
      return this._fail("Initialization failed: " + err.message);
    }
  }

  async _selectModel() {
    const defaultModel = "gemini-2.5-flash"; // trying gemini-2.5-flash
    let candidate = this.modelName || defaultModel;
    if (candidate.startsWith("models/")) {
      candidate = candidate.replace("models/", "");
    }

    const models = await this.getAvailableModels();

    if (!models.length) {
      console.warn("⚠️ No models fetched. Using fallback model:", candidate);
      this.modelName = candidate;
      return;
    }

    // First try the candidate model directly
    try {
      const testModel = this.genAI.getGenerativeModel({ model: candidate });
      await testModel.generateContent({ contents: [{ role: "user", parts: [{ text: "Test" }] }] });
      this.modelName = candidate;
      console.log(`✅ Using model: ${candidate}`);
      return;
    } catch (error) {
      console.warn(`❌ Model ${candidate} failed: ${error.message}`);
    }

    // Try fallback models
    const fallbackModels = [
      "gemini-2.5-flash",
      "gemini-2.0-flash-exp",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-pro",
    ];
    for (const modelName of fallbackModels) {
      try {
        const testModel = this.genAI.getGenerativeModel({ model: modelName });
        await testModel.generateContent({ contents: [{ role: "user", parts: [{ text: "Test" }] }] });
        this.modelName = modelName;
        console.log(`⚙️  Fallback model selected: ${modelName}`);
        return;
      } catch (error) {
        console.warn(`❌ Fallback model ${modelName} failed: ${error.message}`);
        continue;
      }
    }

    console.error("❌ No working models found");
    this.modelName = null;
  }

  async getAvailableModels() {
    if (!this.genAI) {
      console.warn("⚠️ Gemini client not initialized.");
      return [];
    }
    try {
      // The GoogleGenerativeAI doesn't have listModels method, so return empty array
      // We'll use the fallback model selection instead
      return [];
    } catch (err) {
      console.error("❌ Failed to fetch models:", err.message);
      return [];
    }
  }

  async testConnection() {
    if (!this.isAvailable()) return { success: false, message: "Gemini not initialized." };

    try {
      console.log("🧪 Testing Gemini connection...");
      const model = this.genAI.getGenerativeModel({ model: this.modelName });

      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: "Say OK" }] }],
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "(no response)";
      console.log(`✅ Gemini responded: "${text}"`);
      return { success: true, model: this.modelName, response: text };
    } catch (err) {
      console.error("❌ Connection test failed:", err.message);
      return { success: false, message: err.message };
    }
  }

  getClient() {
    return this.genAI;
  }

  getModelName() {
    return this.modelName;
  }

  isAvailable() {
    return this.isInitialized && this.genAI && !!this.modelName;
  }

  getStatus() {
    return {
      packageInstalled: this.packageAvailable,
      apiKeyPresent: !!this.apiKey,
      apiKeyValidFormat: !!this.apiKey && this.apiKey.startsWith("AIza"),
      clientInitialized: !!this.genAI,
      modelSelected: !!this.modelName,
      fullyInitialized: this.isInitialized,
      available: this.isAvailable(),
      selectedModel: this.modelName,
    };
  }

  _fail(msg) {
    console.error("❌ " + msg);
    this.genAI = null;
    this.isInitialized = false;
    return false;
  }
}

const geminiConfig = new GeminiConfig();
module.exports = geminiConfig;

// Test demo (uncomment to verify)
/*
(async () => {
  console.log('\n--- Initial ---');
  console.log(geminiConfig.getStatus());

  const ok = await geminiConfig.init();
  console.log('\n--- After init ---');
  console.log(geminiConfig.getStatus());

  if (ok) await geminiConfig.testConnection();
})();
*/
