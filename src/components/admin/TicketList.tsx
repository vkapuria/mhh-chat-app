'use client';

import { useRouter } from 'next/navigation';
import { SupportTicket } from '@/types/support';
import { TicketStatusBadge } from '@/components/support/TicketStatusBadge';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Calendar, Package, User, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TicketListProps {
  tickets: SupportTicket[];
  onUpdate: () => void;
}

export function TicketList({ tickets }: TicketListProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Card
          key={ticket.id}
          className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-slate-200 hover:border-l-blue-500"
          onClick={() => router.push(`/admin/support/${ticket.id}`)}
        >
          {/* Header Row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <TicketStatusBadge status={ticket.status} />
              <Badge variant="outline" className="capitalize">
                {ticket.user_type}
              </Badge>
            </div>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Issue Type */}
          <h3 className="font-semibold text-lg text-slate-900 mb-3">
            {ticket.issue_type}
          </h3>

          {/* User Info */}
          <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span className="font-medium">{ticket.user_display_name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Mail className="w-4 h-4" />
              <span>{ticket.user_email}</span>
            </div>
          </div>

          {/* Order Reference */}
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-3 bg-slate-50 px-3 py-2 rounded">
            <Package className="w-4 h-4" />
            <span className="font-mono font-semibold">{ticket.order_id}</span>
            <span className="text-slate-400">•</span>
            <span className="truncate">{ticket.order_title}</span>
          </div>

          {/* Message Preview */}
          <p className="text-sm text-slate-700 line-clamp-2 mb-3 pl-3 border-l-2 border-slate-200">
            {ticket.message}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <MessageSquare className="w-4 h-4" />
              <span>
                {ticket.reply_count || 0} {ticket.reply_count === 1 ? 'reply' : 'replies'}
              </span>
            </div>
            {ticket.status === 'submitted' && (
              <span className="text-xs text-amber-600 font-medium">
                ⚠️ Needs Response
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}