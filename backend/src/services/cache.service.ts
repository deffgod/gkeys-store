import redisClient from '../config/redis';
import prisma from '../config/database';

// Cache TTLs
const CACHE_TTL = {
  BEST_SELLERS: 7 * 24 * 60 * 60, // 7 days (updates weekly)
  NEW_IN_CATALOG: 24 * 60 * 60, // 24 hours (updates daily)
  RANDOM_GAMES: 60, // 1 minute (refreshes frequently)
  GENRE_GAMES: 6 * 60 * 60, // 6 hours
  PREORDER_GAMES: 60 * 60, // 1 hour
  GAME_DETAILS: 60 * 60, // 1 hour
  FILTER_OPTIONS: 60 * 60, // 1 hour
};

// Cache keys
const CACHE_KEYS = {
  BEST_SELLERS: 'home:bestSellers',
  NEW_IN_CATALOG: 'home:newInCatalog',
  PREORDERS: 'home:preorders',
  NEW_GAMES: 'home:newGames',
  RANDOM_GAMES: 'home:randomGames',
  GENRE_PREFIX: 'home:genre:',
  GAME_PREFIX: 'game:',
  FILTER_OPTIONS: 'catalog:filterOptions',
};

interface CachedGame {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  platform: string;
  genre: string;
  tags: string[];
  inStock: boolean;
  isPreorder: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
  discount?: number;
  createdAt: string;
}

/**
 * Check if Redis is available
 */
const isRedisAvailable = async (): Promise<boolean> => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    await redisClient.ping();
    return true;
  } catch {
    console.log('[Cache] Redis not available, using database directly');
    return false;
  }
};

/**
 * Get cached data or fetch from database
 */
const getCachedOrFetch = async <T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> => {
  const available = await isRedisAvailable();
  
  if (available) {
    try {
      const cached = await redisClient.get(key);
      if (cached) {
        console.log(`[Cache] Hit: ${key}`);
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('[Cache] Error reading cache:', err);
    }
  }
  
  console.log(`[Cache] Miss: ${key}, fetching from DB`);
  const data = await fetchFn();
  
  if (available) {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(data));
    } catch (err) {
      console.error('[Cache] Error writing cache:', err);
    }
  }
  
  return data;
};

/**
 * Invalidate cache key
 */
export const invalidateCache = async (pattern: string): Promise<void> => {
  const available = await isRedisAvailable();
  if (!available) return;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`[Cache] Invalidated ${keys.length} keys matching: ${pattern}`);
    }
  } catch (err) {
    console.error('[Cache] Error invalidating cache:', err);
  }
};

/**
 * Get Best Sellers (cached for 7 days)
 * Randomly selects 8 games from top sellers
 */
export const getBestSellers = async (genre?: string): Promise<CachedGame[]> => {
  const key = genre ? `${CACHE_KEYS.BEST_SELLERS}:${genre}` : CACHE_KEYS.BEST_SELLERS;
  
  return getCachedOrFetch(key, CACHE_TTL.BEST_SELLERS, async () => {
    // Get games with most orders in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const where: Record<string, unknown> = {
      inStock: true,
    };
    
    if (genre) {
      where.genres = {
        some: {
          genre: {
            name: { contains: genre, mode: 'insensitive' },
          },
        },
      };
    }
    
    // Get top selling games
    const topGames = await prisma.orderItem.groupBy({
      by: ['gameId'],
      _count: { gameId: true },
      where: {
        order: {
          createdAt: { gte: thirtyDaysAgo },
          status: 'COMPLETED',
        },
      },
      orderBy: { _count: { gameId: 'desc' } },
      take: 50,
    });
    
    let gameIds = topGames.map(g => g.gameId);
    
    // If not enough top sellers, add random games
    if (gameIds.length < 20) {
      const additionalGames = await prisma.game.findMany({
        where: {
          ...where,
          id: { notIn: gameIds },
        },
        take: 20 - gameIds.length,
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      gameIds = [...gameIds, ...additionalGames.map(g => g.id)];
    }
    
    // Fetch full game data
    const games = await prisma.game.findMany({
      where: { id: { in: gameIds } },
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        platforms: {
          include: {
            platform: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    
    // Randomly select 8 games
    const shuffled = games.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 8);
    
    return selected.map(mapGameToCache);
  });
};

/**
 * Get New in Catalog (cached for 24 hours)
 * Returns 15 newest games
 */
export const getNewInCatalog = async (): Promise<CachedGame[]> => {
  return getCachedOrFetch(CACHE_KEYS.NEW_IN_CATALOG, CACHE_TTL.NEW_IN_CATALOG, async () => {
    const games = await prisma.game.findMany({
      where: { inStock: true },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        platforms: {
          include: {
            platform: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    
    return games.map(g => ({
      ...mapGameToCache(g),
      isNew: true,
    }));
  });
};

/**
 * Get Preorder Games (cached for 1 hour)
 */
export const getPreorderGames = async (): Promise<CachedGame[]> => {
  return getCachedOrFetch(CACHE_KEYS.PREORDERS, CACHE_TTL.PREORDER_GAMES, async () => {
    const games = await prisma.game.findMany({
      where: {
        isPreorder: true,
        inStock: true,
      },
      orderBy: { releaseDate: 'asc' },
      take: 10,
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        platforms: {
          include: {
            platform: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    
    return games.map(mapGameToCache);
  });
};

/**
 * Get New Games (released within last 2 weeks)
 */
export const getNewGames = async (): Promise<CachedGame[]> => {
  return getCachedOrFetch(CACHE_KEYS.NEW_GAMES, CACHE_TTL.NEW_IN_CATALOG, async () => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const games = await prisma.game.findMany({
      where: {
        inStock: true,
        releaseDate: { gte: twoWeeksAgo },
        isPreorder: false,
      },
      orderBy: { releaseDate: 'desc' },
      take: 10,
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        platforms: {
          include: {
            platform: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    
    return games.map(g => ({
      ...mapGameToCache(g),
      isNew: true,
    }));
  });
};

/**
 * Get Random Games (refreshes every page load)
 */
export const getRandomGames = async (count: number = 10): Promise<CachedGame[]> => {
  // Don't cache random games for long - they should refresh
  const games = await prisma.game.findMany({
    where: { inStock: true },
    take: 100,
    include: {
      genres: {
        include: {
          genre: true,
        },
      },
      platforms: {
        include: {
          platform: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
  
  // Shuffle and take requested count
  const shuffled = games.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  
  return selected.map(mapGameToCache);
};

/**
 * Get Games by Genre (cached for 6 hours)
 */
export const getGamesByGenre = async (genre: string, count: number = 20): Promise<CachedGame[]> => {
  const key = `${CACHE_KEYS.GENRE_PREFIX}${genre.toLowerCase()}`;
  
  return getCachedOrFetch(key, CACHE_TTL.GENRE_GAMES, async () => {
    const games = await prisma.game.findMany({
      where: {
        genres: {
          some: {
            genre: {
              name: { contains: genre, mode: 'insensitive' },
            },
          },
        },
        inStock: true,
      },
      orderBy: { createdAt: 'desc' },
      take: count,
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        platforms: {
          include: {
            platform: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    
    return games.map(mapGameToCache);
  });
};

/**
 * Get Game by slug (cached for 1 hour)
 */
export const getCachedGame = async (slug: string): Promise<CachedGame | null> => {
  const key = `${CACHE_KEYS.GAME_PREFIX}${slug}`;
  
  return getCachedOrFetch(key, CACHE_TTL.GAME_DETAILS, async () => {
    const game = await prisma.game.findUnique({
      where: { slug },
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        platforms: {
          include: {
            platform: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    
    return game ? mapGameToCache(game) : null;
  });
};

/**
 * Get Filter Options (cached for 1 hour)
 */
export const getFilterOptions = async (): Promise<{
  platforms: string[];
  genres: string[];
  publishers: string[];
  priceRange: { min: number; max: number };
}> => {
  return getCachedOrFetch(CACHE_KEYS.FILTER_OPTIONS, CACHE_TTL.FILTER_OPTIONS, async () => {
    const [platformResults, genreResults, publishers, priceRange] = await Promise.all([
      prisma.platform.findMany({
        where: {
          games: {
            some: {
              game: {
                inStock: true,
              },
            },
          },
        },
        select: { name: true },
        distinct: ['name'],
      }),
      prisma.genre.findMany({
        where: {
          games: {
            some: {
              game: {
                inStock: true,
              },
            },
          },
        },
        select: { name: true },
        distinct: ['name'],
      }),
      prisma.game.findMany({
        where: { inStock: true, publisher: { not: null } },
        select: { publisher: true },
        distinct: ['publisher'],
      }),
      prisma.game.aggregate({
        where: { inStock: true },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);
    
    return {
      platforms: platformResults.map(p => p.name).filter(Boolean),
      genres: genreResults.map(g => g.name).filter(Boolean),
      publishers: publishers.map(p => p.publisher).filter((p): p is string => p !== null),
      priceRange: {
        min: Number(priceRange._min.price || 0),
        max: Number(priceRange._max.price || 100),
      },
    };
  });
};

/**
 * Refresh Best Sellers cache
 */
export const refreshBestSellers = async (): Promise<void> => {
  await invalidateCache(`${CACHE_KEYS.BEST_SELLERS}*`);
  await getBestSellers();
  console.log('[Cache] Best Sellers cache refreshed');
};

/**
 * Refresh New in Catalog cache
 */
export const refreshNewInCatalog = async (): Promise<void> => {
  await invalidateCache(CACHE_KEYS.NEW_IN_CATALOG);
  await getNewInCatalog();
  console.log('[Cache] New in Catalog cache refreshed');
};

/**
 * Map Prisma Game to CachedGame
 */
function mapGameToCache(game: any): CachedGame {
  const price = typeof game.price === 'object' ? game.price.toNumber() : Number(game.price);
  const originalPrice = game.originalPrice 
    ? (typeof game.originalPrice === 'object' ? game.originalPrice.toNumber() : Number(game.originalPrice))
    : undefined;
  
  let discount: number | undefined;
  if (originalPrice && originalPrice > price) {
    discount = Math.round((1 - price / originalPrice) * 100);
  }
  
  // Determine if game is new (created within last 2 weeks)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const isNew = game.createdAt >= twoWeeksAgo;
  
  // Extract platform and genre from relations
  const platform = game.platforms && game.platforms.length > 0 
    ? game.platforms[0].platform?.name || '' 
    : '';
  const genre = game.genres && game.genres.length > 0 
    ? game.genres[0].genre?.name || '' 
    : '';
  const tags = game.tags 
    ? game.tags.map((t: any) => t.tag?.name || '').filter(Boolean)
    : [];
  
  return {
    id: game.id,
    title: game.title,
    slug: game.slug,
    price,
    originalPrice,
    imageUrl: game.image || game.imageUrl || '',
    platform,
    genre,
    tags,
    inStock: game.inStock,
    isPreorder: game.isPreorder,
    isNew,
    discount,
    createdAt: game.createdAt.toISOString(),
  };
}

/**
 * Schedule periodic cache refresh
 */
export const startCacheRefreshScheduler = (): void => {
  // Refresh Best Sellers every 7 days
  setInterval(async () => {
    try {
      await refreshBestSellers();
    } catch (err) {
      console.error('[Cache] Error refreshing Best Sellers:', err);
    }
  }, 7 * 24 * 60 * 60 * 1000);
  
  // Refresh New in Catalog every 24 hours
  setInterval(async () => {
    try {
      await refreshNewInCatalog();
    } catch (err) {
      console.error('[Cache] Error refreshing New in Catalog:', err);
    }
  }, 24 * 60 * 60 * 1000);
  
  console.log('[Cache] Refresh scheduler started');
};

