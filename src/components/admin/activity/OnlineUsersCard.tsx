'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { UserActivityRow } from './UserActivityRow';

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
}

export function OnlineUsersCard() {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchOnlineUsers = async () => {
    try {
      const response = await fetch('/api/admin/activity?type=online');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch online users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">🟢 Online Now</h2>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
            {users.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-500">Live updates</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-500">Loading online users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-8">
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