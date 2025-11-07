'use client';

import { useRouter } from 'next/navigation';
import { SupportTicket } from '@/types/support';
import { TicketStatusBadge } from '@/components/support/TicketStatusBadge';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { 
  EnvelopeIcon, 
  ShoppingCartIcon, 
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';

interface TicketListProps {
  tickets: SupportTicket[];
  onUpdate: () => void;
}

export function TicketList({ tickets }: TicketListProps) {
  const router = useRouter();

  const getTimeColor = (createdAt: string) => {
    return 'text-[#1b1b20]'; // Simple, consistent color
  };

  const needsResponse = (ticket: SupportTicket) => {
    return ticket.status === 'submitted';
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
        <div className="col-span-3">Requester</div>
        <div className="col-span-3">Subject</div>
        <div className="col-span-2">Order</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2 text-right">Last Activity</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-100">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            onClick={() => router.push(`/admin/support/${ticket.id}`)}
            className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors group"
          >
            {/* Requester */}
            <div className="col-span-3 flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                {ticket.user_display_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {ticket.user_display_name}
                  </p>
                  <Badge 
                    variant="outline" 
                    className="text-xs capitalize flex-shrink-0"
                  >
                    {ticket.user_type}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                  <EnvelopeIcon className="w-3 h-3" />
                  {ticket.user_email}
                </p>
              </div>
            </div>

            {/* Subject with Reply Count */}
            <div className="col-span-3 flex items-center min-w-0">
              <div className="flex-1 min-w-0">
                {/* Reply Count Above Subject */}
                <div className="flex items-center gap-1.5 mb-1">
                  <EnvelopeIcon className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">
                    {ticket.reply_count || 0} {ticket.reply_count === 1 ? 'reply' : 'replies'}
                  </span>
                </div>
                {/* Subject */}
                <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600">
                  {ticket.issue_type}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {ticket.message}
                </p>
              </div>
            </div>

            {/* Order */}
            <div className="col-span-2 flex items-center min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs">
                  <ShoppingCartIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="font-mono font-semibold text-slate-700 truncate">
                    {ticket.order_id}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5 ml-5">
                  {ticket.order_title}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="col-span-2 flex items-center">
              <TicketStatusBadge status={ticket.status} lastReplyBy={ticket.last_reply_by} />
            </div>

            {/* Last Activity */}
            <div className="col-span-2 flex flex-col items-end justify-center">
              <span className={`text-xs ${getTimeColor(ticket.created_at)}`}>
                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </span>
              {needsResponse(ticket) && (
                <div className="flex items-center gap-1 text-xs text-amber-600 font-medium mt-1">
                  <ExclamationCircleIcon className="w-3.5 h-3.5" />
                  <span>Needs Response</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {tickets.length === 0 && (
        <div className="px-6 py-12 text-center">
          <EnvelopeIcon className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
          <p className="text-slate-600">No tickets found</p>
        </div>
      )}
    </div>
  );
}