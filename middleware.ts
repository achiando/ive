import { RegistrationStatus, UserRole } from '@prisma/client';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/api/auth',
    'invite/*'
];

// Routes accessible to users with PENDING status
const pendingRoutes = ['/pending', '/api/users/selections'];

// Routes accessible to users with REJECTED status
const rejectedRoutes = ['/rejected'];

// Routes accessible to users with SUSPENDED status
const suspendedRoutes = ['/suspended'];


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow all requests to public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });
  const isAuthenticated = !!token;

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  const userStatus = token.status as RegistrationStatus;
  const userRole = token.role as UserRole;

  // Handle different user statuses
  if (userStatus === RegistrationStatus.PENDING) {
    if (pendingRoutes.some(route => pathname.startsWith(route)) || pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/pending', request.url));
  }

  if (userStatus === RegistrationStatus.REJECTED) {
    if (rejectedRoutes.some(route => pathname.startsWith(route)) || pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/rejected', request.url));
  }

  if (userStatus === RegistrationStatus.SUSPENDED) {
    if (suspendedRoutes.some(route => pathname.startsWith(route)) || pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/suspended', request.url));
  }

  // Handle APPROVED users
  if (userStatus === RegistrationStatus.APPROVED) {
    // If an approved user tries to access a status page, redirect to dashboard
    if (pathname.startsWith('/pending') || pathname.startsWith('/rejected') || pathname.startsWith('/suspended')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Admin role check for admin routes
    const isAdminRoute = pathname.startsWith('/admin'); // Assuming admin routes are under /admin
    if (isAdminRoute && userRole !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
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
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
