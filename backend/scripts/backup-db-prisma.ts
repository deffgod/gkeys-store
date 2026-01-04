#!/usr/bin/env tsx
/**
 * Database Backup Script (Prisma-based)
 * 
 * Создает полный бэкап базы данных через Prisma и сохраняет его в папке prisma
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Prisma client with direct URL (bypass Prisma Accelerate)
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL or DIRECT_URL not found in environment variables');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function backupDatabase() {
  console.log('📦 Creating database backup via Prisma...\n');

  try {
    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = path.join(process.cwd(), 'prisma');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    const backupFileLatest = path.join(backupDir, 'backup-latest.json');

    // Ensure prisma directory exists
    await fs.mkdir(backupDir, { recursive: true });

    console.log(`📊 Backup file: ${backupFile}\n`);

    // Test database connection first
    console.log('🔌 Testing database connection...');
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful\n');
    } catch (error: any) {
      console.error('❌ Cannot connect to database:', error.message);
      console.error('\n⚠️  Please check:');
      console.error('   1. DATABASE_URL or DIRECT_URL is set correctly');
      console.error('   2. Database server is accessible');
      console.error('   3. Network connection is available\n');
      throw new Error('Database connection failed');
    }

    // Export all data from all tables
    console.log('🔄 Exporting data...');

    const [
      users,
      games,
      categories,
      genres,
      platforms,
      tags,
      gameCategories,
      gameGenres,
      gamePlatforms,
      gameTags,
      orders,
      orderItems,
      gameKeys,
      transactions,
      cartItems,
      wishlistItems,
      promoCodes,
      articles,
      paymentMethods,
      paymentForms,
      sessions,
      faqs,
      loginHistory,
    ] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.game.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.category.findMany({ orderBy: { slug: 'asc' } }),
      prisma.genre.findMany({ orderBy: { slug: 'asc' } }),
      prisma.platform.findMany({ orderBy: { slug: 'asc' } }),
      prisma.tag.findMany({ orderBy: { slug: 'asc' } }),
      prisma.gameCategory.findMany(),
      prisma.gameGenre.findMany(),
      prisma.gamePlatform.findMany(),
      prisma.gameTag.findMany(),
      prisma.order.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.orderItem.findMany(),
      prisma.gameKey.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.transaction.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.cartItem.findMany(),
      prisma.wishlist.findMany(),
      prisma.promoCode.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.article.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.paymentMethod.findMany({ orderBy: { order: 'asc' } }),
      prisma.paymentForm.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.session.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.fAQ.findMany({ orderBy: [{ category: 'asc' }, { order: 'asc' }] }),
      prisma.loginHistory.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    // Create backup data structure
    const backupData = {
      exportedAt: new Date().toISOString(),
      databaseUrl: databaseUrl.replace(/:[^:@]+@/, ':****@'), // Mask password
      version: '1.0',
      tables: {
        users: users.length,
        games: games.length,
        categories: categories.length,
        genres: genres.length,
        platforms: platforms.length,
        tags: tags.length,
        gameCategories: gameCategories.length,
        gameGenres: gameGenres.length,
        gamePlatforms: gamePlatforms.length,
        gameTags: gameTags.length,
        orders: orders.length,
        orderItems: orderItems.length,
        gameKeys: gameKeys.length,
        transactions: transactions.length,
        cartItems: cartItems.length,
        wishlistItems: wishlistItems.length,
        promoCodes: promoCodes.length,
        articles: articles.length,
        paymentMethods: paymentMethods.length,
        paymentForms: paymentForms.length,
        sessions: sessions.length,
        faqs: faqs.length,
        loginHistory: loginHistory.length,
      },
      data: {
        users: users.map((u) => ({
          ...u,
          passwordHash: '***REDACTED***', // Don't backup passwords
        })),
        games,
        categories,
        genres,
        platforms,
        tags,
        gameCategories,
        gameGenres,
        gamePlatforms,
        gameTags,
        orders,
        orderItems,
        gameKeys: gameKeys.map((k) => ({
          ...k,
          key: '***REDACTED***', // Don't backup game keys
        })),
        transactions,
        cartItems,
        wishlistItems,
        promoCodes,
        articles,
        paymentMethods,
        paymentForms,
        sessions,
        faqs,
        loginHistory,
      },
    };

    // Write backup file
    console.log('💾 Writing backup file...');
    await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');

    // Create latest backup link
    await fs.writeFile(backupFileLatest, JSON.stringify(backupData, null, 2), 'utf-8');

    // Get file size
    const stats = await fs.stat(backupFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`\n✅ Backup created successfully!`);
    console.log(`   File: ${backupFile}`);
    console.log(`   Latest: ${backupFileLatest}`);
    console.log(`   Size: ${fileSizeMB} MB`);
    console.log(`   Timestamp: ${timestamp}`);
    console.log(`\n📊 Summary:`);
    Object.entries(backupData.tables).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} records`);
    });

    // Also create a SQL-like export for easier restore
    console.log('\n🔄 Creating SQL export...');
    const sqlFile = path.join(backupDir, `backup-${timestamp}.sql`);
    let sqlContent = `-- Database Backup\n`;
    sqlContent += `-- Exported at: ${backupData.exportedAt}\n`;
    sqlContent += `-- Database: ${backupData.databaseUrl}\n\n`;

    // Note: This is a simplified SQL export. For full restore, use the JSON file.
    sqlContent += `-- This is a summary backup. Full data is in the JSON file.\n`;
    sqlContent += `-- To restore, use the JSON backup file with Prisma.\n\n`;

    Object.entries(backupData.tables).forEach(([table, count]) => {
      sqlContent += `-- Table: ${table} - ${count} records\n`;
    });

    await fs.writeFile(sqlFile, sqlContent, 'utf-8');
    console.log(`✅ SQL summary created: ${sqlFile}`);

  } catch (error) {
    console.error('❌ Error creating backup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  backupDatabase()
    .then(() => {
      console.log('\n✅ Backup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Backup failed:', error);
      process.exit(1);
    });
}
