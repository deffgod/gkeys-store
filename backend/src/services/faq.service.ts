import prisma from '../config/database.js';
import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  order: number;
  active: boolean;
  createdAt: Date;
}

export interface FAQFilters {
  category?: string;
  search?: string;
  active?: boolean;
}

export const getFAQs = async (filters?: FAQFilters): Promise<FAQItem[]> => {
  const where: {
    category?: string;
    active?: boolean;
    OR?: Array<{ question?: { contains: string; mode: string }; answer?: { contains: string; mode: string } }>;
  } = {};

  if (filters?.category) {
    where.category = filters.category;
  }

  if (filters?.active !== undefined) {
    where.active = filters.active;
  } else {
    // Default to active only
    where.active = true;
  }

  if (filters?.search) {
    where.OR = [
      { question: { contains: filters.search, mode: 'insensitive' as const } },
      { answer: { contains: filters.search, mode: 'insensitive' as const } },
    ];
  }

  const faqs = await prisma.fAQ.findMany({
    where: where as Prisma.FAQWhereInput,
    orderBy: [
      { category: 'asc' },
      { order: 'asc' },
    ],
  });

  return faqs.map((faq) => ({
    id: faq.id,
    category: faq.category,
    question: faq.question,
    answer: faq.answer,
    order: faq.order,
    active: faq.active,
    createdAt: faq.createdAt,
  }));
};

export const getFAQCategories = async (): Promise<Array<{ name: string; slug: string; count: number }>> => {
  const faqs = await prisma.fAQ.findMany({
    where: { active: true },
    select: { category: true },
  });

  const categoryMap = new Map<string, number>();
  
  for (const faq of faqs) {
    const count = categoryMap.get(faq.category) || 0;
    categoryMap.set(faq.category, count + 1);
  }

  const categories = Array.from(categoryMap.entries()).map(([category, count]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' '),
    slug: category.toLowerCase(),
    count,
  }));

  // Sort by name
  categories.sort((a, b) => a.name.localeCompare(b.name));

  return categories;
};

/**
 * Create a new FAQ item
 */
export const createFAQ = async (data: {
  category: string;
  question: string;
  answer: string;
  order?: number;
  active?: boolean;
}): Promise<FAQItem> => {
  if (!data.category || !data.question || !data.answer) {
    throw new AppError('Category, question, and answer are required', 400);
  }

  // Get max order for this category if order not specified
  let order = data.order;
  if (order === undefined) {
    const maxOrder = await prisma.fAQ.findFirst({
      where: { category: data.category },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    order = maxOrder ? maxOrder.order + 1 : 0;
  }

  const faq = await prisma.fAQ.create({
    data: {
      category: data.category.trim(),
      question: data.question.trim(),
      answer: data.answer.trim(),
      order: order,
      active: data.active !== undefined ? data.active : true,
    },
  });

  // Invalidate FAQ cache (non-blocking)
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache('faq:*');
  } catch (cacheError) {
    console.warn('[FAQ Create] Failed to invalidate cache:', cacheError);
  }

  return {
    id: faq.id,
    category: faq.category,
    question: faq.question,
    answer: faq.answer,
    order: faq.order,
    active: faq.active,
    createdAt: faq.createdAt,
  };
};

/**
 * Update an existing FAQ item
 */
export const updateFAQ = async (
  id: string,
  data: {
    category?: string;
    question?: string;
    answer?: string;
    order?: number;
    active?: boolean;
  }
): Promise<FAQItem> => {
  // Verify FAQ exists
  const existing = await prisma.fAQ.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError('FAQ not found', 404);
  }

  const updateData: {
    category?: string;
    question?: string;
    answer?: string;
    order?: number;
    active?: boolean;
  } = {};

  if (data.category !== undefined) {
    updateData.category = data.category.trim();
  }
  if (data.question !== undefined) {
    updateData.question = data.question.trim();
  }
  if (data.answer !== undefined) {
    updateData.answer = data.answer.trim();
  }
  if (data.order !== undefined) {
    updateData.order = data.order;
  }
  if (data.active !== undefined) {
    updateData.active = data.active;
  }

  const faq = await prisma.fAQ.update({
    where: { id },
    data: updateData,
  });

  // Invalidate FAQ cache (non-blocking)
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache('faq:*');
  } catch (cacheError) {
    console.warn('[FAQ Update] Failed to invalidate cache:', cacheError);
  }

  return {
    id: faq.id,
    category: faq.category,
    question: faq.question,
    answer: faq.answer,
    order: faq.order,
    active: faq.active,
    createdAt: faq.createdAt,
  };
};

/**
 * Delete an FAQ item
 */
export const deleteFAQ = async (id: string): Promise<void> => {
  // Verify FAQ exists
  const existing = await prisma.fAQ.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError('FAQ not found', 404);
  }

  await prisma.fAQ.delete({
    where: { id },
  });

  // Invalidate FAQ cache (non-blocking)
  try {
    const { invalidateCache } = await import('./cache.service.js');
    await invalidateCache('faq:*');
  } catch (cacheError) {
    console.warn('[FAQ Delete] Failed to invalidate cache:', cacheError);
  }
};
