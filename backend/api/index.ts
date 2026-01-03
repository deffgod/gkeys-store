/**
 * Vercel Serverless Function Handler for Express Backend
 * 
 * This file serves as the entry point for all /api/* requests on Vercel.
 * Vercel automatically routes /api/* requests to this serverless function.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: any = null;

async function getApp(): Promise<any> {
  if (!app) {
    try {
      // Import compiled backend from dist
      const backendModule = await import('../dist/index.js');
      app = backendModule.default;
      console.log('✅ Loaded backend from compiled dist');
    } catch (distError) {
      const errorMessage = distError instanceof Error ? distError.message : String(distError);
      console.error('❌ Failed to load backend:', errorMessage);
      throw new Error(`Failed to import backend: ${errorMessage}`);
    }
  }
  return app;
}

/**
 * Vercel Serverless Function Handler
 * Handles all requests to /api/* routes
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    const expressApp = await getApp();
    
    // Create Express-compatible request/response objects
    const expressReq = req as any;
    const expressRes = res as any;
    
    // Vercel strips /api prefix, but Express routes expect /api prefix
    // Add /api back to the URL path
    const originalUrl = expressReq.url || expressReq.path || '/';
    const pathWithoutApi = originalUrl.startsWith('/') ? originalUrl : `/${originalUrl}`;
    
    if (!pathWithoutApi.startsWith('/api')) {
      expressReq.url = '/api' + pathWithoutApi;
      expressReq.originalUrl = '/api' + pathWithoutApi;
      expressReq.path = '/api' + pathWithoutApi;
    } else {
      expressReq.url = pathWithoutApi;
      expressReq.originalUrl = pathWithoutApi;
      expressReq.path = pathWithoutApi;
    }
    
    // Ensure method is set
    expressReq.method = req.method || 'GET';
    
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
