'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import clsx from 'clsx';
import { fetcher } from '@/lib/fetcher';
import { SupportTicket } from '@/types/support';
import { TicketList } from '@/components/admin/TicketList';
import { AdminTicketCreationModal } from '@/components/admin/AdminTicketCreationModal';
import { Button } from '@/components/ui/button';
import { Inbox, Plus, Layers3 } from 'lucide-react';
import { Square3Stack3DIcon } from '@heroicons/react/24/outline';
/* ---------------- Types & Helpers ---------------- */

type QuickFilter =
  | 'all'
  | 'submitted'
  | 'awaiting_admin'
  | 'awaiting_user'
  | 'resolved'
  | 'sla_ok'
  | 'sla_warn'
  | 'sla_over';

// API response type
interface TicketsResponse {
  success: boolean;
  tickets: SupportTicket[];
  resolved_groups?: {
    thisWeek: SupportTicket[];
    last30Days: SupportTicket[];
    older: SupportTicket[];
  };
}

function isAwaitingAdmin(t: SupportTicket) {
  return t.status === 'in_progress' && t.last_reply_by === 'user';
}
function isAwaitingUser(t: SupportTicket) {
  return t.status === 'in_progress' && t.last_reply_by === 'admin';
}

function getSlaState(t: SupportTicket): 'green' | 'amber' | 'red' {
  // Resolved tickets have no SLA
  if (t.status === 'resolved') return 'green';
  
  const now = Date.now();
  let base: string;
  
  if (t.status === 'submitted') {
    // New tickets: measure time since creation (waiting for first admin response)
    base = t.created_at;
  } else if (t.status === 'in_progress') {
    // In progress: only apply SLA if customer replied last (admin needs to respond)
    if (t.last_reply_by === 'admin') {
      // Admin responded, waiting on customer → NO SLA pressure
      return 'green';
    } else {
      // Customer replied last, admin needs to respond → SLA applies
      base = t.updated_at || t.created_at;
    }
  } else {
    base = t.created_at;
  }
  
  const ms = Math.max(0, now - new Date(base).getTime());
  const hours = ms / 36e5;
  
  if (hours < 24) return 'green';    // Less than 1 day
  if (hours < 48) return 'amber';    // 1-2 days
  return 'red';                       // 2+ days
}

/* ---------------- Page ---------------- */

export default function AdminSupportPage() {
  const [filter, setFilter] = useState<QuickFilter>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false); // ADD THIS

  const { data, error, isLoading, mutate } = useSWR<TicketsResponse>(
    '/api/support/tickets',
    fetcher
  );

  const allTickets = data?.tickets || [];

  // Counts for tabs
  const counts = useMemo(() => {
    const c: Record<QuickFilter, number> = {
      all: allTickets.length,
      submitted: 0,
      awaiting_admin: 0,
      awaiting_user: 0,
      resolved: 0,
      sla_ok: 0,
      sla_warn: 0,
      sla_over: 0,
    };
    for (const t of allTickets) {
      if (t.status === 'submitted') c.submitted++;
      if (t.status === 'resolved') c.resolved++;
      if (isAwaitingAdmin(t)) c.awaiting_admin++;
      if (isAwaitingUser(t)) c.awaiting_user++;

      // Only calculate SLA for non-resolved tickets
      if (t.status !== 'resolved') {
        const sla = getSlaState(t);
        if (sla === 'green') c.sla_ok++;
        if (sla === 'amber') c.sla_warn++;
        if (sla === 'red') c.sla_over++;
      }
    }
    return c;
  }, [allTickets]);

  // Apply filter
  const tickets = useMemo(() => {
    switch (filter) {
      case 'submitted':
        return allTickets.filter((t) => t.status === 'submitted');
      case 'awaiting_admin':
        return allTickets.filter(isAwaitingAdmin);
      case 'awaiting_user':
        return allTickets.filter(isAwaitingUser);
      case 'resolved':
        return allTickets.filter((t) => t.status === 'resolved');
      case 'sla_ok':
        return allTickets.filter((t) => t.status !== 'resolved' && getSlaState(t) === 'green');
      case 'sla_warn':
        return allTickets.filter((t) => t.status !== 'resolved' && getSlaState(t) === 'amber');
      case 'sla_over':
        return allTickets.filter((t) => t.status !== 'resolved' && getSlaState(t) === 'red');
      default:
        return allTickets;
    }
  }, [allTickets, filter]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Failed to load tickets</p>
          <p className="text-sm text-slate-600 mt-2">{(error as any)?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Support Tickets</h2>
          <p className="mt-1 text-sm md:text-base text-slate-600">
            Manage customer and expert support requests
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            variant={isSelectionMode ? "default" : "outline"}
            className={isSelectionMode ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            <Square3Stack3DIcon className="w-4 h-4 mr-2" />
            {isSelectionMode ? 'Exit Selection' : 'Select Tickets'}
          </Button>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Proactive Ticket
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-4 bg-white border border-slate-200 rounded-lg px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {([
            { id: 'all', label: 'All' },
            { id: 'submitted', label: 'Open' },
            { id: 'awaiting_admin', label: 'Awaiting Admin' },
            { id: 'awaiting_user', label: 'Awaiting User' },
            { id: 'resolved', label: 'Resolved' },
            { id: 'sla_ok', label: '🟢 SLA OK' },
            { id: 'sla_warn', label: '🟠 Warning' },
            { id: 'sla_over', label: '🔴 Overdue' },
          ] as { id: QuickFilter; label: string }[]).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium transition-all',
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-800 hover:bg-slate-100'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={clsx(
                    'px-1.5 rounded text-[11px] font-semibold leading-tight min-w-[22px] text-center',
                    active ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-700'
                  )}
                >
                  {counts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kanban */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-lg">
          <Inbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">
            {filter === 'all' ? 'No support tickets yet' : 'No tickets for this filter'}
          </p>
        </div>
      ) : (
        <TicketList 
          tickets={tickets} 
          resolved_groups={data?.resolved_groups}
          onUpdate={mutate}
          isSelectionMode={isSelectionMode}
          onToggleSelectionMode={() => setIsSelectionMode(!isSelectionMode)}
        />
      )}

      {/* Create Ticket Modal */}
      <AdminTicketCreationModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={mutate}
      />
    </div>
  );
}