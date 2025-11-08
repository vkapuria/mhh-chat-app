'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { SupportTicket } from '@/types/support';
import { TicketList } from '@/components/admin/TicketList';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, AlertCircle, Inbox } from 'lucide-react';
import { formatTicketNumber } from '@/lib/ticket-utils';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

type StatusFilter = 'all' | 'submitted' | 'in_progress' | 'resolved';

export default function AdminSupportPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Always fetch ALL tickets (no status filter in API call)
const { data, error, isLoading, mutate } = useSWR<{
  success: boolean;
  tickets: SupportTicket[];
}>(
  `/api/support/tickets`,
  fetcher
);

// Get all tickets
const allTickets = data?.tickets || [];

// Filter tickets on frontend based on selected tab
const tickets = statusFilter === 'all' 
  ? allTickets
  : allTickets.filter(t => t.status === statusFilter);

  // Count by status (ALWAYS from all tickets, not filtered)
const counts = {
  all: allTickets.length,
  submitted: allTickets.filter((t) => t.status === 'submitted').length,
  in_progress: allTickets.filter((t) => t.status === 'in_progress' && t.last_reply_by === 'admin').length,
  awaiting_response: allTickets.filter((t) => t.status === 'in_progress' && t.last_reply_by === 'user').length,
  resolved: allTickets.filter((t) => t.status === 'resolved').length,
};

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Failed to load tickets</p>
          <p className="text-sm text-slate-600 mt-2">{error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Support Tickets</h2>
        <p className="mt-1 md:mt-2 text-sm md:text-base text-slate-600">
          Manage customer and expert support requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 md:mb-8">
        {/* Total Card - Full Width */}
        <Card className="p-4 mb-3 md:mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600">Total Tickets</p>
            <Inbox className="w-6 h-6 md:w-7 md:h-7 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{counts.all}</p>
        </Card>

        {/* Other Cards - 2x2 Grid on Mobile, Single Row on Desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs md:text-sm text-slate-600">Open</p>
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-blue-600">{counts.submitted}</p>
          </Card>

          <Card className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs md:text-sm text-slate-600">In Progress</p>
              <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-amber-600">{counts.in_progress}</p>
          </Card>

          <Card className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs md:text-sm text-slate-600">Awaiting</p>
              <ChatBubbleLeftRightIcon className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-red-600">{counts.awaiting_response}</p>
          </Card>

          <Card className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs md:text-sm text-slate-600">Resolved</p>
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-green-600">{counts.resolved}</p>
          </Card>
        </div>
      </div>

      {/* Status Filters */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        className="mb-4 md:mb-6"
      >
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="all" className="text-xs md:text-sm py-2 md:py-2.5">
            <span className="hidden sm:inline">All</span>
            <span className="sm:hidden">All</span>
            <span className="ml-0.5 md:ml-1">({counts.all})</span>
          </TabsTrigger>
          <TabsTrigger value="submitted" className="text-xs md:text-sm py-2 md:py-2.5">
            <span className="hidden sm:inline">Open</span>
            <span className="sm:hidden">Open</span>
            <span className="ml-0.5 md:ml-1">({counts.submitted})</span>
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="text-xs md:text-sm py-2 md:py-2.5">
            <span className="hidden sm:inline">In Progress</span>
            <span className="sm:hidden">Progress</span>
            <span className="ml-0.5 md:ml-1">({counts.in_progress})</span>
          </TabsTrigger>
          <TabsTrigger value="resolved" className="text-xs md:text-sm py-2 md:py-2.5">
            <span className="hidden sm:inline">Resolved</span>
            <span className="sm:hidden">Done</span>
            <span className="ml-0.5 md:ml-1">({counts.resolved})</span>
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
        <Card className="p-12 text-center">
          <Inbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">
            {statusFilter === 'all'
              ? 'No support tickets yet'
              : `No ${statusFilter.replace('_', ' ')} tickets`}
          </p>
        </Card>
      ) : (
        <TicketList tickets={tickets} onUpdate={mutate} />
      )}
    </div>
  );
}