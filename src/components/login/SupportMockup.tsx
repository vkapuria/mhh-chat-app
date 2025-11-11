'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';

/** ---------------- Ticket Number Generator ---------------- */
function generateTicketNumber() {
  const num = Math.floor(10 + Math.random() * 90); // 2 digits
  const alpha = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 chars
  return `TKT-${num}${alpha}`;
}

/** ---------------- Mock Data ---------------- */
const mockTickets = [
  {
    id: generateTicketNumber(),
    subject: 'Question about order status',
    status: 'In Progress' as const,
    created: '2 hours ago',
    replies: 3,
    closedAt: null as string | null,
  },
  {
    id: generateTicketNumber(),
    subject: 'Request for changes in my assignment',
    status: 'Resolved' as const,
    created: '1 day ago',
    replies: 5,
    closedAt: 'Nov 10, 2:45 PM',
  },
  {
    id: generateTicketNumber(),
    subject: 'Other: Payment method update',
    status: 'Submitted' as const,
    created: '3 hours ago',
    replies: 1,
    closedAt: null as string | null,
  },
];

type Ticket = (typeof mockTickets)[number];

const statusColors = {
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
  'Resolved': 'bg-green-100 text-green-700 border-green-200',
  'Submitted': 'bg-yellow-100 text-yellow-700 border-yellow-200',
} as const;

/** ---------------- Waiting Status Helper ---------------- */
function getWaitingStatus(ticket: Ticket) {
  if (ticket.status === 'Submitted') {
    return { text: 'Waiting for support reply', color: 'text-slate-600' };
  }
  if (ticket.status === 'In Progress') {
    return { text: 'Waiting your response', color: 'text-blue-600' };
  }
  if (ticket.status === 'Resolved') {
    return { text: `Closed at ${ticket.closedAt}`, color: 'text-green-600' };
  }
  return { text: '', color: '' };
}

/** ---------------- Ticket Card ---------------- */
function TicketCard({ ticket, index, isMobile = false }: { ticket: Ticket; index: number; isMobile?: boolean }) {
  const waitingStatus = getWaitingStatus(ticket);
  const statusColor = statusColors[ticket.status];
  
  // Alternating animation direction
  const direction = index % 2 === 0 ? -40 : 40;

  return (
    <motion.div
      initial={{ opacity: 0, x: direction }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.15,
        ease: 'easeOut'
      }}
      className="bg-white rounded-lg p-1.5 border-2 border-dashed border-slate-300 hover:border-slate-400 transition-all cursor-pointer"
      role="group"
      aria-label={`Ticket ${ticket.id} - ${ticket.subject}`}
    >
      {/* Title and Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-slate-900 leading-tight flex-1`}>
          {ticket.subject}
        </h3>
        <span className={`px-2 py-1 rounded-full ${isMobile ? 'text-[10px]' : 'text-xs'} font-medium whitespace-nowrap border ${statusColor}`}>
          {ticket.status}
        </span>
      </div>

      {/* Ticket ID, Replies, Time - Same Row */}
      <div className={`flex items-center gap-2 ${isMobile ? 'text-[10px]' : 'text-xs'} text-slate-600 mb-1`}>
        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
          {ticket.id}
        </span>
        <span className="text-slate-300">•</span>
        <span>{ticket.replies} {ticket.replies === 1 ? 'reply' : 'replies'}</span>
        <span className="text-slate-300">•</span>
        <span>{ticket.created}</span>
      </div>

      {/* Waiting Status */}
      <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} ${waitingStatus.color} font-medium`}>
        {waitingStatus.text}
      </div>
    </motion.div>
  );
}

/** ---------------- Main Component ---------------- */
export function SupportMockup() {
  const reduceMotion = useReducedMotion();
  const tickets = useMemo(() => mockTickets, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {/* Desktop View - Browser Frame */}
      <div className="hidden md:block w-full max-w-3xl border border-slate-400 rounded-xl">
        {/* Safari-style Browser Chrome */}
        <div className="bg-gradient-to-b from-slate-200 to-slate-100 rounded-t-xl px-4 py-2.5 border-b border-slate-300">
          <div className="flex items-center gap-3">
            {/* Safari traffic lights */}
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"></div>
              <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors"></div>
            </div>
            
            {/* URL Bar with SSL Shield */}
            <div className="flex-1 bg-white rounded-md px-3 py-1.5 flex items-center gap-2 shadow-inner">
              <ShieldCheckIcon className="w-4 h-4 text-green-600" />
              <span className="text-xs text-slate-600">chat.myhomeworkhelp.com/support</span>
            </div>
          </div>
        </div>

        {/* Browser Content */}
        <div className="bg-white rounded-b-xl border-x border-b border-slate-200 overflow-hidden">
          <div className="p-2.5">
            {/* Header */}
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Support Tickets</h2>
                <p className="text-[11px] text-slate-600">Get help from our team</p>
              </div>
              {/* Black Background Button */}
              <button
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-all"
                aria-disabled="true"
              >
                + New Ticket
              </button>
            </div>

            {/* Tickets List */}
            <div className="space-y-1.5">
              {tickets.map((ticket, index) => (
                <TicketCard key={ticket.id} ticket={ticket} index={index} />
              ))}
            </div>

            {/* Quick Stats */}
            <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-3 gap-3">
                <div className="text-center">
                    <div className="text-xl font-bold text-slate-900">1</div>
                    <div className="text-[10px] text-slate-600">Active</div>
                </div>
                <div className="text-center">
                    <div className="text-xl font-bold text-green-600">1</div>
                    <div className="text-[10px] text-slate-600">Resolved</div>
                </div>
                <div className="text-center">
                    <div className="text-xl font-bold text-slate-900">3</div>
                    <div className="text-[10px] text-slate-600">Total</div>
                </div>
                </div>
          </div>
        </div>
      </div>

      {/* Mobile View - Phone Frame */}
      <div className="md:hidden w-full max-w-[280px] mx-auto">
        {/* Phone Frame */}
        <div className="bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl">
          {/* Notch */}
          <div className="flex justify-center mb-2">
            <div className="w-20 h-5 bg-slate-900 rounded-b-2xl flex items-center justify-center gap-2">
              <div className="w-10 h-1 bg-slate-700 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
            </div>
          </div>

          {/* Screen */}
          <div className="bg-white rounded-[2rem] overflow-hidden">
            {/* Status Bar */}
            <div className="bg-slate-50 px-3 py-1.5 flex items-center justify-between text-[10px] font-medium">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  <div className="w-1 h-2 bg-slate-900 rounded-sm"></div>
                  <div className="w-1 h-2.5 bg-slate-900 rounded-sm"></div>
                  <div className="w-1 h-3 bg-slate-900 rounded-sm"></div>
                  <div className="w-1 h-3.5 bg-slate-900 rounded-sm"></div>
                </div>
              </div>
            </div>

            {/* App Content */}
            <div className="p-2 h-[360px] overflow-y-auto">
              {/* Header */}
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Support</h2>
                  <p className="text-xs text-slate-600">Your tickets</p>
                </div>
                <button
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium"
                  aria-disabled="true"
                >
                  + New
                </button>
              </div>

              {/* Tickets List */}
              <div className="space-y-2">
                {tickets.map((ticket, index) => (
                  <TicketCard key={ticket.id} ticket={ticket} index={index} isMobile />
                ))}
              </div>
            </div>

            {/* Bottom Nav Bar */}
            <div className="border-t border-slate-200 px-4 py-2 flex items-center justify-around bg-white">
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-5 h-5 bg-slate-300 rounded-lg"></div>
                <span className="text-[9px] text-slate-400">Orders</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-5 h-5 bg-slate-300 rounded-lg"></div>
                <span className="text-[9px] text-slate-400">Messages</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-5 h-5 bg-blue-600 rounded-lg"></div>
                <span className="text-[9px] text-blue-600 font-medium">Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}