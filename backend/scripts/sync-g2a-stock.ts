#!/usr/bin/env tsx
/**
 * Sync G2A Stock Script
 * 
 * Синхронизирует наличие товаров для всех игр с g2aProductId из базы данных.
 * Проверяет наличие товаров в G2A API и обновляет inStock и g2aStock в БД.
 * 
 * Usage:
 *   npx tsx scripts/sync-g2a-stock.ts [--dry-run] [--limit=N]
 * 
 * Options:
 *   --dry-run          Don't save to database, just fetch and display
 *   --limit=N          Limit to first N games (for testing)
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { validateGameStock } from '../src/services/g2a.service.js';

dotenv.config();

const prisma = new PrismaClient();

interface SyncOptions {
  dryRun: boolean;
  limit?: number;
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
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
G2A Stock Sync Script

Синхронизирует наличие товаров для всех игр с g2aProductId из базы данных.

Usage:
  npx tsx scripts/sync-g2a-stock.ts [options]

Options:
  --dry-run          Не сохранять в БД, только получить и показать статистику
  --limit=N         Ограничить количество игр (для тестирования)
  --help, -h        Показать эту справку

Examples:
  npx tsx scripts/sync-g2a-stock.ts --dry-run
  npx tsx scripts/sync-g2a-stock.ts --limit=100
`);
      process.exit(0);
    }
  }

  return options;
}

async function syncStock(options: SyncOptions): Promise<void> {
  console.log('\n📦 G2A Stock Sync Script\n');
  console.log('📋 Configuration:');
  console.log(`   Dry Run: ${options.dryRun ? 'YES (no database changes)' : 'NO (will save to DB)'}`);
  if (options.limit) {
    console.log(`   Limit: ${options.limit} games`);
  }
  console.log('');

  try {
    // Get all games with g2aProductId
    const games = await prisma.game.findMany({
      where: {
        g2aProductId: { not: null },
      },
      select: {
        id: true,
        title: true,
        g2aProductId: true,
        inStock: true,
        g2aStock: true,
      },
      take: options.limit,
    });

    if (games.length === 0) {
      console.log('⚠️  No games with g2aProductId found in database');
      return;
    }

    console.log(`📥 Found ${games.length} games with G2A product IDs`);
    console.log('🔄 Checking stock in G2A API...\n');

    const startTime = Date.now();
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let stockChanges = 0;
    let inStockCount = 0;
    let outOfStockCount = 0;

    // Process games in batches with delays to respect rate limits
    const batchSize = 10;
    for (let i = 0; i < games.length; i += batchSize) {
      const batch = games.slice(i, i + batchSize);

      for (const game of batch) {
        try {
          if (!game.g2aProductId) {
            totalSkipped++;
            continue;
          }

          // Check stock for this game
          const stockResult = await validateGameStock(game.g2aProductId);

          const wasInStock = game.inStock;
          const wasG2aStock = game.g2aStock;
          const isNowInStock = stockResult.available;
          const isNowG2aStock = stockResult.available;

          if (options.dryRun) {
            const stockChanged = wasInStock !== isNowInStock || wasG2aStock !== isNowG2aStock;
            if (stockChanged) {
              stockChanges++;
              console.log(
                `📊 ${game.title}: ${wasInStock ? 'IN STOCK' : 'OUT OF STOCK'} → ${isNowInStock ? 'IN STOCK' : 'OUT OF STOCK'} (Stock: ${stockResult.stock})`
              );
            } else {
              console.log(
                `✓ ${game.title}: ${isNowInStock ? 'IN STOCK' : 'OUT OF STOCK'} (Stock: ${stockResult.stock}, no change)`
              );
            }
          } else {
            // Update database if stock status changed
            const stockChanged = wasInStock !== isNowInStock || wasG2aStock !== isNowG2aStock;

            if (stockChanged) {
              await prisma.game.update({
                where: { id: game.id },
                data: {
                  inStock: isNowInStock,
                  g2aStock: isNowG2aStock,
                  g2aLastSync: new Date(),
                },
              });

              totalUpdated++;
              stockChanges++;

              if (totalUpdated % 10 === 0) {
                process.stdout.write(`\r💾 Updated: ${totalUpdated} games...`);
              }
            } else {
              // Still update g2aLastSync even if stock didn't change
              await prisma.game.update({
                where: { id: game.id },
                data: {
                  g2aLastSync: new Date(),
                },
              });
            }
          }

          if (isNowInStock) {
            inStockCount++;
          } else {
            outOfStockCount++;
          }

          // Small delay between requests to respect rate limits
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`\n❌ Error checking stock for game ${game.id} (${game.title}):`, error);
          totalErrors++;
        }
      }

      // Delay between batches
      if (i + batchSize < games.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n');
    if (options.dryRun) {
      console.log('📊 Statistics:');
      console.log(`   Total games: ${games.length}`);
      console.log(`   Stock changes: ${stockChanges}`);
      console.log(`   In stock: ${inStockCount}`);
      console.log(`   Out of stock: ${outOfStockCount}`);
      console.log(`   Skipped: ${totalSkipped}`);
      console.log(`   Errors: ${totalErrors}`);
      console.log(`   Duration: ${duration}s`);
      console.log('\n💡 Run without --dry-run to save to database');
    } else {
      console.log('✅ Sync completed!');
      console.log(`   Total games: ${games.length}`);
      console.log(`   Total updated: ${totalUpdated}`);
      console.log(`   Stock changes: ${stockChanges}`);
      console.log(`   In stock: ${inStockCount}`);
      console.log(`   Out of stock: ${outOfStockCount}`);
      console.log(`   Skipped: ${totalSkipped}`);
      console.log(`   Errors: ${totalErrors}`);
      console.log(`   Total duration: ${duration}s`);
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
  await syncStock(options);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
