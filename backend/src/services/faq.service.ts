import prisma from '../config/database.js';
import { Prisma } from '@prisma/client';

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
    where,
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
