/**
 * Test Script - API Endpoints Verification
 * Tests all major API endpoints to ensure they're working correctly
 */

const BASE_URL = 'http://localhost:5000';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, path, description, options = {}) {
  try {
    log(`\n🔍 Testing: ${description}`, 'cyan');
    log(`   ${method} ${path}`, 'blue');
    
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log(`   ✅ SUCCESS (${response.status})`, 'green');
      if (data.data) {
        if (Array.isArray(data.data)) {
          log(`   📊 Returned ${data.data.length} items`, 'green');
        } else if (typeof data.data === 'object') {
          log(`   📦 Returned object with keys: ${Object.keys(data.data).join(', ')}`, 'green');
        }
      }
      return { success: true, data, status: response.status };
    } else {
      log(`   ⚠️  FAILED (${response.status}): ${data.message || 'Unknown error'}`, 'yellow');
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    log(`   ❌ ERROR: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('API ENDPOINTS TEST SUITE', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };
  
  // Test 1: Health Check
  log('\n📋 SECTION 1: HEALTH CHECK', 'yellow');
  const health = await testEndpoint('GET', '/api/health', 'Health Check');
  results.total++;
  if (health.success) results.passed++;
  else results.failed++;
  
  // Test 2: Trips Endpoints
  log('\n📋 SECTION 2: TRIPS ENDPOINTS', 'yellow');
  const trips = await testEndpoint('GET', '/api/trips', 'Get All Trips');
  results.total++;
  if (trips.success) results.passed++;
  else results.failed++;
  
  if (trips.success && trips.data?.data?.length > 0) {
    const firstTripId = trips.data.data[0].id;
    const singleTrip = await testEndpoint('GET', `/api/trips/${firstTripId}`, `Get Trip #${firstTripId}`);
    results.total++;
    if (singleTrip.success) results.passed++;
    else results.failed++;
  }
  
  // Test 3: Hotels Endpoints
  log('\n📋 SECTION 3: HOTELS ENDPOINTS', 'yellow');
  const hotels = await testEndpoint('GET', '/api/hotels', 'Get All Hotels');
  results.total++;
  if (hotels.success) results.passed++;
  else results.failed++;
  
  if (hotels.success && hotels.data?.data?.length > 0) {
    const firstHotelId = hotels.data.data[0].id;
    const singleHotel = await testEndpoint('GET', `/api/hotels/${firstHotelId}`, `Get Hotel #${firstHotelId}`);
    results.total++;
    if (singleHotel.success) results.passed++;
    else results.failed++;
  }
  
  // Test 4: Authentication Endpoints (without actual login)
  log('\n📋 SECTION 4: AUTHENTICATION ENDPOINTS', 'yellow');
  const authTest = await testEndpoint('GET', '/api/auth/test', 'Auth Test Endpoint');
  results.total++;
  if (authTest.success) results.passed++;
  else results.failed++;
  
  // Test 5: Booking Endpoints (will fail without auth, but tests routing)
  log('\n📋 SECTION 5: BOOKING ENDPOINTS (Expected to fail without auth)', 'yellow');
  const bookings = await testEndpoint('GET', '/api/bookings', 'Get User Bookings (No Auth)');
  results.total++;
  // This should fail with 401, which is expected
  if (bookings.status === 401) {
    log('   ✅ Correctly requires authentication', 'green');
    results.passed++;
  } else {
    results.failed++;
  }
  
  const dashboard = await testEndpoint('GET', '/api/bookings/dashboard', 'Get Dashboard Data (No Auth)');
  results.total++;
  // This should fail with 401, which is expected
  if (dashboard.status === 401) {
    log('   ✅ Correctly requires authentication', 'green');
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 6: GraphQL Endpoint
  log('\n📋 SECTION 6: GRAPHQL ENDPOINT', 'yellow');
  const graphql = await testEndpoint('POST', '/graphql', 'GraphQL Health Query', {
    body: JSON.stringify({
      query: '{ __typename }',
    }),
  });
  results.total++;
  if (graphql.success) results.passed++;
  else results.failed++;
  
  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`\nTotal Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%\n`, 
    results.passed === results.total ? 'green' : 'yellow');
  
  if (results.passed === results.total) {
    log('🎉 ALL TESTS PASSED! API is working correctly.', 'green');
  } else {
    log('⚠️  Some tests failed. Check the output above for details.', 'yellow');
  }
  
  log('\n' + '='.repeat(60) + '\n', 'cyan');
}

// Run tests
log('\n🚀 Starting API endpoint tests...', 'cyan');
log('📡 Server: ' + BASE_URL, 'blue');
log('⏰ Timestamp: ' + new Date().toISOString() + '\n', 'blue');

runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
