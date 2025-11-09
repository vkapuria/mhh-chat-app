'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HomeIcon, 
  ShoppingBagIcon, 
  ChatBubbleLeftRightIcon, 
  UserCircleIcon,
  CurrencyDollarIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { User } from '@/types/user';
import { LifeBuoy } from 'lucide-react';
import { UserProfileDropdown } from '@/components/user/UserProfileDropdown';

interface PortalSidebarProps {
  user: User;
  onNavigate?: () => void;
}

export function PortalSidebar({ user, onNavigate }: PortalSidebarProps) {
  const pathname = usePathname();
  const isCustomer = user.user_type === 'customer';
  const isExpert = user.user_type === 'expert';
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Navigation items based on user type
  const navItems = [
    {
      name: 'Home',
      href: '/dashboard',
      icon: HomeIcon,
      show: true,
      description: 'Dashboard overview',
    },
    {
      name: isCustomer ? 'Orders' : 'Tasks',
      href: '/orders',
      icon: ShoppingBagIcon,
      show: true,
      description: isCustomer ? 'Track your orders' : 'View assigned tasks',
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: ChatBubbleLeftRightIcon,
      show: true,
      description: 'Chat conversations',
    },
    {
      name: 'Earnings',
      href: '/earnings',
      icon: CurrencyDollarIcon,
      show: isExpert,
      description: 'Payment history',
    },
    {
      name: 'Support',
      href: '/support',
      icon: LifeBuoy,
      show: true,
      description: 'Get help',
    },
    {
      name: 'FAQ',
      href: '/faq',
      icon: QuestionMarkCircleIcon,
      show: true,
      description: 'Common questions',
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserCircleIcon,
      show: true,
      description: 'Account settings',
    },
  ].filter(item => item.show);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = () => {
    if (confirm('Are you sure you want to sign out?')) {
      window.location.href = '/login';
    }
  };

  return (
    <div className="w-56 bg-white border-r border-slate-200 flex flex-col h-screen">
      {/* Logo Only Header */}
      <div className="p-4 border-b border-slate-200 flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src="/icons/mhh-logo.png"
            alt="Homework Hub"
            width={100}
            height={50}
            className="object-contain"
          />
        </motion.div>
      </div>

      {/* User Profile Dropdown */}
      <div className="p-3 border-b border-slate-200">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex justify-center"
        >
          <UserProfileDropdown userType={user.user_type} />
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const isHovered = hoveredItem === item.href;

          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              onHoverStart={() => setHoveredItem(item.href)}
              onHoverEnd={() => setHoveredItem(null)}
            >
              <Link
                href={item.href}
                onClick={onNavigate}
                className={`
                  group relative flex flex-col gap-0 px-3 py-2.5 rounded-lg transition-all duration-200 overflow-hidden
                  ${
                    active
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-blue-600 rounded-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                {/* Main content */}
                <div className="relative flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
                  <span className={`text-sm font-medium ${active ? 'text-white' : ''}`}>
                    {item.name}
                  </span>
                </div>

                {/* Description - expands on hover */}
                <AnimatePresence>
                  {isHovered && !active && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="relative overflow-hidden"
                    >
                      <p className="text-xs text-slate-300 pt-1 pl-8">
                        {item.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer - Sign Out */}
      <div className="p-3 border-t border-slate-200">
        <button
          onClick={handleSignOut}
          className="group w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
        >
          <span>Sign Out</span>
          <ArrowRightOnRectangleIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}