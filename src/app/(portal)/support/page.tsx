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
import { formatDistanceToNow, format } from 'date-fns';
import Image from 'next/image';

type StatusFilter = 'all' | 'submitted' | 'in_progress' | 'resolved';

export default function SupportPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // Always fetch ALL tickets (no status filter in API)
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
    in_progress: allTickets.filter((t) => t.status === 'in_progress').length,
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
    <div className='p-3 md:p-6'>
      {/* Header */}
      <div className="mb-4 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 md:mb-2">Support Tickets</h1>
          <p className="text-sm md:text-base text-slate-600">
            View and manage your support requests
          </p>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-1.5 w-full sm:w-auto">
          <Button 
            onClick={() => setShowNewTicketModal(true)} 
            size="lg"
            className="bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto shadow-sm text-sm md:text-base px-6"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Contact Support</span>
            <span className="sm:hidden">Submit Support Ticket</span>
          </Button>
          <p className="text-xs text-slate-500 text-center w-full sm:w-auto">
            Have a question or issue? We're here to help!
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-8">
        <Card className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs md:text-sm text-slate-600">Total Tickets</p>
            <InboxIcon className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-slate-900">{counts.all}</p>
        </Card>

        <Card className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs md:text-sm text-slate-600">In Progress</p>
            <ExclamationCircleIcon className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-amber-600">{counts.in_progress}</p>
        </Card>

        <Card className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs md:text-sm text-slate-600">Resolved</p>
            <CheckCircleIcon className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-green-600">{counts.resolved}</p>
        </Card>
      </div>

      {/* Status Filters */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        className="mb-4 md:mb-6"
      >
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="all" className="text-xs md:text-sm py-2 md:py-2.5">
            <span className="hidden sm:inline">All</span>
            <span className="sm:hidden">All</span>
            <span className="ml-0.5 md:ml-1">({counts.all})</span>
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="text-xs md:text-sm py-2 md:py-2.5">
            <span className="hidden sm:inline">In Progress</span>
            <span className="sm:hidden">Active</span>
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
        <>
          {/* Desktop Table View (hidden on mobile) */}
          <div className="hidden md:block bg-white rounded-lg border border-slate-200 overflow-hidden">
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
                      <div className="flex items-center gap-1.5 mb-1">
                        <EnvelopeIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-medium text-slate-500">
                          {ticket.reply_count || 0} {ticket.reply_count === 1 ? 'reply' : 'replies'}
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
{/* Last Activity */}
<div className="col-span-3 flex flex-col items-end justify-center">
  <span className="text-xs text-[#1b1b20]">
    {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
  </span>
  
  {/* Helper text - plain black text, no chips */}
  {ticket.status === 'submitted' && (
    <span className="text-[11px] text-slate-700 mt-1">
      Waiting support team response
    </span>
  )}
  
  {ticket.status === 'in_progress' && ticket.last_reply_by === 'admin' && (
    <span className="text-[11px] text-slate-700 mt-1">
      Waiting for your reply
    </span>
  )}
  
  {ticket.status === 'in_progress' && ticket.last_reply_by === 'user' && (
    <span className="text-[11px] text-slate-700 mt-1">
      Waiting support team response
      </span>
  )}
  
  {ticket.status === 'resolved' && (
    <span className="text-[11px] text-slate-700 mt-1">
      {ticket.resolved_at 
        ? format(new Date(ticket.resolved_at), 'MMM d, yyyy')
        : ticket.updated_at
        ? format(new Date(ticket.updated_at), 'MMM d, yyyy')
        : 'Resolved'}
    </span>
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
                onClick={() => router.push(`/support/${ticket.id}`)}
                className="bg-white rounded-lg border border-slate-200 p-4 active:bg-slate-50 transition-colors"
              >
                {/* Header: Status Badge */}
                <div className="flex items-start justify-between mb-3">
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
                      {ticket.reply_count || 0}
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
{ticket.status === 'in_progress' && ticket.last_reply_by === 'admin' && (
  <div className="flex items-center gap-1.5 text-xs text-white font-semibold bg-slate-900 px-2 py-1.5 rounded mt-2">
    <ExclamationCircleIcon className="w-4 h-4" />
    <span>Waiting for Your Reply</span>
  </div>
)}

{ticket.status === 'in_progress' && ticket.last_reply_by === 'user' && (
  <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold bg-red-50 px-2 py-1.5 rounded mt-2 border border-red-200">
    <ClockIcon className="w-4 h-4" />
    <span>Awaiting Support Team Reply</span>
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
        </>
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