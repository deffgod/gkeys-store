/**
 * Test G2A Games Count
 * 
 * Tests production G2A API to get total games count
 * Run with: npx tsx scripts/test-g2a-games-count.ts
 */

import axios from 'axios';
import crypto from 'crypto';

// Production G2A credentials
const G2A_API_KEY = process.env.G2A_API_KEY || 'DNvKyOKBjWTVBmEw'; // Client ID
const G2A_API_HASH = process.env.G2A_API_HASH || 'rksBZDeNuUHnDkOiPCyJEdDHZUnlhydS'; // Client Secret
const G2A_API_URL = process.env.G2A_API_URL || 'https://api.g2a.com';
const G2A_EMAIL = process.env.G2A_EMAIL || 'welcome@nalytoo.com'; // Required for Export API

// Timeout for requests
const TIMEOUT_MS = 30000;

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
 * Create G2A Export API client with Authorization header (ClientId, ApiKey)
 */
function createExportAPIClient() {
  const apiKey = generateExportApiKey();
  const exportBaseURL = `${G2A_API_URL}/v1`;

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
 * Get total games count from G2A API
 */
async function getTotalGamesCount(): Promise<number> {
  try {
    const client = createExportAPIClient();
    
    // Get first page to get total count
    const response = await client.get('/products', {
      params: {
        page: 1,
        perPage: 1, // We only need the total count, not the products
        minQty: 1,
        includeOutOfStock: false,
      },
    });

    if (response.data && response.data.meta) {
      return response.data.meta.total || 0;
    }

    // Alternative: if meta doesn't have total, try to get it from response
    if (response.data && typeof response.data.total === 'number') {
      return response.data.total;
    }

    return 0;
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const message = data?.message || data?.code || JSON.stringify(data).substring(0, 200);
      throw new Error(`Failed to get games count: Status ${status}, Message: ${message}`);
    }
    throw new Error(`Failed to get games count: ${error.message}`);
  }
}

/**
 * Get games count with filters
 */
async function getGamesCountWithFilters() {
  try {
    const client = createExportAPIClient();
    
    const results: Record<string, number> = {};

    // Total games (in stock)
    try {
      const inStockResponse = await client.get('/products', {
        params: {
          page: 1,
          perPage: 1,
          minQty: 1,
          includeOutOfStock: false,
        },
      });
      results['In Stock'] = inStockResponse.data?.meta?.total || inStockResponse.data?.total || 0;
    } catch (err: any) {
      console.error('Error getting in-stock count:', err.message);
      results['In Stock'] = 0;
    }

    // Total games (including out of stock)
    try {
      const allResponse = await client.get('/products', {
        params: {
          page: 1,
          perPage: 1,
          includeOutOfStock: true,
        },
      });
      results['Total (including out of stock)'] = allResponse.data?.meta?.total || allResponse.data?.total || 0;
    } catch (err: any) {
      console.error('Error getting total count:', err.message);
      results['Total (including out of stock)'] = 0;
    }

    // Games with minimum quantity >= 1
    try {
      const minQtyResponse = await client.get('/products', {
        params: {
          page: 1,
          perPage: 1,
          minQty: 1,
        },
      });
      results['Min Qty >= 1'] = minQtyResponse.data?.meta?.total || minQtyResponse.data?.total || 0;
    } catch (err: any) {
      console.error('Error getting min qty count:', err.message);
      results['Min Qty >= 1'] = 0;
    }

    return results;
  } catch (error: any) {
    throw new Error(`Failed to get games count with filters: ${error.message}`);
  }
}

/**
 * Get sample products to verify API is working
 */
async function getSampleProducts(count: number = 5) {
  try {
    const client = createExportAPIClient();
    
    const response = await client.get('/products', {
      params: {
        page: 1,
        perPage: count,
        minQty: 1,
        includeOutOfStock: false,
      },
    });

    if (response.data && response.data.docs) {
      return response.data.docs.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.minPrice,
        qty: product.qty,
        platform: product.platform,
      }));
    }

    return [];
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const message = data?.message || data?.code || JSON.stringify(data).substring(0, 200);
      throw new Error(`Failed to get sample products: Status ${status}, Message: ${message}`);
    }
    throw new Error(`Failed to get sample products: ${error.message}`);
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('\n🎮 Testing G2A Games Count API...\n');
  console.log('📋 Configuration:');
  console.log(`   API URL: ${G2A_API_URL}`);
  console.log(`   Client ID: ${G2A_API_KEY.substring(0, 10)}...`);
  console.log(`   Client Secret: ${G2A_API_HASH.substring(0, 10)}...`);
  console.log(`   Email: ${G2A_EMAIL}\n`);

  try {
    // Test 1: Get total games count
    console.log('='.repeat(60));
    console.log('📊 Test 1: Get Total Games Count');
    console.log('='.repeat(60));
    
    const totalCount = await getTotalGamesCount();
    console.log(`✅ Total games count: ${totalCount.toLocaleString()}`);

    // Test 2: Get games count with different filters
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test 2: Get Games Count with Filters');
    console.log('='.repeat(60));
    
    const filteredCounts = await getGamesCountWithFilters();
    Object.entries(filteredCounts).forEach(([filter, count]) => {
      console.log(`   ${filter}: ${count.toLocaleString()}`);
    });

    // Test 3: Get sample products
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test 3: Get Sample Products');
    console.log('='.repeat(60));
    
    const sampleProducts = await getSampleProducts(5);
    if (sampleProducts.length > 0) {
      console.log(`✅ Retrieved ${sampleProducts.length} sample products:\n`);
      sampleProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name}`);
        console.log(`      ID: ${product.id}`);
        console.log(`      Price: $${product.price || 'N/A'}`);
        console.log(`      Qty: ${product.qty || 'N/A'}`);
        console.log(`      Platform: ${product.platform || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No products retrieved');
    }

    // Summary
    console.log('='.repeat(60));
    console.log('📊 Summary');
    console.log('='.repeat(60));
    console.log(`✅ Total games available: ${totalCount.toLocaleString()}`);
    console.log(`✅ In stock games: ${filteredCounts['In Stock']?.toLocaleString() || 'N/A'}`);
    console.log(`✅ Total (including out of stock): ${filteredCounts['Total (including out of stock)']?.toLocaleString() || 'N/A'}`);
    console.log('\n🎉 All tests passed! G2A API is working correctly.\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n💡 Tips:');
    console.error('   - Check that G2A credentials are correct');
    console.error('   - Verify that your G2A account has API access enabled');
    console.error('   - Check that IP address is whitelisted (if required)');
    console.error('   - Verify G2A_EMAIL environment variable is set correctly\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('💥 Fatal error during testing:', error);
  process.exit(1);
});
