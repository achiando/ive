import { RegistrationStatus, UserRole } from '@prisma/client'; // Import RegistrationStatus
import { useSession as useNextAuthSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type UserSession = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  status: RegistrationStatus; // Add status field
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
  const user = session?.user as UserSession | null; // Cast to UserSession type
  const loading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    if (required && status === 'unauthenticated') {
      const callbackUrl = encodeURIComponent(window.location.href);
      router.push(`/login?callbackUrl=${callbackUrl}`);
    }
  }, [required, status, router]);

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
    status, // Use status from useNextAuthSession
    loading,
    isAuthenticated, // Use derived isAuthenticated
    
    // Role checks
    ...roleChecks,
    hasRole,
    hasAnyRole,
    
    // Role (for direct comparison)
    role: user?.role,
  };
}
