'use client';

import { useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { SupportTicket } from '@/types/support';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useReducedMotion,
} from 'framer-motion';
import type { Variants, Transition } from 'framer-motion';

import {
  ChevronDownIcon,
  TrashIcon,
  CheckCircleIcon,
  Square3Stack3DIcon,
} from '@heroicons/react/24/outline';
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal';

/* ===============================================
   TYPES & PROPS
   =============================================== */

interface TicketListProps {
  tickets: SupportTicket[];
  resolved_groups?: {
    thisWeek: SupportTicket[];
    last30Days: SupportTicket[];
    older: SupportTicket[];
    older_count?: number;
  };
  onUpdate: () => void;
  isSelectionMode: boolean;          // ADD THIS
  onToggleSelectionMode: () => void; // ADD THIS
}

/* ===============================================
   HELPERS
   =============================================== */

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
  
  const hours = (now - new Date(base).getTime()) / 36e5;
  
  if (hours < 24) return 'green';    // Less than 1 day
  if (hours < 48) return 'amber';    // 1-2 days
  return 'red';                       // 2+ days
}

const slaDotClass: Record<'green' | 'amber' | 'red', string> = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

/* ===============================================
   MOTION PRESETS (Apple-y)
   =============================================== */

// One spring to rule them all
const SPRING: Transition = { type: 'spring', stiffness: 380, damping: 28, mass: 0.9 } as const;

// Column container variants (for staggered children)
const columnVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.035,
      when: 'beforeChildren',
    },
  },
};

// Card variants – minimal movement, GPU friendly
const cardVariants: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1, transition: SPRING },
  exit: { opacity: 0, y: 8, scale: 0.995, transition: SPRING },
};

// Count pulse when numbers change
const pulseOnce = { scale: [1, 0.95, 1] };
const PULSE: Transition = { type: 'tween', duration: 0.25, ease: 'easeOut' };

/* ===============================================
   SMALL UI PIECES
   =============================================== */

function RoleChip({ role }: { role: string }) {
  const isExpert = role?.toLowerCase() === 'expert';
  return (
    <span
      className={clsx(
        'inline-block rounded-full px-2 py-0.5 text-[11px] font-medium border',
        isExpert
          ? 'bg-amber-100 text-amber-800 border-amber-200'
          : 'bg-slate-900 text-white border-slate-900'
      )}
    >
      {role || 'user'}
    </span>
  );
}

function Avatar({
  name,
  src,
  ringClass,
  size = 54,
}: {
  name: string;
  src?: string | null;
  ringClass?: string;
  size?: number;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className={clsx('rounded-full object-cover border-2', ringClass || 'border-slate-200')}
      />
    );
  }
  return (
    <div
      className={clsx(
        'rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white grid place-content-center font-semibold',
        ringClass
      )}
      style={{ width: size, height: size }}
      aria-label={name}
      title={name}
    >
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

function RepliesIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
      />
    </svg>
  );
}

/* ===============================================
   COLLAPSIBLE GROUP (scaleY + opacity; no height thrash)
   =============================================== */

function CollapsibleGroup({
  title,
  count,
  defaultExpanded = true,
  children,
}: {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const reduce = useReducedMotion();

  if (count === 0) return null;

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={SPRING}
          >
            <ChevronDownIcon className="w-4 h-4 text-slate-400" />
          </motion.div>
          <span className="text-xs font-semibold text-slate-600">{title}</span>
          <span className="text-xs text-slate-500">({count})</span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scaleY: 0.96, transformOrigin: 'top' }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scaleY: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scaleY: 0.96 }}
            transition={SPRING}
            className="p-3 space-y-3 will-change-transform"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ===============================================
   CARD
   =============================================== */

const TicketCard = ({
  t,
  onOpen,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}: {
  t: SupportTicket;
  onOpen: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) => {
  const isAdminInitiated = (t as any).created_by_admin_name;
  const requesterName = isAdminInitiated ? (t as any).created_by_admin_name : t.user_display_name;
  const requesterRole = isAdminInitiated ? 'Admin' : t.user_type;
  const avatarSrc = isAdminInitiated ? (t as any).admin_avatar : t.user_avatar_url;
  const ringClass = isAdminInitiated ? 'border-purple-300' : 'border-slate-200';
  const sla = getSlaState(t);
  const lastTs = new Date(t.updated_at || t.created_at);
  const replies = (t.replies?.length ?? 0) || (t.reply_count ?? 0) || 0;

  return (
    <motion.article
      layout="position"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={isSelectionMode ? onToggleSelect : onOpen}
      className={clsx(
        'relative rounded-lg border bg-white p-4 shadow-sm hover:shadow-md cursor-pointer transition-all transform-gpu will-change-transform',
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200',
        !isSelectionMode && 'hover:-translate-y-0.5'
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (isSelectionMode ? onToggleSelect?.() : onOpen());
      }}
    >
      {/* selection checkbox */}
      {isSelectionMode && (
        <div className="absolute top-2 right-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      )}

      {/* avatar / name */}
      <div className="mb-2 flex items-center gap-3">
        <Avatar name={requesterName} src={avatarSrc} ringClass={ringClass} size={54} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{requesterName}</p>
          <RoleChip role={requesterRole} />
        </div>
        {!isSelectionMode && t.status !== 'resolved' && (
          <span
            className={clsx('ml-auto inline-block h-2.5 w-2.5 rounded-full', slaDotClass[sla])}
            title={`SLA: ${sla.toUpperCase()}`}
          />
        )}
      </div>

      {/* subject + preview */}
      <h3 className="mb-1 line-clamp-1 font-semibold" title={t.issue_type}>
        {t.issue_type}
      </h3>
      {t.message && (
        <p className="line-clamp-2 text-sm text-slate-600" title={t.message}>
          {t.message}
        </p>
      )}

      {/* footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <RepliesIcon />
          <span>
            {replies} {replies === 1 ? 'reply' : 'replies'}
          </span>
        </div>
        <span>{formatDistanceToNow(lastTs, { addSuffix: true })}</span>
      </div>
    </motion.article>
  );
};

/* ===============================================
   COLUMN SHELL
   =============================================== */

function ColumnShell({
  title,
  count,
  headerClass,
  children,
}: {
  title: string;
  count: number;
  headerClass: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className={clsx('flex items-center justify-between px-4 py-3 border-b border-slate-200', headerClass)}>
        <h2 className="text-sm font-semibold">{title}</h2>
        <motion.span
          key={count} // triggers a one-time pulse when count changes
          initial={false}
          animate={pulseOnce}
          transition={PULSE}
          className="rounded-full bg-white text-slate-900 px-2 py-0.5 text-xs font-semibold"
        >
          {count}
        </motion.span>
      </div>
      {/* Limit height so page never grows infinitely; nice scroll with shadows */}
      <div className="relative max-h-[70vh] overflow-auto">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-white to-transparent" />
        <motion.div
          className="space-y-3 p-3"
          variants={columnVariants}
          initial="initial"
          animate="animate"
        >
          {children}
        </motion.div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white to-transparent" />
      </div>
    </section>
  );
}

/* ===============================================
   MAIN (KANBAN)
   =============================================== */

export function TicketList({ 
  tickets, 
  resolved_groups, 
  onUpdate,
  isSelectionMode,
  onToggleSelectionMode 
}: TicketListProps) {
  const router = useRouter();

  // selection mode (controlled from parent)
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const groups = useMemo(() => {
    const submitted = tickets.filter((t) => t.status === 'submitted');
    const awaitingAdmin = tickets.filter(isAwaitingAdmin);
    const awaitingUser = tickets.filter(isAwaitingUser);
    const inProgressCount = awaitingAdmin.length + awaitingUser.length;
    const resolved = tickets.filter((t) => t.status === 'resolved');
    return { submitted, awaitingAdmin, awaitingUser, inProgressCount, resolved };
  }, [tickets]);

  const handleToggleSelection = (ticketId: string) => {
    const next = new Set(selectedTickets);
    next.has(ticketId) ? next.delete(ticketId) : next.add(ticketId);
    setSelectedTickets(next);
  };

  const handleCancelSelection = () => {
    onToggleSelectionMode(); // Use prop instead
    setSelectedTickets(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedTickets.size === 0) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push('/login');
        return;
      }
      const response = await fetch('/api/admin/tickets/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ ticket_ids: Array.from(selectedTickets) }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`Deleted ${result.deleted_count} ticket(s)`);
        setSelectedTickets(new Set());
        onToggleSelectionMode();
        setShowDeleteModal(false);
        onUpdate();
      } else {
        toast.error(result.error || 'Failed to delete tickets');
      }
    } catch {
      toast.error('Failed to delete tickets');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkResolve = async (skipEmails = false) => {
    if (selectedTickets.size === 0) return;
    const message = skipEmails
      ? `Resolve ${selectedTickets.size} ticket(s) without sending emails?`
      : `Resolve ${selectedTickets.size} ticket(s)? This will send ${selectedTickets.size} email(s) with delays.`;
    if (!confirm(message)) return;

    setIsResolving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push('/login');
        return;
      }
      const response = await fetch('/api/admin/tickets/bulk-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ ticket_ids: Array.from(selectedTickets), skip_emails: skipEmails }),
      });
      const result = await response.json();
      if (result.success) {
        const emailInfo = result.skipped_emails
          ? '(no emails sent)'
          : `(${result.emails_sent} emails sent${result.emails_failed > 0 ? `, ${result.emails_failed} failed` : ''})`;
        toast.success(`Resolved ${result.resolved_count} ticket(s) ${emailInfo}`);
        setSelectedTickets(new Set());
        onToggleSelectionMode();
        onUpdate();
      } else {
        toast.error(result.error || 'Failed to resolve tickets');
      }
    } catch {
      toast.error('Failed to resolve tickets');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-4">
        {/* Selection mode action bar */}
        {isSelectionMode && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="sticky top-0 z-20 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 shadow-lg"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-blue-900">
                  {selectedTickets.size} ticket(s) selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleBulkResolve(false)}
                  disabled={isResolving || isDeleting || selectedTickets.size === 0}
                  size="sm"
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Resolve & Email
                </Button>
                <Button
                  onClick={() => handleBulkResolve(true)}
                  disabled={isResolving || isDeleting || selectedTickets.size === 0}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-green-600 text-green-600 hover:bg-green-50"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Resolve (No Email)
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  disabled={isDeleting || isResolving || selectedTickets.size === 0}
                  size="sm"
                  variant="destructive"
                  className="gap-2"
                >
                  <TrashIcon className="w-4 h-4" />
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </Button>
                <Button onClick={handleCancelSelection} disabled={isDeleting || isResolving} size="sm" variant="ghost">
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Board */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Submitted */}
          <ColumnShell title="Submitted" count={groups.submitted.length} headerClass="bg-slate-900 text-white">
            {groups.submitted.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No new submissions
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {groups.submitted.map((t) => (
                  <TicketCard
                    key={t.id}
                    t={t}
                    onOpen={() => router.push(`/admin/support/${t.id}`)}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedTickets.has(t.id)}
                    onToggleSelect={() => handleToggleSelection(t.id)}
                  />
                ))}
              </AnimatePresence>
            )}
          </ColumnShell>

          {/* In Progress (two swimlanes) */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-indigo-700 text-white">
              <h2 className="text-sm font-semibold">In Progress</h2>
              <motion.span
                key={groups.inProgressCount}
                initial={false}
                animate={pulseOnce}
                transition={PULSE}
                className="rounded-full bg-white text-slate-900 px-2 py-0.5 text-xs font-semibold"
              >
                {groups.inProgressCount}
              </motion.span>
            </div>

            {/* Awaiting Admin */}
            <div className="border-b border-slate-200 px-4 py-2 text-xs font-semibold text-purple-500">
              Awaiting Admin Response
            </div>
            <motion.div className="space-y-3 p-3" variants={columnVariants} initial="initial" animate="animate">
              <AnimatePresence mode="popLayout">
                {groups.awaitingAdmin.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                    Nothing pending for admins
                  </div>
                ) : (
                  groups.awaitingAdmin.map((t) => (
                    <TicketCard
                      key={t.id}
                      t={t}
                      onOpen={() => router.push(`/admin/support/${t.id}`)}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedTickets.has(t.id)}
                      onToggleSelect={() => handleToggleSelection(t.id)}
                    />
                  ))
                )}
              </AnimatePresence>
            </motion.div>

            {/* Awaiting User */}
            <div className="border-b border-slate-200 px-4 py-2 text-xs font-semibold text-green-500">
              Awaiting User Response
            </div>
            <motion.div className="space-y-3 p-3" variants={columnVariants} initial="initial" animate="animate">
              <AnimatePresence mode="popLayout">
                {groups.awaitingUser.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                    Nothing pending for users
                  </div>
                ) : (
                  groups.awaitingUser.map((t) => (
                    <TicketCard
                      key={t.id}
                      t={t}
                      onOpen={() => router.push(`/admin/support/${t.id}`)}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedTickets.has(t.id)}
                      onToggleSelect={() => handleToggleSelection(t.id)}
                    />
                  ))
                )}
              </AnimatePresence>
            </motion.div>
          </section>

          {/* Resolved (collapsible groups) */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-lime-500 text-white">
              <h2 className="text-sm font-semibold">Resolved</h2>
              <motion.span
                key={groups.resolved.length}
                initial={false}
                animate={pulseOnce}
                transition={PULSE}
                className="rounded-full bg-white text-slate-900 px-2 py-0.5 text-xs font-semibold"
              >
                {groups.resolved.length}
              </motion.span>
            </div>

            {groups.resolved.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Nothing here yet
              </div>
            ) : (
              <>
                <CollapsibleGroup
                  title="This Week"
                  count={(resolved_groups?.thisWeek || []).length}
                  defaultExpanded={true}
                >
                  <AnimatePresence mode="popLayout">
                    {(resolved_groups?.thisWeek || []).map((t) => (
                      <TicketCard
                        key={t.id}
                        t={t}
                        onOpen={() => router.push(`/admin/support/${t.id}`)}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedTickets.has(t.id)}
                        onToggleSelect={() => handleToggleSelection(t.id)}
                      />
                    ))}
                  </AnimatePresence>
                </CollapsibleGroup>

                <CollapsibleGroup
                  title="Last 30 Days"
                  count={(resolved_groups?.last30Days || []).length}
                  defaultExpanded={false}
                >
                  <AnimatePresence mode="popLayout">
                    {(resolved_groups?.last30Days || []).map((t) => (
                      <TicketCard
                        key={t.id}
                        t={t}
                        onOpen={() => router.push(`/admin/support/${t.id}`)}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedTickets.has(t.id)}
                        onToggleSelect={() => handleToggleSelection(t.id)}
                      />
                    ))}
                  </AnimatePresence>
                </CollapsibleGroup>

                <CollapsibleGroup
                  title="All Time"
                  count={resolved_groups?.older_count || (resolved_groups?.older || []).length || 0}
                  defaultExpanded={false}
                >
                  {(resolved_groups?.older || []).length === 0 &&
                  (resolved_groups?.older_count || 0) > 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-slate-600 font-medium">
                        {resolved_groups?.older_count} older ticket
                        {(resolved_groups?.older_count || 0) > 1 ? 's' : ''} not shown for performance
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {(resolved_groups?.older || []).map((t) => (
                        <TicketCard
                          key={t.id}
                          t={t}
                          onOpen={() => router.push(`/admin/support/${t.id}`)}
                          isSelectionMode={isSelectionMode}
                          isSelected={selectedTickets.has(t.id)}
                          onToggleSelect={() => handleToggleSelection(t.id)}
                        />
                      ))}
                    </AnimatePresence>
                  )}
                </CollapsibleGroup>
              </>
            )}
          </section>
        </div>

        {/* Delete modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          count={selectedTickets.size}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          isDeleting={isDeleting}
        />
      </div>
    </MotionConfig>
  );
}
