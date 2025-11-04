'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { fetcher } from '@/lib/fetcher';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import {
  ShoppingBagIcon,
  CheckCircleIcon,
  ClockIcon,
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

  // Get userId first
  const [userId, setUserId] = useState('');

  // Get user ID on mount
  useEffect(() => {
    async function getUserInfo() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const type = session.user.user_metadata?.user_type || 'customer';
        setUserType(type);
        setUserId(session.user.id); // Add this line
      }
    }
    getUserInfo();
  }, []);

  // ✨ SWR with USER-SPECIFIC caching
  const { data, error, isLoading } = useSWR<DashboardData>(
    userId ? ['/api/dashboard', userId] : null, // Include userId in cache key
    ([url]) => fetcher(url), // Extract URL from array
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true, // Refresh when user returns to tab
      revalidateOnReconnect: true, // Refresh when internet reconnects
      dedupingInterval: 5000, // Prevent duplicate requests within 5s
      fallbackData: undefined, // No fallback, show loading state
    }
  );

  // Get user type on mount
  useEffect(() => {
    async function getUserType() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const type = session.user.user_metadata?.user_type || 'customer';
        setUserType(type);
      }
    }
    getUserType();
  }, []);

  // Loading state
  if (isLoading || !data) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
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