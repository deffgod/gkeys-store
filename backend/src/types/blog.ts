export interface ArticleFilters {
  category?: string;
  search?: string;
  published?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ArticleResponse {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  author: string;
  published: boolean;
  publishedAt?: string;
  readTime?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedArticleResponse {
  data: ArticleResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BlogPostCreateInput {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  published: boolean;
}

export interface BlogPostUpdateInput {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  published?: boolean;
}

export interface BlogPostResponse {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  author: string;
  published: boolean;
  publishedAt?: string;
  readTime?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}