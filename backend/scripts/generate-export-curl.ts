#!/usr/bin/env tsx
/**
 * Генерация curl команды для экспорта игр из G2A Export API
 * Использует продакшн ключи из переменных окружения
 * 
 * Usage:
 *   npx tsx scripts/generate-export-curl.ts [page] [perPage]
 */

import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем __dirname для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем переменные окружения
dotenv.config({ path: path.join(__dirname, '../.env') });

const G2A_API_KEY = process.env.G2A_API_KEY || '';
const G2A_EMAIL = process.env.G2A_EMAIL || '';
const G2A_API_HASH = process.env.G2A_API_HASH || '';

// Проверяем наличие необходимых переменных
if (!G2A_API_KEY || !G2A_EMAIL || !G2A_API_HASH) {
  console.error('❌ Ошибка: Необходимы переменные окружения:');
  console.error('   G2A_API_KEY - G2A Client ID');
  console.error('   G2A_EMAIL - Email для генерации API ключа');
  console.error('   G2A_API_HASH - G2A Client Secret');
  console.error('');
  console.error('Установите их в backend/.env файл');
  process.exit(1);
}

// Генерируем API ключ: SHA256(ClientId + Email + ClientSecret)
const apiKey = crypto
  .createHash('sha256')
  .update(G2A_API_KEY + G2A_EMAIL + G2A_API_HASH)
  .digest('hex');

// URL для продакшн G2A Export API
const API_URL = 'https://api.g2a.com/v1/products';

// Параметры запроса
const page = process.argv[2] ? parseInt(process.argv[2], 10) : 1;
const perPage = process.argv[3] ? parseInt(process.argv[3], 10) : 20;

console.log('🔑 Конфигурация:');
console.log(`   Client ID: ${G2A_API_KEY.substring(0, 10)}...`);
console.log(`   Email: ${G2A_EMAIL}`);
console.log(`   API Key: ${apiKey.substring(0, 20)}...`);
console.log('');

console.log('📋 Готовая curl команда:');
console.log('');
console.log(
  `curl -X GET '${API_URL}?page=${page}&perPage=${perPage}&minQty=1&includeOutOfStock=false' \\`
);
console.log(`  -H 'Authorization: ${G2A_API_KEY}, ${apiKey}' \\`);
console.log(`  -H 'Content-Type: application/json'`);
console.log('');

console.log('📋 С форматированием JSON (требует jq):');
console.log('');
console.log(
  `curl -X GET '${API_URL}?page=${page}&perPage=${perPage}&minQty=1&includeOutOfStock=false' \\`
);
console.log(`  -H 'Authorization: ${G2A_API_KEY}, ${apiKey}' \\`);
console.log(`  -H 'Content-Type: application/json' \\`);
console.log(`  | jq '.'`);
console.log('');

console.log('💡 Примеры использования:');
console.log('');
console.log('# Получить первую страницу (20 игр)');
console.log(
  `curl -X GET '${API_URL}?page=1&perPage=20&minQty=1' \\`
);
console.log(`  -H 'Authorization: ${G2A_API_KEY}, ${apiKey}' \\`);
console.log(`  -H 'Content-Type: application/json'`);
console.log('');

console.log('# Получить все игры на странице 1 (100 игр)');
console.log(
  `curl -X GET '${API_URL}?page=1&perPage=100&minQty=1' \\`
);
console.log(`  -H 'Authorization: ${G2A_API_KEY}, ${apiKey}' \\`);
console.log(`  -H 'Content-Type: application/json'`);
console.log('');

console.log('# Сохранить результат в файл');
console.log(
  `curl -X GET '${API_URL}?page=1&perPage=100&minQty=1' \\`
);
console.log(`  -H 'Authorization: ${G2A_API_KEY}, ${apiKey}' \\`);
console.log(`  -H 'Content-Type: application/json' \\`);
console.log(`  -o games-export.json`);
console.log('');

console.log('# С фильтром по платформе (Steam)');
console.log(
  `curl -X GET '${API_URL}?page=1&perPage=20&minQty=1&platform=steam' \\`
);
console.log(`  -H 'Authorization: ${G2A_API_KEY}, ${apiKey}' \\`);
console.log(`  -H 'Content-Type: application/json'`);
console.log('');
