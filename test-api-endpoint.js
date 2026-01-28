#!/usr/bin/env node

/**
 * Test the running API server endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testEndpoint(endpoint, method = 'GET', data = null) {
  console.log(`\n🧪 Testing: ${method} ${endpoint}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📝 Response:`, JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Testing API Endpoints on Running Server\n');
  
  // Test health endpoint
  await testEndpoint('/api/health');
  
  // Test Groq AI assistant
  await testEndpoint('/api/ai/assistant', 'POST', {
    query: 'What are the best places to visit in Japan for first-time travelers?',
    userContext: {
      budget: 2000,
      duration: 7,
      interests: ['culture', 'food']
    }
  });
  
  // Test trip recommendations
  await testEndpoint('/api/ai/recommend', 'POST', {
    budget: 1500,
    interests: ['adventure', 'nature'],
    duration: 5,
    destination: 'Southeast Asia',
    travelStyle: 'Standard'
  });
  
  // Test budget suggestions
  await testEndpoint('/api/ai/budget-suggestions', 'POST', {
    budget: 1000,
    currency: 'USD',
    preferences: ['budget', 'culture'],
    duration: 4
  });
  
  console.log('\n🎉 API testing complete!');
}

main().catch(console.error);