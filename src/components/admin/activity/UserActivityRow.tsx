'use client';

import { formatDistanceToNow } from 'date-fns';

interface UserActivityRowProps {
  user_id: string;
  user_email: string;
  user_name: string;
  user_type: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
  current_page?: string;
  session_start?: string;
}

export function UserActivityRow({
  user_email,
  user_name,
  user_type,
  status,
  last_seen,
  current_page,
  session_start,
}: UserActivityRowProps) {
  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-slate-300',
  };

  const userTypeColors = {
    admin: 'bg-purple-100 text-purple-800',
    expert: 'bg-blue-100 text-blue-800',
    customer: 'bg-green-100 text-green-800',
  };

  const sessionDuration = session_start
    ? formatDistanceToNow(new Date(session_start), { addSuffix: false })
    : null;

  return (
    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        {/* Status Indicator */}
        <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />

        {/* User Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-900">{user_name || user_email}</p>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                userTypeColors[user_type as keyof typeof userTypeColors]
              }`}
            >
              {user_type}
            </span>
          </div>
          <p className="text-sm text-slate-500">{user_email}</p>
        </div>
      </div>

      {/* Activity Details */}
      <div className="text-right">
        {status === 'online' && current_page && (
          <p className="text-sm text-slate-700 font-mono mb-1">📍 {current_page}</p>
        )}
        <p className="text-xs text-slate-500">
          {status === 'online' ? (
            <>
              ⏱️ {sessionDuration || 'Just now'}
            </>
          ) : (
            <>Last seen: {formatDistanceToNow(new Date(last_seen), { addSuffix: true })}</>
          )}
        </p>
      </div>
    </div>
  );
}