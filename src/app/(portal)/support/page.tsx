'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SupportTicket } from '@/types/support';
import { TicketStatusBadge } from '@/components/support/TicketStatusBadge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calendar, Package } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatTicketNumber } from '@/lib/ticket-utils';
import { NewTicketModal } from '@/components/support/NewTicketModal';
import { Plus } from 'lucide-react';

export default function SupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'in_progress' | 'resolved'>('all');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please log in to view tickets');
        router.push('/login');
        return;
      }

      const response = await fetch('/api/support/tickets', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setTickets(result.tickets);
      } else {
        toast.error('Failed to load tickets');
      }
    } catch (error) {
      console.error('Fetch tickets error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  const getReplyCount = (ticket: SupportTicket) => {
    return ticket.replies ? ticket.replies.length : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
<div className="mb-8 flex items-start justify-between">
  <div>
    <h1 className="text-3xl font-bold text-slate-900 mb-2">Support Tickets</h1>
    <p className="text-slate-600">
      View and manage your support requests. You can reply via email or through the portal.
    </p>
  </div>
  <Button 
  onClick={() => setShowNewTicketModal(true)} 
  size="lg"
  className="bg-slate-900 hover:bg-slate-800 text-white"
>
  <Plus className="w-5 h-5 mr-2" />
  New Ticket
</Button>
</div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card
          className={`p-4 cursor-pointer transition-all ${
            filter === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-slate-50'
          }`}
          onClick={() => setFilter('all')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Tickets</p>
              <p className="text-2xl font-bold text-slate-900">{tickets.length}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-slate-400" />
          </div>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all ${
            filter === 'submitted' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-slate-50'
          }`}
          onClick={() => setFilter('submitted')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Submitted</p>
              <p className="text-2xl font-bold text-blue-600">
                {tickets.filter(t => t.status === 'submitted').length}
              </p>
            </div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all ${
            filter === 'in_progress' ? 'ring-2 ring-yellow-500 bg-yellow-50' : 'hover:bg-slate-50'
          }`}
          onClick={() => setFilter('in_progress')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">
                {tickets.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          </div>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all ${
            filter === 'resolved' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-slate-50'
          }`}
          onClick={() => setFilter('resolved')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">
                {tickets.filter(t => t.status === 'resolved').length}
              </p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </Card>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {filter === 'all' ? 'No tickets yet' : `No ${filter.replace('_', ' ')} tickets`}
            </h3>
            <p className="text-slate-600 mb-6">
              {filter === 'all'
                ? 'When you need help with an order, submit a support ticket from your orders page.'
                : 'No tickets found with this status.'}
            </p>
            {filter === 'all' && (
              <Button onClick={() => router.push('/orders')}>
                Go to Orders
              </Button>
            )}
            {filter !== 'all' && (
              <Button variant="outline" onClick={() => setFilter('all')}>
                View All Tickets
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="p-6 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => router.push(`/support/${ticket.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {formatTicketNumber(ticket.id)}
                    </span>
                    <TicketStatusBadge status={ticket.status} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {ticket.issue_type}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      <span className="font-mono">{ticket.order_id}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(ticket.created_at), 'PPp')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MessageSquare className="w-4 h-4" />
                    <span>{getReplyCount(ticket)} replies</span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded border-l-4 border-blue-500">
                <p className="line-clamp-2">{ticket.message}</p>
              </div>

              {ticket.order_title && (
                <div className="mt-3 text-sm text-slate-600">
                  <span className="font-medium">Order: </span>
                  {ticket.order_title}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      {/* New Ticket Modal */}
      <NewTicketModal
        open={showNewTicketModal}
        onClose={() => setShowNewTicketModal(false)}
        onSuccess={fetchTickets}
      />
    </div>
  );
}