import apiClient from './api';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image?: string;
  coverImage?: string;
  category: string;
  author: string;
  publishedAt: string;
  readTime?: number;
  tags?: string[];
}

export interface BlogFilters {
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedBlogResponse {
  data: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Mock blog data for frontend
const mockPosts: BlogPost[] = [
  {
    id: '1',
    slug: 'best-rpg-games-2025',
    title: 'Top 10 Best RPG Games to Play in 2025',
    excerpt: 'Discover the most anticipated and critically acclaimed RPG games of 2025. From epic fantasy adventures to sci-fi masterpieces.',
    content: `<p>The RPG genre continues to evolve and deliver incredible experiences for gamers worldwide. In 2025, we're seeing some of the most innovative and ambitious RPG titles ever created.</p>
    
<h2>1. Elder Scrolls VI</h2>
<p>After years of waiting, Bethesda's magnum opus is finally here. Set in the mysterious province of Hammerfell, this game delivers everything fans have been waiting for and more.</p>

<h2>2. Dragon Age: The Veilguard</h2>
<p>BioWare's return to form brings deep storytelling and strategic combat that fans of the series will love.</p>

<h2>3. Final Fantasy XVII</h2>
<p>Square Enix continues their legendary franchise with stunning visuals and an emotional story.</p>`,
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop',
    category: 'guides',
    author: 'Alex Gaming',
    publishedAt: '2025-01-15T10:00:00Z',
    readTime: 8,
    tags: ['RPG', 'Gaming', 'Top 10'],
  },
  {
    id: '2',
    slug: 'steam-winter-sale-2025',
    title: 'Steam Winter Sale 2025: Best Deals You Can\'t Miss',
    excerpt: 'The biggest Steam sale of the year is here! We\'ve compiled the best deals and hidden gems you should grab.',
    content: `<p>Steam's Winter Sale 2025 has arrived, and with it comes thousands of amazing deals on games both new and classic.</p>
    
<h2>Top AAA Deals</h2>
<p>This year's sale features incredible discounts on major titles including up to 75% off on recent releases.</p>

<h2>Hidden Gems Under $10</h2>
<p>Don't overlook these indie masterpieces that are available for less than $10 during the sale.</p>`,
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=400&fit=crop',
    category: 'news',
    author: 'Sarah Deal Hunter',
    publishedAt: '2025-01-12T14:30:00Z',
    readTime: 5,
    tags: ['Steam', 'Sales', 'Deals'],
  },
  {
    id: '3',
    slug: 'how-to-activate-steam-keys',
    title: 'Complete Guide: How to Activate Game Keys on Steam',
    excerpt: 'New to buying game keys? This comprehensive guide will walk you through the entire activation process step by step.',
    content: `<p>Purchasing and activating game keys is a great way to save money on your favorite games. Here's everything you need to know.</p>
    
<h2>Step 1: Open Steam Client</h2>
<p>Launch the Steam application on your computer and make sure you're logged into your account.</p>

<h2>Step 2: Navigate to Games Menu</h2>
<p>Click on "Games" in the top menu bar, then select "Activate a Product on Steam..."</p>

<h2>Step 3: Enter Your Key</h2>
<p>Follow the prompts and enter your game key exactly as it appears. The game will be added to your library!</p>`,
    image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&h=400&fit=crop',
    category: 'guides',
    author: 'Tech Support Team',
    publishedAt: '2025-01-10T09:00:00Z',
    readTime: 3,
    tags: ['Steam', 'Tutorial', 'Keys'],
  },
  {
    id: '4',
    slug: 'cyberpunk-2077-phantom-liberty-review',
    title: 'Cyberpunk 2077: Phantom Liberty - Is It Worth It?',
    excerpt: 'CD Projekt Red\'s ambitious expansion brings major changes to Night City. We dive deep into what makes it special.',
    content: `<p>Phantom Liberty represents CD Projekt Red's commitment to making Cyberpunk 2077 the game it was always meant to be.</p>
    
<h2>Story & Characters</h2>
<p>The new storyline featuring Idris Elba's character Solomon Reed is a spy thriller that rivals the best in the genre.</p>

<h2>Gameplay Improvements</h2>
<p>The overhauled police system, vehicle combat, and skill trees make this feel like an entirely new game.</p>

<h2>Verdict: 9/10</h2>
<p>A must-play expansion that elevates the entire Cyberpunk experience.</p>`,
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=400&fit=crop',
    category: 'reviews',
    author: 'Mike Reviewer',
    publishedAt: '2025-01-08T16:00:00Z',
    readTime: 10,
    tags: ['Review', 'Cyberpunk', 'DLC'],
  },
  {
    id: '5',
    slug: 'upcoming-games-february-2025',
    title: 'Most Anticipated Games Coming in February 2025',
    excerpt: 'February is packed with exciting releases. Here\'s what games you should keep on your radar.',
    content: `<p>The gaming industry shows no signs of slowing down as we head into February 2025.</p>
    
<h2>Week 1 Releases</h2>
<p>Starting strong with several indie darlings and a major multiplayer title.</p>

<h2>Week 2-3 Releases</h2>
<p>The month's biggest AAA releases drop in the middle weeks.</p>

<h2>End of Month</h2>
<p>February closes out with some surprise announcements expected.</p>`,
    image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=800&h=400&fit=crop',
    category: 'news',
    author: 'News Team',
    publishedAt: '2025-01-05T12:00:00Z',
    readTime: 6,
    tags: ['Upcoming', 'Releases', '2025'],
  },
  {
    id: '6',
    slug: 'best-budget-gaming-pc-2025',
    title: 'Build the Best Budget Gaming PC in 2025',
    excerpt: 'You don\'t need to spend thousands to enjoy modern games. Here\'s how to build an excellent gaming PC on a budget.',
    content: `<p>Building a gaming PC doesn't have to break the bank. With the right components, you can enjoy modern games at respectable settings.</p>
    
<h2>CPU: Best Value Options</h2>
<p>AMD's Ryzen 5 series and Intel's Core i5 lineup offer incredible performance per dollar.</p>

<h2>GPU: Sweet Spot Cards</h2>
<p>The mid-range GPU market is more competitive than ever, with great options from both NVIDIA and AMD.</p>

<h2>Complete Build List</h2>
<p>Here's our recommended parts list for a $800 gaming PC that handles 1080p gaming with ease.</p>`,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&h=400&fit=crop',
    category: 'guides',
    author: 'Hardware Expert',
    publishedAt: '2025-01-03T11:00:00Z',
    readTime: 12,
    tags: ['PC Build', 'Budget', 'Hardware'],
  },
];

export const blogApi = {
  getPosts: async (filters?: BlogFilters): Promise<PaginatedBlogResponse> => {
    try {
      const params: Record<string, string> = {};
      if (filters?.category && filters.category !== 'all') {
        params.category = filters.category;
      }
      if (filters?.search) {
        params.search = filters.search;
      }
      if (filters?.page) {
        params.page = filters.page.toString();
      }
      if (filters?.pageSize) {
        params.pageSize = filters.pageSize.toString();
      }

      const response = await apiClient.get<{
        success: boolean;
        data: {
          data: BlogPost[];
          total: number;
          page: number;
          pageSize: number;
          totalPages: number;
        };
      }>('/api/blog/articles', { params });

      const result = response.data;
      return {
        data: result.data.map((article) => ({
          id: article.id,
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt || '',
          content: article.content || '',
          image: article.coverImage || article.image || '',
          category: article.category || '',
          author: article.author || 'Unknown',
          publishedAt: article.publishedAt || '',
          readTime: article.readTime || 5,
          tags: article.tags || [],
        })),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      };
    } catch (error) {
      console.error('Failed to load posts:', error);
      // Fallback to empty result
      return {
        data: [],
        total: 0,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 9,
        totalPages: 0,
      };
    }
  },

  getPost: async (slug: string): Promise<BlogPost | null> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: BlogPost;
      }>(`/api/blog/articles/slug/${slug}`);

      const article = response.data;
      return {
        id: article.id,
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt || '',
        content: article.content || '',
        image: article.coverImage || article.image || '',
        category: article.category || '',
        author: article.author || 'Unknown',
        publishedAt: article.publishedAt || '',
        readTime: article.readTime || 5,
        tags: article.tags || [],
      };
    } catch (error) {
      console.error('Failed to load post:', error);
      return null;
    }
  },

  getCategories: async (): Promise<Array<{ name: string; slug: string; count: number }>> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: Array<{ name: string; slug: string; count: number }>;
      }>('/api/blog/categories');

      return response.data.data;
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Fallback to default categories
      return [
        { name: 'All', slug: 'all', count: 0 },
        { name: 'News', slug: 'news', count: 0 },
        { name: 'Guides', slug: 'guides', count: 0 },
        { name: 'Reviews', slug: 'reviews', count: 0 },
      ];
    }
  },

  getRecentPosts: async (limit: number = 5): Promise<BlogPost[]> => {
    try {
      const result = await this.getPosts({ page: 1, pageSize: limit });
      return result.data;
    } catch (error) {
      console.error('Failed to load recent posts:', error);
      return [];
    }
  },
};

