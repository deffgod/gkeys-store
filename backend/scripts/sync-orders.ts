#!/usr/bin/env tsx
/**
 * Sync Orders Script
 * 
 * Синхронизирует статусы заказов. Получает заказы со статусом PENDING или PROCESSING
 * и обновляет их статусы на основе внутренней логики или внешних источников.
 * 
 * Usage:
 *   npx tsx scripts/sync-orders.ts [--dry-run] [--status=STATUS] [--limit=N]
 * 
 * Options:
 *   --dry-run          Don't save to database, just analyze
 *   --status=STATUS   Filter by order status (PENDING, PROCESSING, etc.)
 *   --limit=N         Limit to first N orders (for testing)
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { updateOrder } from '../src/services/admin.service.js';

dotenv.config();

const prisma = new PrismaClient();

interface SyncOptions {
  dryRun: boolean;
  status?: string;
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
    } else if (arg.startsWith('--status=')) {
      options.status = arg.split('=')[1].toUpperCase();
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Orders Sync Script

Синхронизирует статусы заказов. Получает заказы со статусом PENDING или PROCESSING
и обновляет их статусы на основе внутренней логики.

Usage:
  npx tsx scripts/sync-orders.ts [options]

Options:
  --dry-run          Не сохранять в БД, только проанализировать
  --status=STATUS    Фильтр по статусу заказа (PENDING, PROCESSING, etc.)
  --limit=N         Ограничить количество заказов (для тестирования)
  --help, -h        Показать эту справку

Examples:
  npx tsx scripts/sync-orders.ts --dry-run
  npx tsx scripts/sync-orders.ts --status=PENDING --limit=50
`);
      process.exit(0);
    }
  }

  return options;
}

async function syncOrders(options: SyncOptions): Promise<void> {
  console.log('\n📋 Orders Sync Script\n');
  console.log('📋 Configuration:');
  console.log(`   Dry Run: ${options.dryRun ? 'YES (no database changes)' : 'NO (will save to DB)'}`);
  if (options.status) {
    console.log(`   Status filter: ${options.status}`);
  }
  if (options.limit) {
    console.log(`   Limit: ${options.limit} orders`);
  }
  console.log('');

  try {
    // Build where clause
    const where: any = {};
    if (options.status) {
      where.status = options.status;
    } else {
      // Default: get PENDING and PROCESSING orders
      where.status = {
        in: ['PENDING', 'PROCESSING'],
      };
    }

    // Get orders
    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        total: true,
        externalOrderId: true,
        createdAt: true,
        completedAt: true,
        items: {
          select: {
            gameId: true,
            quantity: true,
          },
        },
        keys: {
          select: {
            id: true,
            key: true,
            activated: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: options.limit,
    });

    if (orders.length === 0) {
      console.log(`⚠️  No orders found with status ${options.status || 'PENDING/PROCESSING'}`);
      return;
    }

    console.log(`📥 Found ${orders.length} orders to sync`);
    console.log('🔄 Analyzing orders...\n');

    const startTime = Date.now();
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const statusChanges: Record<string, number> = {};

    for (const order of orders) {
      try {
        let newStatus: string | undefined;
        let shouldUpdate = false;

        // Logic for determining new status:
        // 1. If order has keys and they're all activated, mark as COMPLETED
        if (order.keys.length > 0 && order.keys.every((k) => k.activated)) {
          if (order.status !== 'COMPLETED') {
            newStatus = 'COMPLETED';
            shouldUpdate = true;
          }
        }
        // 2. If order has keys but none are activated, mark as PROCESSING
        else if (order.keys.length > 0 && !order.keys.some((k) => k.activated)) {
          if (order.status === 'PENDING') {
            newStatus = 'PROCESSING';
            shouldUpdate = true;
          }
        }
        // 3. If order is PENDING for more than 24 hours without keys, mark as FAILED
        else if (order.status === 'PENDING' && order.keys.length === 0) {
          const hoursSinceCreation = (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60);
          if (hoursSinceCreation > 24) {
            newStatus = 'FAILED';
            shouldUpdate = true;
          }
        }
        // 4. If order is PROCESSING for more than 48 hours, mark as FAILED
        else if (order.status === 'PROCESSING') {
          const hoursSinceCreation = (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60);
          if (hoursSinceCreation > 48) {
            newStatus = 'FAILED';
            shouldUpdate = true;
          }
        }

        if (options.dryRun) {
          if (shouldUpdate && newStatus) {
            const statusChange = `${order.status} → ${newStatus}`;
            statusChanges[statusChange] = (statusChanges[statusChange] || 0) + 1;

            console.log(
              `📊 Order ${order.id}: ${order.status} → ${newStatus} (Keys: ${order.keys.length}, Activated: ${order.keys.filter((k) => k.activated).length})`
            );
          } else {
            console.log(`✓ Order ${order.id}: ${order.status} (no change needed)`);
            totalSkipped++;
          }
        } else {
          if (shouldUpdate && newStatus) {
            try {
              await updateOrder(order.id, {
                status: newStatus as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED',
              });

              const statusChange = `${order.status} → ${newStatus}`;
              statusChanges[statusChange] = (statusChanges[statusChange] || 0) + 1;

              totalUpdated++;

              if (totalUpdated % 10 === 0) {
                process.stdout.write(`\r💾 Updated: ${totalUpdated} orders...`);
              }
            } catch (updateError) {
              console.error(`\n❌ Error updating order ${order.id}:`, updateError);
              totalErrors++;
            }
          } else {
            totalSkipped++;
          }
        }
      } catch (error) {
        console.error(`\n❌ Error processing order ${order.id}:`, error);
        totalErrors++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n');
    if (options.dryRun) {
      console.log('📊 Statistics:');
      console.log(`   Total orders: ${orders.length}`);
      console.log(`   Status changes: ${Object.keys(statusChanges).length}`);
      Object.entries(statusChanges).forEach(([change, count]) => {
        console.log(`     ${change}: ${count}`);
      });
      console.log(`   Skipped: ${totalSkipped}`);
      console.log(`   Errors: ${totalErrors}`);
      console.log(`   Duration: ${duration}s`);
      console.log('\n💡 Run without --dry-run to save to database');
    } else {
      console.log('✅ Sync completed!');
      console.log(`   Total orders: ${orders.length}`);
      console.log(`   Total updated: ${totalUpdated}`);
      console.log(`   Status changes:`);
      Object.entries(statusChanges).forEach(([change, count]) => {
        console.log(`     ${change}: ${count}`);
      });
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
  await syncOrders(options);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
