'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UsersIcon, HomeIcon, LifebuoyIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { AdminProfileDropdown } from '@/components/admin/AdminProfileDropdown';

export function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Users', href: '/admin/users', icon: UsersIcon },
    { name: 'Monitor Chats', href: '/admin/chats', icon: ChatBubbleLeftRightIcon },
    { name: 'Support Tickets', href: '/admin/support', icon: LifebuoyIcon },
  ];

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <div className="flex justify-between items-center">
    <div className="flex space-x-8">
      {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors
                  ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
        {/* Profile Dropdown */}
        <div className="py-2">
          <AdminProfileDropdown />
        </div>
      </div>
    </div>
  </nav>
  );
}