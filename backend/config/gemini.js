require('dotenv').config();
let GoogleGenAI;

try {
  const genai = require('@google/genai');
  GoogleGenAI = genai.GoogleGenAI;
  console.log('✅ Loaded @google/genai successfully');
} catch (err) {
  console.warn('⚠️  @google/genai not found. Install it with: npm install @google/genai');
  GoogleGenAI = null;
}

class GeminiConfig {
  constructor({ preferredModel } = {}) {
    this.apiKey = process.env.GEMINI_API_KEY || null;
    this.modelName = preferredModel || null;
    this.genAI = null;
    this.isInitialized = false;
    this.packageAvailable = !!GoogleGenAI;

    // quick API key sanity check
    if (this.apiKey && (!this.apiKey.startsWith('AIza') || this.apiKey.length < 30)) {
      console.error('❌ Invalid GEMINI_API_KEY format.');
      this.apiKey = null;
    }

    console.log('🔑 GEMINI_API_KEY prefix:', this.apiKey?.slice(0, 10) || '(none)');
  }

  async init() {
    if (this.isInitialized) {
      console.log('ℹ️ Gemini already initialized.');
      return this.isAvailable();
    }

    if (!this.packageAvailable) return this._fail('Package not installed.');
    if (!this.apiKey) return this._fail('API key missing or invalid.');

    try {
      console.log('🚀 Initializing Gemini client...');
      this.genAI = new GoogleGenAI({ apiKey: this.apiKey });

      await this._selectModel();
      if (!this.modelName) return this._fail('No valid model found.');

      this.isInitialized = true;
      console.log(`✅ Gemini ready with model: ${this.modelName}`);
      return true;
    } catch (err) {
      return this._fail('Initialization failed: ' + err.message);
    }
  }

  async _selectModel() {
    const defaultModel = 'models/gemini-1.5-flash'; // free & fast
    let candidate = this.modelName || defaultModel;
    const models = await this.getAvailableModels();

    if (!models.length) {
      console.warn('⚠️ No models fetched. Using fallback model:', candidate);
      this.modelName = candidate;
      return;
    }

    const found = models.find(m => m.name === candidate);
    if (found) {
      this.modelName = found.name;
      console.log(`✅ Using model: ${found.name}`);
    } else {
      const firstTextModel = models.find(m => m.supportedGenerationMethods?.includes('generateContent'));
      this.modelName = firstTextModel?.name || defaultModel;
      console.log(`⚙️  Fallback model selected: ${this.modelName}`);
    }
  }

  async getAvailableModels() {
    if (!this.genAI) {
      console.warn('⚠️ Gemini client not initialized.');
      return [];
    }
    try {
      const { models } = await this.genAI.listModels();
      return models || [];
    } catch (err) {
      console.error('❌ Failed to fetch models:', err.message);
      return [];
    }
  }

  async testConnection() {
    if (!this.isAvailable()) return { success: false, message: 'Gemini not initialized.' };

    try {
      console.log('🧪 Testing Gemini connection...');
      const model = this.genAI.getGenerativeModel({ model: this.modelName });

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Say OK' }] }],
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '(no response)';
      console.log(`✅ Gemini responded: "${text}"`);
      return { success: true, model: this.modelName, response: text };
    } catch (err) {
      console.error('❌ Connection test failed:', err.message);
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
      apiKeyValidFormat: !!this.apiKey && this.apiKey.startsWith('AIza'),
      clientInitialized: !!this.genAI,
      modelSelected: !!this.modelName,
      fullyInitialized: this.isInitialized,
      available: this.isAvailable(),
      selectedModel: this.modelName,
    };
  }

  _fail(msg) {
    console.error('❌ ' + msg);
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
