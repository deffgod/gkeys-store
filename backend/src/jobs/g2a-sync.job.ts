import cron from 'node-cron';
import { syncG2ACatalog, validateGameStock, getG2APrices } from '../services/g2a.service.js';
import prisma from '../config/database.js';

/**
 * Retry helper with exponential backoff
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`[G2A Job] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Sync G2A catalog 2 times per day (at 2 AM and 2 PM)
 */
export const startG2ASyncJob = () => {
  cron.schedule('0 2,14 * * *', async () => {
    console.log('🔄 [G2A Job] Starting G2A catalog sync...');
    try {
      const result = await retryWithBackoff(() => syncG2ACatalog({ 
        fullSync: true,
        includeRelationships: true 
      }));
      console.log(`✅ [G2A Job] Catalog sync completed: ${result.added} added, ${result.updated} updated, ${result.removed} removed`);
      console.log(`📊 [G2A Job] Relationships: ${result.categoriesCreated} categories, ${result.genresCreated} genres, ${result.platformsCreated} platforms created`);
      if (result.errors && result.errors.length > 0) {
        console.warn(`⚠️ [G2A Job] Sync completed with ${result.errors.length} errors`);
      }
    } catch (error) {
      console.error('❌ [G2A Job] Catalog sync failed after retries:', error);
    }
  });
};

/**
 * Check game stock and prices every 15 minutes
 * Handles rate limiting with delays between requests
 */
export const startStockCheckJob = () => {
  cron.schedule('*/15 * * * *', async () => {
    console.log('🔍 [G2A Job] Starting stock and price check...');
    
    const errors: Array<{ gameId: string; g2aProductId: string | null; error: string }> = [];
    let checked = 0;
    let updated = 0;
    let priceUpdated = 0;
    
    try {
      // Get all games with G2A product IDs that are in stock
      const games = await prisma.game.findMany({
        where: {
          g2aProductId: { not: null },
        },
        select: {
          id: true,
          g2aProductId: true,
          price: true,
          inStock: true,
        },
      });

      console.log(`[G2A Job] Checking stock and prices for ${games.length} games`);

      // Batch process games to handle rate limiting
      const BATCH_SIZE = 10;
      const batches: typeof games[] = [];
      
      for (let i = 0; i < games.length; i += BATCH_SIZE) {
        batches.push(games.slice(i, i + BATCH_SIZE));
      }

      // Process each batch with delay between batches
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        // Check stock for each game in batch
        for (const game of batch) {
          if (!game.g2aProductId) continue;
          
          try {
            checked++;
            
            // Check stock with retry logic
            const stockResult = await retryWithBackoff(
              () => validateGameStock(game.g2aProductId!),
              2, // 2 retries for stock checks
              500 // 500ms initial delay
            );
            
            // Update stock status
            const stockChanged = game.inStock !== stockResult.available;
            if (stockChanged || stockResult.stock !== (game.inStock ? 1 : 0)) {
              await prisma.game.update({
                where: { id: game.id },
                data: {
                  g2aStock: stockResult.available,
                  inStock: stockResult.available,
                  g2aLastSync: new Date(),
                },
              });
              updated++;
              if (stockChanged) {
                console.log(`[G2A Job] Stock changed for game ${game.id}: ${game.inStock} → ${stockResult.available}`);
                // Invalidate cache for this specific game
                try {
                  const { invalidateCache } = await import('../services/cache.service.js');
                  await invalidateCache(`game:*${game.id}*`);
                } catch (cacheError) {
                  console.warn(`[G2A Job] Failed to invalidate cache for game ${game.id}`, cacheError);
                }
              }
            } else {
              // Update sync timestamp even if stock didn't change
              await prisma.game.update({
                where: { id: game.id },
                data: {
                  g2aLastSync: new Date(),
                },
              });
            }
            
            // Small delay between individual stock checks
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            const errMsg = error instanceof Error ? error.message : 'Unknown error';
            errors.push({
              gameId: game.id,
              g2aProductId: game.g2aProductId,
              error: errMsg,
            });
            console.error(`[G2A Job] Failed to check stock for game ${game.id}:`, error);
          }
        }
        
        // Delay between batches for rate limiting
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Update prices in bulk (more efficient)
      try {
        const productIds = games
          .map(g => g.g2aProductId)
          .filter((id): id is string => id !== null);
        
        if (productIds.length > 0) {
          console.log(`[G2A Job] Fetching prices for ${productIds.length} products`);
          const prices = await retryWithBackoff(
            () => getG2APrices(productIds),
            2,
            1000
          ) as Map<string, number>;
          
          // Update prices in database
          for (const game of games) {
            if (!game.g2aProductId) continue;
            
            const newPrice = prices.get(game.g2aProductId);
            if (newPrice && Number(game.price) !== newPrice) {
              try {
                await prisma.game.update({
                  where: { id: game.id },
                  data: {
                    price: newPrice,
                    g2aLastSync: new Date(),
                  },
                });
                priceUpdated++;
              } catch (error) {
                const errMsg = error instanceof Error ? error.message : 'Unknown error';
                errors.push({
                  gameId: game.id,
                  g2aProductId: game.g2aProductId,
                  error: `Price update failed: ${errMsg}`,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('[G2A Job] Failed to update prices:', error);
        errors.push({
          gameId: 'bulk-price-update',
          g2aProductId: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Invalidate cache after all stock and price updates
      if (updated > 0 || priceUpdated > 0) {
        try {
          const { invalidateCache } = await import('../services/cache.service.js');
          // Invalidate affected product caches and related caches
          await invalidateCache('game:*');
          await invalidateCache('home:*');
          await invalidateCache('catalog:*');
          console.log(`[G2A Job] Cache invalidated after stock/price updates`);
        } catch (cacheError) {
          // Non-blocking - log but don't fail job
          console.warn(`[G2A Job] Failed to invalidate cache after stock check:`, cacheError);
        }
      }

      console.log(`✅ [G2A Job] Stock check completed: ${checked} checked, ${updated} stock updated, ${priceUpdated} prices updated`);
      if (errors.length > 0) {
        console.warn(`⚠️ [G2A Job] Completed with ${errors.length} errors`);
        // Log first few errors for debugging
        errors.slice(0, 5).forEach(err => {
          console.error(`[G2A Job] Error: ${err.gameId} (${err.g2aProductId}): ${err.error}`);
        });
      }
    } catch (error) {
      console.error('❌ [G2A Job] Stock check failed:', error);
    }
  });
};
