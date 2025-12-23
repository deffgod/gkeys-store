import prisma from '../config/database.js';
import { ArticleFilters, ArticleResponse, PaginatedArticleResponse } from '../types/blog.js';
import { Prisma } from '@prisma/client';

const DEFAULT_PAGE_SIZE = 20;

export const getArticles = async (
  filters?: ArticleFilters
): Promise<PaginatedArticleResponse> => {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ArticleWhereInput = {
    published: filters?.published !== false, // Default to published only
  };

  if (filters?.category) {
    where.category = filters.category;
  }

  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { excerpt: { contains: filters.search, mode: 'insensitive' } },
      { content: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.article.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    data: articles.map((article) => ({
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      coverImage: article.coverImage,
      category: article.category,
      author: article.author,
      published: article.published,
      publishedAt: article.publishedAt?.toISOString(),
      readTime: article.readTime || undefined,
      tags: article.tags,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
};

export const getArticleById = async (id: string): Promise<ArticleResponse | null> => {
  const article = await prisma.article.findUnique({
    where: { id },
  });

  if (!article) return null;

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    coverImage: article.coverImage,
    category: article.category,
    author: article.author,
    published: article.published,
    publishedAt: article.publishedAt?.toISOString(),
    readTime: article.readTime || undefined,
    tags: article.tags,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
};

export const getArticleBySlug = async (slug: string): Promise<ArticleResponse | null> => {
  const article = await prisma.article.findUnique({
    where: { slug },
  });

  if (!article) return null;

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    coverImage: article.coverImage,
    category: article.category,
    author: article.author,
    published: article.published,
    publishedAt: article.publishedAt?.toISOString(),
    readTime: article.readTime || undefined,
    tags: article.tags,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
};

export const getCategories = async (): Promise<Array<{ name: string; slug: string; count: number }>> => {
  // Get all articles and group by category
  const articles = await prisma.article.findMany({
    where: { published: true },
    select: { category: true },
  });

  const categoryMap = new Map<string, number>();
  
  for (const article of articles) {
    const count = categoryMap.get(article.category) || 0;
    categoryMap.set(article.category, count + 1);
  }

  const categories = [
    { name: 'All', slug: 'all', count: articles.length },
    ...Array.from(categoryMap.entries()).map(([category, count]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      slug: category.toLowerCase(),
      count,
    })),
  ];

  return categories;
};

