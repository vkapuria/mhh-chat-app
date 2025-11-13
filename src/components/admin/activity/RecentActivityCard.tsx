'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface Activity {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_type: string;
  action: string;
  page_path?: string;
  created_at: string;
}

export function RecentActivityCard() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'login' | 'page_view'>('all');

  useEffect(() => {
    fetchRecentActivity();
    const interval = setInterval(fetchRecentActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session found');
        return;
      }

      const response = await fetch('/api/admin/activity?type=recent', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setActivities(data.activity);
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter((activity) => {
    if (filter === 'all') return true;
    return activity.action === filter;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login': return '🔓';
      case 'logout': return '🔒';
      case 'page_view': return '📄';
      case 'heartbeat': return '💓';
      default: return '📊';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login': return 'text-green-600';
      case 'logout': return 'text-red-600';
      case 'page_view': return 'text-blue-600';
      case 'heartbeat': return 'text-slate-400';
      default: return 'text-slate-600';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">🔵 Recent Activity</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('login')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === 'login'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Logins
          </button>
          <button
            onClick={() => setFilter('page_view')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === 'page_view'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Page Views
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-500">Loading activity...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{getActionIcon(activity.action)}</span>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {activity.user_name || activity.user_email}
                    <span className={`ml-2 font-normal ${getActionColor(activity.action)}`}>
                      {activity.action}
                    </span>
                  </p>
                  {activity.page_path && (
                    <p className="text-xs text-slate-500 font-mono">{activity.page_path}</p>
                  )}
                </div>
              </div>
              <span className="text-xs text-slate-400">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}