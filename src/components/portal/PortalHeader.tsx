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
}