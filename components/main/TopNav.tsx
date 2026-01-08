'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/hooks/useSession'; // To get user role for logo text

export function TopNav() {
  const router = useRouter();
  const { user, loading, role } = useSession(true);

  if (loading || !user) {
    return null; // Or a loading spinner
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 md:hidden">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <h1 className="text-xl font-bold text-gray-900">CDIE {role}</h1>
        
        {/* Logout Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleSignOut}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </nav>
  );
}
