import { Request, Response, NextFunction } from 'express';
import { getFAQs, getFAQCategories } from '../services/faq.service.js';
import { FAQFilters } from '../services/faq.service.js';

export const getFAQsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: FAQFilters = {
      category: req.query.category as string | undefined,
      search: req.query.search as string | undefined,
      active: req.query.active !== 'false',
    };

    const faqs = await getFAQs(filters);

    res.status(200).json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    next(error);
  }
};

export const getFAQCategoriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await getFAQCategories();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};
