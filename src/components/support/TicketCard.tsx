'use client';

import { SupportTicket } from '@/types/support';
import { TicketStatusBadge } from './TicketStatusBadge';
import { Card } from '@/components/ui/card';
import { MessageSquare, Calendar, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TicketCardProps {
  ticket: SupportTicket;
  onClick: () => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-slate-200 hover:border-l-blue-500"
      onClick={onClick}
    >
      {/* Header: Status + Time */}
      <div className="flex items-start justify-between mb-3">
        <TicketStatusBadge status={ticket.status} />
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
        </span>
      </div>

      {/* Issue Type */}
      <h3 className="font-semibold text-slate-900 mb-2">{ticket.issue_type}</h3>

      {/* Order Reference */}
      <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
        <Package className="w-3 h-3" />
        <span className="font-mono">{ticket.order_id}</span>
        <span className="text-slate-400">•</span>
        <span className="truncate">{ticket.order_title}</span>
      </div>

      {/* Message Preview */}
      <p className="text-sm text-slate-600 line-clamp-2 mb-3">{ticket.message}</p>

      {/* Footer: Reply Count */}
      {ticket.reply_count !== undefined && ticket.reply_count > 0 && (
        <div className="flex items-center gap-1 text-xs text-blue-600 pt-2 border-t">
          <MessageSquare className="w-3 h-3" />
          <span>{ticket.reply_count} {ticket.reply_count === 1 ? 'reply' : 'replies'}</span>
        </div>
      )}
    </Card>
  );
}