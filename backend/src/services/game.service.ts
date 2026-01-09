import prisma from '../config/database.js';
import redisClient from '../config/redis.js';
import { GameFilters, PaginatedResponse, GameResponse } from '../types/game.js';
import { Prisma } from '@prisma/client';

const DEFAULT_PAGE_SIZE = 36;
// const CATALOG_PAGE_SIZE = 36; // Reserved for future use

// Helper to get random discount (5-10%)
const getRandomDiscount = (): number => {
  return Math.floor(Math.random() * 6) + 5; // 5-10%
};

// Helper to check if game is "New" (released within 2 weeks)
const isNewGame = (releaseDate: Date): boolean => {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  return new Date(releaseDate) >= twoWeeksAgo;
};

// Transform Prisma Game to GameResponse
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformGame = (game: any): GameResponse => {
  const isNew = isNewGame(game.releaseDate);

  // Apply random discount (5-10%) except for New games
  let discount = game.discount;
  let originalPrice = game.originalPrice;

  if (!isNew && !game.isPreorder && Math.random() > 0.3) {
    // 70% chance of having a discount
    discount = getRandomDiscount();
    originalPrice = game.price;
    // Calculate new price with discount
    const newPrice = game.price * (1 - discount / 100);
    return {
      id: game.id,
      title: game.title,
      slug: game.slug,
      description: game.description,
      shortDescription: game.shortDescription,
      price: Number(newPrice.toFixed(2)),
      originalPrice: Number(originalPrice.toFixed(2)),
      discount,
      currency: game.currency,
      image: game.image,
      images: game.images,
      inStock: game.inStock,
      releaseDate: game.releaseDate.toISOString(),
      metacriticScore: game.metacriticScore,
      userRating: game.userRating ? Number(game.userRating) : undefined,
      ageRating: game.ageRating,
      multiplayer: game.multiplayer,
      activationService: game.activationService,
      region: game.region,
      publisher: game.publisher,
      isBestSeller: game.isBestSeller,
      isNew,
      isPreorder: game.isPreorder,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      platforms: game.platforms?.map((p: any) => p.platform.name) || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      genres: game.genres?.map((g: any) => g.genre.name) || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tags: game.tags?.map((t: any) => t.tag.name) || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      categories: game.categories?.map((c: any) => c.category.name) || [],
    };
  }

  return {
    id: game.id,
    title: game.title,
    slug: game.slug,
    description: game.description,
    shortDescription: game.shortDescription,
    price: Number(game.price),
    originalPrice: originalPrice ? Number(originalPrice) : undefined,
    discount: discount || undefined,
    currency: game.currency,
    image: game.image,
    images: game.images,
    inStock: game.inStock,
    releaseDate: game.releaseDate.toISOString(),
    metacriticScore: game.metacriticScore,
    userRating: game.userRating ? Number(game.userRating) : undefined,
    ageRating: game.ageRating,
    multiplayer: game.multiplayer,
    activationService: game.activationService,
    region: game.region,
    publisher: game.publisher,
    isBestSeller: game.isBestSeller,
    isNew,
    isPreorder: game.isPreorder,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    platforms: game.platforms?.map((p: any) => p.platform.name) || [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    genres: game.genres?.map((g: any) => g.genre.name) || [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tags: game.tags?.map((t: any) => t.tag.name) || [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categories: game.categories?.map((c: any) => c.category.name) || [],
  };
};

export const getGames = async (filters?: GameFilters): Promise<PaginatedResponse<GameResponse>> => {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * pageSize;

  const where: Prisma.GameWhereInput = {};

  // Search filter
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  // In Stock Only (default: true, hides Preorder)
  if (filters?.inStockOnly !== false) {
    where.inStock = true;
    where.isPreorder = false;
  }

  // Price range filter
  if (filters?.priceRange) {
    where.price = {
      gte: filters.priceRange.min,
      lte: filters.priceRange.max,
    };
  }

  // Price preset filter
  if (filters?.pricePreset) {
    switch (filters.pricePreset) {
      case 'under-10':
        where.price = { lt: 10 };
        break;
      case '10-25':
        where.price = { gte: 10, lt: 25 };
        break;
      case '25-50':
        where.price = { gte: 25, lt: 50 };
        break;
      case '50-100':
        where.price = { gte: 50, lt: 100 };
        break;
      case 'over-100':
        where.price = { gte: 100 };
        break;
    }
  }

  // Platform filter
  if (filters?.platforms && filters.platforms.length > 0) {
    where.platforms = {
      some: {
        platform: {
          slug: { in: filters.platforms },
        },
      },
    };
  }

  // Activation Service filter
  if (filters?.activationServices && filters.activationServices.length > 0) {
    where.activationService = { in: filters.activationServices };
  }

  // Region filter
  if (filters?.regions && filters.regions.length > 0) {
    where.region = { in: filters.regions };
  }

  // Multiplayer filter
  if (filters?.multiplayer !== undefined) {
    where.multiplayer = filters.multiplayer;
  }

  // Publisher filter
  if (filters?.publishers && filters.publishers.length > 0) {
    where.publisher = { in: filters.publishers };
  }

  // Genre filter
  if (filters?.genres && filters.genres.length > 0) {
    where.genres = {
      some: {
        genre: {
          slug: { in: filters.genres },
        },
      },
    };
  }

  // Sort
  let orderBy: Prisma.GameOrderByWithRelationInput = { createdAt: 'desc' };
  if (filters?.sort) {
    switch (filters.sort) {
      case 'popular':
        orderBy = { userRating: 'desc' };
        break;
      case 'newest':
        orderBy = { releaseDate: 'desc' };
        break;
      case 'price-asc':
        orderBy = { price: 'asc' };
        break;
      case 'price-desc':
        orderBy = { price: 'desc' };
        break;
    }
  }

  const [games, total] = await Promise.all([
    prisma.game.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        platforms: {
          include: {
            platform: true,
          },
        },
        genres: {
          include: {
            genre: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    }),
    prisma.game.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    data: games.map(transformGame),
    total,
    page,
    pageSize,
    totalPages,
  };
};

export const getGameById = async (id: string): Promise<GameResponse | null> => {
  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      platforms: {
        include: {
          platform: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!game) return null;

  return transformGame(game);
};

export const getGameBySlug = async (slug: string): Promise<GameResponse | null> => {
  const game = await prisma.game.findUnique({
    where: { slug },
    include: {
      platforms: {
        include: {
          platform: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!game) return null;

  return transformGame(game);
};

export const getBestSellers = async (genre?: string): Promise<GameResponse[]> => {
  const cacheKey = `best-sellers:weekly:${genre || 'all'}`;

  // Try to get from cache
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Redis cache error:', error);
  }

  const where: Prisma.GameWhereInput = {
    isBestSeller: true,
    inStock: true,
  };

  if (genre) {
    where.genres = {
      some: {
        genre: {
          slug: genre,
        },
      },
    };
  }

  const games = await prisma.game.findMany({
    where,
    take: 100, // Get more to randomize
    orderBy: {
      userRating: 'desc',
    },
    include: {
      platforms: {
        include: {
          platform: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  // Shuffle and take 30 random
  const shuffled = games.sort(() => 0.5 - Math.random());
  const result = shuffled.slice(0, 30).map(transformGame);

  // Cache for 7 days
  try {
    await redisClient.setEx(cacheKey, 7 * 24 * 60 * 60, JSON.stringify(result));
  } catch (error) {
    console.error('Redis cache error:', error);
  }

  return result;
};

export const getNewInCatalog = async (): Promise<GameResponse[]> => {
  const cacheKey = 'new-in-catalog:daily';

  // Try to get from cache
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Redis cache error:', error);
  }

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const games = await prisma.game.findMany({
    where: {
      releaseDate: { gte: twoWeeksAgo },
      inStock: true,
    },
    take: 100, // Get more to randomize
    orderBy: {
      releaseDate: 'desc',
    },
    include: {
      platforms: {
        include: {
          platform: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  // Shuffle and take 40 random
  const shuffled = games.sort(() => 0.5 - Math.random());
  const result = shuffled.slice(0, 40).map(transformGame);

  // Cache for 24 hours
  try {
    await redisClient.setEx(cacheKey, 24 * 60 * 60, JSON.stringify(result));
  } catch (error) {
    console.error('Redis cache error:', error);
  }

  return result;
};

export const getPreorders = async (): Promise<GameResponse[]> => {
  const games = await prisma.game.findMany({
    where: {
      isPreorder: true,
      inStock: true,
    },
    take: 30,
    orderBy: {
      releaseDate: 'asc',
    },
    include: {
      platforms: {
        include: {
          platform: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  return games.map(transformGame);
};

export const getNewGames = async (): Promise<GameResponse[]> => {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const games = await prisma.game.findMany({
    where: {
      releaseDate: { gte: twoWeeksAgo },
      inStock: true,
      isPreorder: false,
    },
    take: 30,
    orderBy: {
      releaseDate: 'desc',
    },
    include: {
      platforms: {
        include: {
          platform: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  return games.map(transformGame);
};

export const getGamesByGenre = async (genreSlug: string): Promise<GameResponse[]> => {
  const games = await prisma.game.findMany({
    where: {
      genres: {
        some: {
          genre: {
            slug: genreSlug,
          },
        },
      },
      inStock: true,
    },
    take: 40,
    orderBy: {
      userRating: 'desc',
    },
    include: {
      platforms: {
        include: {
          platform: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  return games.map(transformGame);
};

export const getRandomGames = async (count: number = 10): Promise<GameResponse[]> => {
  // Get total count
  const total = await prisma.game.count({
    where: { inStock: true },
  });

  if (total === 0) return [];

  // Get random games
  const skip = Math.floor(Math.random() * Math.max(0, total - count));

  const games = await prisma.game.findMany({
    where: { inStock: true },
    skip,
    take: count,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      platforms: {
        include: {
          platform: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  // Shuffle results
  const shuffled = games.sort(() => 0.5 - Math.random());
  return shuffled.map(transformGame);
};

export const getSimilarGames = async (
  gameId: string,
  count: number = 10
): Promise<GameResponse[]> => {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
    },
  });

  if (!game) return [];

  const gameTagIds = game.tags.map((t) => t.tagId);
  const gameGenreIds = game.genres.map((g) => g.genreId);

  // Find games with at least 2 matching tags
  const similarGames = await prisma.game.findMany({
    where: {
      id: { not: gameId },
      inStock: true,
      OR: [
        {
          tags: {
            some: {
              tagId: { in: gameTagIds },
            },
          },
        },
        {
          genres: {
            some: {
              genreId: { in: gameGenreIds },
            },
          },
        },
      ],
    },
    take: count * 2, // Get more to filter
    include: {
      platforms: {
        include: {
          platform: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  // Score games by matching tags (minimum 2)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scored = similarGames
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((g: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matchingTags = g.tags
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? g.tags.filter((t: any) => gameTagIds.includes(t.tagId)).length
        : 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matchingGenres = g.genres
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? g.genres.filter((gen: any) => gameGenreIds.includes(gen.genreId)).length
        : 0;
      return {
        game: g,
        score: matchingTags * 2 + matchingGenres,
      };
    })
    .filter((item) => item.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((item) => transformGame(item.game));

  return scored;
};

export const searchGames = async (query: string): Promise<GameResponse[]> => {
  const games = await prisma.game.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { publisher: { contains: query, mode: 'insensitive' } },
      ],
      inStock: true,
    },
    take: 50,
    include: {
      platforms: {
        include: {
          platform: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  return games.map(transformGame);
};

export const getAllGenres = async (): Promise<Array<{ name: string; slug: string }>> => {
  const genres = await prisma.genre.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return genres.map((genre) => ({
    name: genre.name,
    slug: genre.slug,
  }));
};

export const getAllPlatforms = async (): Promise<Array<{ name: string; slug: string }>> => {
  const platforms = await prisma.platform.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return platforms.map((platform) => ({
    name: platform.name,
    slug: platform.slug,
  }));
};

export const getFilterOptions = async () => {
  const [genres, platforms] = await Promise.all([getAllGenres(), getAllPlatforms()]);

  // Get unique values from games
  const games = await prisma.game.findMany({
    select: {
      activationService: true,
      region: true,
      publisher: true,
      multiplayer: true,
    },
  });

  const activationServices = [
    ...new Set(games.map((g) => g.activationService).filter(Boolean)),
  ].sort();
  const regions = [...new Set(games.map((g) => g.region).filter(Boolean))].sort();
  const publishers = [...new Set(games.map((g) => g.publisher).filter(Boolean))].sort();

  return {
    genres,
    platforms,
    activationServices,
    regions,
    publishers,
    multiplayer: [true, false],
  };
};

export const getCollections = async (): Promise<
  Array<{
    id: string;
    title: string;
    type: 'genre' | 'publisher';
    value: string;
    games: GameResponse[];
  }>
> => {
  const collections = [];

  // Get top 5 genres
  const topGenres = await prisma.genre.findMany({
    take: 5,
    orderBy: {
      name: 'asc',
    },
  });

  // Get top 5 publishers
  const games = await prisma.game.findMany({
    select: {
      publisher: true,
    },
    where: {
      publisher: { not: null },
      inStock: true,
    },
  });

  const publisherCounts = games.reduce(
    (acc, game) => {
      if (game.publisher) {
        acc[game.publisher] = (acc[game.publisher] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const topPublishers = Object.entries(publisherCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5)
    .map(([name]) => name);

  // Create genre collections
  for (const genre of topGenres) {
    const genreGames = await getGamesByGenre(genre.slug);
    if (genreGames.length > 0) {
      collections.push({
        id: `genre-${genre.slug}`,
        title: genre.name,
        type: 'genre' as const,
        value: genre.slug,
        games: genreGames.slice(0, 40),
      });
    }
  }

  // Create publisher collections
  for (const publisher of topPublishers) {
    const publisherGames = await prisma.game.findMany({
      where: {
        publisher,
        inStock: true,
      },
      take: 40,
      orderBy: {
        userRating: 'desc',
      },
      include: {
        platforms: {
          include: {
            platform: true,
          },
        },
        genres: {
          include: {
            genre: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (publisherGames.length > 0) {
      collections.push({
        id: `publisher-${publisher}`,
        title: publisher,
        type: 'publisher' as const,
        value: publisher,
        games: publisherGames.map(transformGame).slice(0, 40),
      });
    }
  }

  return collections.slice(0, 10);
};

/**
 * Get autocomplete suggestions for search query
 * @param query - Search query (minimum 2 characters)
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of search suggestions with relevance scores
 */
export const getGameAutocomplete = async (
  query: string,
  limit: number = 10
): Promise<
  Array<{
    id: string;
    title: string;
    image: string;
    slug: string;
    relevanceScore: number;
  }>
> => {
  if (!query || query.length < 2) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();

  // Search games by title and description
  const games = await prisma.game.findMany({
    where: {
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
      inStock: true,
    },
    take: limit * 2, // Get more to calculate relevance
    include: {
      platforms: {
        include: {
          platform: true,
        },
      },
    },
    orderBy: [{ userRating: 'desc' }, { releaseDate: 'desc' }],
  });

  // Calculate relevance scores
  const suggestions = games.map((game) => {
    const titleLower = game.title.toLowerCase();
    const descriptionLower = game.description.toLowerCase();

    let relevanceScore = 0;

    // Exact title match gets highest score
    if (titleLower === searchTerm) {
      relevanceScore = 1.0;
    } else if (titleLower.startsWith(searchTerm)) {
      relevanceScore = 0.9;
    } else if (titleLower.includes(searchTerm)) {
      relevanceScore = 0.7;
    } else if (descriptionLower.includes(searchTerm)) {
      relevanceScore = 0.5;
    }

    // Boost score for best sellers and new games
    if (game.isBestSeller) relevanceScore += 0.1;
    if (game.isNew) relevanceScore += 0.05;

    // Normalize to 0-1 range
    relevanceScore = Math.min(1.0, relevanceScore);

    return {
      id: game.id,
      title: game.title,
      image: game.image,
      slug: game.slug,
      relevanceScore,
    };
  });

  // Sort by relevance and take top results
  return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, limit);
};
