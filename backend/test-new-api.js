require('dotenv').config();

async function testNewAPI() {
  console.log('🆕 Testing New @google/genai Package');
  console.log('=' .repeat(40));

  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT FOUND');

  if (!apiKey) {
    console.log('❌ No API key found');
    return;
  }

  try {
    // Try to use the new package structure
    const { GoogleGenAI } = require('@google/genai');
    console.log('✅ New @google/genai package loaded');

    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    // Test with newer models
    const modelsToTest = [
      'gemini-2.5-flash',
      'gemini-2.5-flash-image',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro'
    ];

    console.log('\n🔍 Testing new API models...\n');

    for (const modelName of modelsToTest) {
      try {
        console.log(`Testing: ${modelName}`);
        
        const contents = [{
          role: 'user',
          parts: [{
            text: 'Hello! Please respond with just "Working" to confirm the connection.',
          }],
        }];

        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
        });

        console.log(`✅ ${modelName} - SUCCESS!`);
        console.log(`   Response available: ${response ? 'Yes' : 'No'}`);
        
        // Try to extract text from response
        if (response && response.candidates && response.candidates[0]) {
          const text = response.candidates[0].content?.parts?.[0]?.text || 'No text found';
          console.log(`   Response: "${text.trim()}"`);
        }
        
        console.log('');
        console.log(`🎉 FOUND WORKING MODEL: ${modelName}`);
        console.log('This model works with the new API!');
        return modelName;
        
      } catch (error) {
        console.log(`❌ ${modelName} - FAILED`);
        console.log(`   Error: ${error.message}`);
        console.log('');
      }
    }

    console.log('❌ No working models found with new API');
    
  } catch (error) {
    console.log('❌ New package not available:', error.message);
    
    if (error.message.includes('Cannot find module')) {
      console.log('\n📦 New package not installed. To install:');
      console.log('   npm install @google/genai');
      console.log('   npm install mime  # for file handling');
    }
    
    console.log('\n💡 Falling back to current package test...');
    return null;
  }
}

async function main() {
  const newAPIResult = await testNewAPI();
  
  if (!newAPIResult) {
    console.log('\n🔄 Testing current API as fallback...');
    const { testCurrentAPI } = require('./test-current-api');
    await testCurrentAPI();
  }
}

main();