'use client';

import { useRouter } from 'next/navigation';
import { SupportTicket } from '@/types/support';
import { TicketStatusBadge } from '@/components/support/TicketStatusBadge';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  EnvelopeIcon, 
  ShoppingCartIcon, 
  ExclamationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';


interface TicketListProps {
  tickets: SupportTicket[];
  onUpdate: () => void;
}

export function TicketList({ tickets }: TicketListProps) {
  const router = useRouter();

  // 🔍 DEBUG: Log first ticket to see data structure
  console.log('🎫 First ticket data:', tickets[0]);
  console.log('🎫 Reply count field:', tickets[0]?.reply_count);
  console.log('🎫 Replies array:', tickets[0]?.replies);

  // 🔍 DEBUG: Check last_reply_by for tickets
  tickets.forEach(ticket => {
    if (ticket.reply_count && ticket.reply_count > 0) {
      console.log(`🎫 ${ticket.issue_type} - Replies: ${ticket.reply_count}, last_reply_by: ${ticket.last_reply_by}`);
    }
  });

  // 🔍 DEBUG: Check resolved tickets
const resolvedTicket = tickets.find(t => t.status === 'resolved');
console.log('🎫 Resolved ticket:', resolvedTicket);
console.log('🎫 Resolved_at field:', resolvedTicket?.resolved_at);

  const getTimeColor = (createdAt: string) => {
    return 'text-[#1b1b20]'; // Simple, consistent color
  };

  const needsResponse = (ticket: SupportTicket) => {
    return ticket.status === 'submitted';
  };

  return (
    <>
      {/* Desktop Table View (hidden on mobile) */}
      <div className="hidden md:block bg-white rounded-lg border border-slate-200 overflow-hidden">
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
                {ticket.user_avatar_url ? (
                  <Image 
                    src={ticket.user_avatar_url} 
                    alt={ticket.user_display_name}
                    width={32}
                    height={32}
                    className="flex-shrink-0 w-8 h-8 rounded-full object-cover border-2 border-slate-300"
                  />
                ) : (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                    {ticket.user_display_name.charAt(0).toUpperCase()}
                  </div>
                )}
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
                <div className="flex items-center gap-1.5 mb-1">
                  <EnvelopeIcon className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">
                    {(ticket.replies?.length || ticket.reply_count || 0)} {((ticket.replies?.length || ticket.reply_count || 0) === 1) ? 'reply' : 'replies'}
                  </span>
                </div>
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
  
  {/* Contextual Helper Text */}
  {ticket.status === 'submitted' && (
    <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold mt-1">
      <ExclamationCircleIcon className="w-3 h-3" />
      <span>Needs Response</span>
    </div>
  )}
  
  {ticket.status === 'in_progress' && ticket.last_reply_by === 'user' && (
    <div className="flex items-center gap-1 text-[11px] text-red-600 font-semibold mt-1">
      <ClockIcon className="w-3 h-3" />
      <span>Awaiting Admin ({formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: false })})</span>
    </div>
  )}
  
  {ticket.status === 'in_progress' && ticket.last_reply_by === 'admin' && (
    <div className="flex items-center gap-1 text-[11px] text-blue-600 font-medium mt-1">
      <ClockIcon className="w-3 h-3" />
      <span>Awaiting User ({formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: false })})</span>
    </div>
  )}
  
  {ticket.status === 'resolved' && (
    <div className="text-[11px] text-green-600 font-medium mt-1">
      <span>
        {ticket.resolved_at 
          ? format(new Date(ticket.resolved_at), 'MMM d, yyyy')
          : ticket.updated_at
          ? format(new Date(ticket.updated_at), 'MMM d, yyyy')
          : 'Resolved'}
      </span>
    </div>
  )}
</div>
            </div>
          ))}
        </div>
      </div>
  
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            onClick={() => router.push(`/admin/support/${ticket.id}`)}
            className="bg-white rounded-lg border border-slate-200 p-4 active:bg-slate-50 transition-colors"
          >
            {/* Header: Avatar + Name + Status */}
            <div className="flex items-start gap-3 mb-3">
              {ticket.user_avatar_url ? (
                <Image 
                  src={ticket.user_avatar_url} 
                  alt={ticket.user_display_name}
                  width={40}
                  height={40}
                  className="flex-shrink-0 w-10 h-10 rounded-full object-cover border-2 border-slate-300"
                />
              ) : (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                  {ticket.user_display_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {ticket.user_display_name}
                  </p>
                  <Badge 
                    variant="outline" 
                    className="text-[10px] capitalize flex-shrink-0"
                  >
                    {ticket.user_type}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {ticket.user_email}
                </p>
              </div>
              <TicketStatusBadge status={ticket.status} lastReplyBy={ticket.last_reply_by} />
            </div>
  
            {/* Subject */}
            <div className="mb-3">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                {ticket.issue_type}
              </h3>
              <p className="text-xs text-slate-600 line-clamp-2">
                {ticket.message}
              </p>
            </div>
  
            {/* Meta Info Grid */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              {/* Order */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <ShoppingCartIcon className="w-4 h-4" />
                  <span>Order:</span>
                </div>
                <span className="font-mono font-semibold text-slate-700">
                  {ticket.order_id}
                </span>
              </div>
  
              {/* Replies */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <EnvelopeIcon className="w-4 h-4" />
                  <span>Replies:</span>
                </div>
                <span className="font-medium text-slate-700">
                  {(ticket.replies?.length || ticket.reply_count || 0)}
                </span>
              </div>
  
              {/* Last Activity */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <ClockIcon className="w-4 h-4" />
                <span>Last Activity:</span>
              </div>
              <span className="font-medium text-slate-700">
                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </span>
            </div>
  
            {/* Contextual Helper Text */}
{ticket.status === 'submitted' && (
  <div className="flex items-center justify-between text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1.5 rounded mt-2 border border-amber-200">
    <div className="flex items-center gap-1.5">
      <ExclamationCircleIcon className="w-4 h-4" />
      <span>Needs Admin Response</span>
    </div>
    <span className="text-amber-500">
      {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: false })}
    </span>
  </div>
)}

{ticket.status === 'in_progress' && ticket.last_reply_by === 'user' && (
  <div className="flex items-center justify-between text-xs text-red-600 font-semibold bg-red-50 px-2 py-1.5 rounded mt-2 border border-red-200">
    <div className="flex items-center gap-1.5">
      <ExclamationCircleIcon className="w-4 h-4" />
      <span>Waiting Admin Reply</span>
    </div>
    <span className="text-red-500">
      {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: false })}
    </span>
  </div>
)}

{ticket.status === 'in_progress' && ticket.last_reply_by === 'admin' && (
  <div className="flex items-center justify-between text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1.5 rounded mt-2 border border-blue-200">
    <div className="flex items-center gap-1.5">
      <ClockIcon className="w-4 h-4" />
      <span>Waiting User Reply</span>
    </div>
    <span className="text-blue-500">
      {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: false })}
    </span>
  </div>
)}

{ticket.status === 'resolved' && (
  <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 px-2 py-1.5 rounded mt-2 border border-green-200">
    <span>
      {ticket.resolved_at 
        ? `Resolved on ${format(new Date(ticket.resolved_at), 'MMM d, yyyy')}` 
        : ticket.updated_at
        ? `Resolved on ${format(new Date(ticket.updated_at), 'MMM d, yyyy')}`
        : 'Resolved'}
    </span>
  </div>
)}
          </div>
        </div>
      ))}
    </div>
  
      {/* Empty State (shared) */}
      {tickets.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 px-6 py-12 text-center">
          <EnvelopeIcon className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
          <p className="text-slate-600">No tickets found</p>
        </div>
      )}
    </>
  );
}