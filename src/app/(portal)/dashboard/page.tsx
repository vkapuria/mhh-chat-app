'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { fetcher } from '@/lib/fetcher';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { DashboardSkeleton } from '@/components/loaders/DashboardSkeleton';
import {
  ShoppingBagIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface DashboardData {
  stats: {
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    pendingOrders: number;
    unreadMessages: number;
  };
  recentOrders: any[];
}

export default function DashboardPage() {
  const [userType, setUserType] = useState<'customer' | 'expert'>('customer');
  const [userId, setUserId] = useState('');

  // Get user type and userId on mount
  useEffect(() => {
    async function getUserInfo() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const type = session.user.user_metadata?.user_type || 'customer';
        setUserType(type);
        setUserId(session.user.id);
      }
    }
    getUserInfo();
  }, []);

  // ✨ SWR with USER-SPECIFIC caching
  const { data, error, isLoading } = useSWR<DashboardData>(
    userId ? ['/api/dashboard', userId] : null,
    ([url]) => fetcher(url),
    {
      refreshInterval: 60000, // 60s instead of 30s
      revalidateOnFocus: false, // Don't refetch on focus
      revalidateOnReconnect: false, // Don't refetch on reconnect
      dedupingInterval: 15000, // 15s dedup window
      revalidateOnMount: true, // Still fetch on first mount
      fallbackData: undefined,
    }
  );

  // Loading state with beautiful skeleton
  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Failed to load dashboard</p>
            <p className="text-red-600 text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back! 👋
          </h1>
          <p className="text-slate-600 mt-1">
            Here's what's happening with your {userType === 'customer' ? 'orders' : 'assignments'} today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Orders"
            value={data.stats.totalOrders}
            icon={<ShoppingBagIcon className="w-6 h-6" />}
            color="blue"
          />
          <StatsCard
            title="Active"
            value={data.stats.activeOrders}
            icon={<PencilIcon className="w-6 h-6" />}
            color="orange"
          />
          <StatsCard
            title="Completed"
            value={data.stats.completedOrders}
            icon={<CheckCircleIcon className="w-6 h-6" />}
            color="green"
          />
          <StatsCard
            title="Unread Messages"
            value={data.stats.unreadMessages}
            icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />}
            color="purple"
          />
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivity 
              orders={data.recentOrders} 
              userType={userType}
            />
          </div>
          <div>
            <QuickActions userType={userType} />
          </div>
        </div>
      </div>
    </div>
  );
}