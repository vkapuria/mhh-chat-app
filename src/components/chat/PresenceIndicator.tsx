'use client';

import { PresenceState } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';

interface PresenceIndicatorProps {
  presence: PresenceState;
  userType: string;
}

export function PresenceIndicator({ presence, userType }: PresenceIndicatorProps) {
  const otherUserLabel = userType === 'customer' ? 'Expert' : 'Customer';

  return (
    <div className="flex items-center gap-2">
      {/* Status Dot */}
      <div className="relative">
        <div className={`w-2.5 h-2.5 rounded-full ${
          presence.otherUserOnline ? 'bg-green-500' : 'bg-slate-400'
        }`} />
        {presence.otherUserOnline && (
          <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
        )}
      </div>

      {/* Status Text */}
      <div className="text-sm">
        {presence.otherUserOnline ? (
          <span className="text-green-700 font-medium">{otherUserLabel} is online</span>
        ) : (
          <span className="text-slate-500">
            {otherUserLabel} {
              presence.otherUserLastSeen 
                ? `last seen ${formatDistanceToNow(new Date(presence.otherUserLastSeen), { addSuffix: true })}`
                : 'offline'
            }
          </span>
        )}
      </div>
    </div>
  );
}