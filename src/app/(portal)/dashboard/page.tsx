'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import {
  ShoppingBagIcon,
  CheckCircleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon // Add this
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<'customer' | 'expert'>('customer');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userTypeFromSession = session.user.user_metadata?.user_type || 'customer';
      setUserType(userTypeFromSession);

      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
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
            value={data?.stats.totalOrders || 0}
            icon={<ShoppingBagIcon className="w-6 h-6" />}
            color="blue"
          />
          <StatsCard
            title="Active"
            value={data?.stats.activeOrders || 0}
            icon={<PencilIcon className="w-6 h-6" />}
            color="orange"
          />
          <StatsCard
            title="Completed"
            value={data?.stats.completedOrders || 0}
            icon={<CheckCircleIcon className="w-6 h-6" />}
            color="green"
          />
          <StatsCard
            title="Unread Messages"
            value={data?.stats.unreadMessages || 0}
            icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />}
            color="purple"
          />
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivity 
              orders={data?.recentOrders || []} 
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