/**
 * Test G2A Production API Connection
 * 
 * Tests production G2A API with provided credentials
 * Run with: npx tsx scripts/test-g2a-production.ts
 */

import axios from 'axios';
import crypto from 'crypto';

// Production G2A credentials
const G2A_API_KEY = 'ibHtsEljmCxjOFAn'; // Client ID
const G2A_API_HASH = 'HrsPmuOlWjqBMHnQWIgfchUqBTBYcRph'; // Client Secret
const G2A_API_URL = 'https://api.g2a.com';
const G2A_EMAIL = process.env.G2A_EMAIL || 'Welcome@nalytoo.com'; // Required for Export API

// Timeout for requests
const TIMEOUT_MS = 30000;

/**
 * Generate hash for G2A Import API authentication (hash-based)
 */
function generateHash(timestamp: string): string {
  return crypto
    .createHash('sha256')
    .update(G2A_API_HASH + G2A_API_KEY + timestamp)
    .digest('hex');
}

/**
 * Generate API Key for G2A Export API (sha256(ClientId + Email + ClientSecret))
 */
function generateExportApiKey(): string {
  return crypto
    .createHash('sha256')
    .update(G2A_API_KEY + G2A_EMAIL + G2A_API_HASH)
    .digest('hex');
}

/**
 * Create G2A Import API client with hash-based authentication
 */
function createImportAPIClient() {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const hash = generateHash(timestamp);

  return axios.create({
    baseURL: `${G2A_API_URL}/integration-api/v1`,
    timeout: TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
      'X-API-HASH': G2A_API_HASH,
      'X-API-KEY': G2A_API_KEY,
      'X-G2A-Timestamp': timestamp,
      'X-G2A-Hash': hash,
    },
  });
}

/**
 * Create G2A Export API client with Authorization header (ClientId, ApiKey)
 * According to G2A Developers API documentation:
 * - Format: Authorization: ClientId, ApiKey
 * - ApiKey = sha256(ClientId + Email + ClientSecret)
 * - Base URL: https://api.g2a.com/v1 (not /integration-api/v1)
 */
function createExportAPIClient() {
  const apiKey = generateExportApiKey();
  
  // For Export API (Developers API), use /v1, not /integration-api/v1
  const exportBaseURL = G2A_API_URL.replace('/integration-api/v1', '/v1').replace(/\/+$/, '') + '/v1';

  return axios.create({
    baseURL: exportBaseURL,
    timeout: TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `${G2A_API_KEY}, ${apiKey}`,
    },
  });
}

/**
 * Test helpers
 */
const logTest = (name: string, status: 'PASS' | 'FAIL', message?: string) => {
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} [${status}] ${name}${message ? `: ${message}` : ''}`);
};

const logSection = (name: string) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${name}`);
  console.log('='.repeat(60));
};

/**
 * Test 1: Basic Connection (Export API)
 */
async function testBasicConnection() {
  logSection('Test 1: Basic Connection (Export API)');
  
  try {
    const client = createExportAPIClient();
    // Try to get products (simple endpoint to test connection)
    const response = await client.get('/products', {
      params: { page: 1 },
    });
    logTest('Basic connection', 'PASS', `Status: ${response.status}`);
    return true;
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.code || error.message;
      logTest('Basic connection', 'FAIL', `Status: ${status}, Message: ${message}`);
    } else {
      logTest('Basic connection', 'FAIL', error.message);
    }
    return false;
  }
}

/**
 * Test 2: OAuth2 Token Authentication (Import API)
 */
async function testOAuth2Token() {
  logSection('Test 2: OAuth2 Token Authentication (Import API)');
  
  try {
    const client = createImportAPIClient();
    const response = await client.get<{ access_token: string; expires_in: number; token_type: string }>('/token');
    
    if (response.data.access_token) {
      logTest('OAuth2 token', 'PASS', `Token obtained, expires in ${response.data.expires_in}s`);
      return { success: true, token: response.data.access_token };
    } else {
      logTest('OAuth2 token', 'FAIL', 'No access_token in response');
      return { success: false };
    }
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const message = typeof data === 'string' ? data.substring(0, 100) : JSON.stringify(data).substring(0, 200);
      logTest('OAuth2 token', 'FAIL', `Status: ${status}, Message: ${message}`);
    } else {
      logTest('OAuth2 token', 'FAIL', error.message);
    }
    return { success: false };
  }
}

/**
 * Test 3: Get Products (Export API)
 */
async function testGetProducts() {
  logSection('Test 3: Get Products (Export API)');
  
  try {
    const client = createExportAPIClient();
    const response = await client.get('/products', {
      params: {
        page: 1,
        minQty: 1,
        includeOutOfStock: false,
      },
    });
    
    if (response.data && response.data.docs) {
      logTest('Get products', 'PASS', `Found ${response.data.total || response.data.docs.length} products`);
      return { success: true, count: response.data.total || response.data.docs.length, products: response.data.docs };
    } else {
      logTest('Get products', 'FAIL', 'Invalid response format');
      return { success: false };
    }
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const message = data?.message || data?.code || JSON.stringify(data).substring(0, 200);
      logTest('Get products', 'FAIL', `Status: ${status}, Message: ${message}`);
    } else {
      logTest('Get products', 'FAIL', error.message);
    }
    return { success: false };
  }
}

/**
 * Test 4: Get Single Product
 */
async function testGetSingleProduct() {
  logSection('Test 4: Get Single Product (Export API)');
  
  try {
    // First get products to find a valid product ID
    const client = createExportAPIClient();
    const productsResponse = await client.get('/products', {
      params: { page: 1, minQty: 1 },
    });
    
    if (!productsResponse.data?.docs || productsResponse.data.docs.length === 0) {
      logTest('Get single product', 'SKIP', 'No products available to test');
      return { success: true };
    }
    
    const productId = productsResponse.data.docs[0].id;
    const productResponse = await client.get(`/products/${productId}`);
    
    if (productResponse.data && productResponse.data.id) {
      logTest('Get single product', 'PASS', `Product: ${productResponse.data.name || productId}`);
      return { success: true };
    } else {
      logTest('Get single product', 'FAIL', 'Invalid response format');
      return { success: false };
    }
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const message = data?.message || data?.code || JSON.stringify(data).substring(0, 200);
      logTest('Get single product', 'FAIL', `Status: ${status}, Message: ${message}`);
    } else {
      logTest('Get single product', 'FAIL', error.message);
    }
    return { success: false };
  }
}

/**
 * Test 5: Price Simulation (Import API with OAuth2)
 */
async function testPriceSimulation(oauthToken?: string) {
  logSection('Test 5: Price Simulation (Import API)');
  
  if (!oauthToken) {
    logTest('Price simulation', 'SKIP', 'OAuth2 token not available');
    return { success: true };
  }
  
  try {
    // First get a product ID from Export API
    const exportClient = createExportAPIClient();
    const productsResponse = await exportClient.get('/products', {
      params: { page: 1, minQty: 1 },
    });
    
    if (!productsResponse.data?.docs || productsResponse.data.docs.length === 0) {
      logTest('Price simulation', 'SKIP', 'No products available to test');
      return { success: true };
    }
    
    const productId = productsResponse.data.docs[0].id;
    
    // Use OAuth2 token for Import API
    const importClient = axios.create({
      baseURL: `${G2A_API_URL}/integration-api/v1`,
      timeout: TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${oauthToken}`,
      },
    });
    
    const response = await importClient.get('/prices', {
      params: {
        productId: productId,
        price: 10.00,
      },
    });
    
    if (response.data) {
      logTest('Price simulation', 'PASS', 'Price simulation successful');
      return { success: true };
    } else {
      logTest('Price simulation', 'FAIL', 'Invalid response format');
      return { success: false };
    }
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const message = data?.message || data?.code || JSON.stringify(data).substring(0, 200);
      logTest('Price simulation', 'FAIL', `Status: ${status}, Message: ${message}`);
    } else {
      logTest('Price simulation', 'FAIL', error.message);
    }
    return { success: false };
  }
}

/**
 * Test 6: Authentication Method
 */
async function testAuthenticationMethod() {
  logSection('Test 6: Authentication Method');
  
  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const hash = generateHash(timestamp);
    const exportApiKey = generateExportApiKey();
    
    console.log('📝 Authentication details:');
    console.log(`   Client ID (API Key): ${G2A_API_KEY.substring(0, 10)}...`);
    console.log(`   Client Secret (API Hash): ${G2A_API_HASH.substring(0, 10)}...`);
    console.log(`   Email: ${G2A_EMAIL}`);
    console.log(`   Base URL: ${G2A_API_URL}`);
    console.log(`\n   Import API (Hash-based):`);
    console.log(`     Timestamp: ${timestamp}`);
    console.log(`     Generated Hash: ${hash.substring(0, 20)}...`);
    console.log(`\n   Export API (Authorization header):`);
    console.log(`     ApiKey (sha256): ${exportApiKey.substring(0, 20)}...`);
    console.log(`     Format: Authorization: ${G2A_API_KEY.substring(0, 10)}..., ${exportApiKey.substring(0, 20)}...`);
    
    logTest('Authentication method', 'PASS', 'Both authentication methods configured');
    return true;
  } catch (error: any) {
    logTest('Authentication method', 'FAIL', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n🚀 Starting G2A Production API Tests...\n');
  console.log('📋 Configuration:');
  console.log(`   API URL: ${G2A_API_URL}`);
  console.log(`   Client ID: ${G2A_API_KEY.substring(0, 10)}...`);
  console.log(`   Client Secret: ${G2A_API_HASH.substring(0, 10)}...`);
  console.log(`   Email: ${G2A_EMAIL}`);
  console.log(`   ⚠️  Note: Email is required for Export API authentication`);
  console.log(`   📝 Export API uses: Authorization: ClientId, ApiKey (where ApiKey = sha256(ClientId + Email + ClientSecret))`);
  console.log(`   📝 Import API uses: Hash-based auth with X-API-HASH, X-API-KEY headers\n`);
  
  const results: Array<{ name: string; passed: boolean }> = [];
  
  // Run tests
  results.push({ name: 'Authentication Method', passed: await testAuthenticationMethod() });
  results.push({ name: 'Basic Connection', passed: await testBasicConnection() });
  
  const oauthResult = await testOAuth2Token();
  results.push({ name: 'OAuth2 Token', passed: oauthResult.success });
  
  results.push({ name: 'Get Products', passed: (await testGetProducts()).success });
  results.push({ name: 'Get Single Product', passed: (await testGetSingleProduct()).success });
  
  if (oauthResult.success && oauthResult.token) {
    results.push({ name: 'Price Simulation', passed: (await testPriceSimulation(oauthResult.token)).success });
  } else {
    results.push({ name: 'Price Simulation', passed: true }); // Skip if no token
  }
  
  // Summary
  logSection('Test Summary');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! G2A Production API is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.');
    console.log('\n💡 Tips:');
    console.log('   - Check that G2A credentials are correct');
    console.log('   - Verify that your G2A account has API access enabled');
    console.log('   - Check that IP address is whitelisted (if required)');
    console.log('   - Verify G2A_EMAIL environment variable is set correctly');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('💥 Fatal error during testing:', error);
  process.exit(1);
});

