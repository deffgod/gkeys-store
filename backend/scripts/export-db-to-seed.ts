#!/usr/bin/env tsx
/**
 * Export Database to Seed File
 * 
 * Экспортирует все данные из базы данных в seed файл для последующего использования
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

async function exportDatabaseToSeed() {
  console.log('📦 Exporting database to seed file...\n');

  try {
    // Export all data
    const [games, categories, genres, platforms, tags, users] = await Promise.all([
      prisma.game.findMany({
        include: {
          categories: { include: { category: true } },
          genres: { include: { genre: true } },
          platforms: { include: { platform: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.category.findMany({ orderBy: { slug: 'asc' } }),
      prisma.genre.findMany({ orderBy: { slug: 'asc' } }),
      prisma.platform.findMany({ orderBy: { slug: 'asc' } }),
      prisma.tag.findMany({ orderBy: { slug: 'asc' } }),
      prisma.user.findMany({
        select: {
          email: true,
          nickname: true,
          firstName: true,
          lastName: true,
          role: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    console.log(`✅ Found ${games.length} games`);
    console.log(`✅ Found ${categories.length} categories`);
    console.log(`✅ Found ${genres.length} genres`);
    console.log(`✅ Found ${platforms.length} platforms`);
    console.log(`✅ Found ${tags.length} tags`);
    console.log(`✅ Found ${users.length} users\n`);

    // Transform games to seed format
    const seedGames = games.map((game) => {
      const gameData: any = {
        title: game.title,
        slug: game.slug,
        description: game.description || '',
        shortDescription: game.shortDescription || '',
        price: Number(game.price),
        originalPrice: game.originalPrice ? Number(game.originalPrice) : undefined,
        discount: game.discount || undefined,
        currency: game.currency,
        image: game.image || '',
        images: game.images || [],
        inStock: game.inStock,
        releaseDate: game.releaseDate.toISOString(),
        isBestSeller: game.isBestSeller,
        isNew: game.isNew,
        isPreorder: game.isPreorder,
        multiplayer: game.multiplayer,
        publisher: game.publisher || undefined,
        developer: game.developer || undefined,
        activationService: game.activationService || undefined,
        region: game.region || undefined,
        g2aProductId: game.g2aProductId || undefined,
        categories: game.categories.map((gc) => gc.category.slug),
        genres: game.genres.map((gg) => gg.genre.slug),
        platforms: game.platforms.map((gp) => gp.platform.slug),
        tags: game.tags.map((gt) => gt.tag.slug),
      };

      // Remove undefined values
      Object.keys(gameData).forEach((key) => {
        if (gameData[key] === undefined) {
          delete gameData[key];
        }
      });

      return gameData;
    });

    // Create seed data structure
    const seedData = {
      exportedAt: new Date().toISOString(),
      games: seedGames,
      categories: categories.map((cat) => ({
        name: cat.name,
        slug: cat.slug,
      })),
      genres: genres.map((genre) => ({
        name: genre.name,
        slug: genre.slug,
      })),
      platforms: platforms.map((platform) => ({
        name: platform.name,
        slug: platform.slug,
      })),
      tags: tags.map((tag) => ({
        name: tag.name,
        slug: tag.slug,
      })),
      users: users.map((user) => ({
        email: user.email,
        nickname: user.nickname || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        role: user.role,
      })),
    };

    // Write to seed data file
    const seedFilePath = path.join(process.cwd(), 'prisma', 'seed-data.json');
    await fs.writeFile(seedFilePath, JSON.stringify(seedData, null, 2));

    console.log(`✅ Seed data exported to: ${seedFilePath}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Games: ${seedGames.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Genres: ${genres.length}`);
    console.log(`   Platforms: ${platforms.length}`);
    console.log(`   Tags: ${tags.length}`);
    console.log(`   Users: ${users.length}`);

  } catch (error) {
    console.error('❌ Error exporting database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  exportDatabaseToSeed()
    .then(() => {
      console.log('\n✅ Export completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Export failed:', error);
      process.exit(1);
    });
}
