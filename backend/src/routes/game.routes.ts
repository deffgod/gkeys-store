import { Router } from 'express';
import {
  getGamesController,
  getGameByIdController,
  getGameBySlugController,
  getBestSellersController,
  getNewInCatalogController,
  getPreordersController,
  getNewGamesController,
  getGamesByGenreController,
  getRandomGamesController,
  getSimilarGamesController,
  searchGamesController,
  getAllGenresController,
  getAllPlatformsController,
  getFilterOptionsController,
  getCollectionsController,
  getGameAutocompleteController,
} from '../controllers/game.controller.js';

const router = Router();

router.get('/', getGamesController);
router.get('/autocomplete', getGameAutocompleteController);
router.get('/search', searchGamesController);
router.get('/best-sellers', getBestSellersController);
router.get('/new-in-catalog', getNewInCatalogController);
router.get('/preorders', getPreordersController);
router.get('/new', getNewGamesController);
router.get('/by-genre/:genre', getGamesByGenreController);
router.get('/random', getRandomGamesController);
router.get('/genres', getAllGenresController);
router.get('/platforms', getAllPlatformsController);
router.get('/filter-options', getFilterOptionsController);
router.get('/collections', getCollectionsController);
router.get('/:id/similar', getSimilarGamesController);
router.get('/slug/:slug', getGameBySlugController);
router.get('/:id', getGameByIdController);

export default router;

