'use client';

import { useEffect, useState } from 'react';
import { ActivityStats } from '@/components/admin/activity/ActivityStats';
import { OnlineUsersCard } from '@/components/admin/activity/OnlineUsersCard';
import { RecentActivityCard } from '@/components/admin/activity/RecentActivityCard';
import { LoginTrendChart } from '@/components/admin/activity/LoginTrendChart';
import { TodaysLoginCard } from '@/components/admin/activity/TodaysLoginCard';
import { fetchAdminActivity } from '@/lib/admin-activity-client';
import { supabase } from '@/lib/supabase';

interface LoginRow {
  user_id: string;
  user_name: string;
  user_email: string;
  user_type: string;
  created_at: string;
}

interface TrendData {
  date: string;
  count: number;
}

export default function ActivityPage() {
  const [todayLoginsList, setTodayLoginsList] = useState<LoginRow[]>([]);
  const [last7daysLogins, setLast7daysLogins] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaningUp, setCleaningUp] = useState(false);

  useEffect(() => {
    fetchChartData();
    const interval = setInterval(fetchChartData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchChartData = async () => {
    try {
      const data = await fetchAdminActivity('stats');

      if (data && data.success) {
        setTodayLoginsList(data.stats.todayLoginsList || []);
        setLast7daysLogins(data.stats.last7daysLogins || []);
      } else if (data && !data.success) {
        console.error('Failed to fetch chart data:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('🗑️ Delete activity logs older than 7 days?\n\nThis action cannot be undone.')) {
      return;
    }

    setCleaningUp(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        alert('❌ Not authenticated');
        return;
      }

      const res = await fetch('/api/admin/activity/cleanup', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        window.location.reload();
      } else {
        alert('❌ Failed to cleanup logs');
      }
    } catch (error) {
      console.error(error);
      alert('❌ Error cleaning up logs');
    } finally {
      setCleaningUp(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">User Activity Monitor</h1>
          <p className="mt-1 text-sm md:text-base text-slate-600">
            Track online users, login activity, and page views in real-time
          </p>
        </div>
  
        {/* Cleanup Button */}
        <button
          onClick={handleCleanup}
          disabled={cleaningUp}
          className="px-3 py-2 md:px-4 bg-red-600 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
        >
          {cleaningUp ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-2 border-white border-t-transparent" />
              <span className="hidden sm:inline">Cleaning...</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            <>
              🧹 <span className="hidden sm:inline">Cleanup Old Logs</span>
              <span className="sm:hidden">Cleanup</span>
            </>
          )}
        </button>
      </div>
  
      <div className="space-y-4 md:space-y-6">
        {/* Online Users + Today's Logins */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <OnlineUsersCard />
          {!loading && <TodaysLoginCard list={todayLoginsList} />}
        </div>
  
        {/* Today's Insights */}
        <ActivityStats />
  
        {/* Login Trend Chart */}
        {!loading && last7daysLogins.length > 0 && (
          <LoginTrendChart data={last7daysLogins} />
        )}
  
        {/* Recent Activity */}
        <RecentActivityCard />
      </div>
    </div>
  );
}