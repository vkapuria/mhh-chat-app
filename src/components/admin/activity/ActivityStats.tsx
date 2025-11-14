'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { fetchAdminActivity } from '@/lib/admin-activity-client';

interface Stats {
  currentlyOnline: number;
  todayLogins: number;
  mostVisitedPage?: {
    page_path: string;
    count: number;
  } | null;
  avgSessionDurationSeconds?: number | null;
}

export function ActivityStats() {
  const [stats, setStats] = useState<Stats>({
    currentlyOnline: 0,
    todayLogins: 0,
    mostVisitedPage: null,
    avgSessionDurationSeconds: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const data = await fetchAdminActivity('stats');

      if (data && data.success) {
        setStats({
          currentlyOnline: data.stats.currentlyOnline || 0,
          todayLogins: data.stats.todayLogins || 0,
          mostVisitedPage: data.stats.mostVisitedPage || null,
          avgSessionDurationSeconds: data.stats.avgSessionDurationSeconds || null,
        });
      } else if (data && !data.success) {
        console.error('Failed to fetch stats:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAvgSession = (seconds?: number | null) => {
    if (!seconds || seconds <= 0) return '—';
    const minutes = Math.round(seconds / 60);
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    if (remMin === 0) return `${hours}h`;
    return `${hours}h ${remMin}m`;
  };

  const formatPagePath = (path: string) => {
    // Remove leading slash and format nicely
    const cleanPath = path.replace(/^\//, '');
    if (!cleanPath) return 'Home';
    
    // Split by / and capitalize each segment
    const segments = cleanPath.split('/').map(seg => 
      seg.charAt(0).toUpperCase() + seg.slice(1)
    );
    
    return segments.join(' › ');
  };

  const mostVisitedLabel = (() => {
    if (!stats.mostVisitedPage) return '—';
    return `${formatPagePath(stats.mostVisitedPage.page_path)} (${stats.mostVisitedPage.count} views)`;
  })();

  return (
    <Card className="p-4 md:p-8 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
      <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">📊 Today&apos;s Insights</h2>
  
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-100">
          <p className="text-xs md:text-sm font-medium text-slate-500 mb-1 md:mb-2">Most visited page</p>
          <p className="text-base md:text-xl font-bold text-slate-900">
            {loading ? '...' : mostVisitedLabel}
          </p>
        </div>
        <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-100">
          <p className="text-xs md:text-sm font-medium text-slate-500 mb-1 md:mb-2">Average session duration</p>
          <p className="text-base md:text-xl font-bold text-slate-900">
            {loading ? '...' : formatAvgSession(stats.avgSessionDurationSeconds)}
          </p>
        </div>
      </div>
    </Card>
  );
}