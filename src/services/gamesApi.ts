import apiClient from './api';


// Check if we're in development mode
const isDevelopment = import.meta.env.DEV;

export interface Game {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  currency: string;
  image: string;
  images: string[];
  inStock: boolean;
  releaseDate: string;
  platforms: string[];
  genres: string[];
  tags: string[];
  isBestSeller: boolean;
  isNew: boolean;
  isPreorder: boolean;
  developer?: string;
  publisher?: string;
  qty?: number;
}

// Mock data from G2A Sandbox API for demo purposes
const mockGamesFromG2A: Game[] = [
  {
    id: '10000000195012',
    title: 'Killing Floor 2',
    slug: 'killing-floor-2-steam-key-global',
    description: 'Killing Floor 2 is a first-person shooter video game developed and published by Tripwire Interactive. It is the sequel to 2009\'s Killing Floor.',
    shortDescription: 'Co-op survival horror FPS game',
    price: 5.61,
    originalPrice: 29.99,
    discount: 81,
    currency: 'EUR',
    image: 'https://images.g2a.com/images/230x336/0x1x1/2424cf695f5d/59124143ae653a685e3aec62',
    images: [
      'https://images.g2a.com/images/0x0/1x1x1/a7b89088bd08/59124143ae653a685e3aec62',
      'https://images.g2a.com/images/0x0/1x1x1/d48914d45cf4/59e608985bafe333847a0d53',
      'https://images.g2a.com/images/0x0/1x1x1/2ccee3e276be/591241465bafe3807a52dfed',
    ],
    inStock: true,
    releaseDate: '2016-11-18',
    platforms: ['Steam', 'PC'],
    genres: ['Action', 'Horror', 'FPS'],
    tags: ['Co-op', 'Zombies', 'Gore'],
    isBestSeller: true,
    isNew: false,
    isPreorder: false,
    developer: 'Tripwire Interactive',
    publisher: 'Tripwire Interactive',
    qty: 326,
  },
  {
    id: '10000000415008',
    title: 'Borderlands 2 GOTY',
    slug: 'borderlands-2-goty-steam-key-global',
    description: 'Borderlands 2 Game of the Year Edition includes the original Borderlands 2 game plus all four add-on content campaigns.',
    shortDescription: 'Looter shooter with billions of guns',
    price: 8.15,
    originalPrice: 44.99,
    discount: 82,
    currency: 'EUR',
    image: 'https://images.g2a.com/images/230x336/0x1x1/93069a20070a/590de6645bafe33a140fa943',
    images: [
      'https://images.g2a.com/images/0x0/1x1x1/26fa59cdfae6/590de6645bafe33a140fa943',
      'https://images.g2a.com/images/0x0/1x1x1/9593c2f6baec/5a5314c9ae653a32e470aed3',
      'https://images.g2a.com/images/0x0/1x1x1/cf7a04976ab8/5a4f7a545bafe366941c9722',
    ],
    inStock: true,
    releaseDate: '2012-09-20',
    platforms: ['Steam', 'PC'],
    genres: ['Action', 'RPG', 'FPS'],
    tags: ['Looter Shooter', 'Co-op', 'Open World'],
    isBestSeller: true,
    isNew: false,
    isPreorder: false,
    developer: 'Gearbox Software',
    publisher: '2K Games',
    qty: 464,
  },
  {
    id: '10000000565013',
    title: 'Call of Duty: Black Ops II',
    slug: 'call-of-duty-black-ops-ii-steam-key-global',
    description: 'Call of Duty: Black Ops II is a 2012 first-person shooter video game developed by Treyarch and published by Activision.',
    shortDescription: 'Legendary FPS shooter',
    price: 11.22,
    originalPrice: 59.99,
    discount: 81,
    currency: 'EUR',
    image: 'https://images.g2a.com/images/230x336/0x1x1/bc6994fc5842/59886485ae653acb850d4532',
    images: [
      'https://images.g2a.com/images/0x0/1x1x1/c3563ce1c430/59886485ae653acb850d4532',
      'https://images.g2a.com/images/0x0/1x1x1/0acc93981660/59e5c724ae653ab61c4384ad',
      'https://images.g2a.com/images/0x0/1x1x1/efb22ea8c3db/591269135bafe3c03725a2d6',
    ],
    inStock: true,
    releaseDate: '2012-11-12',
    platforms: ['Steam', 'PC'],
    genres: ['Action', 'FPS'],
    tags: ['Multiplayer', 'Campaign', 'Zombies'],
    isBestSeller: true,
    isNew: false,
    isPreorder: false,
    developer: 'Treyarch',
    publisher: 'Activision',
    qty: 248,
  },
  {
    id: '10000000788017',
    title: 'Grand Theft Auto V',
    slug: 'grand-theft-auto-v-rockstar-key-global',
    description: 'Grand Theft Auto V is a 2013 action-adventure game developed by Rockstar North and published by Rockstar Games.',
    shortDescription: 'Open world crime action',
    price: 19.38,
    originalPrice: 59.99,
    discount: 68,
    currency: 'EUR',
    image: 'https://images.g2a.com/images/230x336/0x1x1/5d526a47248b/59e5efeb5bafe304c4426c47',
    images: [
      'https://images.g2a.com/images/0x0/1x1x1/bbe9cee9b959/59e5efeb5bafe304c4426c47',
      'https://images.g2a.com/images/0x0/1x1x1/1f2c241a3ded/59e5ee54ae653a08e46af093',
      'https://images.g2a.com/images/0x0/1x1x1/66603d2df25d/59e5f0595bafe304f351b5f8',
    ],
    inStock: true,
    releaseDate: '2015-04-14',
    platforms: ['Rockstar', 'PC'],
    genres: ['Action', 'Adventure', 'Open World'],
    tags: ['Crime', 'Multiplayer', 'GTA Online'],
    isBestSeller: true,
    isNew: false,
    isPreorder: true,
    developer: 'Rockstar North',
    publisher: 'Rockstar Games',
    qty: 370,
  },
  {
    id: '10000001250017',
    title: 'Fallout 4',
    slug: 'fallout-4-steam-key-global',
    description: 'Fallout 4 is an action role-playing game developed by Bethesda Game Studios and published by Bethesda Softworks.',
    shortDescription: 'Post-apocalyptic RPG adventure',
    price: 10.09,
    originalPrice: 29.99,
    discount: 66,
    currency: 'EUR',
    image: 'https://images.g2a.com/images/230x336/0x1x1/d651d5b0f4f8/5a718f545bafe318943d3514',
    images: [
      'https://images.g2a.com/images/0x0/1x1x1/c8fa89887c26/5a718f545bafe318943d3514',
      'https://images.g2a.com/images/0x0/1x1x1/112faab68a0c/5beec8dd5bafe3fee425a7b2',
      'https://images.g2a.com/images/0x0/1x1x1/78955d3a5df9/5a718f585bafe3192858da33',
    ],
    inStock: true,
    releaseDate: '2015-11-09',
    platforms: ['Steam', 'PC'],
    genres: ['RPG', 'Action', 'Open World'],
    tags: ['Post-Apocalyptic', 'Survival', 'Crafting'],
    isBestSeller: true,
    isNew: false,
    isPreorder: false,
    developer: 'Bethesda Game Studios',
    publisher: 'Bethesda Softworks',
    qty: 322,
  },
  {
    id: '10000001000001',
    title: 'Diablo 3 Battlechest',
    slug: 'diablo-3-battlechest-battlenet-pc-key-global',
    description: 'Diablo III is a genre-defining action-RPG set in Sanctuary, a world ravaged by the eternal conflict between angels and demons.',
    shortDescription: 'Action RPG masterpiece',
    price: 20.29,
    originalPrice: 39.99,
    discount: 49,
    currency: 'EUR',
    image: 'https://images.g2a.com/images/230x336/0x1x1/980940adef3a/5910f83dae653a855d5ab8ad',
    images: [
      'https://images.g2a.com/images/0x0/1x1x1/2ff1645ca0cf/5910f83dae653a855d5ab8ad',
      'https://images.g2a.com/images/0x0/1x1x1/cdd0ae0f2a21/5b3b51c85bafe330b873db33',
      'https://images.g2a.com/images/0x0/1x1x1/d1901cca23ce/5910f8405bafe39c635835d5',
    ],
    inStock: true,
    releaseDate: '2012-05-15',
    platforms: ['Battle.net', 'PC'],
    genres: ['RPG', 'Action', 'Hack and Slash'],
    tags: ['Dungeon Crawler', 'Loot', 'Co-op'],
    isBestSeller: false,
    isNew: false,
    isPreorder: false,
    developer: 'Blizzard Entertainment',
    publisher: 'Blizzard Entertainment',
    qty: 125,
  },
  {
    id: '10000000702004',
    title: "Assassin's Creed: Liberation HD",
    slug: 'assassins-creed-liberation-hd-uplay-key-global',
    description: "Assassin's Creed Liberation HD is an action-adventure video game developed by Ubisoft Sofia.",
    shortDescription: 'Assassin adventure in New Orleans',
    price: 2.03,
    originalPrice: 19.99,
    discount: 90,
    currency: 'EUR',
    image: 'https://images.g2a.com/images/230x336/0x1x1/9e0ffc670439/5a8bda8dae653a92b20755c5',
    images: [
      'https://images.g2a.com/images/0x0/1x1x1/41c53311c13d/5a8bda8dae653a92b20755c5',
      'https://images.g2a.com/images/0x0/1x1x1/5e2f5f2ab17a/5a8bda8d5bafe3027f2823d5',
      'https://images.g2a.com/images/0x0/1x1x1/e6ad56a99c65/5a8bda8dae653a851173efd6',
    ],
    inStock: true,
    releaseDate: '2014-01-15',
    platforms: ['Uplay', 'PC'],
    genres: ['Action', 'Adventure', 'Stealth'],
    tags: ['Historical', 'Parkour', 'Open World'],
    isBestSeller: false,
    isNew: true,
    isPreorder: false,
    developer: 'Ubisoft Sofia',
    publisher: 'Ubisoft',
    qty: 261,
  },
  {
    id: '10000000737012',
    title: 'Call of Duty: Modern Warfare 3',
    slug: 'call-of-duty-modern-warfare-3-steam-key-global',
    description: 'Call of Duty: Modern Warfare 3 is a first-person shooter video game developed by Infinity Ward and Sledgehammer Games.',
    shortDescription: 'Modern military FPS',
    price: 8.64,
    originalPrice: 39.99,
    discount: 78,
    currency: 'EUR',
    image: 'https://images.g2a.com/images/230x336/0x1x1/98d1f9192ee8/59123be15bafe375680e47b5',
    images: [
      'https://images.g2a.com/images/0x0/1x1x1/767d0bf757c2/59123be15bafe375680e47b5',
      'https://images.g2a.com/images/0x0/1x1x1/a6b4c11596ad/5b65d9c2ae653a0fc4207eb2',
      'https://images.g2a.com/images/0x0/1x1x1/cff6dcc9926b/59123be0ae653a5d4c7c0751',
    ],
    inStock: true,
    releaseDate: '2011-11-07',
    platforms: ['Steam', 'PC'],
    genres: ['Action', 'FPS'],
    tags: ['Military', 'Multiplayer', 'Campaign'],
    isBestSeller: false,
    isNew: false,
    isPreorder: false,
    developer: 'Infinity Ward',
    publisher: 'Activision',
    qty: 34,
  },
  {
    id: '10000000515006',
    title: 'Pillars of Eternity - Hero Edition',
    slug: 'pillars-of-eternity-hero-edition-steam-key-global',
    description: 'Pillars of Eternity is an RPG inspired by classic titles such as Baldur\'s Gate, Icewind Dale, and Planescape: Torment.',
    shortDescription: 'Classic isometric RPG',
    price: 4.52,
    originalPrice: 29.99,
    discount: 85,
    currency: 'EUR',
    image: 'https://images.g2a.com/images/230x336/0x1x1/e55dc4192458/59122f9c5bafe35b590e2faa',
    images: [
      'https://images.g2a.com/images/0x0/1x1x1/17226403296f/59122f9c5bafe35b590e2faa',
      'https://images.g2a.com/images/0x0/1x1x1/6dfc9a41197c/59122f9b5bafe35b82614edf',
      'https://images.g2a.com/images/0x0/1x1x1/4489e1d169ca/59122f9a5bafe35ba6780306',
    ],
    inStock: true,
    releaseDate: '2015-03-26',
    platforms: ['Steam', 'PC'],
    genres: ['RPG', 'Strategy'],
    tags: ['Isometric', 'Fantasy', 'Story Rich'],
    isBestSeller: false,
    isNew: false,
    isPreorder: false,
    developer: 'Obsidian Entertainment',
    publisher: 'Paradox Interactive',
    qty: 349,
  },
  {
    id: '10000001261006',
    title: 'Destiny 2',
    slug: 'destiny-2-battlenet-key-pc-europe',
    description: 'Destiny 2 is an online-only multiplayer first-person shooter video game developed by Bungie.',
    shortDescription: 'Sci-fi looter shooter MMO',
    price: 20.39,
    originalPrice: 59.99,
    discount: 66,
    currency: 'EUR',
    image: 'https://images.g2a.com/images/230x336/0x1x1/d3201c430d41/5af448a95bafe3234418c7b4',
    images: [
      'https://images.g2a.com/images/0x0/1x1x1/8f0e168c54bf/5af448a95bafe3234418c7b4',
      'https://images.g2a.com/images/0x0/1x1x1/815a6b826d16/5af4488bae653aa1e72e83e8',
      'https://images.g2a.com/images/0x0/1x1x1/b901b1f7ff72/5af4488e5bafe32159496ba4',
    ],
    inStock: true,
    releaseDate: '2017-10-24',
    platforms: ['Battle.net', 'PC'],
    genres: ['Action', 'FPS', 'MMO'],
    tags: ['Sci-Fi', 'Looter Shooter', 'Co-op'],
    isBestSeller: false,
    isNew: true,
    isPreorder: false,
    developer: 'Bungie',
    publisher: 'Bungie',
    qty: 37,
  },
  {
    id: '10000001741008',
    title: 'Insurgency',
    slug: 'insurgency-steam-key-global',
    description: 'Insurgency is a multiplayer tactical first-person shooter video game developed and published by New World Interactive.',
    shortDescription: 'Tactical military shooter',
    price: 1.89,
    originalPrice: 14.99,
    discount: 87,
    currency: 'EUR',
    image: 'https://images.g2a.com/images/230x336/0x1x1/3150865a5e2a/5910bd5aae653a0c9213335a',
    images: [
      'https://images.g2a.com/images/0x0/1x1x1/95e5485687e1/5910bd5aae653a0c9213335a',
      'https://images.g2a.com/images/0x0/1x1x1/f225c2fdcf37/59e605cf5bafe3233e6ee128',
      'https://images.g2a.com/images/0x0/1x1x1/e1bb65aa24dc/5910bd5b5bafe323b54541d4',
    ],
    inStock: true,
    releaseDate: '2014-01-22',
    platforms: ['Steam', 'PC'],
    genres: ['Action', 'FPS'],
    tags: ['Tactical', 'Multiplayer', 'Military'],
    isBestSeller: false,
    isNew: false,
    isPreorder: false,
    developer: 'New World Interactive',
    publisher: 'New World Interactive',
    qty: 791,
  },
  {
    id: '10000001685004',
    title: "Assassin's Creed: Revelations",
    slug: 'assassins-creed-revelations-uplay-key-global',
    description: "Assassin's Creed Revelations is an action-adventure video game developed by Ubisoft Montreal.",
    shortDescription: 'Ezio\'s final chapter',
    price: 3.32,
    originalPrice: 19.99,
    discount: 83,
    currency: 'EUR',
    image: 'https://images.g2a.com/images/230x336/0x1x1/ff8799b9b6e8/590db06e5bafe38c581a220f',
    images: [
      'https://images.g2a.com/images/0x0/1x1x1/3e5787a8ea7a/590db06e5bafe38c581a220f',
      'https://images.g2a.com/images/0x0/1x1x1/e655d3b7a1ca/5a8bfed0ae653a085e367924',
      'https://images.g2a.com/images/0x0/1x1x1/88fd364fa68c/590db06d5bafe38c5f50d8cc',
    ],
    inStock: true,
    releaseDate: '2011-11-30',
    platforms: ['Uplay', 'PC'],
    genres: ['Action', 'Adventure', 'Stealth'],
    tags: ['Historical', 'Parkour', 'Open World'],
    isBestSeller: true,
    isNew: false,
    isPreorder: false,
    developer: 'Ubisoft Montreal',
    publisher: 'Ubisoft',
    qty: 23,
  },
  {
    id: '10000000202019',
    title: 'Xbox Live GOLD 12 Months',
    slug: 'xbox-live-gold-subscription-card-12-months',
    description: 'Xbox Live Gold membership gives you the most advanced multiplayer gaming experience.',
    shortDescription: '12-month Xbox Live Gold subscription',
    price: 30.60,
    originalPrice: 59.99,
    discount: 49,
    currency: 'EUR',
    image: 'https://images.g2a.com/images/230x336/0x1x1/e16e2bdc9635/5ae2326eae653ac9647e2b0d',
    images: [
      'https://images.g2a.com/images/0x0/1x1x1/435716e55309/5ae2326eae653ac9647e2b0d',
      'https://images.g2a.com/images/0x0/1x1x1/2e8e4c7e6ec3/5ae2326fae653ade266144a2',
    ],
    inStock: true,
    releaseDate: '2020-01-01',
    platforms: ['Xbox'],
    genres: ['Subscription'],
    tags: ['Xbox Live', 'Multiplayer', 'Gaming'],
    isBestSeller: false,
    isNew: false,
    isPreorder: false,
    publisher: 'Microsoft',
    qty: 18,
  },
  {
    id: '10000001534004',
    title: 'Random 10 Keys',
    slug: 'random-10-keys-steam-key-global',
    description: 'Get 10 random Steam keys! Each key unlocks a different game.',
    shortDescription: 'Mystery gaming bundle',
    price: 3.05,
    originalPrice: 9.99,
    discount: 69,
    currency: 'EUR',
    image: 'https://images.g2a.com/images/230x336/0x1x1/ca4ffb16f14a/5bae92295bafe3e077535765',
    images: [
      'https://images.g2a.com/images/0x0/1x1x1/adc371fd911f/5bae92295bafe3e077535765',
      'https://images.g2a.com/images/0x0/1x1x1/0a646f7cd7db/5bae922b5bafe3ceb95aecca',
    ],
    inStock: true,
    releaseDate: '2023-01-01',
    platforms: ['Steam', 'PC'],
    genres: ['Bundle'],
    tags: ['Random', 'Mystery', 'Value'],
    isBestSeller: true,
    isNew: true,
    isPreorder: false,
    qty: 2057,
  },
  {
    id: '10000000024005',
    title: 'Random PREMIUM 5 Keys',
    slug: 'random-premium-5-keys-steam-key-global',
    description: 'Get 5 premium random Steam keys! Higher quality games guaranteed.',
    shortDescription: 'Premium mystery bundle',
    price: 5.09,
    originalPrice: 24.99,
    discount: 80,
    currency: 'EUR',
    image: 'https://images.g2a.com/images/230x336/0x1x1/8c6195e7cc44/5bae8f895bafe3d2d760f440',
    images: [
      'https://images.g2a.com/images/0x0/1x1x1/327e994e3a0b/5bae8f895bafe3d2d760f440',
      'https://images.g2a.com/images/0x0/1x1x1/2e1a5c3821cc/5bae8f8bae653af43d2301eb',
    ],
    inStock: true,
    releaseDate: '2023-06-01',
    platforms: ['Steam', 'PC'],
    genres: ['Bundle'],
    tags: ['Random', 'Premium', 'Mystery'],
    isBestSeller: false,
    isNew: true,
    isPreorder: false,
    qty: 2926,
  },
];

export interface GameFilters {
  search?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  pricePreset?: 'under-10' | '10-25' | '25-50' | '50-100' | 'over-100';
  inStockOnly?: boolean;
  platforms?: string[];
  activationServices?: string[];
  regions?: string[];
  multiplayer?: boolean;
  publishers?: string[];
  genres?: string[];
  sort?: 'popular' | 'newest' | 'price-asc' | 'price-desc';
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Helper to filter mock games
const filterMockGames = (games: Game[], filters?: GameFilters): Game[] => {
  let result = [...games];
  
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(g => 
      g.title.toLowerCase().includes(search) || 
      g.description.toLowerCase().includes(search)
    );
  }
  
  if (filters?.genres && filters.genres.length > 0) {
    result = result.filter(g => 
      g.genres.some(genre => filters.genres!.includes(genre))
    );
  }
  
  if (filters?.platforms && filters.platforms.length > 0) {
    result = result.filter(g => 
      g.platforms.some(p => filters.platforms!.includes(p))
    );
  }
  
  if (filters?.priceRange) {
    result = result.filter(g => 
      g.price >= filters.priceRange!.min && g.price <= filters.priceRange!.max
    );
  }
  
  if (filters?.inStockOnly) {
    result = result.filter(g => g.inStock);
  }
  
  // Sorting
  if (filters?.sort) {
    switch (filters.sort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
        break;
      case 'popular':
      default:
        result.sort((a, b) => (b.qty || 0) - (a.qty || 0));
    }
  }
  
  return result;
};

export const gamesApi = {
  getGames: async (filters?: GameFilters): Promise<PaginatedResponse<Game>> => {
    try {
      const params: Record<string, string> = {};
      
      if (filters) {
        if (filters.search) params.search = filters.search;
        if (filters.priceRange) {
          params.minPrice = filters.priceRange.min.toString();
          params.maxPrice = filters.priceRange.max.toString();
        }
        if (filters.pricePreset) params.pricePreset = filters.pricePreset;
        if (filters.inStockOnly !== undefined) params.inStockOnly = filters.inStockOnly.toString();
        if (filters.platforms) params.platforms = filters.platforms.join(',');
        if (filters.activationServices) params.activationServices = filters.activationServices.join(',');
        if (filters.regions) params.regions = filters.regions.join(',');
        if (filters.multiplayer !== undefined) params.multiplayer = filters.multiplayer.toString();
        if (filters.publishers) params.publishers = filters.publishers.join(',');
        if (filters.genres) params.genres = filters.genres.join(',');
        if (filters.sort) params.sort = filters.sort;
        if (filters.page) params.page = filters.page.toString();
        if (filters.pageSize) params.pageSize = filters.pageSize.toString();
      }
      
      const response = await apiClient.get<{ success: boolean; data: PaginatedResponse<Game> }>(
        '/api/games',
        { params }
      );
      return response.data;
    } catch (error) {
      // In production, throw error instead of using mock data
      if (!isDevelopment) {
        console.error('Failed to fetch games from API:', error);
        throw new Error('Unable to load games. Please try again later.');
      }
      // Fallback to mock data only in development
      if (isDevelopment) {
        console.warn('API request failed, using mock data (development mode):', error);
      }
      const filtered = filterMockGames(mockGamesFromG2A, filters);
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 36;
      const start = (page - 1) * pageSize;
      const paginatedData = filtered.slice(start, start + pageSize);
      
      return {
        data: paginatedData,
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
      };
    }
  },

  getGameById: async (id: string): Promise<Game> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Game }>(`/api/games/${id}`);
      return response.data;
    } catch (error) {
      // In production, throw error instead of using mock data
      if (!isDevelopment) {
        console.error('Failed to fetch game from API:', error);
        throw new Error('Unable to load game. Please try again later.');
      }
      // Fallback to mock data only in development
      const game = mockGamesFromG2A.find(g => g.id === id);
      if (game) {
        if (isDevelopment) {
          console.warn('API request failed, using mock data (development mode):', error);
        }
        return game;
      }
      throw new Error('Game not found');
    }
  },

  getGameBySlug: async (slug: string): Promise<Game> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Game }>(
        `/api/games/slug/${slug}`
      );
      return response.data;
    } catch (error) {
      // In production, throw error instead of using mock data
      if (!isDevelopment) {
        console.error('Failed to fetch game from API:', error);
        throw new Error('Unable to load game. Please try again later.');
      }
      // Fallback to mock data only in development
      const game = mockGamesFromG2A.find(g => g.slug === slug);
      if (game) {
        if (isDevelopment) {
          console.warn('API request failed, using mock data (development mode):', error);
        }
        return game;
      }
      throw new Error('Game not found');
    }
  },

  getBestSellers: async (genre?: string): Promise<Game[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Game[] }>(
        '/api/games/best-sellers',
        {
          params: genre ? { genre } : undefined,
        }
      );
      return response.data;
    } catch (error) {
      // In production, throw error instead of using mock data
      if (!isDevelopment) {
        console.error('Failed to fetch best sellers from API:', error);
        throw new Error('Unable to load best sellers. Please try again later.');
      }
      // Fallback to mock data only in development
      if (isDevelopment) {
        console.warn('API request failed, using mock data (development mode):', error);
      }
      let games = mockGamesFromG2A.filter(g => g.isBestSeller);
      if (genre) {
        games = games.filter(g => g.genres.includes(genre));
      }
      return games.slice(0, 30);
    }
  },

  getNewInCatalog: async (): Promise<Game[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Game[] }>(
        '/api/games/new-in-catalog'
      );
      return response.data;
    } catch (error) {
      // In production, throw error instead of using mock data
      if (!isDevelopment) {
        console.error('Failed to fetch new in catalog from API:', error);
        throw new Error('Unable to load new games. Please try again later.');
      }
      // Fallback to mock data only in development
      if (isDevelopment) {
        console.warn('API request failed, using mock data (development mode):', error);
      }
      return mockGamesFromG2A.filter(g => g.isNew).slice(0, 40);
    }
  },

  getPreorders: async (): Promise<Game[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Game[] }>(
        '/api/games/preorders'
      );
      return response.data;
    } catch (error) {
      // In production, throw error instead of using mock data
      if (!isDevelopment) {
        console.error('Failed to fetch preorders from API:', error);
        throw new Error('Unable to load preorders. Please try again later.');
      }
      // Fallback to mock data only in development
      if (isDevelopment) {
        console.warn('API request failed, using mock data (development mode):', error);
      }
      return mockGamesFromG2A.filter(g => g.isPreorder).slice(0, 30);
    }
  },

  getNewGames: async (): Promise<Game[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Game[] }>('/api/games/new');
      return response.data;
    } catch (error) {
      // In production, throw error instead of using mock data
      if (!isDevelopment) {
        console.error('Failed to fetch new games from API:', error);
        throw new Error('Unable to load new games. Please try again later.');
      }
      // Fallback to mock data only in development
      if (isDevelopment) {
        console.warn('API request failed, using mock data (development mode):', error);
      }
      // Return games released within last 2 weeks (simulated)
      return mockGamesFromG2A.slice(0, 30);
    }
  },

  getGamesByGenre: async (genre: string): Promise<Game[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Game[] }>(
        `/api/games/by-genre/${genre}`
      );
      return response.data;
    } catch (error) {
      // In production, throw error instead of using mock data
      if (!isDevelopment) {
        console.error('Failed to fetch games by genre from API:', error);
        throw new Error('Unable to load games. Please try again later.');
      }
      // Fallback to mock data only in development
      if (isDevelopment) {
        console.warn('API request failed, using mock data (development mode):', error);
      }
      return mockGamesFromG2A.filter(g => 
        g.genres.some(gGenre => gGenre.toLowerCase() === genre.toLowerCase())
      ).slice(0, 40);
    }
  },

  getRandomGames: async (count: number = 10): Promise<Game[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Game[] }>(
        '/api/games/random',
        {
          params: { count: count.toString() },
        }
      );
      return response.data;
    } catch (error) {
      // In production, throw error instead of using mock data
      if (!isDevelopment) {
        console.error('Failed to fetch random games from API:', error);
        throw new Error('Unable to load games. Please try again later.');
      }
      // Fallback to mock data only in development
      if (isDevelopment) {
        console.warn('API request failed, using mock data (development mode):', error);
      }
      // Shuffle and return random games
      const shuffled = [...mockGamesFromG2A].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }
  },

  getSimilarGames: async (gameId: string, count: number = 10): Promise<Game[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Game[] }>(
        `/api/games/${gameId}/similar`,
        {
          params: { count: count.toString() },
        }
      );
      return response.data;
    } catch (error) {
      // In production, throw error instead of using mock data
      if (!isDevelopment) {
        console.error('Failed to fetch similar games from API:', error);
        throw new Error('Unable to load similar games. Please try again later.');
      }
      // Fallback to mock data only in development
      if (isDevelopment) {
        console.warn('API request failed, using mock data (development mode):', error);
      }
      // Find games with similar genres
      const game = mockGamesFromG2A.find(g => g.id === gameId);
      if (!game) return mockGamesFromG2A.slice(0, count);
      
      return mockGamesFromG2A
        .filter(g => g.id !== gameId && g.genres.some(genre => game.genres.includes(genre)))
        .slice(0, count);
    }
  },

  searchGames: async (query: string): Promise<Game[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Game[] }>(
        '/api/games/search',
        {
          params: { q: query },
        }
      );
      return response.data;
    } catch (error) {
      // In production, throw error instead of using mock data
      if (!isDevelopment) {
        console.error('Failed to search games from API:', error);
        throw new Error('Unable to search games. Please try again later.');
      }
      // Fallback to mock data only in development
      if (isDevelopment) {
        console.warn('API request failed, using mock data (development mode):', error);
      }
      const q = query.toLowerCase();
      return mockGamesFromG2A.filter(g => 
        g.title.toLowerCase().includes(q) || 
        g.description.toLowerCase().includes(q)
      );
    }
  },

  getAllGenres: async (): Promise<Array<{ name: string; slug: string }>> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Array<{ name: string; slug: string }> }>(
        '/api/games/genres'
      );
      return response.data;
    } catch (error) {
      // In production, throw error instead of using mock data
      if (!isDevelopment) {
        console.error('Failed to fetch genres from API:', error);
        throw new Error('Unable to load genres. Please try again later.');
      }
      // Fallback to mock data only in development
      if (isDevelopment) {
        console.warn('API request failed, using mock data (development mode):', error);
      }
      const genres = new Set<string>();
      mockGamesFromG2A.forEach(g => g.genres.forEach(genre => genres.add(genre)));
      return Array.from(genres).map(name => ({ name, slug: name.toLowerCase().replace(/\s+/g, '-') }));
    }
  },

  getAllPlatforms: async (): Promise<Array<{ name: string; slug: string }>> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Array<{ name: string; slug: string }> }>(
        '/api/games/platforms'
      );
      return response.data;
    } catch (error) {
      // In production, throw error instead of using mock data
      if (!isDevelopment) {
        console.error('Failed to fetch platforms from API:', error);
        throw new Error('Unable to load platforms. Please try again later.');
      }
      // Fallback to mock data only in development
      if (isDevelopment) {
        console.warn('API request failed, using mock data (development mode):', error);
      }
      const platforms = new Set<string>();
      mockGamesFromG2A.forEach(g => g.platforms.forEach(p => platforms.add(p)));
      return Array.from(platforms).map(name => ({ name, slug: name.toLowerCase().replace(/\s+/g, '-') }));
    }
  },

  getFilterOptions: async (): Promise<{
    genres: Array<{ name: string; slug: string }>;
    platforms: Array<{ name: string; slug: string }>;
    activationServices: string[];
    regions: string[];
    publishers: string[];
    multiplayer: boolean[];
  }> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: {
        genres: Array<{ name: string; slug: string }>;
        platforms: Array<{ name: string; slug: string }>;
        activationServices: string[];
        regions: string[];
        publishers: string[];
        multiplayer: boolean[];
      } }>('/api/games/filter-options');
      return response.data;
    } catch (error) {
      // In production, throw error instead of using mock data
      if (!isDevelopment) {
        console.error('Failed to fetch filter options from API:', error);
        throw new Error('Unable to load filter options. Please try again later.');
      }
      // Fallback to mock data only in development
      if (isDevelopment) {
        console.warn('API request failed, using mock data (development mode):', error);
      }
      const genres = new Set<string>();
      const platforms = new Set<string>();
      const publishers = new Set<string>();
      
      mockGamesFromG2A.forEach(g => {
        g.genres.forEach(genre => genres.add(genre));
        g.platforms.forEach(p => platforms.add(p));
        if (g.publisher) publishers.add(g.publisher);
      });
      
      return {
        genres: Array.from(genres).map(name => ({ name, slug: name.toLowerCase().replace(/\s+/g, '-') })),
        platforms: Array.from(platforms).map(name => ({ name, slug: name.toLowerCase().replace(/\s+/g, '-') })),
        activationServices: ['Steam', 'Uplay', 'Battle.net', 'Rockstar', 'Xbox'],
        regions: ['Global', 'Europe', 'North America'],
        publishers: Array.from(publishers),
        multiplayer: [true, false],
      };
    }
  },

  getCollections: async (): Promise<Array<{ id: string; title: string; type: 'genre' | 'publisher'; value: string; games: Game[] }>> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Array<{ id: string; title: string; type: 'genre' | 'publisher'; value: string; games: Game[] }> }>(
        '/api/games/collections'
      );
      return response.data;
    } catch (error) {
      // In production, throw error instead of using mock data
      if (!isDevelopment) {
        console.error('Failed to fetch collections from API:', error);
        throw new Error('Unable to load collections. Please try again later.');
      }
      // Fallback to mock data only in development
      if (isDevelopment) {
        console.warn('API request failed, using mock data (development mode):', error);
      }
      return [
        {
          id: 'action-collection',
          title: 'Action Games',
          type: 'genre',
          value: 'Action',
          games: mockGamesFromG2A.filter(g => g.genres.includes('Action')).slice(0, 40),
        },
        {
          id: 'rpg-collection',
          title: 'RPG Games',
          type: 'genre',
          value: 'RPG',
          games: mockGamesFromG2A.filter(g => g.genres.includes('RPG')).slice(0, 40),
        },
        {
          id: 'ubisoft-collection',
          title: 'Ubisoft Games',
          type: 'publisher',
          value: 'Ubisoft',
          games: mockGamesFromG2A.filter(g => g.publisher === 'Ubisoft').slice(0, 40),
        },
      ];
    }
  },

  /**
   * Get autocomplete suggestions for search query
   * @param query - Search query (minimum 2 characters)
   * @param limit - Maximum number of results (default: 10)
   * @returns Array of search suggestions
   */
  getAutocomplete: async (query: string, limit: number = 10): Promise<Array<{
    id: string;
    title: string;
    image: string;
    slug: string;
    relevanceScore: number;
  }>> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Array<{
        id: string;
        title: string;
        image: string;
        slug: string;
        relevanceScore: number;
      }> }>('/api/games/autocomplete', {
        params: { q: query, limit: limit.toString() },
      });
      return response.data;
    } catch (error) {
      // In production, throw error instead of using mock data
      if (!isDevelopment) {
        console.error('Failed to fetch autocomplete from API:', error);
        throw new Error('Unable to load search suggestions. Please try again later.');
      }
      // Fallback to mock data only in development
      if (isDevelopment) {
        console.warn('API request failed, using mock data (development mode):', error);
      }
      // Fallback to mock data - simple search
      const q = query.toLowerCase();
      const matches = mockGamesFromG2A
        .filter(g => 
          g.title.toLowerCase().includes(q) || 
          g.description.toLowerCase().includes(q)
        )
        .slice(0, limit)
        .map((g, index) => ({
          id: g.id,
          title: g.title,
          image: g.image,
          slug: g.slug,
          relevanceScore: 1 - (index * 0.1), // Simple relevance scoring
        }));
      return matches;
    }
  },

  getWishlist: async (): Promise<Game[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Game[] }>(
        '/api/user/wishlist'
      );
      return response.data;
    } catch (error) {
      // In production, throw error instead of using mock data
      if (!isDevelopment) {
        console.error('Failed to fetch wishlist from API:', error);
        throw new Error('Unable to load wishlist. Please try again later.');
      }
      // Fallback to mock data only in development
      if (isDevelopment) {
        console.warn('API request failed, using mock data (development mode):', error);
      }
      // Return mock wishlist - first 6 games
      return mockGamesFromG2A.slice(0, 6);
    }
  },

  removeFromWishlist: async (gameId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/user/wishlist/${gameId}`);
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      throw error;
    }
  },
};

