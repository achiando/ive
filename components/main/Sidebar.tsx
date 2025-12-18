'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Badge } from '../ui/badge';

import { useSession } from '@/hooks/useSession';
import { cn } from '@/lib/utils';
import { UserRole } from '@prisma/client';
import { Calendar, FileText, FolderGit2, LayoutDashboard, LogOut, Package, SearchCode, Settings, Users, Wrench } from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  roles?: UserRole[]; // Optional: if not provided, visible to all
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, hasAnyRole, role } = useSession(true);
  
  if (loading) {
    return (
      <div className="hidden md:flex md:flex-shrink-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col w-full p-4">
          <div className="animate-pulse h-6 w-3/4 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigation: NavigationItem[] = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      roles: [UserRole.LAB_MANAGER, UserRole.ADMIN, UserRole.ADMIN_TECHNICIAN, UserRole.TECHNICIAN, UserRole.STUDENT,UserRole.FACULTY]
    },
    { 
      name: 'Users', 
      href: '/users', 
      icon: Users,
      roles: [UserRole.ADMIN,UserRole.LAB_MANAGER]
    },
    { 
      name: 'Equipments', 
      href: '/equipments', 
      icon: FolderGit2,
      roles: [UserRole.LAB_MANAGER, UserRole.ADMIN, UserRole.ADMIN_TECHNICIAN, UserRole.TECHNICIAN,UserRole.STUDENT,UserRole.FACULTY]
    },
    { 
      name: 'Projects', 
      href: '/projects', 
      icon: SearchCode,
      roles: [UserRole.LAB_MANAGER, UserRole.ADMIN, UserRole.STUDENT, UserRole.FACULTY,UserRole.TECHNICIAN,UserRole.ADMIN_TECHNICIAN]
    },
    { 
      name: 'Bookings', 
      href: '/bookings', 
      icon: Calendar,
      roles: [UserRole.LAB_MANAGER, UserRole.ADMIN, UserRole.STUDENT, UserRole.FACULTY,UserRole.TECHNICIAN,UserRole.ADMIN_TECHNICIAN]
    },
    { 
      name: 'Maintenance', 
      href: '/maintenance', 
      icon: Wrench,
      roles: [UserRole.LAB_MANAGER, UserRole.ADMIN, UserRole.ADMIN_TECHNICIAN, UserRole.TECHNICIAN]
    },
    { 
      name: 'Consumables', 
      href: '/consumables', 
      icon: Package,
      roles: [UserRole.LAB_MANAGER, UserRole.ADMIN,UserRole.TECHNICIAN,UserRole.ADMIN_TECHNICIAN]
    },
    { 
      name: 'Technicians', 
      href: '/technicians', 
      icon: Users,
      roles: [UserRole.ADMIN, UserRole.ADMIN_TECHNICIAN],
      badge: {
        text: 'Admin',
        variant: 'outline'
      }
    },
    { 
      name: 'Events', 
      href: '/events', 
      icon: Calendar,
      roles: [UserRole.LAB_MANAGER, UserRole.ADMIN, UserRole.STUDENT, UserRole.FACULTY,UserRole.TECHNICIAN,UserRole.ADMIN_TECHNICIAN]
    },
    { 
      name: 'SOP Manuals', 
      href: '/sop-manuals', 
      icon: FileText,
      roles: [UserRole.STUDENT, UserRole.FACULTY, UserRole.TECHNICIAN, UserRole.ADMIN_TECHNICIAN, UserRole.LAB_MANAGER, UserRole.ADMIN]
    },
    { 
      name: 'Settings', 
      href: '/me', 
      icon: Settings,
      roles: [UserRole.ADMIN, UserRole.LAB_MANAGER, UserRole.STUDENT, UserRole.FACULTY, UserRole.TECHNICIAN, UserRole.ADMIN_TECHNICIAN]  
    },
  ];

  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true;
    return hasAnyRole(item.roles);
  });

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-gray-900">CDIE {role}</h1>
          </div>
          <div className="flex flex-col flex-grow mt-5">
            <nav className="flex-1 px-2 space-y-1 bg-white">
              {filteredNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150'
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive
                          ? 'text-gray-500'
                          : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 flex-shrink-0 h-5 w-5'
                      )}
                      aria-hidden="true"
                    />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <Badge 
                        variant={item.badge.variant || 'secondary'} 
                        className="ml-2"
                      >
                        {item.badge.text}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
        <div className="flex flex-shrink-0 p-4 border-t border-gray-200">
          <button 
            onClick={handleSignOut}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
          >
            <LogOut className="w-5 h-5 mr-3 text-gray-400" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
