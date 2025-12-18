import { UserRole } from '@prisma/client';
import { useSession as useNextAuthSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type UserSession = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
};

type RoleCheck = {
  isStudent: boolean;
  isLecturer: boolean;
  isFaculty: boolean;
  isTechnician: boolean;
  isAdminTechnician: boolean;
  isLabManager: boolean;
  isAdmin: boolean;
  isOther: boolean;
};

export function useSession(required = false) {
  const { data: session, status } = useNextAuthSession();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        
        if (data.authenticated) {
          setUser(data.user);
        } else if (required) {
          const callbackUrl = encodeURIComponent(window.location.href);
          router.push(`/login?callbackUrl=${callbackUrl}`);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        if (required) {
          const callbackUrl = encodeURIComponent(window.location.href);
          router.push(`/login?callbackUrl=${callbackUrl}`);
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [required, router]);

  // Role check functions
  const roleChecks: RoleCheck = {
    isStudent: user?.role === UserRole.STUDENT,
    isLecturer: user?.role === UserRole.LECTURER,
    isFaculty: user?.role === UserRole.FACULTY,
    isTechnician: user?.role === UserRole.TECHNICIAN,
    isAdminTechnician: user?.role === UserRole.ADMIN_TECHNICIAN,
    isLabManager: user?.role === UserRole.LAB_MANAGER,
    isAdmin: user?.role === UserRole.ADMIN,
    isOther: user?.role === UserRole.OTHER,
  };

  // Check if user has any of the specified roles
  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  };

  // Check if user has any of the specified roles (alternative syntax)
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  };

  return {
    // User data
    user,
    status,
    loading,
    isAuthenticated: !!user,
    
    // Role checks
    ...roleChecks,
    hasRole,
    hasAnyRole,
    
    // Role (for direct comparison)
    role: user?.role,
  };
}
