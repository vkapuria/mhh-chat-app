'use client';

import { formatDistanceToNow } from 'date-fns';

interface UserActivityRowProps {
  user_id: string;
  user_email: string;
  user_name: string;
  user_type: string;
  avatar_url?: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
  current_page?: string;
  session_start?: string;
}

export function UserActivityRow({
  user_name,
  user_type,
  avatar_url,
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

  const statusTextColors = {
    online: 'text-green-600',
    away: 'text-yellow-600',
    offline: 'text-slate-500',
  };

  const statusLabel = {
    online: 'Online now',
    away: 'Away (tab inactive)',
    offline: 'Offline',
  };

  const userTypeColors = {
    admin: 'bg-purple-100 text-purple-800',
    expert: 'bg-blue-100 text-blue-800',
    customer: 'bg-green-100 text-green-800',
  };

  const sessionDuration = session_start
    ? formatDistanceToNow(new Date(session_start), { addSuffix: false })
    : null;

  const lastSeenDistance = formatDistanceToNow(new Date(last_seen), {
    addSuffix: true,
  });

  // Format page path to readable text
  const formatPagePath = (path?: string) => {
    if (!path) return 'Unknown page';
    
    // Remove leading slash and split by /
    const segments = path.replace(/^\//, '').split('/');
    
    // Capitalize first letter of each segment
    const formatted = segments
      .map(seg => seg.charAt(0).toUpperCase() + seg.slice(1))
      .join(' › ');
    
    return `Browsing ${formatted || 'Home'} Page`;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 bg-white border border-slate-100 rounded-lg hover:border-slate-200 hover:shadow-md transition-all">
      {/* Left: avatar + user info */}
      <div className="flex items-center gap-4 flex-1">
        {/* Avatar with Status Indicator */}
        <div className="relative">
          {avatar_url ? (
            <img
              src={avatar_url}
              alt={user_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="text-slate-600 font-semibold text-sm">
                {user_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Status dot on avatar */}
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
              statusColors[status]
            }`}
          />
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-900 truncate max-w-xs">
              {user_name}
            </p>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                userTypeColors[user_type as keyof typeof userTypeColors]
              }`}
            >
              {user_type}
            </span>
          </div>
          <p
            className={`mt-1 text-xs flex items-center gap-1 ${statusTextColors[status]}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status === 'online'
                  ? 'bg-green-500'
                  : status === 'away'
                  ? 'bg-yellow-500'
                  : 'bg-slate-400'
              }`}
            />
            {statusLabel[status]}
          </p>
        </div>
      </div>

      {/* Right: activity details */}
      <div className="mt-3 sm:mt-0 text-left sm:text-right">
        {status === 'online' && current_page && (
          <p className="text-sm text-slate-700 mb-1">
            📍 {formatPagePath(current_page)}
          </p>
        )}
        <p className="text-xs text-slate-500">
          {status === 'online' ? (
            <>
              Session:{' '}
              <span className="font-medium">
                {sessionDuration || 'just started'}
              </span>
            </>
          ) : (
            <>
              Last seen:{' '}
              <span className="font-medium">{lastSeenDistance}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}