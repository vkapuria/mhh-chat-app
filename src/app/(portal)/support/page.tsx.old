'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { SupportTicket } from '@/types/support';
import { TicketCard } from '@/components/support/TicketCard';
import { TicketDetail } from '@/components/support/TicketDetail';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, Inbox } from 'lucide-react';

type StatusFilter = 'all' | 'submitted' | 'in_progress' | 'resolved';

export default function SupportPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    tickets: SupportTicket[];
  }>(
    `/api/support/tickets${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`,
    fetcher
  );

  const tickets = data?.tickets || [];

  const handleTicketClick = async (ticket: SupportTicket) => {
    // Fetch full ticket details with replies
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return;
    }
    
    const response = await fetch(`/api/support/tickets/${ticket.id}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    const result = await response.json();
    if (result.success) {
      setSelectedTicket(result.ticket);
      setDetailOpen(true);
    }
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    setTimeout(() => setSelectedTicket(null), 200);
    mutate(); // Refresh list
  };

  // Count by status
  const counts = {
    all: tickets.length,
    submitted: tickets.filter((t) => t.status === 'submitted').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-600">Failed to load support tickets</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Support Requests</h1>
        <p className="text-slate-600">Track your support tickets and view responses</p>
      </div>

      {/* Status Filter Tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="all" className="flex items-center gap-2 py-3">
            <Inbox className="w-4 h-4" />
            All
            {counts.all > 0 && (
              <span className="ml-1 bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full">
                {counts.all}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="submitted" className="flex items-center gap-2 py-3">
            <Clock className="w-4 h-4" />
            Submitted
            {counts.submitted > 0 && (
              <span className="ml-1 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {counts.submitted}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="flex items-center gap-2 py-3">
            <AlertCircle className="w-4 h-4" />
            In Progress
            {counts.in_progress > 0 && (
              <span className="ml-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                {counts.in_progress}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2 py-3">
            <CheckCircle className="w-4 h-4" />
            Resolved
            {counts.resolved > 0 && (
              <span className="ml-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                {counts.resolved}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tickets List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <Inbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 mb-2">No support tickets found</p>
          <p className="text-sm text-slate-500">
            {statusFilter === 'all'
              ? 'You haven\'t submitted any support requests yet'
              : `No ${statusFilter.replace('_', ' ')} tickets`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => handleTicketClick(ticket)}
            />
          ))}
        </div>
      )}

      {/* Ticket Detail Modal */}
      <TicketDetail
        ticket={selectedTicket}
        open={detailOpen}
        onOpenChange={handleDetailClose}
      />
    </div>
  );
}