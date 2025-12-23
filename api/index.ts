/**
 * Vercel Serverless Function Handler for Express Backend
 * 
 * This file serves as the entry point for all /api/* requests on Vercel.
 * Vercel automatically routes /api/* requests to this serverless function.
 * 
 * Note: Vercel strips the /api prefix before calling this function,
 * but Express app expects paths with /api prefix, so we need to handle this.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import Express app from backend
// Use dynamic import to avoid executing server startup code
// Note: Express type is inferred from the imported module, no need for explicit type import

let app: any = null;

async function getApp(): Promise<any> {
  if (!app) {
    const distPath = '../backend/dist/index.js';
    const sourcePath = '../backend/src/index.js';
    
    try {
      // Try compiled version first (production)
      const backendModule = await import(distPath);
      app = backendModule.default;
      console.log('✅ Loaded backend from compiled dist');
    } catch (distError) {
      // Log warning but try source fallback
      const errorMessage = distError instanceof Error ? distError.message : String(distError);
      console.warn(`⚠️  Compiled backend not found at ${distPath}, trying source fallback:`, errorMessage);
      
      try {
        // Fallback to source (development only - should not happen in production)
        if (process.env.NODE_ENV === 'production') {
          throw new Error(`Production build requires compiled backend at ${distPath}. Build may have failed.`);
        }
        const backendModule = await import(sourcePath);
        app = backendModule.default;
        console.warn('⚠️  Using source backend (development mode)');
      } catch (sourceError) {
        const sourceErrorMessage = sourceError instanceof Error ? sourceError.message : String(sourceError);
        throw new Error(`Failed to import backend. Dist error: ${errorMessage}. Source error: ${sourceErrorMessage}`);
      }
    }
  }
  return app;
}

/**
 * Vercel Serverless Function Handler
 * Handles all requests to /api/* routes
 * 
 * Note: Vercel strips /api prefix, but Express app expects /api prefix in routes.
 * We need to add /api back to the path before passing to Express.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    const expressApp = await getApp();
    
    // Create Express-compatible request/response objects
    // Vercel's request/response are compatible with Express
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expressReq = req as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expressRes = res as any;
    
    // Vercel strips /api prefix, but Express routes expect /api prefix
    // Add /api back to the URL path
    if (expressReq.url && !expressReq.url.startsWith('/api')) {
      expressReq.url = '/api' + expressReq.url;
      expressReq.originalUrl = '/api' + (expressReq.originalUrl || expressReq.url);
    }
    
    // Handle the request with Express app
    expressApp(expressReq, expressRes);
  } catch (error) {
    console.error('Serverless function error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          ...(process.env.NODE_ENV === 'development' && { 
            details: error instanceof Error ? error.message : String(error) 
          }),
        },
      });
    }
  }
}
