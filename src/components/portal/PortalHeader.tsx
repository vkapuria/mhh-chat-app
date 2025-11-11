'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { User } from '@/types/user';
import { UserProfileDropdown } from '@/components/user/UserProfileDropdown';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

interface PortalHeaderProps {
  user: User;
}

export function PortalHeader({ user }: PortalHeaderProps) {
  const pathname = usePathname();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Home';
    if (pathname.startsWith('/orders')) return user.user_type === 'customer' ? 'My Orders' : 'My Assignments';
    if (pathname.startsWith('/messages')) return 'Messages';
    if (pathname.startsWith('/earnings')) return 'Earnings';
    if (pathname.startsWith('/profile')) return 'Profile';
    if (pathname.startsWith('/support')) return 'Support';
    return 'Portal';
  };

  const handleSignOut = () => {
    if (confirm('Are you sure you want to sign out?')) {
      window.location.href = '/login';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 md:px-6 py-3 md:py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">
          {getPageTitle()}
        </h1>
        
        {/* Desktop: Show UserProfileDropdown */}
        <div className="hidden md:block">
          <UserProfileDropdown userType={user.user_type} />
        </div>

        {/* Mobile: Show UserProfileDropdown + Sign Out Button */}
        <div className="flex items-center gap-2 md:hidden">
          <UserProfileDropdown userType={user.user_type} />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
            aria-label="Sign out"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}