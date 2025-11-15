'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home03Icon,
  ShoppingBag03Icon,
  Message02Icon,
  UserIcon,
  DollarSquareIcon,
  InformationCircleIcon,
  Logout03Icon,
  CustomerService02Icon,
} from '@hugeicons/core-free-icons';
import { User } from '@/types/user';
import { UserProfileModal } from '../user/UserProfileModal';
import { useUnreadTicketsStore } from '@/store/unread-tickets-store';
import { useUnreadMessagesStore } from '@/store/unread-messages-store';

// Avatar pools
const CUSTOMER_AVATARS = [
  '/avatars/users/ghibli-girl-1.png',
  '/avatars/users/ghibli-girl-2.png',
  '/avatars/users/ghibli-girl-3.png',
  '/avatars/users/ghibli-boy-1.png',
  '/avatars/users/ghibli-boy-2.png',
  '/avatars/users/ghibli-boy-3.png',
  '/avatars/users/photo-girl-1.png',
  '/avatars/users/photo-girl-2.png',
  '/avatars/users/photo-girl-3.png',
  '/avatars/users/photo-girl-4.png',
  '/avatars/users/photo-boy-1.png',
  '/avatars/users/photo-boy-2.png',
  '/avatars/users/photo-boy-3.png',
  '/avatars/users/photo-boy-4.png',
];

const EXPERT_AVATARS = [
  '/avatars/experts/expert-image-1.png',
  '/avatars/experts/expert-image-2.png',
  '/avatars/experts/expert-image-3.png',
  '/avatars/experts/expert-image-4.png',
  '/avatars/experts/expert-image-5.png',
  '/avatars/experts/expert-image-6.png',
  '/avatars/experts/expert-image-7.png',
  '/avatars/experts/expert-image-8.png',
  '/avatars/experts/expert-image-9.png',
  '/avatars/experts/expert-image-10.png',
  '/avatars/experts/expert-image-11.png',
];

interface PortalSidebarProps {
  user: User;
  onNavigate?: () => void;
}

type NavSection = 'main' | 'account';

export function PortalSidebar({ user, onNavigate }: PortalSidebarProps) {
  const pathname = usePathname();
  const isCustomer = user.user_type === 'customer';
  const isExpert = user.user_type === 'expert';

  const [hoveredDescription, setHoveredDescription] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Dashboard label for header
  const dashboardLabel = isCustomer
    ? 'Customer Dashboard'
    : isExpert
    ? 'Expert Dashboard'
    : 'Dashboard';

  // Get unread ticket count
  const unreadTickets = useUnreadTicketsStore((state) => state.unreadTickets);
  const totalUnreadTickets = Object.values(unreadTickets).reduce(
    (total, ticket) => total + ticket.unreadCount,
    0
  );

  // Get unread messages count
  const unreadOrders = useUnreadMessagesStore((state) => state.unreadOrders);
  const totalUnreadMessages = Object.values(unreadOrders).reduce(
    (total, order) => total + order.unreadCount,
    0
  );

  // Navigation items with sections
  const navItems = [
    {
      name: 'Home',
      href: '/dashboard',
      icon: Home03Icon,
      show: true,
      description: 'Dashboard overview at a glance',
      dataTour: 'dashboard',
      section: 'main' as NavSection,
    },
    {
      name: isCustomer ? 'My Orders' : 'My Tasks',
      href: '/orders',
      icon: ShoppingBag03Icon,
      show: true,
      description: isCustomer ? 'Track your orders and deadlines' : 'View and manage assigned tasks',
      dataTour: isCustomer ? 'orders' : 'my-tasks',
      section: 'main' as NavSection,
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: Message02Icon,
      show: true,
      description: 'Chat with your expert or support',
      dataTour: 'messages',
      section: 'main' as NavSection,
    },
    {
      name: 'My Earnings',
      href: '/earnings',
      icon: DollarSquareIcon,
      show: isExpert,
      description: 'Payouts, balances, and history',
      dataTour: 'earnings',
      section: 'account' as NavSection,
    },
    {
      name: 'Help Center',
      href: '/support',
      icon: CustomerService02Icon,
      show: true,
      description: 'Get help from our support team',
      dataTour: 'support',
      section: 'account' as NavSection,
    },
    {
      name: 'FAQ',
      href: '/faq',
      icon: InformationCircleIcon,
      show: true,
      description: 'Common questions and quick answers',
      section: 'account' as NavSection,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserIcon,
      show: true,
      description: 'Update your details and settings',
      section: 'account' as NavSection,
    },
  ].filter((item) => item.show);

  const mainNavItems = navItems.filter((item) => item.section === 'main');
  const accountNavItems = navItems.filter((item) => item.section === 'account');

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

  // Avatar + name
  const DEFAULT_AVATAR = isExpert ? EXPERT_AVATARS[0] : CUSTOMER_AVATARS[0];
  const avatarUrl = (user as any).user_metadata?.avatar_url || DEFAULT_AVATAR;
  const displayName = (user as any).user_metadata?.display_name || user.name;

  return (
    <>
      <div className="w-56 bg-white border-r border-slate-200 flex flex-col h-screen">
        {/* Compact header: favicon + dashboard label + profile */}
        <div className="px-3 py-3 border-b border-slate-200">
          {/* Brand + dashboard label */}
          <div className="flex items-center gap-2">
            <Image
              src="/favicon.svg"
              alt="MyHomeworkHelp"
              width={28}
              height={28}
              className="shrink-0"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                MyHomeworkHelp
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {dashboardLabel}
              </span>
            </div>
          </div>

          {/* Profile row */}
          <motion.button
            data-tour="edit-profile"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            onClick={() => setShowProfileModal(true)}
            className="mt-3 w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover border border-slate-300"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-semibold border border-slate-200">
                {displayName.substring(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {displayName}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                Edit profile
                <ChevronRightIcon className="w-3 h-3" />
              </p>
            </div>
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col overflow-y-auto">
          {/* Main section */}
          <div className="px-2 pt-3 pb-1">
            <p className="px-1 mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Main
            </p>
            <div className="space-y-1">
              {mainNavItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    data-tour={item.dataTour}
                    onMouseEnter={() => setHoveredDescription(item.description)}
                    onMouseLeave={() => setHoveredDescription(null)}
                    className={`
                      group relative flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium
                      transition-colors
                      ${
                        active
                          ? 'text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }
                    `}
                  >
                    {/* Active animated background */}
                    {active && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 rounded-lg bg-blue-600"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                      />
                    )}

                    <div className="relative flex items-center gap-3 w-full">
                      <HugeiconsIcon
                        icon={item.icon}
                        size={18}
                        strokeWidth={1.5}
                        className={
                          active
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-slate-700'
                        }
                      />
                      <span className={`truncate ${active ? 'text-white' : ''}`}>
                        {item.name}
                      </span>

                      {/* Unread badge for Messages */}
                      {item.href === '/messages' && totalUnreadMessages > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Account & Help section */}
          <div className="px-2 pt-3 pb-2">
            <p className="px-1 mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Account &amp; Help
            </p>
            <div className="space-y-1">
              {accountNavItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    data-tour={item.dataTour}
                    onMouseEnter={() => setHoveredDescription(item.description)}
                    onMouseLeave={() => setHoveredDescription(null)}
                    className={`
                      group relative flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium
                      transition-colors
                      ${
                        active
                          ? 'text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }
                    `}
                  >
                    {/* Active animated background */}
                    {active && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 rounded-lg bg-blue-600"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                      />
                    )}

                    <div className="relative flex items-center gap-3 w-full">
                      <HugeiconsIcon
                        icon={item.icon}
                        size={18}
                        strokeWidth={1.5}
                        className={
                          active
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-slate-700'
                        }
                      />
                      <span className={`truncate ${active ? 'text-white' : ''}`}>
                        {item.name}
                      </span>

                      {/* Unread badge for Support */}
                      {item.href === '/support' && totalUnreadTickets > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {totalUnreadTickets > 9 ? '9+' : totalUnreadTickets}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Helper description strip */}
          <div className="mt-auto border-t border-slate-200 px-3 py-2 text-[11px] leading-snug text-slate-500 bg-slate-50">
            {hoveredDescription
              ? hoveredDescription
              : 'Tip: Use Messages to chat with your expert and track order updates.'}
          </div>

          {/* Sign Out */}
          <div className="p-3 border-t border-slate-200">
            <button
              onClick={handleSignOut}
              className="group w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150"
            >
              <span>Sign out</span>
              <HugeiconsIcon
                icon={Logout03Icon}
                size={18}
                strokeWidth={1.5}
                className="text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          </div>
        </nav>
      </div>

      {/* Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userType={user.user_type}
      />
    </>
  );
}
