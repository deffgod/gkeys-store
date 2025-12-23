import { Request, Response, NextFunction } from 'express';
import { getArticles, getArticleById, getArticleBySlug, getCategories } from '../services/blog.service.js';
import { ArticleFilters } from '../types/blog.js';

export const getArticlesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters: ArticleFilters = {
      category: req.query.category as string | undefined,
      search: req.query.search as string | undefined,
      published: req.query.published !== 'false',
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
    };

    const result = await getArticles(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getArticleByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const article = await getArticleById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        error: { message: 'Article not found' },
      });
    }

    res.status(200).json({
      success: true,
      data: article,
    });
  } catch (error) {
    next(error);
  }
};

export const getArticleBySlugController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;
    const article = await getArticleBySlug(slug);

    if (!article) {
      return res.status(404).json({
        success: false,
        error: { message: 'Article not found' },
      });
    }

    res.status(200).json({
      success: true,
      data: article,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await getCategories();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

