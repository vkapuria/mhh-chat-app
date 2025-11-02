'use client';

import { usePathname } from 'next/navigation';
import { User } from '@/types/user';

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
    return 'Portal';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          {getPageTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Future: Notifications bell icon */}
        <div className="text-sm text-slate-600">
          Welcome back, {user.name.split(' ')[0]}! 👋
        </div>
      </div>
    </header>
  );
}