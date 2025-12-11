import { NextRequest } from 'next/server';
import { ALLOWED_ORIGINS } from '@/utils/config';

interface CorsOptions {
  methods?: string;
  headers?: string;
  maxAge?: number;
}

export function getCorsHeaders(request: NextRequest, options: CorsOptions = {}) {
  const origin = request.headers.get('origin');
  const allowedMethods = options.methods || 'GET, POST, PUT, DELETE, OPTIONS';
  const allowedHeaders = options.headers || 'Content-Type, Authorization';
  const maxAge = options.maxAge || 86400; // Default to 24 hours

  const headers: HeadersInit = {
    'Access-Control-Allow-Methods': allowedMethods,
    'Access-Control-Allow-Headers': allowedHeaders,
    'Access-Control-Max-Age': maxAge.toString(),
    'Access-Control-Allow-Credentials': 'true',
  };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  // If origin is not allowed, we don't set Access-Control-Allow-Origin,
  // letting the browser's default CORS behavior block the request.

  return headers;
}
