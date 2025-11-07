'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { fetcher } from '@/lib/fetcher';
import { SupportTicket } from '@/types/support';
import { TicketStatusBadge } from '@/components/support/TicketStatusBadge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NewTicketModal } from '@/components/support/NewTicketModal';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon, 
  InboxIcon,
  PlusIcon,
  EnvelopeIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

type StatusFilter = 'all' | 'submitted' | 'in_progress' | 'resolved';

export default function SupportPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

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
    in_progress: tickets.filter((t) => t.status === 'in_progress').length, // Count ALL in_progress
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
    <div className='p-6'>
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
          <PlusIcon className="w-5 h-5 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Stats Cards */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-600">Total Tickets</p>
        <p className="text-2xl font-bold text-slate-900">{counts.all}</p>
      </div>
      <InboxIcon className="w-8 h-8 text-slate-400" />
    </div>
  </Card>

  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-600">In Progress</p>
        <p className="text-2xl font-bold text-amber-600">{counts.in_progress}</p>
      </div>
      <ExclamationCircleIcon className="w-8 h-8 text-amber-400" />
    </div>
  </Card>

  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-600">Resolved</p>
        <p className="text-2xl font-bold text-green-600">{counts.resolved}</p>
      </div>
      <CheckCircleIcon className="w-8 h-8 text-green-400" />
    </div>
  </Card>
</div>

      {/* Status Filters */}
<Tabs
  value={statusFilter}
  onValueChange={(v) => setStatusFilter(v as StatusFilter)}
  className="mb-6"
>
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="all">
      All ({counts.all})
    </TabsTrigger>
    <TabsTrigger value="in_progress">
      In Progress ({counts.in_progress})
    </TabsTrigger>
    <TabsTrigger value="resolved">
      Resolved ({counts.resolved})
    </TabsTrigger>
  </TabsList>
</Tabs>

      {/* Tickets Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-12 text-center">
          <InboxIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 mb-4">
  {statusFilter === 'all'
    ? 'No support tickets yet'
    : statusFilter === 'in_progress'
    ? 'No tickets in progress'
    : 'No resolved tickets'}
</p>
          <Button onClick={() => setShowNewTicketModal(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Your First Ticket
          </Button>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <div className="col-span-4">Subject</div>
            <div className="col-span-3">Order</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3 text-right">Last Activity</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => router.push(`/support/${ticket.id}`)}
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                {/* Subject with Reply Count */}
                <div className="col-span-4 flex items-center min-w-0">
                  <div className="flex-1 min-w-0">
                    {/* Reply Count */}
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
                <div className="col-span-3 flex items-center min-w-0">
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
                <div className="col-span-3 flex flex-col items-end justify-center">
                  <span className="text-xs text-[#1b1b20]">
                    {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                  </span>
                  {ticket.status === 'in_progress' && ticket.last_reply_by === 'admin' && (
                    <span className="text-xs text-green-600 font-medium mt-1">
                      Waiting for your reply
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      <NewTicketModal
        open={showNewTicketModal}
        onClose={() => setShowNewTicketModal(false)}
        onSuccess={() => mutate()}
      />
    </div>
  );
}