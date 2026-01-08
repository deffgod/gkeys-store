#!/usr/bin/env tsx
/**
 * Restore Database from Backup
 * 
 * Восстанавливает базу данных из JSON бэкапа
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { hashPassword } from '../src/utils/bcrypt.js';

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

interface BackupData {
  exportedAt: string;
  version: string;
  tables: Record<string, number>;
  data: {
    users: any[];
    games: any[];
    categories: any[];
    genres: any[];
    platforms: any[];
    tags: any[];
    gameCategories: any[];
    gameGenres: any[];
    gamePlatforms: any[];
    gameTags: any[];
    orders: any[];
    orderItems: any[];
    gameKeys: any[];
    transactions: any[];
    cartItems: any[];
    wishlistItems: any[];
    promoCodes: any[];
    articles: any[];
    paymentMethods: any[];
    paymentForms: any[];
    sessions: any[];
    faqs: any[];
    loginHistory: any[];
  };
}

async function restoreFromBackup(backupFile: string) {
  console.log('📦 Restoring database from backup...\n');
  console.log(`📂 Backup file: ${backupFile}\n`);

  try {
    // Read backup file
    const backupContent = await fs.readFile(backupFile, 'utf-8');
    const backupData: BackupData = JSON.parse(backupContent);

    console.log(`✅ Backup loaded`);
    console.log(`   Exported at: ${backupData.exportedAt}`);
    console.log(`   Version: ${backupData.version}`);
    console.log(`\n📊 Data summary:`);
    Object.entries(backupData.tables).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} records`);
    });
    console.log('');

    // Test database connection
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Clear existing data (in reverse order of dependencies)
    console.log('🗑️  Clearing existing data...');
    await prisma.loginHistory.deleteMany();
    await prisma.fAQ.deleteMany();
    await prisma.session.deleteMany();
    await prisma.paymentForm.deleteMany();
    await prisma.paymentMethod.deleteMany();
    await prisma.article.deleteMany();
    await prisma.promoCode.deleteMany();
    await prisma.wishlist.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.gameKey.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.gameTag.deleteMany();
    await prisma.gamePlatform.deleteMany();
    await prisma.gameGenre.deleteMany();
    await prisma.gameCategory.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.platform.deleteMany();
    await prisma.genre.deleteMany();
    await prisma.category.deleteMany();
    await prisma.game.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Existing data cleared\n');

    // Restore data (in order of dependencies)
    console.log('🔄 Restoring data...\n');

    // 1. Categories
    if (backupData.data.categories.length > 0) {
      console.log(`   Restoring ${backupData.data.categories.length} categories...`);
      for (const category of backupData.data.categories) {
        await prisma.category.upsert({
          where: { slug: category.slug },
          update: category,
          create: category,
        });
      }
    }

    // 2. Genres
    if (backupData.data.genres.length > 0) {
      console.log(`   Restoring ${backupData.data.genres.length} genres...`);
      for (const genre of backupData.data.genres) {
        await prisma.genre.upsert({
          where: { slug: genre.slug },
          update: genre,
          create: genre,
        });
      }
    }

    // 3. Platforms
    if (backupData.data.platforms.length > 0) {
      console.log(`   Restoring ${backupData.data.platforms.length} platforms...`);
      for (const platform of backupData.data.platforms) {
        await prisma.platform.upsert({
          where: { slug: platform.slug },
          update: platform,
          create: platform,
        });
      }
    }

    // 4. Tags
    if (backupData.data.tags.length > 0) {
      console.log(`   Restoring ${backupData.data.tags.length} tags...`);
      for (const tag of backupData.data.tags) {
        await prisma.tag.upsert({
          where: { slug: tag.slug },
          update: tag,
          create: tag,
        });
      }
    }

    // 5. Users (with password restoration)
    if (backupData.data.users.length > 0) {
      console.log(`   Restoring ${backupData.data.users.length} users...`);
      for (const user of backupData.data.users) {
        // If password is redacted, set a default password
        const passwordHash = user.passwordHash === '***REDACTED***' 
          ? await hashPassword('password123')
          : user.passwordHash;

        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            ...user,
            passwordHash,
          },
          create: {
            ...user,
            passwordHash,
          },
        });
      }
    }

    // 6. Games
    if (backupData.data.games.length > 0) {
      console.log(`   Restoring ${backupData.data.games.length} games...`);
      for (const game of backupData.data.games) {
        await prisma.game.upsert({
          where: { id: game.id },
          update: game,
          create: game,
        });
      }
    }

    // 7. Game relations
    if (backupData.data.gameCategories.length > 0) {
      console.log(`   Restoring ${backupData.data.gameCategories.length} game categories...`);
      for (const gc of backupData.data.gameCategories) {
        await prisma.gameCategory.upsert({
          where: { id: gc.id },
          update: gc,
          create: gc,
        });
      }
    }

    if (backupData.data.gameGenres.length > 0) {
      console.log(`   Restoring ${backupData.data.gameGenres.length} game genres...`);
      for (const gg of backupData.data.gameGenres) {
        await prisma.gameGenre.upsert({
          where: { id: gg.id },
          update: gg,
          create: gg,
        });
      }
    }

    if (backupData.data.gamePlatforms.length > 0) {
      console.log(`   Restoring ${backupData.data.gamePlatforms.length} game platforms...`);
      for (const gp of backupData.data.gamePlatforms) {
        await prisma.gamePlatform.upsert({
          where: { id: gp.id },
          update: gp,
          create: gp,
        });
      }
    }

    if (backupData.data.gameTags.length > 0) {
      console.log(`   Restoring ${backupData.data.gameTags.length} game tags...`);
      for (const gt of backupData.data.gameTags) {
        await prisma.gameTag.upsert({
          where: { id: gt.id },
          update: gt,
          create: gt,
        });
      }
    }

    // 8. Game Keys (without actual keys)
    if (backupData.data.gameKeys.length > 0) {
      console.log(`   Restoring ${backupData.data.gameKeys.length} game keys (without actual keys)...`);
      for (const key of backupData.data.gameKeys) {
        // Skip if key is redacted
        if (key.key === '***REDACTED***') continue;
        
        await prisma.gameKey.upsert({
          where: { id: key.id },
          update: {
            ...key,
            key: key.key || 'PLACEHOLDER-KEY',
          },
          create: {
            ...key,
            key: key.key || 'PLACEHOLDER-KEY',
          },
        });
      }
    }

    // 9. Other data
    if (backupData.data.promoCodes.length > 0) {
      console.log(`   Restoring ${backupData.data.promoCodes.length} promo codes...`);
      for (const promo of backupData.data.promoCodes) {
        await prisma.promoCode.upsert({
          where: { code: promo.code },
          update: promo,
          create: promo,
        });
      }
    }

    if (backupData.data.articles.length > 0) {
      console.log(`   Restoring ${backupData.data.articles.length} articles...`);
      for (const article of backupData.data.articles) {
        await prisma.article.upsert({
          where: { slug: article.slug },
          update: article,
          create: article,
        });
      }
    }

    if (backupData.data.faqs.length > 0) {
      console.log(`   Restoring ${backupData.data.faqs.length} FAQs...`);
      for (const faq of backupData.data.faqs) {
        await prisma.fAQ.upsert({
          where: { id: faq.id },
          update: faq,
          create: faq,
        });
      }
    }

    console.log('\n✅ Database restored successfully!');
    console.log('\n📝 Note:');
    console.log('   - User passwords have been reset to "password123"');
    console.log('   - Game keys have been redacted for security');
    console.log('   - Some data (orders, transactions, etc.) may be empty');

  } catch (error) {
    console.error('❌ Error restoring from backup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
const backupFile = process.argv[2] || path.join(process.cwd(), 'prisma', 'backup-latest.json');

restoreFromBackup(backupFile)
  .then(() => {
    console.log('\n✅ Restore completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Restore failed:', error);
    process.exit(1);
  });
