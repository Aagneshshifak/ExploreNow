#!/usr/bin/env node

/**
 * Comprehensive Groq API Integration Test
 * Tests all Groq service endpoints and validates JSON responses
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Configuration
const BASE_URL = 'http://localhost:5000';
const TEST_RESULTS_FILE = 'groq-test-results.json';

// Test data
const testCases = [
  {
    name: 'Trip Recommendations',
    endpoint: '/api/ai/recommend',
    method: 'POST',
    data: {
      budget: 2000,
      interests: ['adventure', 'nature', 'culture'],
      duration: 7,
      destination: 'Southeast Asia',
      travelStyle: 'Standard'
    },
    expectedFields: ['trips', 'recommendations', 'budgetBreakdown']
  },
  {
    name: 'Budget Trip Suggestions',
    endpoint: '/api/ai/budget-suggestions',
    method: 'POST',
    data: {
      budget: 1500,
      currency: 'USD',
      preferences: ['budget', 'culture', 'food'],
      duration: 5
    },
    expectedFields: ['trips', 'budgetTips', 'alternatives']
  },
  {
    name: 'Route Optimization',
    endpoint: '/api/ai/optimize-route',
    method: 'POST',
    data: {
      destinations: ['Bangkok', 'Chiang Mai', 'Phuket'],
      budget: 2500,
      duration: 10,
      preferences: ['culture', 'beaches', 'food']
    },
    expectedFields: ['route', 'totalDistance', 'totalDuration', 'budgetBreakdown']
  },
  {
    name: 'Travel Assistant',
    endpoint: '/api/ai/assistant',
    method: 'POST',
    data: {
      query: 'What are the best places to visit in Japan for first-time travelers?',
      userContext: {
        budget: 3000,
        duration: 14,
        interests: ['culture', 'food', 'history']
      }
    },
    expectedFields: ['response', 'category', 'confidence', 'relatedSuggestions']
  },
  {
    name: 'Destination Insights',
    endpoint: '/api/ai/destination-insights',
    method: 'POST',
    data: {
      destination: 'Tokyo, Japan',
      interests: ['culture', 'food', 'technology'],
      budget: 2000,
      duration: 7
    },
    expectedFields: ['attractions', 'cuisine', 'culture', 'budgetGuide']
  }
];

// Test results structure
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: testCases.length,
    passed: 0,
    failed: 0,
    errors: []
  },
  tests: [],
  groqApiStatus: {
    available: false,
    model: null,
    responseTime: null
  },
  recommendations: []
};

// Helper functions
function validateJsonStructure(data, expectedFields) {
  const errors = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Response is not a valid JSON object');
    return errors;
  }
  
  if (!data.success) {
    errors.push(`API returned success: false - ${data.message || 'Unknown error'}`);
  }
  
  if (!data.data) {
    errors.push('Response missing data field');
    return errors;
  }
  
  for (const field of expectedFields) {
    if (!(field in data.data)) {
      errors.push(`Missing expected field: ${field}`);
    }
  }
  
  return errors;
}

function formatResponseSize(data) {
  return `${JSON.stringify(data).length} bytes`;
}

function extractKeyMetrics(testCase, response) {
  const metrics = {
    responseSize: formatResponseSize(response),
    hasData: !!response.data,
    dataKeys: response.data ? Object.keys(response.data) : []
  };
  
  // Extract specific metrics based on endpoint
  if (testCase.endpoint.includes('recommend') && response.data?.trips) {
    metrics.tripCount = response.data.trips.length;
    metrics.avgCost = response.data.trips.reduce((sum, trip) => sum + (trip.cost || 0), 0) / response.data.trips.length;
  }
  
  if (testCase.endpoint.includes('budget') && response.data?.trips) {
    metrics.budgetCompliant = response.data.trips.every(trip => trip.cost <= testCase.data.budget);
  }
  
  if (testCase.endpoint.includes('route') && response.data?.route) {
    metrics.routeStops = response.data.route.length;
    metrics.totalDuration = response.data.totalDuration;
  }
  
  if (testCase.endpoint.includes('assistant') && response.data?.response) {
    metrics.responseLength = response.data.response.length;
    metrics.confidence = response.data.confidence;
  }
  
  if (testCase.endpoint.includes('destination') && response.data?.attractions) {
    metrics.attractionCount = response.data.attractions.length;
    metrics.cuisineCount = response.data.cuisine?.length || 0;
  }
  
  return metrics;
}

// Main test function
async function runTest(testCase) {
  const startTime = Date.now();
  const result = {
    name: testCase.name,
    endpoint: testCase.endpoint,
    method: testCase.method,
    status: 'unknown',
    responseTime: 0,
    errors: [],
    response: null,
    metrics: {},
    recommendations: []
  };
  
  try {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📡 Endpoint: ${testCase.method} ${testCase.endpoint}`);
    console.log(`📝 Request data:`, JSON.stringify(testCase.data, null, 2));
    
    const response = await fetch(`${BASE_URL}${testCase.endpoint}`, {
      method: testCase.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase.data)
    });
    
    result.responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const jsonResponse = await response.json();
    result.response = jsonResponse;
    
    // Validate JSON structure
    const validationErrors = validateJsonStructure(jsonResponse, testCase.expectedFields);
    result.errors = validationErrors;
    
    // Extract metrics
    result.metrics = extractKeyMetrics(testCase, jsonResponse);
    
    if (validationErrors.length === 0) {
      result.status = 'passed';
      testResults.summary.passed++;
      console.log(`✅ PASSED (${result.responseTime}ms)`);
      
      // Add specific recommendations based on test results
      if (jsonResponse.data?.trips?.length > 0) {
        result.recommendations.push('Groq API successfully generated trip recommendations');
      }
      if (result.metrics.budgetCompliant) {
        result.recommendations.push('All recommendations are within specified budget');
      }
      if (result.responseTime < 5000) {
        result.recommendations.push('Response time is acceptable for user experience');
      }
    } else {
      result.status = 'failed';
      testResults.summary.failed++;
      console.log(`❌ FAILED`);
      validationErrors.forEach(error => console.log(`   - ${error}`));
      testResults.summary.errors.push(...validationErrors);
    }
    
    // Log key metrics
    console.log(`📊 Metrics:`, result.metrics);
    
  } catch (error) {
    result.status = 'error';
    result.errors = [error.message];
    testResults.summary.failed++;
    testResults.summary.errors.push(error.message);
    console.log(`💥 ERROR: ${error.message}`);
  }
  
  return result;
}

// Test Groq API availability
async function testGroqApiStatus() {
  console.log('\n🔍 Testing Groq API Status...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ai/assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'Test connection',
        userContext: {}
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      testResults.groqApiStatus.available = true;
      testResults.groqApiStatus.model = 'Groq API (OpenAI-compatible)';
      testResults.groqApiStatus.responseTime = Date.now();
      console.log('✅ Groq API is available and responding');
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    testResults.groqApiStatus.available = false;
    console.log(`❌ Groq API unavailable: ${error.message}`);
  }
}

// Generate final recommendations
function generateRecommendations() {
  const recommendations = [];
  
  if (testResults.summary.passed === testResults.summary.total) {
    recommendations.push('🎉 All Groq API endpoints are working correctly');
    recommendations.push('✅ JSON response structure is consistent and well-formed');
    recommendations.push('🚀 Ready for production deployment');
  } else {
    recommendations.push(`⚠️  ${testResults.summary.failed} out of ${testResults.summary.total} tests failed`);
    recommendations.push('🔧 Review failed endpoints and fix issues before deployment');
  }
  
  if (testResults.groqApiStatus.available) {
    recommendations.push('🤖 Groq AI integration is functional and providing intelligent responses');
  } else {
    recommendations.push('🚨 Groq API is not available - check API key and network connectivity');
  }
  
  // Performance recommendations
  const avgResponseTime = testResults.tests.reduce((sum, test) => sum + test.responseTime, 0) / testResults.tests.length;
  if (avgResponseTime > 10000) {
    recommendations.push('⏱️  Consider implementing response caching for better performance');
  } else if (avgResponseTime < 3000) {
    recommendations.push('⚡ Excellent response times - great user experience expected');
  }
  
  testResults.recommendations = recommendations;
}

// Main execution
async function main() {
  console.log('🚀 Starting Groq API Integration Test Suite');
  console.log(`🎯 Target: ${BASE_URL}`);
  console.log(`📅 Started: ${testResults.timestamp}`);
  
  // Test Groq API status first
  await testGroqApiStatus();
  
  // Run all test cases
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    testResults.tests.push(result);
  }
  
  // Generate recommendations
  generateRecommendations();
  
  // Save results to file
  fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`📊 Total:  ${testResults.summary.total}`);
  console.log(`🤖 Groq API: ${testResults.groqApiStatus.available ? 'Available' : 'Unavailable'}`);
  
  if (testResults.summary.errors.length > 0) {
    console.log('\n🚨 ERRORS:');
    testResults.summary.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  testResults.recommendations.forEach(rec => console.log(`   ${rec}`));
  
  console.log(`\n📄 Detailed results saved to: ${TEST_RESULTS_FILE}`);
  console.log('='.repeat(60));
  
  // Exit with appropriate code
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
  process.exit(1);
});

// Run the tests
main().catch(console.error);