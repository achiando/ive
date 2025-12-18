import { UserRole } from '@prisma/client';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
    '/',
    '/auth/signin', 
    '/auth/error', 
    '/api/auth','/api/auth/register','/api/auth/verify','/api/auth/verify','/api/auth/verify'];

// Define admin routes that require admin role
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });
  const isAuthenticated = !!token;

  // Handle unauthenticated users
  if (!isAuthenticated) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // Check admin routes
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  if (isAdminRoute && token.role !== UserRole.ADMIN) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
