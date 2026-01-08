'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession } from '@/hooks/useSession';
import { UserRole } from '@prisma/client';
import { LayoutDashboard, FolderGit2, SearchCode, Calendar, Settings } from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  roles?: UserRole[];
}

export function BottomNav() {
  const pathname = usePathname();
  const { user, loading, hasAnyRole } = useSession(true);

  if (loading || !user) {
    return null; // Or a loading spinner
  }

  const navigation: NavigationItem[] = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      roles: [UserRole.LAB_MANAGER, UserRole.ADMIN, UserRole.ADMIN_TECHNICIAN, UserRole.TECHNICIAN, UserRole.STUDENT,UserRole.FACULTY, UserRole.LECTURER,UserRole.OTHER]
    },
    { 
      name: 'Equipments', 
      href: '/equipments', 
      icon: FolderGit2,
      roles: [UserRole.LAB_MANAGER, UserRole.ADMIN, UserRole.ADMIN_TECHNICIAN, UserRole.TECHNICIAN,UserRole.STUDENT,UserRole.FACULTY,UserRole.LECTURER,UserRole.OTHER]
    },
    { 
      name: 'Projects', 
      href: '/projects', 
      icon: SearchCode,
      roles: [UserRole.LAB_MANAGER, UserRole.ADMIN, UserRole.STUDENT, UserRole.FACULTY,UserRole.TECHNICIAN,UserRole.ADMIN_TECHNICIAN,UserRole.LECTURER,UserRole.FACULTY,UserRole.OTHER]
    },
    { 
      name: 'Bookings', 
      href: '/bookings', 
      icon: Calendar,
      roles: [UserRole.LAB_MANAGER, UserRole.ADMIN, UserRole.STUDENT, UserRole.FACULTY,UserRole.TECHNICIAN,UserRole.ADMIN_TECHNICIAN,UserRole.FACULTY,UserRole.LECTURER,UserRole.OTHER]
    },
    { 
      name: 'Settings', 
      href: '/me', 
      icon: Settings,
      roles: [UserRole.ADMIN, UserRole.LAB_MANAGER, UserRole.STUDENT, UserRole.FACULTY, UserRole.TECHNICIAN, UserRole.ADMIN_TECHNICIAN,UserRole.OTHER,UserRole.LECTURER]  
    },
  ];

  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true;
    return hasAnyRole(item.roles);
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
      <div className="flex justify-around h-16 items-center">
        {filteredNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center text-xs font-medium text-gray-600 hover:text-gray-900",
                isActive ? "text-gray-900" : ""
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
