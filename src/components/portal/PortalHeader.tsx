'use client';

import { usePathname } from 'next/navigation';
import { User } from '@/types/user';
import { UserProfileDropdown } from '@/components/user/UserProfileDropdown';

interface PortalHeaderProps {
  user: User;
}

export function PortalHeader({ user }: PortalHeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Home';
    if (pathname.startsWith('/orders')) return user.user_type === 'customer' ? 'My Orders' : 'My Assignments';
    if (pathname.startsWith('/messages')) return 'Messages';
    if (pathname.startsWith('/earnings')) return 'Earnings';
    if (pathname.startsWith('/profile')) return 'Profile';
    if (pathname.startsWith('/support')) return 'Support';
    return 'Portal';
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {getPageTitle()}
        </h1>
        <UserProfileDropdown userType={user.user_type} />
      </div>
    </header>
  );
}