import { NextRequest, NextResponse } from 'next/server';
import logger from './logger';

export function withLogging(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const start = Date.now();
    const { method, nextUrl } = req;

    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - start;
      
      // Log setiap request yang sukses
      logger.info(`${method} ${nextUrl.pathname} - ${response.status} (${duration}ms)`);
      
      return response;
    } catch (error: any) {
      const duration = Date.now() - start;
      // Log jika terjadi crash
      logger.error(`CRASH ${method} ${nextUrl.pathname} - ${error.message} (${duration}ms)`, { stack: error.stack });
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
  };
}