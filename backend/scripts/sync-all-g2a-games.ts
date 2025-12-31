#!/usr/bin/env tsx
/**
 * Sync All G2A Games Script
 * 
 * Получает все игры из G2A Export API через метод GetProducts с автоматической пагинацией
 * и сохраняет их в базу данных.
 * 
 * Usage:
 *   npx tsx scripts/sync-all-g2a-games.ts [--filters] [--dry-run] [--limit=N]
 * 
 * Options:
 *   --filters          Apply filters (minQty, inStock, etc.)
 *   --dry-run          Don't save to database, just fetch and display
 *   --limit=N          Limit to first N products (for testing)
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { G2AIntegrationClient } from '../src/lib/g2a/index.js';
import { loadG2AEnvVars } from '../src/lib/g2a/config/env.js';

dotenv.config();

const prisma = new PrismaClient();

interface SyncOptions {
  dryRun: boolean;
  limit?: number;
  filters?: {
    minQty?: number;
    includeOutOfStock?: boolean;
    minPriceFrom?: number;
    minPriceTo?: number;
    updatedAtFrom?: string;
  };
}

function parseArgs(): SyncOptions {
  const args = process.argv.slice(2);
  const options: SyncOptions = {
    dryRun: false,
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--filters') {
      options.filters = {
        minQty: 1,
        includeOutOfStock: false,
      };
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
G2A Games Sync Script

Получает все игры из G2A Export API через метод GetProducts с автоматической пагинацией.

Usage:
  npx tsx scripts/sync-all-g2a-games.ts [options]

Options:
  --dry-run          Не сохранять в БД, только получить и показать статистику
  --limit=N         Ограничить количество продуктов (для тестирования)
  --filters         Применить фильтры (minQty=1, только в наличии)
  --help, -h        Показать эту справку

Examples:
  npx tsx scripts/sync-all-g2a-games.ts --dry-run
  npx tsx scripts/sync-all-g2a-games.ts --limit=100
  npx tsx scripts/sync-all-g2a-games.ts --filters
`);
      process.exit(0);
    }
  }

  return options;
}

async function syncAllGames(options: SyncOptions): Promise<void> {
  console.log('\n🎮 G2A Games Sync Script\n');
  console.log('📋 Configuration:');
  console.log(`   Dry Run: ${options.dryRun ? 'YES (no database changes)' : 'NO (will save to DB)'}`);
  if (options.limit) {
    console.log(`   Limit: ${options.limit} products`);
  }
  if (options.filters) {
    console.log(`   Filters:`, options.filters);
  }
  console.log('');

  // Load G2A configuration from environment
  let g2aEnvVars;
  try {
    g2aEnvVars = loadG2AEnvVars();
  } catch (error) {
    console.error('❌ Error: G2A API credentials not found!');
    console.error(`   ${(error as Error).message}`);
    console.error('   Please set G2A_API_KEY and G2A_API_HASH environment variables.');
    process.exit(1);
  }

  // Initialize G2A client with circuit breaker disabled for bulk sync
  const client = await G2AIntegrationClient.create({
    apiKey: g2aEnvVars.apiKey,
    apiHash: g2aEnvVars.apiHash,
    email: g2aEnvVars.email,
    env: g2aEnvVars.env,
    baseUrl: g2aEnvVars.baseUrl,
    timeoutMs: g2aEnvVars.timeoutMs,
    circuitBreaker: {
      enabled: false, // Disable circuit breaker for bulk sync operations
    },
    rateLimiting: {
      enabled: true,
      requestsPerSecond: 2, // Slower rate for bulk operations
      burstSize: 5,
    },
  });
  
  console.log('🔗 Connecting to G2A Export API...');
  console.log(`   Environment: ${g2aEnvVars.env}`);
  console.log(`   API URL: ${g2aEnvVars.baseUrl}`);
  console.log('');

  try {
    let totalFetched = 0;
    let totalSaved = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const startTime = Date.now();

    // Progress callback
    const onProgress = (page: number, total: number, currentCount: number) => {
      const percentage = total > 0 ? ((currentCount / total) * 100).toFixed(1) : '?';
      process.stdout.write(
        `\r📄 Page ${page} | Fetched: ${currentCount}/${total > 0 ? total : '?'} (${percentage}%)`
      );
    };

    console.log('📥 Fetching all products from G2A Export API...\n');

    // Use the unified client's batch fetcher
    const batchFetcher = client.getBatchProductFetcher();
    const result = await batchFetcher.fetchAll(
      options.filters,
      onProgress
    );

    totalFetched = result.successCount;
    totalErrors = result.failureCount;

    console.log('\n');
    console.log('✅ Fetching completed!');
    console.log(`   Total fetched: ${totalFetched}`);
    console.log(`   Errors: ${totalErrors}`);
    console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log('');

    if (result.failures.length > 0) {
      console.log('⚠️  Failed pages:');
      result.failures.forEach(failure => {
        console.log(`   Page ${failure.index}: ${failure.error.message}`);
      });
      console.log('');
    }

    // Apply limit if specified
    const productsToProcess = options.limit 
      ? result.success.slice(0, options.limit)
      : result.success;

    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - Analyzing products...\n');
      
      // Analyze products
      const games = productsToProcess.filter(p => 
        p.type?.toLowerCase().includes('game') || 
        p.categories?.some(c => c.name?.toLowerCase().includes('game'))
      );
      
      const platforms = new Set<string>();
      const categories = new Set<string>();
      
      productsToProcess.forEach(p => {
        if (p.platform) platforms.add(p.platform);
        p.categories?.forEach(c => {
          if (c.name) categories.add(c.name);
        });
      });

      console.log('📊 Statistics:');
      console.log(`   Total products: ${productsToProcess.length}`);
      console.log(`   Games: ${games.length}`);
      console.log(`   Platforms: ${platforms.size} (${Array.from(platforms).slice(0, 5).join(', ')}...)`);
      console.log(`   Categories: ${categories.size}`);
      console.log(`   Average price: $${(productsToProcess.reduce((sum, p) => sum + (p.price || 0), 0) / productsToProcess.length).toFixed(2)}`);
      console.log('');
      
      console.log('📝 Sample products (first 5):');
      productsToProcess.slice(0, 5).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} (ID: ${p.id})`);
        console.log(`      Price: $${p.price} ${p.currency} | Stock: ${p.qty} | Platform: ${p.platform || 'N/A'}`);
      });
      console.log('');
      
      console.log('💡 Run without --dry-run to save to database');
    } else {
      console.log('💾 Saving products to database...\n');

      // Get existing games to avoid duplicates
      const existingGames = await prisma.game.findMany({
        where: { g2aProductId: { not: null } },
        select: { id: true, g2aProductId: true },
      });
      const existingG2AIds = new Set(existingGames.map(g => g.g2aProductId!));

      // Process products in batches
      const batchSize = 50;
      for (let i = 0; i < productsToProcess.length; i += batchSize) {
        const batch = productsToProcess.slice(i, i + batchSize);
        
        for (const product of batch) {
          try {
            // Skip if already exists
            if (existingG2AIds.has(product.id)) {
              totalSkipped++;
              continue;
            }

            // Filter for games only
            const isGame = product.type?.toLowerCase().includes('game') || 
                          product.categories?.some(c => c.name?.toLowerCase().includes('game'));

            if (!isGame) {
              totalSkipped++;
              continue;
            }

            // Generate slug from title
            const slug = product.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
              .substring(0, 100); // Limit length

            // Get price from G2A product (use minPrice or retailMinBasePrice)
            const price = (product as any).minPrice || 
                         (product as any).retailMinBasePrice || 
                         product.price || 
                         0;

            // Get image URL
            const imageUrl = product.coverImage || product.images?.[0] || '';
            if (!imageUrl) {
              console.warn(`⚠️  Product ${product.id} has no image, skipping`);
              totalSkipped++;
              continue;
            }

            // Get release date (required field)
            const releaseDate = product.releaseDate 
              ? new Date(product.releaseDate) 
              : new Date(); // Default to today if not provided

            // Create game in database
            await prisma.game.create({
              data: {
                title: product.name,
                slug: slug,
                description: product.description || product.shortDescription || '',
                price: price,
                currency: product.currency || 'USD',
                image: imageUrl,
                images: product.images || [imageUrl],
                inStock: (product.qty || 0) > 0,
                g2aProductId: product.id,
                g2aStock: (product.qty || 0) > 0,
                g2aLastSync: new Date(),
                releaseDate: releaseDate,
                // Map additional fields
                publisher: product.publisher || null,
                region: product.region || null,
                activationService: product.platform || null,
              },
            });

            totalSaved++;
            
            if (totalSaved % 10 === 0) {
              process.stdout.write(`\r💾 Saved: ${totalSaved} games...`);
            }
          } catch (error) {
            console.error(`\n❌ Error saving product ${product.id}:`, error);
            totalErrors++;
          }
        }
      }

      console.log('\n');
      console.log('✅ Sync completed!');
      console.log(`   Total fetched: ${totalFetched}`);
      console.log(`   Total saved: ${totalSaved}`);
      console.log(`   Total skipped: ${totalSkipped} (duplicates or non-games)`);
      console.log(`   Total errors: ${totalErrors}`);
      console.log(`   Total duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    }

  } catch (error) {
    console.error('\n❌ Error during sync:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const options = parseArgs();
  await syncAllGames(options);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
