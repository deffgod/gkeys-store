#!/usr/bin/env tsx
/**
 * Analyze and Fix Game Relations Script
 * 
 * Проверяет и улучшает связи между играми по жанрам, тегам, категориям и платформам.
 * Находит игры с недостаточными связями и создает логичные пересечения.
 * 
 * Usage:
 *   npx tsx scripts/analyze-and-fix-game-relations.ts [--dry-run] [--fix]
 * 
 * Options:
 *   --dry-run    Только анализ, без изменений
 *   --fix        Исправить найденные проблемы
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

interface GameStats {
  id: string;
  title: string;
  categories: number;
  genres: number;
  platforms: number;
  tags: number;
  totalRelations: number;
}

interface RelationStats {
  totalGames: number;
  gamesWithCategories: number;
  gamesWithGenres: number;
  gamesWithPlatforms: number;
  gamesWithTags: number;
  gamesWithAllRelations: number;
  gamesWithNoRelations: number;
  averageCategoriesPerGame: number;
  averageGenresPerGame: number;
  averagePlatformsPerGame: number;
  averageTagsPerGame: number;
}

async function analyzeRelations(): Promise<RelationStats> {
  console.log('\n📊 Анализ связей между играми...\n');

  const totalGames = await prisma.game.count();
  
  const gamesWithCategories = await prisma.game.count({
    where: { categories: { some: {} } },
  });
  
  const gamesWithGenres = await prisma.game.count({
    where: { genres: { some: {} } },
  });
  
  const gamesWithPlatforms = await prisma.game.count({
    where: { platforms: { some: {} } },
  });
  
  const gamesWithTags = await prisma.game.count({
    where: { tags: { some: {} } },
  });
  
  const gamesWithAllRelations = await prisma.game.count({
    where: {
      categories: { some: {} },
      genres: { some: {} },
      platforms: { some: {} },
      tags: { some: {} },
    },
  });
  
  const gamesWithNoRelations = await prisma.game.count({
    where: {
      categories: { none: {} },
      genres: { none: {} },
      platforms: { none: {} },
      tags: { none: {} },
    },
  });

  // Подсчет средних значений
  const totalCategories = await prisma.gameCategory.count();
  const totalGenres = await prisma.gameGenre.count();
  const totalPlatforms = await prisma.gamePlatform.count();
  const totalTags = await prisma.gameTag.count();

  const stats: RelationStats = {
    totalGames,
    gamesWithCategories,
    gamesWithGenres,
    gamesWithPlatforms,
    gamesWithTags,
    gamesWithAllRelations,
    gamesWithNoRelations,
    averageCategoriesPerGame: totalGames > 0 ? totalCategories / totalGames : 0,
    averageGenresPerGame: totalGames > 0 ? totalGenres / totalGames : 0,
    averagePlatformsPerGame: totalGames > 0 ? totalPlatforms / totalGames : 0,
    averageTagsPerGame: totalGames > 0 ? totalTags / totalGames : 0,
  };

  return stats;
}

async function findGamesNeedingRelations(): Promise<GameStats[]> {
  const games = await prisma.game.findMany({
    include: {
      categories: true,
      genres: true,
      platforms: true,
      tags: true,
    },
    take: 1000, // Ограничиваем для производительности
  });

  const gamesNeedingRelations: GameStats[] = [];

  for (const game of games) {
    const categories = game.categories.length;
    const genres = game.genres.length;
    const platforms = game.platforms.length;
    const tags = game.tags.length;
    const totalRelations = categories + genres + platforms + tags;

    // Игры с недостаточными связями
    if (totalRelations < 3 || categories === 0 || genres === 0 || platforms === 0) {
      gamesNeedingRelations.push({
        id: game.id,
        title: game.title,
        categories,
        genres,
        platforms,
        tags,
        totalRelations,
      });
    }
  }

  return gamesNeedingRelations.sort((a, b) => a.totalRelations - b.totalRelations);
}

async function findCommonRelations(): Promise<{
  commonCategories: Array<{ id: string; name: string; count: number }>;
  commonGenres: Array<{ id: string; name: string; count: number }>;
  commonPlatforms: Array<{ id: string; name: string; count: number }>;
  commonTags: Array<{ id: string; name: string; count: number }>;
}> {
  // Находим самые популярные категории
  const categoryCounts = await prisma.gameCategory.groupBy({
    by: ['categoryId'],
    _count: { categoryId: true },
    orderBy: { _count: { categoryId: 'desc' } },
    take: 10,
  });

  const commonCategories = await Promise.all(
    categoryCounts.map(async (cc) => {
      const category = await prisma.category.findUnique({
        where: { id: cc.categoryId },
      });
      return {
        id: cc.categoryId,
        name: category?.name || 'Unknown',
        count: cc._count.categoryId,
      };
    })
  );

  // Находим самые популярные жанры
  const genreCounts = await prisma.gameGenre.groupBy({
    by: ['genreId'],
    _count: { genreId: true },
    orderBy: { _count: { genreId: 'desc' } },
    take: 10,
  });

  const commonGenres = await Promise.all(
    genreCounts.map(async (gc) => {
      const genre = await prisma.genre.findUnique({
        where: { id: gc.genreId },
      });
      return {
        id: gc.genreId,
        name: genre?.name || 'Unknown',
        count: gc._count.genreId,
      };
    })
  );

  // Находим самые популярные платформы
  const platformCounts = await prisma.gamePlatform.groupBy({
    by: ['platformId'],
    _count: { platformId: true },
    orderBy: { _count: { platformId: 'desc' } },
    take: 10,
  });

  const commonPlatforms = await Promise.all(
    platformCounts.map(async (pc) => {
      const platform = await prisma.platform.findUnique({
        where: { id: pc.platformId },
      });
      return {
        id: pc.platformId,
        name: platform?.name || 'Unknown',
        count: pc._count.platformId,
      };
    })
  );

  // Находим самые популярные теги
  const tagCounts = await prisma.gameTag.groupBy({
    by: ['tagId'],
    _count: { tagId: true },
    orderBy: { _count: { tagId: 'desc' } },
    take: 10,
  });

  const commonTags = await Promise.all(
    tagCounts.map(async (tc) => {
      const tag = await prisma.tag.findUnique({
        where: { id: tc.tagId },
      });
      return {
        id: tc.tagId,
        name: tag?.name || 'Unknown',
        count: tc._count.tagId,
      };
    })
  );

  return {
    commonCategories,
    commonGenres,
    commonPlatforms,
    commonTags,
  };
}

// Умное определение платформы из названия игры
function detectPlatformFromTitle(title: string): string[] {
  const titleLower = title.toLowerCase();
  const platforms: string[] = [];

  const platformKeywords: Record<string, string[]> = {
    'Steam': ['steam', 'steam key', 'steam gift'],
    'Xbox Live': ['xbox', 'xbox live', 'xbox series', 'xbox one', 'xbox 360'],
    'PlayStation': ['playstation', 'ps4', 'ps5', 'psn'],
    'Nintendo': ['nintendo', 'switch', 'eshop'],
    'Epic Games': ['epic games', 'epic store'],
    'Battle.net': ['battle.net', 'battlenet', 'blizzard'],
    'Ubisoft Connect': ['ubisoft', 'uplay'],
    'Origin': ['origin', 'ea'],
    'GOG': ['gog', 'gog.com'],
    'PC': ['pc', 'windows', 'microsoft'],
  };

  for (const [platform, keywords] of Object.entries(platformKeywords)) {
    if (keywords.some(keyword => titleLower.includes(keyword))) {
      platforms.push(platform);
    }
  }

  // Если ничего не найдено, используем PC по умолчанию
  if (platforms.length === 0) {
    platforms.push('PC');
  }

  return platforms;
}

// Умное определение жанра из названия игры
function detectGenreFromTitle(title: string, description?: string): string[] {
  const text = `${title} ${description || ''}`.toLowerCase();
  const genres: string[] = [];

  const genreKeywords: Record<string, string[]> = {
    'Action': ['action', 'shooter', 'fps', 'tps', 'combat', 'fight', 'war', 'battle'],
    'Adventure': ['adventure', 'explore', 'quest', 'journey', 'story'],
    'RPG': ['rpg', 'role-playing', 'role playing', 'character', 'level', 'skill'],
    'Strategy': ['strategy', 'tactical', 'simulation', 'sim', 'manage', 'build', 'city'],
    'Racing': ['racing', 'race', 'drive', 'car', 'vehicle'],
    'Sports': ['sport', 'football', 'soccer', 'basketball', 'tennis'],
    'Puzzle': ['puzzle', 'brain', 'solve', 'match'],
    'Horror': ['horror', 'scary', 'zombie', 'survival'],
    'Simulation': ['simulation', 'sim', 'tycoon', 'manager'],
    'Indie': ['indie', 'independent'],
  };

  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      genres.push(genre);
    }
  }

  // Если ничего не найдено, используем Action по умолчанию
  if (genres.length === 0) {
    genres.push('Action');
  }

  return genres.slice(0, 2); // Максимум 2 жанра
}

// Умное определение категории
function detectCategoryFromTitle(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('simulator') || titleLower.includes('sim')) {
    return 'Simulation';
  }
  if (titleLower.includes('strategy') || titleLower.includes('tactical')) {
    return 'Strategy';
  }
  if (titleLower.includes('racing') || titleLower.includes('drive')) {
    return 'Racing';
  }
  if (titleLower.includes('sport') || titleLower.includes('football') || titleLower.includes('soccer')) {
    return 'Sports';
  }
  
  return 'Games'; // По умолчанию
}

async function findOrCreateCategory(name: string, tx?: any): Promise<string> {
  const db = tx || prisma;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  let category = await db.category.findFirst({
    where: { OR: [{ name }, { slug }] },
  });

  if (!category) {
    category = await db.category.create({
      data: { name, slug },
    });
  }

  return category.id;
}

async function findOrCreateGenre(name: string, tx?: any): Promise<string> {
  const db = tx || prisma;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  let genre = await db.genre.findFirst({
    where: { OR: [{ name }, { slug }] },
  });

  if (!genre) {
    genre = await db.genre.create({
      data: { name, slug },
    });
  }

  return genre.id;
}

async function findOrCreatePlatform(name: string, tx?: any): Promise<string> {
  const db = tx || prisma;
  let platform = await db.platform.findFirst({
    where: { name },
  });

  if (!platform) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    platform = await db.platform.create({
      data: { name, slug },
    });
  }

  return platform.id;
}

async function findOrCreateTag(name: string, tx?: any): Promise<string> {
  const db = tx || prisma;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  let tag = await db.tag.findFirst({
    where: { OR: [{ name }, { slug }] },
  });

  if (!tag) {
    tag = await db.tag.create({
      data: { name, slug },
    });
  }

  return tag.id;
}

async function fixGameRelations(dryRun: boolean = true): Promise<void> {
  console.log('\n🔧 Исправление связей между играми...\n');

  const gamesNeedingRelations = await findGamesNeedingRelations();
  const common = await findCommonRelations();

  console.log(`📋 Найдено игр, требующих улучшения: ${gamesNeedingRelations.length}\n`);

  if (gamesNeedingRelations.length === 0) {
    console.log('✅ Все игры имеют достаточные связи!\n');
    return;
  }

  let fixed = 0;
  let skipped = 0;
  let errors = 0;

  // Обрабатываем игры батчами (без транзакций для избежания таймаутов)
  const batchSize = 50;
  const gamesToProcess = gamesNeedingRelations.slice(0, 2000); // Ограничиваем для стабильности
  const totalBatches = Math.ceil(gamesToProcess.length / batchSize);

  console.log(`📦 Обработка ${gamesToProcess.length} игр в ${totalBatches} батчах...\n`);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batch = gamesToProcess.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);
    
    for (const game of batch) {
      try {
        // Получаем полную информацию об игре
        const currentGame = await prisma.game.findUnique({
          where: { id: game.id },
          include: {
            categories: true,
            genres: true,
            platforms: true,
            tags: true,
          },
        });

        if (!currentGame) {
          skipped++;
          continue;
        }

        const updates: {
          categories?: { connect: Array<{ id: string }> };
          genres?: { connect: Array<{ id: string }> };
          platforms?: { connect: Array<{ id: string }> };
          tags?: { connect: Array<{ id: string }> };
        } = {};

        // Умное определение платформы из названия
        if (currentGame.platforms.length === 0) {
          const detectedPlatforms = detectPlatformFromTitle(currentGame.title);
          const platformIds: string[] = [];
          
          for (const platformName of detectedPlatforms) {
            const platformId = await findOrCreatePlatform(platformName);
            if (!currentGame.platforms.find(p => p.platformId === platformId)) {
              platformIds.push(platformId);
            }
          }
          
          if (platformIds.length > 0) {
            updates.platforms = { connect: platformIds.map(id => ({ id })) };
          }
        }

        // Умное определение жанра из названия
        if (currentGame.genres.length === 0) {
          const detectedGenres = detectGenreFromTitle(currentGame.title, currentGame.description);
          const genreIds: string[] = [];
          
          for (const genreName of detectedGenres) {
            const genreId = await findOrCreateGenre(genreName);
            if (!currentGame.genres.find(g => g.genreId === genreId)) {
              genreIds.push(genreId);
            }
          }
          
          if (genreIds.length > 0) {
            updates.genres = { connect: genreIds.map(id => ({ id })) };
          }
        }

        // Умное определение категории
        if (currentGame.categories.length === 0) {
          const detectedCategory = detectCategoryFromTitle(currentGame.title);
          const categoryId = await findOrCreateCategory(detectedCategory);
          
          if (!currentGame.categories.find(c => c.categoryId === categoryId)) {
            updates.categories = { connect: [{ id: categoryId }] };
          }
        }

        // Добавляем теги на основе характеристик игры
        if (currentGame.tags.length === 0) {
          const tagIds: string[] = [];
          
          // Определяем теги на основе характеристик
          if (currentGame.multiplayer) {
            const multiplayerTagId = await findOrCreateTag('Multiplayer');
            tagIds.push(multiplayerTagId);
          } else {
            const singlePlayerTagId = await findOrCreateTag('Single Player');
            tagIds.push(singlePlayerTagId);
          }
          
          if (currentGame.isBestSeller) {
            const bestsellerTagId = await findOrCreateTag('Bestseller');
            tagIds.push(bestsellerTagId);
          }
          
          if (tagIds.length > 0) {
            updates.tags = { connect: tagIds.map(id => ({ id })) };
          }
        }

        // Применяем изменения
        if (Object.keys(updates).length > 0) {
          if (!dryRun) {
            await prisma.game.update({
              where: { id: game.id },
              data: updates,
            });
            fixed++;
            if (fixed % 50 === 0) {
              process.stdout.write(`\r✅ Исправлено: ${fixed} игр...`);
            }
          } else {
            fixed++;
            if (fixed % 50 === 0) {
              process.stdout.write(`\r📝 Будет исправлено: ${fixed} игр...`);
            }
          }
        } else {
          skipped++;
        }
      } catch (error) {
        errors++;
        if (errors <= 5) {
          console.error(`\n❌ Ошибка при обновлении игры ${game.title}:`, error);
        }
      }
    }

    // Показываем прогресс после каждого батча
    const progress = ((batchIndex + 1) / totalBatches * 100).toFixed(1);
    console.log(`\n📊 Батч ${batchIndex + 1}/${totalBatches} (${progress}%) | Исправлено: ${fixed} | Пропущено: ${skipped} | Ошибок: ${errors}`);
    
    // Небольшая задержка между батчами
    if (batchIndex + 1 < totalBatches) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`\n\n✅ Обработано: ${fixed} игр`);
  if (skipped > 0) {
    console.log(`⏭️  Пропущено: ${skipped} игр`);
  }
  if (errors > 0) {
    console.log(`❌ Ошибок: ${errors} игр`);
  }
}

function printStats(stats: RelationStats, common: Awaited<ReturnType<typeof findCommonRelations>>): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 СТАТИСТИКА СВЯЗЕЙ МЕЖДУ ИГРАМИ');
  console.log('='.repeat(60));
  
  console.log(`\n🎮 Всего игр: ${stats.totalGames}`);
  console.log(`\n📈 Игры со связями:`);
  console.log(`   • С категориями: ${stats.gamesWithCategories} (${((stats.gamesWithCategories / stats.totalGames) * 100).toFixed(1)}%)`);
  console.log(`   • С жанрами: ${stats.gamesWithGenres} (${((stats.gamesWithGenres / stats.totalGames) * 100).toFixed(1)}%)`);
  console.log(`   • С платформами: ${stats.gamesWithPlatforms} (${((stats.gamesWithPlatforms / stats.totalGames) * 100).toFixed(1)}%)`);
  console.log(`   • С тегами: ${stats.gamesWithTags} (${((stats.gamesWithTags / stats.totalGames) * 100).toFixed(1)}%)`);
  console.log(`   • Со всеми связями: ${stats.gamesWithAllRelations} (${((stats.gamesWithAllRelations / stats.totalGames) * 100).toFixed(1)}%)`);
  console.log(`   • Без связей: ${stats.gamesWithNoRelations} (${((stats.gamesWithNoRelations / stats.totalGames) * 100).toFixed(1)}%)`);

  console.log(`\n📊 Средние значения:`);
  console.log(`   • Категорий на игру: ${stats.averageCategoriesPerGame.toFixed(2)}`);
  console.log(`   • Жанров на игру: ${stats.averageGenresPerGame.toFixed(2)}`);
  console.log(`   • Платформ на игру: ${stats.averagePlatformsPerGame.toFixed(2)}`);
  console.log(`   • Тегов на игру: ${stats.averageTagsPerGame.toFixed(2)}`);

  console.log(`\n🏆 Самые популярные категории:`);
  common.commonCategories.slice(0, 5).forEach((cat, i) => {
    console.log(`   ${i + 1}. ${cat.name} (${cat.count} игр)`);
  });

  console.log(`\n🎭 Самые популярные жанры:`);
  common.commonGenres.slice(0, 5).forEach((genre, i) => {
    console.log(`   ${i + 1}. ${genre.name} (${genre.count} игр)`);
  });

  console.log(`\n💻 Самые популярные платформы:`);
  common.commonPlatforms.slice(0, 5).forEach((platform, i) => {
    console.log(`   ${i + 1}. ${platform.name} (${platform.count} игр)`);
  });

  console.log(`\n🏷️  Самые популярные теги:`);
  common.commonTags.slice(0, 5).forEach((tag, i) => {
    console.log(`   ${i + 1}. ${tag.name} (${tag.count} игр)`);
  });

  console.log('\n' + '='.repeat(60) + '\n');
}

async function analyzeGameIntersections(): Promise<void> {
  console.log('\n🔗 Анализ пересечений между играми...\n');

  // Находим игры, которые пересекаются по жанрам
  const gamesByGenre = await prisma.gameGenre.groupBy({
    by: ['genreId'],
    _count: { gameId: true },
    having: {
      gameId: {
        _count: {
          gt: 1, // Больше одной игры
        },
      },
    },
    orderBy: {
      _count: {
        gameId: 'desc',
      },
    },
    take: 10,
  });

  console.log('🎭 Игры, пересекающиеся по жанрам:');
  for (const group of gamesByGenre) {
    const genre = await prisma.genre.findUnique({ where: { id: group.genreId } });
    const games = await prisma.game.findMany({
      where: { genres: { some: { genreId: group.genreId } } },
      select: { title: true },
      take: 5,
    });
    
    console.log(`\n   ${genre?.name || 'Unknown'} (${group._count.gameId} игр):`);
    games.forEach((game, i) => {
      console.log(`      ${i + 1}. ${game.title}`);
    });
    if (group._count.gameId > 5) {
      console.log(`      ... и еще ${group._count.gameId - 5} игр`);
    }
  }

  // Находим игры, которые пересекаются по категориям
  const gamesByCategory = await prisma.gameCategory.groupBy({
    by: ['categoryId'],
    _count: { gameId: true },
    having: {
      gameId: {
        _count: {
          gt: 1,
        },
      },
    },
    orderBy: {
      _count: {
        gameId: 'desc',
      },
    },
    take: 10,
  });

  console.log('\n\n📂 Игры, пересекающиеся по категориям:');
  for (const group of gamesByCategory) {
    const category = await prisma.category.findUnique({ where: { id: group.categoryId } });
    const games = await prisma.game.findMany({
      where: { categories: { some: { categoryId: group.categoryId } } },
      select: { title: true },
      take: 5,
    });
    
    console.log(`\n   ${category?.name || 'Unknown'} (${group._count.gameId} игр):`);
    games.forEach((game, i) => {
      console.log(`      ${i + 1}. ${game.title}`);
    });
    if (group._count.gameId > 5) {
      console.log(`      ... и еще ${group._count.gameId - 5} игр`);
    }
  }

  // Находим игры, которые пересекаются по платформам
  const gamesByPlatform = await prisma.gamePlatform.groupBy({
    by: ['platformId'],
    _count: { gameId: true },
    having: {
      gameId: {
        _count: {
          gt: 1,
        },
      },
    },
    orderBy: {
      _count: {
        gameId: 'desc',
      },
    },
    take: 10,
  });

  console.log('\n\n💻 Игры, пересекающиеся по платформам:');
  for (const group of gamesByPlatform) {
    const platform = await prisma.platform.findUnique({ where: { id: group.platformId } });
    const games = await prisma.game.findMany({
      where: { platforms: { some: { platformId: group.platformId } } },
      select: { title: true },
      take: 5,
    });
    
    console.log(`\n   ${platform?.name || 'Unknown'} (${group._count.gameId} игр):`);
    games.forEach((game, i) => {
      console.log(`      ${i + 1}. ${game.title}`);
    });
    if (group._count.gameId > 5) {
      console.log(`      ... и еще ${group._count.gameId - 5} игр`);
    }
  }

  console.log('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || !args.includes('--fix');

  try {
    console.log('🔍 Анализ связей между играми...\n');

    // Анализ
    const stats = await analyzeRelations();
    const common = await findCommonRelations();
    printStats(stats, common);

    // Анализ пересечений
    await analyzeGameIntersections();

    // Поиск игр, требующих улучшения
    const gamesNeedingRelations = await findGamesNeedingRelations();
    
    if (gamesNeedingRelations.length > 0) {
      console.log(`\n⚠️  Найдено ${gamesNeedingRelations.length} игр с недостаточными связями\n`);
      console.log('📋 Примеры игр, требующих улучшения:');
      gamesNeedingRelations.slice(0, 10).forEach((game, i) => {
        console.log(`   ${i + 1}. ${game.title}`);
        console.log(`      Категории: ${game.categories}, Жанры: ${game.genres}, Платформы: ${game.platforms}, Теги: ${game.tags}`);
      });
    }

    // Исправление
    if (!dryRun) {
      console.log('\n🔧 Запуск исправления...\n');
      await fixGameRelations(false);
      
      // Повторный анализ после исправления
      console.log('\n\n📊 Повторный анализ после исправления...\n');
      const newStats = await analyzeRelations();
      const newCommon = await findCommonRelations();
      printStats(newStats, newCommon);
      
      console.log('\n✅ Исправление завершено!\n');
    } else {
      console.log('\n💡 Для применения изменений запустите с флагом --fix:');
      console.log('   npx tsx scripts/analyze-and-fix-game-relations.ts --fix\n');
    }

  } catch (error) {
    console.error('\n❌ Ошибка:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
