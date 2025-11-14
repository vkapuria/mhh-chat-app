'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { fetchAdminActivity } from '@/lib/admin-activity-client';

function getInitial(user: any): string {
  const name = user.name || user.user_name || user.user_email || '?';
  return name.charAt(0).toUpperCase();
}

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

type ActivityFilter = 'all' | 'login' | 'page_view' | 'heartbeat' | 'logout';

export function RecentActivityCard() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [timeRange, setTimeRange] = useState<'24h' | 'today' | 'yesterday' | '7d'>('24h');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 25;
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // Fetch when filter, page, search, or time range changes
  useEffect(() => {
    fetchRecentActivity();
  }, [filter, page, debouncedSearch, timeRange]);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);

      // Calculate date range based on timeRange filter
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'today':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'yesterday':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case '7d':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
      }

      const params: Record<string, string | number | undefined> = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        start_date: startDate.toISOString(),
      };

      // For "yesterday", we need both start and end date
      if (timeRange === 'yesterday') {
        const endDate = new Date(now);
        endDate.setHours(0, 0, 0, 0);
        params.end_date = endDate.toISOString();
      }

      if (filter !== 'all') {
        params.action = filter;
      }

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const data = await fetchAdminActivity('recent', params);

      if (data && data.success) {
        setActivities(data.activity);
        setTotal(data.total ?? 0);
      } else if (data && !data.success) {
        console.error('Failed to fetch recent activity:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const formatPagePath = (path?: string) => {
    if (!path) return '';
    const segments = path.replace(/^\//, '').split('/');
    const formatted = segments
      .map(seg => seg.charAt(0).toUpperCase() + seg.slice(1))
      .join(' › ');
    return formatted || 'Home';
  };

  const getActivityDescription = (activity: Activity) => {
    const userName = activity.user_name || activity.user_email;
    
    switch (activity.action) {
      case 'login':
        return { text: 'logged in to the app', color: 'text-green-600' };
      case 'logout':
        return { text: 'logged out from the app', color: 'text-red-600' };
      case 'page_view':
        return { 
          text: `visited ${formatPagePath(activity.page_path)}`, 
          color: 'text-blue-600' 
        };
      case 'heartbeat':
        return { 
          text: activity.page_path ? `on ${formatPagePath(activity.page_path)}` : 'sent heartbeat', 
          color: 'text-slate-500' 
        };
      default:
        return { text: activity.action, color: 'text-slate-600' };
    }
  };

  // Group activities by user for mobile view
  const groupedActivities = activities.reduce((acc, activity) => {
    const key = activity.user_id;
    if (!acc[key]) {
      acc[key] = {
        user: {
          id: activity.user_id,
          name: activity.user_name || activity.user_email,
          email: activity.user_email,
          type: activity.user_type,
        },
        activities: [],
      };
    }
    acc[key].activities.push(activity);
    return acc;
  }, {} as Record<string, { user: any; activities: Activity[] }>);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = total === 0 ? 0 : Math.min(page * pageSize, total);

  const userTypeColors = {
    admin: 'bg-purple-100 text-purple-800',
    expert: 'bg-blue-100 text-blue-800',
    customer: 'bg-green-100 text-green-800',
  };

  return (
    <Card className="p-4 md:p-8 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
  {/* Header */}
  <div className="flex flex-col gap-3 md:gap-4 mb-6 md:mb-8">
    <h2 className="text-xl md:text-2xl font-bold text-slate-900">🔵 Recent Activity</h2>

    {/* Filters */}
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Time Range Dropdown */}
<div className="flex items-center gap-2">
  <span className="text-sm font-medium text-slate-500">Time:</span>
  <select
    value={timeRange}
    onChange={(e) => {
      setTimeRange(e.target.value as '24h' | 'today' | 'yesterday' | '7d');
      setPage(1);
    }}
    className="min-w-[140px] text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm cursor-pointer"
  >
    <option value="24h">Last 24 hours</option>
    <option value="today">Today</option>
    <option value="yesterday">Yesterday</option>
    <option value="7d">Last 7 days</option>
  </select>
</div>

          {/* Action Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-slate-500">Type:</span>
            {(['all', 'login', 'page_view', 'heartbeat', 'logout'] as ActivityFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all shadow-sm ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'all' ? 'All' : f === 'page_view' ? 'Page Views' : f === 'heartbeat' ? '💓 Heartbeats' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="w-full lg:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-slate-500">Loading activity...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-slate-500">No recent activity found</p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Ago
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Exact Time (IST)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {activities.map((activity) => {
                  const activityDate = new Date(activity.created_at);
                  const istTime = activityDate.toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    day: '2-digit',
                    month: 'short',
                  });

                  const description = getActivityDescription(activity);

                  return (
                    <tr key={activity.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getActionIcon(activity.action)}</span>
                          <div>
                            <span className="font-semibold text-slate-900">
                              {activity.user_name || activity.user_email}
                            </span>
                            <span className={`ml-1 ${description.color}`}>
                              {description.text}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {formatDistanceToNow(activityDate, { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap font-mono">
                        {istTime} IST
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD VIEW */}
          <div className="md:hidden space-y-4">
            {Object.values(groupedActivities)
              // Sort by most recent activity first
              .sort((a, b) => {
                const aLatest = new Date(a.activities[0].created_at).getTime();
                const bLatest = new Date(b.activities[0].created_at).getTime();
                return bLatest - aLatest;
              })
              .map(({ user, activities: userActivities }) => {
                const isExpanded = expandedUsers[user.id];
                const displayedActivities = isExpanded ? userActivities : userActivities.slice(0, 3);
                const hasMore = userActivities.length > 3;

                return (
                  <div 
                    key={user.id} 
                    className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* User Header */}
                    <div className="bg-gradient-to-r from-slate-50 to-white p-4 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center ring-2 ring-slate-100">
                        <span className="text-slate-700 font-bold text-sm">
                          {getInitial(user)}
                        </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                          <p className="text-xs text-slate-500">
                            {userActivities.length} {userActivities.length === 1 ? 'activity' : 'activities'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${
                        userTypeColors[user.type as keyof typeof userTypeColors]
                      }`}>
                        {user.type}
                      </span>
                    </div>

                    {/* Activities List - Show top 3 or all if expanded */}
                    <div className="divide-y divide-slate-100">
                      {displayedActivities.map((activity) => {
                        const activityDate = new Date(activity.created_at);
                        const istTime = activityDate.toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                          day: '2-digit',
                          month: 'short',
                        });
                        const description = getActivityDescription(activity);

                        return (
                          <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start gap-3">
                              <span className="text-lg mt-0.5 shrink-0">{getActionIcon(activity.action)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm">
                                  <span className={`font-medium ${description.color}`}>
                                    {description.text}
                                  </span>
                                </p>
                                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 flex-wrap">
                                  <span>{formatDistanceToNow(activityDate, { addSuffix: true })}</span>
                                  <span>•</span>
                                  <span className="font-mono">{istTime} IST</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Show More/Less Button */}
                    {hasMore && (
                      <button
                        onClick={() => setExpandedUsers(prev => ({
                          ...prev,
                          [user.id]: !prev[user.id]
                        }))}
                        className="w-full p-3 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 border-t border-slate-200 text-sm font-semibold text-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        {isExpanded ? (
                          <>
                            <span>Show less</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span>Show {userActivities.length - 3} more</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Pagination */}
          <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-slate-500">
            <p>
              Showing <span className="font-semibold text-slate-700">{showingFrom}</span>–
              <span className="font-semibold text-slate-700">{showingTo}</span> of{' '}
              <span className="font-semibold text-slate-700">{total}</span> events
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  page === 1
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-sm'
                }`}
              >
                Previous
              </button>
              <span className="text-sm">
                Page <span className="font-semibold text-slate-700">{page}</span> of{' '}
                <span className="font-semibold text-slate-700">{totalPages}</span>
              </span>
              <button
                onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                disabled={page >= totalPages}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  page >= totalPages
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-sm'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}