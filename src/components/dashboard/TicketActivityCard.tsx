'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUnreadTicketsStore } from '@/store/unread-tickets-store';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { LifeBuoy } from 'lucide-react';
import Image from 'next/image';

interface TicketActivityCardProps {
  tickets: any[];
}

function getInitials(name?: string) {
  if (!name) return 'AD';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || 'AD';
}

function formatRelative(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffSec = Math.max(1, Math.floor((now.getTime() - d.getTime()) / 1000));

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function TicketActivityCard({ tickets }: TicketActivityCardProps) {
  const router = useRouter();
  const getTicketUnread = useUnreadTicketsStore((state) => state.getTicketUnread);

  // Get active tickets (open or in_progress)
  const activeTickets = tickets
    .filter(ticket => ticket.status === 'open' || ticket.status === 'in_progress')
    .map(ticket => {
      const unreadCount = getTicketUnread(ticket.id);
      
      // Determine whose turn it is
      const lastReplyByAdmin = ticket.last_reply_by === 'admin';
      const waitingFor = lastReplyByAdmin ? 'user' : 'admin';
      const statusText = waitingFor === 'admin' 
        ? '⏳ Waiting for admin reply'
        : '💬 Your response needed';
      
      const timeAgo = formatRelative(ticket.updated_at);
      
      return {
        ...ticket,
        unreadCount,
        waitingFor,
        statusText,
        timeAgo,
      };
    })
    .sort((a, b) => {
      // Prioritize: 1) User's turn, 2) Unread count, 3) Most recent
      if (a.waitingFor === 'user' && b.waitingFor === 'admin') return -1;
      if (a.waitingFor === 'admin' && b.waitingFor === 'user') return 1;
      if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    })
    .slice(0, 3);

  const totalUnread = activeTickets.reduce((sum, t) => sum + t.unreadCount, 0);
  const userActionNeeded = activeTickets.filter(t => t.waitingFor === 'user').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 leading-none">Support Tickets</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {userActionNeeded > 0 
                ? `${userActionNeeded} need${userActionNeeded === 1 ? 's' : ''} your response`
                : totalUnread > 0
                ? `${totalUnread} unread update${totalUnread > 1 ? 's' : ''}`
                : 'All caught up'}
            </p>
          </div>
        </div>
      </div>

      {/* Ticket strips with separators */}
      {activeTickets.length > 0 ? (
        <div className="space-y-0 mb-3">
          {activeTickets.map((ticket, index) => (
            <div key={ticket.id}>
              <button
                onClick={() => router.push(`/support?ticketId=${ticket.id}`)}
                className="w-full text-left py-2.5 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar - Show admin or user based on who needs to respond */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center mt-0.5 ring-2 ring-white shadow-sm">
                    {ticket.waitingFor === 'admin' ? (
                      // Admin needs to respond - show admin avatar
                      ticket.admin_avatar ? (
                        <Image
                          src={ticket.admin_avatar}
                          alt="Admin"
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-purple-700 font-bold">AD</span>
                      )
                    ) : (
                      // User needs to respond - show user avatar
                      ticket.user_avatar_url ? (
                        <Image
                          src={ticket.user_avatar_url}
                          alt="User"
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        getInitials(ticket.user_name)
                      )
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top row: Issue type + time */}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {ticket.issue_type || 'Support Request'}
                      </p>
                      <span className="text-[11px] text-slate-400 shrink-0">{ticket.timeAgo}</span>
                    </div>

                    {/* Middle row: Order ID */}
                    <div className="text-[11px] text-slate-500 mb-1">
                      Order: {ticket.order_id}
                    </div>

                    {/* Bottom row: Status bubble */}
                    <div className="inline-block max-w-full">
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        ticket.waitingFor === 'user'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {ticket.statusText}
                      </div>
                    </div>
                  </div>

                  {/* Right: unread + arrow */}
                  <div className="flex items-center gap-2 ml-1">
                    {ticket.unreadCount > 0 && (
                      <span className="flex items-center justify-center min-w-[22px] h-5 px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full">
                        {ticket.unreadCount > 99 ? '99+' : ticket.unreadCount}
                      </span>
                    )}
                    <ArrowRightIcon className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </button>

              {/* Separator */}
              {index < activeTickets.length - 1 && (
                <div className="border-b border-slate-300 my-1.5" />
              )}
            </div>
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