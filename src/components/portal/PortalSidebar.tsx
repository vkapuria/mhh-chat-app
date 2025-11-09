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
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { User } from '@/types/user';
import { LifeBuoy } from 'lucide-react';
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

interface PortalSidebarProps {
  user: User;
  onNavigate?: () => void;
}

export function PortalSidebar({ user, onNavigate }: PortalSidebarProps) {
  const pathname = usePathname();
  const isCustomer = user.user_type === 'customer';
  const isExpert = user.user_type === 'expert';
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  // Get unread ticket count
  // Get unread ticket count - subscribe to entire store to force re-render
  const unreadTickets = useUnreadTicketsStore((state) => state.unreadTickets);
  const totalUnread = Object.values(unreadTickets).reduce(
    (total, ticket) => total + ticket.unreadCount,
    0
  );

  // Get unread messages count
  const unreadOrders = useUnreadMessagesStore((state) => state.unreadOrders);
  const totalUnreadMessages = Object.values(unreadOrders).reduce(
    (total, order) => total + order.unreadCount,
    0
  );


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

  // Get avatar URL
  const DEFAULT_AVATAR = isExpert ? EXPERT_AVATARS[0] : CUSTOMER_AVATARS[0];
const avatarUrl = (user as any).user_metadata?.avatar_url || DEFAULT_AVATAR;
const displayName = (user as any).user_metadata?.display_name || user.name;

  return (
    <>
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

        {/* User Profile - Left Aligned */}
        <div className="p-3 border-b border-slate-200">
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            onClick={() => setShowProfileModal(true)}
            className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group"
          >
            {/* Avatar */}
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={54}
                height={54}
                className="w-12 h-12 rounded-full object-cover border-2 border-slate-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold border-2 border-slate-200">
                {displayName.substring(0, 2).toUpperCase()}
              </div>
            )}
            
            {/* Name & Helper Text */}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {displayName}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                Edit Profile
                <ChevronRightIcon className="w-3 h-3" />
              </p>
            </div>
          </motion.button>
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
                    {/* Unread badge for Support */}
                    {/* Unread badge for Support */}
                    {item.href === '/support' && totalUnreadTickets > 0 && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {totalUnreadTickets > 9 ? '9+' : totalUnreadTickets}
                      </span>
                    )}
                    {/* Unread badge for Messages */}
                    {item.href === '/messages' && totalUnreadMessages > 0 && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                      </span>
                    )}
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

      {/* Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userType={user.user_type}
      />
    </>
  );
}