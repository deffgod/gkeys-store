import { Router } from 'express';
import {
  getFAQsController,
  getFAQCategoriesController,
} from '../controllers/faq.controller.js';

const router = Router();

router.get('/', getFAQsController);
router.get('/categories', getFAQCategoriesController);

export default router;
