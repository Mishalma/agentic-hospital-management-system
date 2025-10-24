require('dotenv').config();

async function listAvailableModels() {
  console.log('🔍 Discovering Available Gemini Models');
  console.log('=' .repeat(50));

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No API key found');
    return;
  }

  console.log('✅ API key found:', apiKey.substring(0, 15) + '...');

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    console.log('\n📋 Attempting to list models...');
    
    try {
      // Try to list models (this might not work with all API keys)
      const models = await genAI.listModels();
      console.log('✅ Available models:');
      models.forEach(model => {
        console.log(`   - ${model.name}`);
      });
    } catch (listError) {
      console.log('⚠️  Cannot list models:', listError.message);
      console.log('   This is normal - trying common model names instead...');
    }

    // Test common model names that should work
    const commonModels = [
      "gemini-pro",
      "gemini-1.0-pro",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-pro-latest",
      "gemini-1.5-flash-latest",
      "models/gemini-pro",
      "models/gemini-1.0-pro", 
      "models/gemini-1.5-pro",
      "models/gemini-1.5-flash"
    ];

    console.log('\n🧪 Testing common model names...\n');

    let workingModels = [];

    for (const modelName of commonModels) {
      try {
        console.log(`Testing: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Simple test request
        const result = await model.generateContent('Hello');
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ ${modelName} - WORKS!`);
        console.log(`   Response: ${text.trim().substring(0, 50)}...`);
        workingModels.push(modelName);
        console.log('');
        
      } catch (error) {
        console.log(`❌ ${modelName} - Failed`);
        console.log(`   Error: ${error.message.substring(0, 100)}...`);
        console.log('');
      }
    }

    console.log('🎯 SUMMARY:');
    console.log('=' .repeat(30));
    
    if (workingModels.length > 0) {
      console.log('✅ Working models found:');
      workingModels.forEach(model => {
        console.log(`   ✓ ${model}`);
      });
      
      console.log('\n💡 Recommended model to use:', workingModels[0]);
      
      // Update the config file suggestion
      console.log('\n🔧 Update your config to use:');
      console.log(`   this.model = this.genAI.getGenerativeModel({ model: "${workingModels[0]}" });`);
      
    } else {
      console.log('❌ No working models found!');
      console.log('\n🔍 Possible issues:');
      console.log('   - API key might be invalid');
      console.log('   - Account might not have access to Gemini API');
      console.log('   - Network connectivity issues');
      console.log('   - API quotas exceeded');
      
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Verify API key at: https://makersuite.google.com/app/apikey');
      console.log('   2. Check if Gemini API is enabled in your project');
      console.log('   3. Verify billing is set up (if required)');
      console.log('   4. Check API quotas and usage limits');
    }

  } catch (error) {
    console.log('❌ Failed to initialize:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('\n🔑 API Key Issue:');
      console.log('   Your API key appears to be invalid');
      console.log('   Get a new one from: https://makersuite.google.com/app/apikey');
    }
  }
}

listAvailableModels();