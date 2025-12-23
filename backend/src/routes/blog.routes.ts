import { Router } from 'express';
import {
  getArticlesController,
  getArticleByIdController,
  getArticleBySlugController,
  getCategoriesController,
} from '../controllers/blog.controller.js';

const router = Router();

router.get('/articles', getArticlesController);
router.get('/articles/slug/:slug', getArticleBySlugController);
router.get('/articles/:id', getArticleByIdController);
router.get('/categories', getCategoriesController);

export default router;

