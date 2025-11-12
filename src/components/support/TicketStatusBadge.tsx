interface TicketStatusBadgeProps {
  status: 'submitted' | 'in_progress' | 'resolved';
  lastReplyBy?: 'admin' | 'user' | null;
}

export function TicketStatusBadge({ status, lastReplyBy }: TicketStatusBadgeProps) {
  // If in_progress and user replied last, show "Awaiting Response"
  if (status === 'in_progress' && lastReplyBy === 'user') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[14px] font-medium bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200">
        Awaiting Response
      </span>
    );
  }

  // Regular status badges
  const badges = {
    submitted: (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[14px] font-medium bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200">
        Open
      </span>
    ),
    in_progress: (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[14px] font-medium bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border border-amber-200">
        In&nbsp;Progress
      </span>
    ),
    resolved: (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[14px] font-medium bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200">
        Resolved
      </span>
    ),
  };
  

  return badges[status];
}