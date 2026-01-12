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

  // Immediately allow requests to auth-related pages to prevent redirect loops.
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')
  ) {
    return NextResponse.next();
  }

  /*
  // Intercept the login request to check for email verification
  if (pathname === '/api/auth/callback/credentials' && request.method === 'POST') {
    // Clone the request to read the body without consuming it for the NextAuth handler
    const requestClone = request.clone();
    const formData = await requestClone.formData();
    const email = formData.get('email') as string | null;

    if (email) {
      const user = await db.user.findUnique({
        where: { email: email },
      });

      // If the user exists but their email is not verified, block the login
      if (user && !user.emailVerified) {
        // Redirect to the verification page, passing the email as a query param
        const verifyUrl = new URL('/verify-email', request.url);
        verifyUrl.searchParams.set('email', email);
        // Adding a message for the UI to display
        verifyUrl.searchParams.set('error', 'Please verify your email before logging in.');
        return NextResponse.redirect(verifyUrl);
      }
    }
  }
  */
  


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
    
    return NextResponse.next();
  }
  

  let token;
  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
  } catch (error) {
    console.error('Error getting token:', error);
    token = null;
  }


  const isAuthenticated = !!token;

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userStatus = token!.status as RegistrationStatus;
  const userRole = token!.role as UserRole;
  


  // Handle PENDING users - regardless of role
  if (userStatus === 'PENDING') {
    if (matchesRoute(pathname, pendingRoutes) || pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/pending', request.url));
  }

  // Handle REJECTED users
  if (userStatus === 'REJECTED') {
    if (matchesRoute(pathname, rejectedRoutes) || pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/rejected', request.url));
  }

  // Handle SUSPENDED users
  if (userStatus === 'SUSPENDED') {
    if (matchesRoute(pathname, suspendedRoutes) || pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/suspended', request.url));
  }

  // Handle APPROVED users
  if (userStatus === 'APPROVED') {
    
    // If an approved user tries to access a status page, redirect to dashboard
    if (pathname.startsWith('/pending') || pathname.startsWith('/rejected') || pathname.startsWith('/suspended')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Admin role check for admin routes
    const isAdminRoute = pathname.startsWith('/admin');
    if (isAdminRoute) {
      if (userRole !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
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
          return NextResponse.redirect(new URL('/sop/sop-1756819829791/view', request.url));
        }
      } catch (error) {
        console.error("Failed to check assessment status in middleware:", error);
        // If checking assessment status fails, redirect to login to prevent unauthorized access.
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
    // --- END Assessment Check Logic ---

    return NextResponse.next();
  }

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