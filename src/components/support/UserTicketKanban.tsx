'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { SupportTicket } from '@/types/support';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import type { Variants, Transition } from 'framer-motion';
import {
  EnvelopeIcon,
  ShoppingCartIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

interface UserTicketKanbanProps {
  tickets: SupportTicket[];
  onCreateTicket: () => void;
  userType: string;
}

/* ===============================================
   MOTION PRESETS
   =============================================== */

const SPRING: Transition = { type: 'spring', stiffness: 380, damping: 28, mass: 0.9 };

const columnVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.035,
      when: 'beforeChildren',
    },
  },
};

const cardVariants: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1, transition: SPRING },
  exit: { opacity: 0, y: 8, scale: 0.995, transition: SPRING },
};

const pulseOnce = { scale: [1, 0.95, 1] };
const PULSE: Transition = { type: 'tween', duration: 0.25, ease: 'easeOut' };

/* ===============================================
   TICKET CARD
   =============================================== */

function TicketCard({ 
  ticket, 
  onOpen, 
  userType 
}: { 
  ticket: SupportTicket; 
  onOpen: () => void;
  userType: string;
}) {
  const replyCount = ticket.reply_count || 0;
  const lastActivity = formatDistanceToNow(new Date(ticket.updated_at || ticket.created_at), {
    addSuffix: true,
  });

  // Determine action needed
  const needsYourReply = ticket.status === 'in_progress' && ticket.last_reply_by === 'admin';
  const waitingForSupport = ticket.status === 'in_progress' && ticket.last_reply_by === 'user';

  return (
    <motion.article
      layout="position"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={onOpen}
      className="relative rounded-lg border-2 border-dashed border-slate-500 bg-white p-4 shadow-sm hover:shadow-md cursor-pointer transition-all transform-gpu will-change-transform hover:-translate-y-0.5"
    >
      {/* Subject */}
      <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 text-sm">
        {ticket.issue_type}
      </h3>

      {/* Message preview */}
      {ticket.message && (
        <p className="text-xs text-slate-600 line-clamp-2 mb-3">
          {ticket.message}
        </p>
      )}

      {/* Meta info - Compact 2-row layout */}
      <div className="space-y-2 text-xs">
        {/* Row 1: Order ID + Amount (privacy-aware) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShoppingCartIcon className="w-3.5 h-3.5" />
            <span className="font-mono font-medium text-slate-700">
              {ticket.order_id}
            </span>
          </div>
          {/* Show expert_fee for experts, order_amount for customers */}
          {userType === 'expert' && ticket.expert_fee && (
            <span className="font-semibold text-green-700">
              ₹{ticket.expert_fee.toLocaleString('en-IN')}
            </span>
          )}
          {userType === 'customer' && ticket.order_amount && (
            <span className="font-semibold text-green-700">
              ${ticket.order_amount.toLocaleString()}
            </span>
          )}
        </div>

        {/* Row 2: Replies + Time ago */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500">
            <EnvelopeIcon className="w-3.5 h-3.5" />
            <span>{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <ClockIcon className="w-3.5 h-3.5" />
            <span>{lastActivity}</span>
          </div>
        </div>
      </div>

      {/* Action needed badge */}
      {needsYourReply && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 px-2 py-1.5 rounded">
          <ExclamationCircleIcon className="w-4 h-4" />
          <span>Your Reply Needed</span>
        </div>
      )}

      {waitingForSupport && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1.5 rounded border border-amber-200">
          <ClockIcon className="w-4 h-4" />
          <span>Awaiting Support Reply</span>
        </div>
      )}

      {ticket.status === 'resolved' && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2 py-1.5 rounded border border-green-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>
            Resolved {ticket.resolved_at 
              ? formatDistanceToNow(new Date(ticket.resolved_at), { addSuffix: true })
              : 'recently'}
          </span>
        </div>
      )}
    </motion.article>
  );
}

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
          key={count}
          initial={false}
          animate={pulseOnce}
          transition={PULSE}
          className="rounded-full bg-white text-slate-900 px-2 py-0.5 text-xs font-semibold"
        >
          {count}
        </motion.span>
      </div>
      
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
   MAIN KANBAN
   =============================================== */

export function UserTicketKanban({ tickets, onCreateTicket, userType }: UserTicketKanbanProps) {
  const router = useRouter();

  const groups = useMemo(() => {
    const submitted = tickets.filter((t) => t.status === 'submitted');
    const inProgress = tickets.filter((t) => t.status === 'in_progress');
    const resolved = tickets.filter((t) => t.status === 'resolved');

    return { submitted, inProgress, resolved };
  }, [tickets]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Submitted */}
<ColumnShell
          title="New"
          count={groups.submitted.length}
          headerClass="bg-slate-900 text-white"
        >
          {groups.submitted.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-slate-500 p-6 text-center">
              <p className="text-sm font-medium text-slate-700 mb-2">No new tickets</p>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Facing issues? Need help with an order?<br />
                Our VIP support team is here 24/7!
              </p>
              <button
                onClick={onCreateTicket}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Contact Support
              </button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {groups.submitted.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onOpen={() => router.push(`/support/${ticket.id}`)}
                  userType={userType}
                />
              ))}
            </AnimatePresence>
          )}
        </ColumnShell>

        {/* In Progress */}
        <ColumnShell
          title="In Progress"
          count={groups.inProgress.length}
          headerClass="bg-indigo-700 text-white"
        >
        {groups.inProgress.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-slate-500 p-6 text-center">
              <p className="text-sm font-medium text-slate-700 mb-2">No active tickets</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                You're all caught up!<br />
                Any ongoing conversations will appear here.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {groups.inProgress.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onOpen={() => router.push(`/support/${ticket.id}`)}
                  userType={userType}
                />
              ))}
            </AnimatePresence>
          )}
        </ColumnShell>

        {/* Resolved */}
        <ColumnShell
          title="Resolved"
          count={groups.resolved.length}
          headerClass="bg-lime-500 text-white"
        >
        {groups.resolved.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-slate-500 p-6 text-center">
              <p className="text-sm font-medium text-slate-700 mb-2">No resolved tickets</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Completed support conversations<br />
                will appear here for your reference.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {groups.resolved.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onOpen={() => router.push(`/support/${ticket.id}`)}
                  userType={userType}
                />
              ))}
            </AnimatePresence>
          )}
        </ColumnShell>
      </div>
    </MotionConfig>
  );
}