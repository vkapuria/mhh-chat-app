'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { UsersIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

interface Stats {
  todayLogins: number;
  currentlyOnline: number;
}

export function ActivityStats() {
  const [stats, setStats] = useState<Stats>({ todayLogins: 0, currentlyOnline: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/activity?type=stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Currently Online */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Currently Online</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {loading ? '...' : stats.currentlyOnline}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <UsersIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-500">Live</span>
        </div>
      </Card>

      {/* Today's Logins */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Today's Logins</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {loading ? '...' : stats.todayLogins}
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <ArrowRightOnRectangleIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xs text-slate-500">Since midnight</span>
        </div>
      </Card>
    </div>
  );
}