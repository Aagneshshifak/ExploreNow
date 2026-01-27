#!/usr/bin/env node

/**
 * Simple Groq API Connection Test
 * Tests basic connectivity and API key validation
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGroqConnection() {
  console.log('🚀 Testing Groq API Connection...\n');
  
  // Check if API key is configured
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.log('❌ GROQ_API_KEY not found in environment variables');
    process.exit(1);
  }
  
  console.log(`✅ API Key found (length: ${apiKey.length} characters)`);
  console.log(`🔑 Key preview: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 10)}\n`);
  
  // Initialize Groq client
  const groq = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
  
  console.log('🔌 Groq client initialized');
  console.log('🌐 Base URL: https://api.groq.com/openai/v1\n');
  
  try {
    console.log('📡 Testing API connection with simple query...');
    const startTime = Date.now();
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful travel assistant. Respond with a brief, friendly message."
        },
        {
          role: "user",
          content: "Hello! Can you help me plan a trip?"
        }
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 100,
      temperature: 0.7,
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ API Response received in ${responseTime}ms`);
    console.log(`🤖 Model: ${completion.model || 'llama-3.3-70b-versatile'}`);
    console.log(`📝 Response: ${completion.choices[0]?.message?.content || 'No response content'}`);
    console.log(`🔢 Tokens used: ${completion.usage?.total_tokens || 'Unknown'}\n`);
    
    // Test travel-specific query
    console.log('🧳 Testing travel-specific query...');
    const travelStartTime = Date.now();
    
    const travelCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a travel expert. Provide a brief recommendation for a budget-friendly destination."
        },
        {
          role: "user",
          content: "Recommend a budget-friendly destination in Southeast Asia for a 7-day trip with a $1500 budget."
        }
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 200,
      temperature: 0.7,
    });
    
    const travelResponseTime = Date.now() - travelStartTime;
    
    console.log(`✅ Travel query response received in ${travelResponseTime}ms`);
    console.log(`📍 Travel recommendation: ${travelCompletion.choices[0]?.message?.content || 'No response content'}\n`);
    
    // Summary
    console.log('=' .repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(60));
    console.log(`✅ Groq API Connection: SUCCESSFUL`);
    console.log(`⚡ Average Response Time: ${Math.round((responseTime + travelResponseTime) / 2)}ms`);
    console.log(`🤖 Model: llama-3.3-70b-versatile`);
    console.log(`🔑 API Key: Valid and working`);
    console.log(`🌐 Base URL: https://api.groq.com/openai/v1`);
    console.log(`📈 Status: Ready for production use`);
    console.log('=' .repeat(60));
    
    console.log('\n🎉 All tests passed! Groq API is ready for use in the travel application.');
    
  } catch (error) {
    console.log(`❌ API Test failed: ${error.message}`);
    
    if (error.status === 401) {
      console.log('🔑 Authentication failed - check your API key');
    } else if (error.status === 429) {
      console.log('⏱️  Rate limit exceeded - try again later');
    } else if (error.status === 500) {
      console.log('🔧 Server error - Groq API may be temporarily unavailable');
    } else {
      console.log('🌐 Network or configuration error');
    }
    
    console.log('\n🔍 Error details:', {
      status: error.status,
      message: error.message,
      type: error.type || 'Unknown'
    });
    
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
  process.exit(1);
});

// Run the test
testGroqConnection().catch(console.error);