#!/usr/bin/env tsx
/**
 * Update Game Badges Script
 * 
 * Updates game flags (isBestSeller, isNew, isPreorder) for better demo display
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateGameBadges() {
  console.log('\n🎮 Updating Game Badges...\n');

  try {
    // Get all games
    const allGames = await prisma.game.findMany({
      select: {
        id: true,
        title: true,
        releaseDate: true,
        isBestSeller: true,
        isNew: true,
        isPreorder: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Total games: ${allGames.length}`);

    if (allGames.length === 0) {
      console.log('⚠️  No games found in database');
      return;
    }

    // Mark first 20 games as Best Sellers
    const bestSellerIds = allGames.slice(0, Math.min(20, allGames.length)).map(g => g.id);
    
    // Mark games released in the last 14 days as New
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const newGameIds = allGames
      .filter(g => new Date(g.releaseDate) >= twoWeeksAgo)
      .map(g => g.id);
    
    // Mark 5 random games as Preorders (set future release date)
    const preorderCount = Math.min(5, allGames.length);
    const preorderGames = allGames
      .sort(() => Math.random() - 0.5)
      .slice(0, preorderCount);

    console.log(`\n📈 Updating badges:`);
    console.log(`   Best Sellers: ${bestSellerIds.length} games`);
    console.log(`   New Games: ${newGameIds.length} games`);
    console.log(`   Preorders: ${preorderGames.length} games`);

    // Update Best Sellers
    if (bestSellerIds.length > 0) {
      await prisma.game.updateMany({
        where: { id: { in: bestSellerIds } },
        data: { isBestSeller: true },
      });
      console.log(`\n✅ Updated ${bestSellerIds.length} Best Sellers`);
    }

    // Update New Games
    if (newGameIds.length > 0) {
      await prisma.game.updateMany({
        where: { id: { in: newGameIds } },
        data: { isNew: true },
      });
      console.log(`✅ Updated ${newGameIds.length} New Games`);
    }

    // Update Preorders (set future release date)
    for (const game of preorderGames) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 60) + 30); // 30-90 days in future

      await prisma.game.update({
        where: { id: game.id },
        data: {
          isPreorder: true,
          releaseDate: futureDate,
        },
      });
    }
    console.log(`✅ Updated ${preorderGames.length} Preorders`);

    // Reset other games
    const idsToReset = allGames
      .filter(g => 
        !bestSellerIds.includes(g.id) && 
        !newGameIds.includes(g.id) && 
        !preorderGames.some(pg => pg.id === g.id)
      )
      .map(g => g.id);

    if (idsToReset.length > 0) {
      await prisma.game.updateMany({
        where: { id: { in: idsToReset } },
        data: {
          isBestSeller: false,
          isNew: false,
          isPreorder: false,
        },
      });
      console.log(`✅ Reset ${idsToReset.length} other games`);
    }

    console.log('\n✅ Badge update completed successfully!\n');

    // Show summary
    const summary = await prisma.game.groupBy({
      by: ['isBestSeller', 'isNew', 'isPreorder'],
      _count: true,
    });

    console.log('📊 Summary:');
    summary.forEach(s => {
      const badges = [];
      if (s.isBestSeller) badges.push('Best Seller');
      if (s.isNew) badges.push('New');
      if (s.isPreorder) badges.push('Preorder');
      const label = badges.length > 0 ? badges.join(' + ') : 'No badges';
      console.log(`   ${label}: ${s._count} games`);
    });

  } catch (error) {
    console.error('\n❌ Error updating badges:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateGameBadges()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { updateGameBadges };
