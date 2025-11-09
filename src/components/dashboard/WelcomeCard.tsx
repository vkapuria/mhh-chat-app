'use client';

import { motion } from 'framer-motion';
import { useUnreadMessagesStore } from '@/store/unread-messages-store';
import { useUnreadTicketsStore } from '@/store/unread-tickets-store';

interface WelcomeCardProps {
  displayName: string;
  userType: 'customer' | 'expert';
  activeOrders: number;
}

export function WelcomeCard({ displayName, userType, activeOrders }: WelcomeCardProps) {
  // Get real-time counts
  const unreadOrders = useUnreadMessagesStore((state) => state.unreadOrders);
  const totalUnreadMessages = Object.values(unreadOrders).reduce(
    (sum, order) => sum + order.unreadCount,
    0
  );

  const unreadTickets = useUnreadTicketsStore((state) => state.unreadTickets);
  const totalUnreadTickets = Object.values(unreadTickets).reduce(
    (sum, ticket) => sum + ticket.unreadCount,
    0
  );

  // Build summary
  const activeParts = [];
  if (totalUnreadMessages > 0) {
    activeParts.push(`${totalUnreadMessages} unread message${totalUnreadMessages > 1 ? 's' : ''}`);
  }
  if (totalUnreadTickets > 0) {
    activeParts.push(`${totalUnreadTickets} ticket${totalUnreadTickets > 1 ? 's' : ''}`);
  }
  if (activeOrders > 0) {
    activeParts.push(`${activeOrders} active ${userType === 'customer' ? 'order' : 'task'}${activeOrders > 1 ? 's' : ''}`);
  }

  const summary = activeParts.length > 0 
    ? `You have ${activeParts.join(' • ')}`
    : '🎉 All caught up!';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-6 md:p-8 text-white shadow-lg"
    >
      <h1 className="text-2xl md:text-3xl font-bold mb-2">
        �� Welcome back, {displayName}!
      </h1>
      <p className="text-slate-300 text-sm md:text-base">
        {summary}
      </p>
    </motion.div>
  );
}
