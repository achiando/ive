import { hasUserTakenAnyAssessment } from "@/lib/actions/user-assessment";
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
  '/pending',
  '/rejected',
  '/suspended',
];

// Routes accessible to users with PENDING status
const pendingRoutes = ['/pending', '/api/users/selections'];

// Routes accessible to users with REJECTED status
const rejectedRoutes = ['/rejected'];

// Routes accessible to users with SUSPENDED status
const suspendedRoutes = ['/suspended'];

export const dynamic = 'force-dynamic';

// Helper function to check if path matches route patterns
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => {
    // Handle wildcard patterns
    if (route.includes('*')) {
      const pattern = route.replace('*', '');
      return pathname.startsWith(pattern);
    }
    return pathname.startsWith(route) || pathname === route;
  });
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('=== MIDDLEWARE START ===');
  console.log('Path:', pathname);
  console.log('URL:', request.url);

  // Skip middleware for static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.ico')
  ) {
    console.log('Skipping middleware for static asset');
    return NextResponse.next();
  }

  // Check if this is a public route
 // In proxy.ts, update the public route check:
const isPublicRoute = 
  // Skip middleware for auth-related API routes
  pathname.startsWith('/api/auth/') && 
  !pathname.endsWith('/session') &&  // But still process /session
  // Other public routes
  (publicRoutes.some(route => pathname.startsWith(route)) || 
   pathname.startsWith('/invite/'));
  
  if (isPublicRoute) {
    console.log('Public route allowed:', pathname);
    console.log('=== MIDDLEWARE END (Public) ===');
    return NextResponse.next();
  }
  
  console.log('Not a public route, proceeding with auth check...');

  // Get token
  console.log('Attempting to get token...');
  let token;
  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    console.log('Token retrieved:', token ? 'YES' : 'NO');
  } catch (error) {
    console.error('Error getting token:', error);
    token = null;
  }

  if (token) {
    console.log('User ID:', token.sub);
    console.log('User email:', token.email);
    console.log('User status:', token.status);
    console.log('User role:', token.role);
  }

  const isAuthenticated = !!token;

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  const userStatus = token!.status as RegistrationStatus;
  const userRole = token!.role as UserRole;
  
  console.log('Processing user with role:', userRole, 'status:', userStatus);

  // Handle PENDING users - regardless of role
  if (userStatus === 'PENDING') {
    console.log('User is PENDING');
    if (matchesRoute(pathname, pendingRoutes) || pathname.startsWith('/api/auth')) {
      console.log('Allowing access to pending route');
      return NextResponse.next();
    }
    console.log('Redirecting PENDING user to /pending');
    return NextResponse.redirect(new URL('/pending', request.url));
  }

  // Handle REJECTED users
  if (userStatus === 'REJECTED') {
    console.log('User is REJECTED');
    if (matchesRoute(pathname, rejectedRoutes) || pathname.startsWith('/api/auth')) {
      console.log('Allowing access to rejected route');
      return NextResponse.next();
    }
    console.log('Redirecting REJECTED user to /rejected');
    return NextResponse.redirect(new URL('/rejected', request.url));
  }

  // Handle SUSPENDED users
  if (userStatus === 'SUSPENDED') {
    console.log('User is SUSPENDED');
    if (matchesRoute(pathname, suspendedRoutes) || pathname.startsWith('/api/auth')) {
      console.log('Allowing access to suspended route');
      return NextResponse.next();
    }
    console.log('Redirecting SUSPENDED user to /suspended');
    return NextResponse.redirect(new URL('/suspended', request.url));
  }

  // Handle APPROVED users
  if (userStatus === 'APPROVED') {
    console.log('User is APPROVED');
    
    // If an approved user tries to access a status page, redirect to dashboard
    if (pathname.startsWith('/pending') || pathname.startsWith('/rejected') || pathname.startsWith('/suspended')) {
      console.log('Redirecting approved user from status page to dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Admin role check for admin routes
    const isAdminRoute = pathname.startsWith('/admin');
    if (isAdminRoute) {
      console.log('Admin route detected');
      if (userRole !== UserRole.ADMIN) {
        console.log('User is not admin, redirecting to unauthorized');
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      console.log('User is admin, allowing access');
    }

    // --- START Assessment Check Logic ---
    const allowedRolesForAssessment: UserRole[] = [
      UserRole.STUDENT,
      UserRole.LECTURER,
      UserRole.TECHNICIAN,
      UserRole.OTHER,
      UserRole.FACULTY,
    ];

  
    if (allowedRolesForAssessment.includes(userRole) && pathname !== '/sop/sop-1756819829791/view') {
      try {
        const hasTakenAssessment = await hasUserTakenAnyAssessment(token!.sub as string); // Pass userId
        if (!hasTakenAssessment) {
          console.log("Redirecting to SOP page - no assessment taken");
          return NextResponse.redirect(new URL('/sop/sop-1756819829791/view', request.url));
        }
      } catch (error) {
        console.error("Failed to check assessment status in middleware:", error);
        // If checking assessment status fails, redirect to login to prevent unauthorized access.
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
    // --- END Assessment Check Logic ---

    console.log('Allowing approved user access');
    return NextResponse.next();
  }

  console.log('No status matched, allowing through');
  console.log('=== MIDDLEWARE END ===');
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)' ,
    '/api/:path*',
  ],
};