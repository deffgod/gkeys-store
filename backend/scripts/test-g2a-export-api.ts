#!/usr/bin/env tsx
/**
 * Test G2A Export API Script
 * 
 * Тестирует G2A Export API с использованием сгенерированного API ключа
 * 
 * Usage:
 *   npx tsx scripts/test-g2a-export-api.ts [--page=1] [--perPage=20]
 * 
 * Environment Variables:
 *   G2A_API_KEY - G2A Client ID
 *   G2A_EMAIL - Email для генерации API ключа
 *   G2A_API_HASH - G2A Client Secret
 *   G2A_ENV - Environment (sandbox/live)
 */

import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Переменные окружения
const clientId = process.env.G2A_API_KEY || '';
const email = process.env.G2A_EMAIL || '';
const clientSecret = process.env.G2A_API_HASH || '';
const envDomain = process.env.G2A_ENV === 'live' 
  ? 'api.g2a.com' 
  : 'sandboxapi.g2a.com';

// Парсинг аргументов командной строки
function parseArgs() {
  const args = process.argv.slice(2);
  const options: { page?: number; perPage?: number } = {};

  for (const arg of args) {
    if (arg.startsWith('--page=')) {
      options.page = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--perPage=')) {
      options.perPage = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
G2A Export API Test Script

Тестирует G2A Export API с использованием сгенерированного API ключа.

Usage:
  npx tsx scripts/test-g2a-export-api.ts [options]

Options:
  --page=N         Номер страницы (default: 1)
  --perPage=N      Количество продуктов на странице (default: 20)
  --help, -h       Показать эту справку

Environment Variables:
  G2A_API_KEY      G2A Client ID (required)
  G2A_EMAIL        Email для генерации API ключа (required)
  G2A_API_HASH     G2A Client Secret (required)
  G2A_ENV          Environment: sandbox или live (default: sandbox)

Examples:
  npx tsx scripts/test-g2a-export-api.ts
  npx tsx scripts/test-g2a-export-api.ts --page=1 --perPage=10
`);
      process.exit(0);
    }
  }

  return options;
}

// Генерация API ключа
function generateG2AApiKey(
  clientId: string,
  email: string,
  clientSecret: string
): string {
  return crypto
    .createHash('sha256')
    .update(clientId + email + clientSecret)
    .digest('hex');
}

async function main() {
  console.log('🧪 G2A Export API Test Script\n');

  // Проверка переменных окружения
  if (!clientId || !email || !clientSecret) {
    console.error('❌ Error: Missing required environment variables!');
    console.error('   Required: G2A_API_KEY, G2A_EMAIL, G2A_API_HASH');
    console.error('\n   Example:');
    console.error('   G2A_API_KEY=your-client-id G2A_EMAIL=your-email G2A_API_HASH=your-secret npx tsx scripts/test-g2a-export-api.ts');
    process.exit(1);
  }

  const options = parseArgs();
  const page = options.page || 1;
  const perPage = options.perPage || 20;

  console.log('📋 Configuration:');
  console.log(`   Client ID: ${clientId.substring(0, 10)}...`);
  console.log(`   Email: ${email}`);
  console.log(`   Client Secret: ${clientSecret.substring(0, 10)}...`);
  console.log(`   Environment: ${process.env.G2A_ENV || 'sandbox'}`);
  console.log(`   Domain: ${envDomain}`);
  console.log(`   Page: ${page}`);
  console.log(`   Per Page: ${perPage}`);
  console.log('');

  // Генерация API ключа
  console.log('🔑 Generating API key...');
  const apiKey = generateG2AApiKey(clientId, email, clientSecret);
  console.log(`   API Key: ${apiKey.substring(0, 20)}...`);
  console.log('');

  // Формирование URL
  const productsApiUrl = `https://${envDomain}/v1/products?page=${page}&perPage=${perPage}`;

  console.log('📡 Making request to G2A Export API...');
  console.log(`   URL: ${productsApiUrl}`);
  console.log(`   Authorization: ${clientId}, ${apiKey.substring(0, 20)}...`);
  console.log('');

  try {
    const startTime = Date.now();
    const response = await fetch(productsApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `${clientId}, ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const latency = Date.now() - startTime;

    console.log(`📥 Response received (${latency}ms):`);
    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n❌ API Error:`);
      console.error(`   Status: ${response.status}`);
      console.error(`   Response: ${errorText.substring(0, 500)}`);
      process.exit(1);
    }

    const data = await response.json();

    console.log(`\n✅ Success!`);
    console.log(`\n📊 Response Data:`);
    
    // G2A Export API возвращает данные в формате { total, page, docs }
    if (data.total !== undefined) {
      const totalPages = Math.ceil(data.total / perPage);
      console.log(`   Total Products: ${data.total.toLocaleString()}`);
      console.log(`   Current Page: ${data.page || page}`);
      console.log(`   Per Page: ${perPage}`);
      console.log(`   Total Pages: ${totalPages.toLocaleString()}`);
    } else if (data.meta) {
      // Альтернативный формат с meta
      console.log(`   Total Products: ${data.meta.total?.toLocaleString() || 'N/A'}`);
      console.log(`   Current Page: ${data.meta.page || page}`);
      console.log(`   Per Page: ${data.meta.perPage || perPage}`);
      console.log(`   Total Pages: ${data.meta.totalPages || 'N/A'}`);
    }

    // Обработка продуктов (docs или products)
    const products = data.docs || data.products || [];
    if (Array.isArray(products)) {
      console.log(`   Products Returned: ${products.length}`);
      
      if (products.length > 0) {
        console.log(`\n📦 Sample Products (first 5):`);
        products.slice(0, 5).forEach((product: any, index: number) => {
          console.log(`\n   ${index + 1}. ${product.name || 'N/A'}`);
          console.log(`      ID: ${product.id || 'N/A'}`);
          const price = product.minPrice || product.price?.amount || product.retailMinBasePrice || 'N/A';
          const currency = product.price?.currency || 'USD';
          console.log(`      Price: $${price} ${currency}`);
          console.log(`      Stock: ${product.qty || 0}`);
          console.log(`      Platform: ${product.platform || 'N/A'}`);
          console.log(`      Type: ${product.type || 'N/A'}`);
          if (product.region) {
            console.log(`      Region: ${product.region}`);
          }
        });
      }
    }

    // Вывод полного JSON (опционально, можно закомментировать для больших ответов)
    if (process.env.DEBUG === 'true') {
      console.log(`\n📄 Full Response JSON:`);
      console.log(JSON.stringify(data, null, 2));
    }

    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  } catch (error: unknown) {
    console.error('\n❌ Request failed:');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack}`);
      }
    } else {
      console.error(`   Error: ${String(error)}`);
    }
    process.exit(1);
  }
}

main();
