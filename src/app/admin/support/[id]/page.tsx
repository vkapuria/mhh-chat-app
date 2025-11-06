'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SupportTicket } from '@/types/support';
import { TicketStatusBadge } from '@/components/support/TicketStatusBadge';
import { TicketReplyForm } from '@/components/admin/TicketReplyForm';
import { TicketStatusUpdater } from '@/components/admin/TicketStatusUpdater';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, Package, User, Mail, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Authentication required');
        router.push('/admin');
        return;
      }

      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setTicket(result.ticket);
      } else {
        toast.error('Failed to load ticket');
      }
    } catch (error) {
      console.error('Fetch ticket error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: 'submitted' | 'in_progress' | 'resolved') => {
    await fetchTicket(); // Refresh ticket data
  };

  const handleReplySubmit = async () => {
    await fetchTicket(); // Refresh to show new reply
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Ticket not found</p>
          <Button onClick={() => router.push('/admin/support')} className="mt-4">
            Back to Tickets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/admin/support')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Tickets
      </Button>

      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">Support Ticket</h1>
              <span className="text-sm font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded border">
                {ticket.order_id}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              Created {format(new Date(ticket.created_at), 'PPpp')}
            </p>
          </div>
          <TicketStatusBadge status={ticket.status} />
        </div>

        {/* Status Updater */}
        <TicketStatusUpdater
          ticketId={ticket.id}
          currentStatus={ticket.status}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Conversation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Details */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              Issue Type
            </h3>
            <p className="text-sm text-slate-700 bg-blue-50 px-4 py-2 rounded border border-blue-100">
              {ticket.issue_type}
            </p>
          </Card>

          {/* Original Message */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Original Request</h3>
            <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-blue-500">
              <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
                <User className="w-4 h-4" />
                <span className="font-semibold text-slate-900">
                  {ticket.user_display_name} ({ticket.user_type})
                </span>
                <span>•</span>
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(ticket.created_at), 'PPp')}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {ticket.message}
              </p>
            </div>
          </Card>

          {/* Replies */}
          {ticket.replies && ticket.replies.length > 0 && (
  <Card className="p-6">
    <h3 className="font-semibold text-slate-900 mb-4">
      Response History ({ticket.replies.length})
    </h3>
    <ScrollArea className="max-h-96">
      <div className="space-y-4 pr-4">
        {ticket.replies.map((reply: any) => {
          const isUserReply = reply.reply_type === 'user';
          
          return (
            <div
              key={reply.id}
              className={`rounded-lg p-4 border-l-4 ${
                isUserReply
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-green-50 border-green-500'
              }`}
            >
              <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                <span className={`font-semibold ${
                  isUserReply ? 'text-blue-700' : 'text-green-700'
                }`}>
                  {reply.admin_name} {isUserReply ? '(Customer)' : '(Support Team)'}
                </span>
                <span>•</span>
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(reply.created_at), 'PPp')}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {reply.message}
              </p>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  </Card>
)}

          {/* Reply Form */}
          {ticket.status !== 'resolved' && (
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Send Response</h3>
              <TicketReplyForm ticketId={ticket.id} onReplySubmit={handleReplySubmit} />
            </Card>
          )}

          {ticket.status === 'resolved' && (
            <Card className="p-6 bg-green-50 border-green-200">
              <p className="text-center text-green-700 font-medium">
                ✓ This ticket has been resolved
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar - Context */}
        <div className="space-y-6">
          {/* User Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">User Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-slate-600">Name</p>
                  <p className="font-medium text-slate-900">{ticket.user_display_name}</p>
                  <p className="text-xs text-slate-500">({ticket.user_name})</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-slate-600">Email</p>
                  <p className="font-medium text-slate-900 break-all">{ticket.user_email}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-2">
                <span className="text-xs text-slate-500 mt-0.5">👤</span>
                <div>
                  <p className="text-slate-600">Type</p>
                  <p className="font-medium text-slate-900 capitalize">{ticket.user_type}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Order Info */}
          <Card className="p-6 bg-slate-50">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Order Details
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-600 text-xs mb-1">Order ID</p>
                <p className="font-mono font-semibold text-slate-900 text-sm">
                  {ticket.order_id}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-slate-600 text-xs mb-1">Title</p>
                <p className="text-slate-900 leading-snug">{ticket.order_title}</p>
              </div>
              {ticket.amount && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-slate-600 text-xs">Amount</p>
                      <p className="font-semibold text-slate-900">
                        ${ticket.amount}
                        {ticket.expert_fee && (
                          <span className="text-xs text-slate-500 ml-2">
                            (Expert: ₹{ticket.expert_fee})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-600 text-xs">Created</p>
                <p className="text-slate-900">{format(new Date(ticket.created_at), 'PPp')}</p>
              </div>
              <Separator />
              <div>
                <p className="text-slate-600 text-xs">Last Updated</p>
                <p className="text-slate-900">{format(new Date(ticket.updated_at), 'PPp')}</p>
              </div>
              {ticket.resolved_at && (
                <>
                  <Separator />
                  <div>
                    <p className="text-slate-600 text-xs">Resolved</p>
                    <p className="text-green-700 font-medium">
                      {format(new Date(ticket.resolved_at), 'PPp')}
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}