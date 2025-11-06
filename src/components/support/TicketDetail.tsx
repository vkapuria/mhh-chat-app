'use client';

import { SupportTicket } from '@/types/support';
import { TicketStatusBadge } from './TicketStatusBadge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar, Package, User, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface TicketDetailProps {
  ticket: SupportTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TicketDetail({ ticket, open, onOpenChange }: TicketDetailProps) {
  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              Support Ticket
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {ticket.order_id}
              </span>
            </DialogTitle>
            <TicketStatusBadge status={ticket.status} />
          </div>
          <DialogDescription>
            Created {format(new Date(ticket.created_at), 'PPp')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-180px)]">
          <div className="space-y-4 pr-4">
            {/* Order Context */}
            <Card className="p-4 bg-slate-50 border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Order Information
              </h4>
              <div className="space-y-2 text-sm">
                <p className="flex items-start">
                  <span className="text-slate-600 min-w-[100px]">Order ID:</span>
                  <span className="font-mono text-slate-900">{ticket.order_id}</span>
                </p>
                <p className="flex items-start">
                  <span className="text-slate-600 min-w-[100px]">Title:</span>
                  <span className="text-slate-900">{ticket.order_title}</span>
                </p>
              </div>
            </Card>

            {/* Issue Details */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Issue Type
              </h4>
              <p className="text-sm text-slate-700 bg-blue-50 px-3 py-2 rounded border border-blue-100">
                {ticket.issue_type}
              </p>
            </div>

            {/* Original Message */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Your Message
              </h4>
              <Card className="p-4 bg-white">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <span className="font-semibold text-slate-700">{ticket.user_display_name}</span>
                  <span>•</span>
                  <Calendar className="w-3 h-3" />
                  <span>{format(new Date(ticket.created_at), 'PPp')}</span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.message}</p>
              </Card>
            </div>

            {/* Replies */}
            {ticket.replies && ticket.replies.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">
                    Responses ({ticket.replies.length})
                  </h4>
                  <div className="space-y-3">
                    {ticket.replies.map((reply) => (
                      <Card key={reply.id} className="p-4 bg-green-50 border-green-200">
                        <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                          <span className="font-semibold text-green-700">
                            {reply.admin_name} (Support Team)
                          </span>
                          <span>•</span>
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(reply.created_at), 'PPp')}</span>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {reply.message}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* No Replies Yet */}
            {(!ticket.replies || ticket.replies.length === 0) && (
              <Card className="p-6 text-center bg-slate-50">
                <p className="text-sm text-slate-500">
                  No responses yet. We'll reply to you soon!
                </p>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}