// API route wrapper that automatically adds performance logging
import { NextRequest, NextResponse } from 'next/server';
import { perfLogger } from './performance-logger';

type ApiHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse>;

// Wrap an API route handler with performance logging
export function withPerformanceLogging(
  routeName: string,
  handler: ApiHandler
): ApiHandler {
  return async (request: NextRequest, context?: any) => {
    // Start tracking
    perfLogger.startRoute(routeName);

    try {
      // Execute the handler
      const response = await handler(request, context);
      
      // End tracking and print results
      const log = perfLogger.endRoute();
      perfLogger.printLog(log);

      return response;
    } catch (error) {
      // End tracking even on error
      const log = perfLogger.endRoute();
      perfLogger.printLog(log);
      
      throw error;
    }
  };
}

// Helper to create a tracked Supabase query
export function createTrackedQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const tracker = perfLogger.trackQuery(queryName);
    tracker.start();
    
    try {
      const result = await queryFn();
      tracker.end();
      resolve(result);
    } catch (error) {
      tracker.end({ error: true });
      reject(error);
    }
  });
}