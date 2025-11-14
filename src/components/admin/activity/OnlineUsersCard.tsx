'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { UserActivityRow } from './UserActivityRow';
import { fetchAdminActivity } from '@/lib/admin-activity-client';

interface OnlineUser {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_type: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
  current_page?: string;
  session_start?: string;
  avatar_url?: string;
}

export function OnlineUsersCard() {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOnlineUsers = async () => {
    try {
      const data = await fetchAdminActivity('online');
  
      if (data && data.success) {
        // Filter out admin users
        const nonAdminUsers = data.users.filter((u: OnlineUser) => u.user_type !== 'admin');
        setUsers(nonAdminUsers);
      } else if (data && !data.success) {
        console.error('Failed to fetch online users:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch online users:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalOnline = users.length;
  const expertCount = users.filter((u) => u.user_type === 'expert').length;
  const customerCount = users.filter((u) => u.user_type === 'customer').length;

  return (
    <Card className="p-4 md:p-8 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-8">
      <div>
        <div className="flex items-center gap-2 md:gap-3">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">🟢 Online Now</h2>
          <span className="px-2 md:px-3 py-1 md:py-1.5 bg-green-100 text-green-800 text-xs md:text-sm font-bold rounded-full shadow-sm">
            {totalOnline}
          </span>
        </div>
        <p className="mt-1 md:mt-2 text-xs md:text-sm text-slate-500">
            {totalOnline === 0 && 'No active users right now'}
            {totalOnline > 0 && (
              <>
                {expertCount > 0 && <span>Experts: {expertCount}</span>}
                {expertCount > 0 && customerCount > 0 && (
                  <span className="mx-1.5">·</span>
                )}
                {customerCount > 0 && <span>Customers: {customerCount}</span>}
              </>
            )}
          </p>
        </div>
  
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-sm" />
          <span className="text-xs font-medium text-slate-500">Live updates</span>
        </div>
      </div>
  
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-slate-500">Loading online users...</p>
        </div>
      ) : totalOnline === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-slate-500">No users online right now</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <UserActivityRow key={user.user_id} {...user} />
          ))}
        </div>
      )}
    </Card>
  );
}