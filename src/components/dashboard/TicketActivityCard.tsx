'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUnreadTicketsStore } from '@/store/unread-tickets-store';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { LifeBuoy } from 'lucide-react';

interface TicketActivityCardProps {
  tickets: any[];
}

export function TicketActivityCard({ tickets }: TicketActivityCardProps) {
  const router = useRouter();
  const getTicketUnread = useUnreadTicketsStore((state) => state.getTicketUnread);

  // Get tickets with unread count
  const ticketsWithUnread = tickets
    .map(ticket => ({
      ...ticket,
      unreadCount: getTicketUnread(ticket.id),
    }))
    .filter(ticket => ticket.unreadCount > 0 || ticket.status === 'in_progress')
    .slice(0, 3);

  const totalUnread = ticketsWithUnread.reduce((sum, t) => sum + t.unreadCount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Support Tickets</h3>
            <p className="text-xs text-slate-500">
              {totalUnread > 0 ? `${totalUnread} need reply` : 'No pending tickets'}
            </p>
          </div>
        </div>
        {totalUnread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center min-w-[28px] h-7 px-2 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse"
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </motion.span>
        )}
      </div>

      {/* Tickets List */}
      {ticketsWithUnread.length > 0 ? (
        <div className="space-y-2 mb-4">
          {ticketsWithUnread.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => router.push(`/support/${ticket.id}`)}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors group"
            >
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {ticket.issue_type}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  Order: {ticket.order_id}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {ticket.unreadCount > 0 && (
                  <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full">
                    {ticket.unreadCount}
                  </span>
                )}
                <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-500">No active tickets</p>
          <p className="text-xs text-slate-400 mt-1">Everything resolved! 🎉</p>
        </div>
      )}

      {/* View All Button */}
      <button
        onClick={() => router.push('/support')}
        className="w-full py-2.5 text-sm font-medium text-slate-700 hover:text-purple-600 hover:bg-slate-50 rounded-lg transition-all"
      >
        View All Tickets →
      </button>
    </motion.div>
  );
}
