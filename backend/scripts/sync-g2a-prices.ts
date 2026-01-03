#!/usr/bin/env tsx
/**
 * Sync G2A Prices Script
 * 
 * Синхронизирует цены для всех игр с g2aProductId из базы данных.
 * Получает актуальные цены из G2A API и обновляет их в БД с применением markup (2%).
 * 
 * Usage:
 *   npx tsx scripts/sync-g2a-prices.ts [--dry-run] [--limit=N]
 * 
 * Options:
 *   --dry-run          Don't save to database, just fetch and display
 *   --limit=N          Limit to first N games (for testing)
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { getG2APrices } from '../src/services/g2a.service.js';

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
G2A Prices Sync Script

Синхронизирует цены для всех игр с g2aProductId из базы данных.

Usage:
  npx tsx scripts/sync-g2a-prices.ts [options]

Options:
  --dry-run          Не сохранять в БД, только получить и показать статистику
  --limit=N         Ограничить количество игр (для тестирования)
  --help, -h        Показать эту справку

Examples:
  npx tsx scripts/sync-g2a-prices.ts --dry-run
  npx tsx scripts/sync-g2a-prices.ts --limit=100
`);
      process.exit(0);
    }
  }

  return options;
}

async function syncPrices(options: SyncOptions): Promise<void> {
  console.log('\n💰 G2A Prices Sync Script\n');
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
        price: true,
      },
      take: options.limit,
    });

    if (games.length === 0) {
      console.log('⚠️  No games with g2aProductId found in database');
      return;
    }

    console.log(`📥 Found ${games.length} games with G2A product IDs`);
    console.log('🔄 Fetching prices from G2A API...\n');

    const g2aProductIds = games.map((g) => g.g2aProductId!).filter(Boolean);
    const startTime = Date.now();

    // Fetch prices in batches (getG2APrices handles batching internally)
    const prices = await getG2APrices(g2aProductIds);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Fetched prices for ${prices.size} products (${duration}s)\n`);

    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let totalPriceChanges = 0;

    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - Analyzing price changes...\n');

      for (const game of games) {
        if (!game.g2aProductId) {
          totalSkipped++;
          continue;
        }

        const newPrice = prices.get(game.g2aProductId);
        if (newPrice === undefined) {
          console.warn(`⚠️  No price found for game ${game.title} (G2A ID: ${game.g2aProductId})`);
          totalSkipped++;
          continue;
        }

        const currentPrice = Number(game.price);
        const priceDiff = newPrice - currentPrice;
        const priceDiffPercent = currentPrice > 0 ? ((priceDiff / currentPrice) * 100).toFixed(2) : 'N/A';

        if (Math.abs(priceDiff) > 0.01) {
          totalPriceChanges++;
          console.log(
            `📊 ${game.title}: $${currentPrice.toFixed(2)} → $${newPrice.toFixed(2)} (${priceDiff > 0 ? '+' : ''}${priceDiff.toFixed(2)}, ${priceDiffPercent}%)`
          );
        } else {
          console.log(`✓ ${game.title}: $${newPrice.toFixed(2)} (no change)`);
        }
      }

      console.log('\n📊 Statistics:');
      console.log(`   Total games: ${games.length}`);
      console.log(`   Prices fetched: ${prices.size}`);
      console.log(`   Price changes: ${totalPriceChanges}`);
      console.log(`   Skipped: ${totalSkipped}`);
      console.log(`   Duration: ${duration}s`);
      console.log('\n💡 Run without --dry-run to save to database');
    } else {
      console.log('💾 Updating prices in database...\n');

      // Process in batches
      const batchSize = 50;
      for (let i = 0; i < games.length; i += batchSize) {
        const batch = games.slice(i, i + batchSize);

        for (const game of batch) {
          try {
            if (!game.g2aProductId) {
              totalSkipped++;
              continue;
            }

            const newPrice = prices.get(game.g2aProductId);
            if (newPrice === undefined) {
              totalSkipped++;
              continue;
            }

            const currentPrice = Number(game.price);
            const priceDiff = Math.abs(newPrice - currentPrice);

            // Update price if it changed significantly (> 0.01)
            if (priceDiff > 0.01) {
              await prisma.game.update({
                where: { id: game.id },
                data: {
                  price: newPrice,
                  g2aLastSync: new Date(),
                },
              });

              totalUpdated++;
              totalPriceChanges++;

              if (totalUpdated % 10 === 0) {
                process.stdout.write(`\r💾 Updated: ${totalUpdated} games...`);
              }
            } else {
              // Still update g2aLastSync even if price didn't change
              await prisma.game.update({
                where: { id: game.id },
                data: {
                  g2aLastSync: new Date(),
                },
              });
            }
          } catch (error) {
            console.error(`\n❌ Error updating game ${game.id}:`, error);
            totalErrors++;
          }
        }
      }

      console.log('\n');
      console.log('✅ Sync completed!');
      console.log(`   Total games: ${games.length}`);
      console.log(`   Prices fetched: ${prices.size}`);
      console.log(`   Total updated: ${totalUpdated}`);
      console.log(`   Price changes: ${totalPriceChanges}`);
      console.log(`   Skipped: ${totalSkipped}`);
      console.log(`   Errors: ${totalErrors}`);
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
  await syncPrices(options);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
