'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  ShoppingBagIcon, 
  ChatBubbleLeftRightIcon, 
  UserCircleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { User } from '@/types/user';
import { LifeBuoy } from 'lucide-react';

interface PortalSidebarProps {
  user: User;
  onNavigate?: () => void;
}

export function PortalSidebar({ user, onNavigate }: PortalSidebarProps) {
  const pathname = usePathname();
  const isCustomer = user.user_type === 'customer';
  const isExpert = user.user_type === 'expert';

  // Navigation items based on user type
  const navItems = [
    {
      name: 'Home',
      href: '/dashboard',
      icon: HomeIcon,
      show: true,
    },
    {
      name: isCustomer ? 'Orders' : 'Tasks',
      href: '/orders',
      icon: ShoppingBagIcon,
      show: true,
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: ChatBubbleLeftRightIcon,
      show: true,
    },
    {
      name: 'Earnings',
      href: '/earnings',
      icon: CurrencyDollarIcon,
      show: isExpert, // Only show for experts
    },
    {
      name: 'Support',
      href: '/support',
      icon: LifeBuoy, // Add import: import { LifeBuoy } from 'lucide-react';
      show: true, // ← ADD THIS!
      badge: undefined, // Can add unresolved count later
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserCircleIcon,
      show: true,
    },
  ].filter(item => item.show);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col items-start gap-3">
          <Image
            src="/icons/mhh-logo.png"
            alt="Homework Hub Logo"
            width={110}
            height={54}
            className="object-contain"
          />
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Homework Hub
            </h1>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {user.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-slate-500 capitalize">
              {user.user_type}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-lg transition-all active:scale-95
                ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : ''}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={() => {
            // Logout handled by parent
            window.location.href = '/login';
          }}
          className="w-full px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}