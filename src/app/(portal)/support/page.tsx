'use client';

import { useUnreadTicketsStore } from '@/store/unread-tickets-store';
import { useEffect } from 'react'; // Already imported, just make sure
import { useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { fetcher } from '@/lib/fetcher';
import { SupportTicket } from '@/types/support';
import { supabase } from '@/lib/supabase';
import { TicketStatusBadge } from '@/components/support/TicketStatusBadge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NewTicketModal } from '@/components/support/NewTicketModal';
import { UserTicketKanban } from '@/components/support/UserTicketKanban';
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
  const [userType, setUserType] = useState<string>('customer');

  // Get user type from session
  useEffect(() => {
    async function getUserType() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserType(session.user.user_metadata?.user_type || 'customer');
      }
    }
    getUserType();
  }, []);

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

  // Initialize unread store from server data
  const initializeFromTickets = useUnreadTicketsStore((state) => state.initializeFromTickets);

  useEffect(() => {
    if (allTickets.length > 0) {
      initializeFromTickets(allTickets);
    }
  }, [allTickets, initializeFromTickets]);

  // Polling backup: Check for new replies every 30 seconds
  useEffect(() => {
    if (!data?.tickets) return;

    const interval = setInterval(() => {
      console.log('🔄 Polling for ticket updates...');
      mutate(); // Re-fetch tickets
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [data?.tickets, mutate]);

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

      {/* Stats Cards - REMOVED: Stats now shown in tabs */}

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

      {/* Tickets Kanban */}
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
        <UserTicketKanban 
          tickets={tickets} 
          onCreateTicket={() => setShowNewTicketModal(true)}
          userType={userType}
        />
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