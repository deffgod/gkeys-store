#!/usr/bin/env tsx
/**
 * Update Seed File from API
 * 
 * Получает данные из API и обновляет seed файл
 */

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001/api';

async function updateSeedFromAPI() {
  console.log('📦 Fetching data from API to update seed file...\n');

  try {
    // Fetch all games
    const gamesResponse = await axios.get(`${API_BASE}/games?limit=1000`);
    const games = gamesResponse.data.data || [];

    console.log(`✅ Found ${games.length} games from API\n`);

    // Transform games to seed format
    const seedGames = games.map((game: any) => {
      const gameData: any = {
        title: game.title,
        slug: game.slug,
        description: game.description || '',
        shortDescription: game.shortDescription || '',
        price: Number(game.price),
        originalPrice: game.originalPrice ? Number(game.originalPrice) : undefined,
        discount: game.discount || undefined,
        currency: game.currency || 'EUR',
        image: game.image || '',
        images: game.images || [],
        inStock: game.inStock !== undefined ? game.inStock : true,
        releaseDate: game.releaseDate ? new Date(game.releaseDate).toISOString() : new Date().toISOString(),
        isBestSeller: game.isBestSeller || false,
        isNew: game.isNew || false,
        isPreorder: game.isPreorder || false,
        multiplayer: game.multiplayer || false,
        publisher: game.publisher || undefined,
        developer: game.developer || undefined,
        activationService: game.activationService || undefined,
        region: game.region || undefined,
        g2aProductId: game.g2aProductId || undefined,
        categories: game.categories?.map((c: any) => c.slug || c.name?.toLowerCase().replace(/\s+/g, '-')) || ['adventure'],
        genres: game.genres?.map((g: any) => g.slug || g.name?.toLowerCase().replace(/\s+/g, '-')) || ['adventure'],
        platforms: game.platforms?.map((p: any) => p.slug || p.name?.toLowerCase().replace(/\s+/g, '-')) || ['steam'],
        tags: game.tags?.map((t: any) => t.slug || t.name?.toLowerCase().replace(/\s+/g, '-')) || ['single-player'],
      };

      // Remove undefined values
      Object.keys(gameData).forEach((key) => {
        if (gameData[key] === undefined) {
          delete gameData[key];
        }
      });

      return gameData;
    });

    // Read current seed file
    const seedFilePath = path.join(process.cwd(), 'prisma', 'seed.ts');
    let seedContent = await fs.readFile(seedFilePath, 'utf-8');

    // Find the testGames array and replace it
    const gamesArrayStart = seedContent.indexOf('const testGames = [');
    const gamesArrayEnd = seedContent.indexOf('];', gamesArrayStart) + 2;

    if (gamesArrayStart === -1 || gamesArrayEnd === -1) {
      console.error('❌ Could not find testGames array in seed.ts');
      return;
    }

    // Generate new games array
    const newGamesArray = `const testGames = ${JSON.stringify(seedGames, null, 2).replace(/"/g, "'").replace(/'/g, "'")};`;

    // Replace the array
    const newSeedContent = 
      seedContent.substring(0, gamesArrayStart) + 
      newGamesArray + 
      seedContent.substring(gamesArrayEnd);

    // Write updated seed file
    await fs.writeFile(seedFilePath, newSeedContent);

    console.log(`✅ Seed file updated: ${seedFilePath}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Games: ${seedGames.length}`);

  } catch (error: any) {
    console.error('❌ Error updating seed file:', error.message);
    if (error.response) {
      console.error('   API Response:', error.response.status, error.response.statusText);
    }
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  updateSeedFromAPI()
    .then(() => {
      console.log('\n✅ Update completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Update failed:', error);
      process.exit(1);
    });
}
