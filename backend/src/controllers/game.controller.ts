import { Request, Response, NextFunction } from 'express';
import {
  getGames,
  getGameById,
  getGameBySlug,
  getBestSellers,
  getNewInCatalog,
  getPreorders,
  getNewGames,
  getGamesByGenre,
  getRandomGames,
  getSimilarGames,
  searchGames,
  getAllGenres,
  getAllPlatforms,
  getFilterOptions,
  getCollections,
  getGameAutocomplete,
} from '../services/game.service.js';
import { GameFilters } from '../types/game.js';

export const getGamesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters: GameFilters = {
      search: req.query.search as string,
      priceRange: req.query.minPrice && req.query.maxPrice
        ? {
            min: Number(req.query.minPrice),
            max: Number(req.query.maxPrice),
          }
        : undefined,
      pricePreset: req.query.pricePreset as GameFilters['pricePreset'],
      inStockOnly: req.query.inStockOnly !== 'false',
      platforms: req.query.platforms
        ? (Array.isArray(req.query.platforms)
            ? req.query.platforms
            : [req.query.platforms]) as string[]
        : undefined,
      activationServices: req.query.activationServices
        ? (Array.isArray(req.query.activationServices)
            ? req.query.activationServices
            : [req.query.activationServices]) as string[]
        : undefined,
      regions: req.query.regions
        ? (Array.isArray(req.query.regions)
            ? req.query.regions
            : [req.query.regions]) as string[]
        : undefined,
      multiplayer: req.query.multiplayer !== undefined
        ? req.query.multiplayer === 'true'
        : undefined,
      publishers: req.query.publishers
        ? (Array.isArray(req.query.publishers)
            ? req.query.publishers
            : [req.query.publishers]) as string[]
        : undefined,
      genres: req.query.genres
        ? (Array.isArray(req.query.genres)
            ? req.query.genres
            : [req.query.genres]) as string[]
        : undefined,
      sort: req.query.sort as GameFilters['sort'],
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
    };

    const result = await getGames(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getGameByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const game = await getGameById(id);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: { message: 'Game not found' },
      });
    }

    res.status(200).json({
      success: true,
      data: game,
    });
  } catch (error) {
    next(error);
  }
};

export const getGameBySlugController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;
    const game = await getGameBySlug(slug);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: { message: 'Game not found' },
      });
    }

    res.status(200).json({
      success: true,
      data: game,
    });
  } catch (error) {
    next(error);
  }
};

export const getBestSellersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const genre = req.query.genre as string | undefined;
    const games = await getBestSellers(genre);

    res.status(200).json({
      success: true,
      data: games,
    });
  } catch (error) {
    next(error);
  }
};

export const getNewInCatalogController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const games = await getNewInCatalog();

    res.status(200).json({
      success: true,
      data: games,
    });
  } catch (error) {
    next(error);
  }
};

export const getPreordersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const games = await getPreorders();

    res.status(200).json({
      success: true,
      data: games,
    });
  } catch (error) {
    next(error);
  }
};

export const getNewGamesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const games = await getNewGames();

    res.status(200).json({
      success: true,
      data: games,
    });
  } catch (error) {
    next(error);
  }
};

export const getGamesByGenreController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { genre } = req.params;
    const games = await getGamesByGenre(genre);

    res.status(200).json({
      success: true,
      data: games,
    });
  } catch (error) {
    next(error);
  }
};

export const getRandomGamesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const count = req.query.count ? Number(req.query.count) : 10;
    const games = await getRandomGames(count);

    res.status(200).json({
      success: true,
      data: games,
    });
  } catch (error) {
    next(error);
  }
};

export const getSimilarGamesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const count = req.query.count ? Number(req.query.count) : 10;
    const games = await getSimilarGames(id, count);

    res.status(200).json({
      success: true,
      data: games,
    });
  } catch (error) {
    next(error);
  }
};

export const searchGamesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Search query is required' },
      });
    }

    const games = await searchGames(q);

    res.status(200).json({
      success: true,
      data: games,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllGenresController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const genres = await getAllGenres();

    res.status(200).json({
      success: true,
      data: genres,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPlatformsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const platforms = await getAllPlatforms();

    res.status(200).json({
      success: true,
      data: platforms,
    });
  } catch (error) {
    next(error);
  }
};

export const getFilterOptionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const options = await getFilterOptions();

    res.status(200).json({
      success: true,
      data: options,
    });
  } catch (error) {
    next(error);
  }
};

export const getCollectionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const collections = await getCollections();

    res.status(200).json({
      success: true,
      data: collections,
    });
  } catch (error) {
    next(error);
  }
};

export const getGameAutocompleteController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query.q as string;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    // Validate query
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: { message: 'Query must be at least 2 characters long' },
      });
    }

    // Validate limit
    if (limit < 1 || limit > 20) {
      return res.status(400).json({
        success: false,
        error: { message: 'Limit must be between 1 and 20' },
      });
    }

    const suggestions = await getGameAutocomplete(query, limit);

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
};

