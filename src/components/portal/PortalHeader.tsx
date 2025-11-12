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
  const [showSignOutConfirm] = useState(false);

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
      {/* Use a flex row where the title can shrink/truncate and the actions never shrink */}
      <div className="flex items-center gap-3">
        {/* Title gets the flexible width and can truncate so actions remain visible */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 truncate">
            {getPageTitle()}
          </h1>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center shrink-0">
          <UserProfileDropdown userType={user.user_type} />
        </div>

        {/* Mobile actions: never shrink; keep touch target; label hides on very small screens */}
        <div className="flex items-center gap-1.5 md:hidden shrink-0">
          <UserProfileDropdown userType={user.user_type} />
          <button
            onClick={handleSignOut}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors
                       h-9 px-2 sm:px-3" /* ~36–40px tall target on mobile */
            aria-label="Sign out"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="hidden sm:inline text-xs font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
