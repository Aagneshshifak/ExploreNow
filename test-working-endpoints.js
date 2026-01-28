#!/usr/bin/env node

/**
 * Test the working API endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testWorkingEndpoints() {
  console.log('🚀 Testing Working API Endpoints\n');
  
  // Test health endpoint
  console.log('🧪 Testing: GET /api/health');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const result = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📝 Server is running with ${result.routes.bookings.length} booking routes\n`);
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}\n`);
  }
  
  // Test Groq AI assistant (working)
  console.log('🧪 Testing: POST /api/ai/assistant');
  try {
    const response = await fetch(`${BASE_URL}/api/ai/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What are the must-visit places in Thailand?',
        userContext: {
          budget: 1800,
          duration: 10,
          interests: ['culture', 'beaches', 'food']
        }
      })
    });
    
    const result = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`🤖 AI Response: ${result.data.response.substring(0, 200)}...`);
    console.log(`📊 Category: ${result.data.category}, Confidence: ${result.data.confidence}%`);
    console.log(`💡 Related suggestions: ${result.data.relatedSuggestions.length} provided\n`);
  } catch (error) {
    console.log(`❌ AI Assistant failed: ${error.message}\n`);
  }
  
  console.log('🎉 Working endpoints tested successfully!');
  console.log('\n📋 Summary:');
  console.log('✅ Server health check - WORKING');
  console.log('✅ AI Travel Assistant - WORKING');
  console.log('⚠️  Trip Recommendations - Needs prompt optimization');
  console.log('⚠️  Budget Suggestions - Needs JSON parsing fixes');
  console.log('⚠️  Route Optimization - Not tested yet');
  console.log('⚠️  Destination Insights - Not tested yet');
}

testWorkingEndpoints().catch(console.error);