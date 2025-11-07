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

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    tickets: SupportTicket[];
  }>(
    `/api/support/tickets${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`,
    fetcher
  );

  const tickets = data?.tickets || [];

  // Count by status
  const counts = {
    all: tickets.length,
    submitted: tickets.filter((t) => t.status === 'submitted').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress' && t.last_reply_by === 'admin').length,
    awaiting_response: tickets.filter((t) => t.status === 'in_progress' && t.last_reply_by === 'user').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
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
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Support Tickets</h2>
        <p className="mt-2 text-slate-600">
          Manage customer and expert support requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Tickets</p>
              <p className="text-2xl font-bold text-slate-900">{counts.all}</p>
            </div>
            <Inbox className="w-8 h-8 text-slate-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Open</p>
              <p className="text-2xl font-bold text-blue-600">{counts.submitted}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">In Progress</p>
              <p className="text-2xl font-bold text-amber-600">{counts.in_progress}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Awaiting Response</p>
              <p className="text-2xl font-bold text-red-600">{counts.awaiting_response}</p>
            </div>
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-red-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{counts.resolved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </Card>
      </div>

      {/* Status Filters */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="submitted">
            Open ({counts.submitted})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({counts.in_progress})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({counts.resolved})
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