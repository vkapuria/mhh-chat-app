'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { DashboardSkeleton } from '@/components/loaders/DashboardSkeleton';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { ChatActivityCard } from '@/components/dashboard/ChatActivityCard';
import { TicketActivityCard } from '@/components/dashboard/TicketActivityCard';
import { useAuthStore } from '@/store/auth-store';
import { useUnreadMessagesStore } from '@/store/unread-messages-store';
import { useUnreadTicketsStore } from '@/store/unread-tickets-store';
import {
  ShoppingBagIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { LifeBuoy } from 'lucide-react';

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
  // Get user from Zustand (no API call!)
  const { user } = useAuthStore();
  const userType = user?.user_type || 'customer';
  const userId = user?.id || '';
  const displayName = user?.display_name || user?.name || 'there';

  // Get real-time unread counts from Zustand
  const unreadOrders = useUnreadMessagesStore((state) => state.unreadOrders);
  const totalUnreadMessages = Object.values(unreadOrders).reduce(
    (sum, order) => sum + order.unreadCount,
    0
  );

  const unreadTickets = useUnreadTicketsStore((state) => state.unreadTickets);
  const totalUnreadTickets = Object.values(unreadTickets).reduce(
    (sum, ticket) => sum + ticket.unreadCount,
    0
  );

  // Fetch dashboard data (orders stats)
  const { data, error, isLoading } = useSWR<DashboardData>(
    userId ? ['/api/dashboard', userId] : null,
    ([url]) => fetcher(url),
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 15000,
      revalidateOnMount: true,
    }
  );

  // Fetch conversations for ChatActivityCard
  const { data: conversationsData } = useSWR(
    userId ? '/api/conversations' : null,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
    }
  );

  // Fetch support tickets for TicketActivityCard
  const { data: ticketsResponse } = useSWR(
    userId ? '/api/support/tickets' : null,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
    }
  );

  // Loading state
  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-3 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Failed to load dashboard</p>
            <p className="text-red-600 text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const conversations = conversationsData?.conversations || [];
  const tickets = ticketsResponse?.tickets || [];

  // Calculate trends
  const activeOrdersTrend = data.stats.activeOrders > 0 ? {
    value: data.stats.activeOrders,
    label: 'active',
    direction: 'neutral' as const,
  } : undefined;

  return (
    <div className="p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        
        {/* Welcome Card - Unified Summary */}
        <WelcomeCard 
          displayName={displayName}
          userType={userType === 'admin' ? 'expert' : userType}
          activeOrders={data.stats.activeOrders}
        />

        {/* Stats Cards - Clean & Information-Dense */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          
          {/* Messages Card - Real-time from Zustand */}
          <StatsCard
            title="Messages"
            value={totalUnreadMessages}
            icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
            link="/messages"
            badge={totalUnreadMessages}
            subtitle={totalUnreadMessages > 0 ? `${totalUnreadMessages} unread conversation${totalUnreadMessages > 1 ? 's' : ''}` : 'All caught up!'}
            trend={totalUnreadMessages > 0 ? {
              value: totalUnreadMessages,
              label: 'unread',
              direction: 'up',
            } : undefined}
          />

          {/* Support Tickets - Real-time from Zustand */}
          <StatsCard
            title="Support"
            value={totalUnreadTickets}
            icon={<LifeBuoy className="w-5 h-5" />}
            link="/support"
            badge={totalUnreadTickets}
            subtitle={totalUnreadTickets > 0 ? `${totalUnreadTickets} ticket${totalUnreadTickets > 1 ? 's' : ''} need${totalUnreadTickets === 1 ? 's' : ''} reply` : 'No pending tickets'}
            trend={totalUnreadTickets > 0 ? {
              value: totalUnreadTickets,
              label: 'pending',
              direction: 'up',
            } : undefined}
          />

          {/* Active Orders/Tasks */}
          <StatsCard
            title={userType === 'customer' ? 'Active Orders' : 'Active Tasks'}
            value={data.stats.activeOrders}
            icon={<ClockIcon className="w-5 h-5" />}
            link="/orders"
            badge={data.stats.activeOrders}
            subtitle={data.stats.activeOrders > 0 ? `${data.stats.activeOrders} in progress` : 'No active orders'}
            trend={activeOrdersTrend}
          />

          {/* Completed */}
          <StatsCard
            title="Completed"
            value={data.stats.completedOrders}
            icon={<CheckCircleIcon className="w-5 h-5" />}
            link="/orders"
            subtitle={`${data.stats.totalOrders} total order${data.stats.totalOrders > 1 ? 's' : ''}`}
            trend={data.stats.completedOrders > 0 ? {
              value: data.stats.completedOrders,
              label: 'done',
              direction: 'neutral',
            } : undefined}
          />
        </div>

        {/* Activity Cards - Real-time Updates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <ChatActivityCard 
            conversations={conversations}
            userType={userType === 'admin' ? 'expert' : userType}
          />
          <TicketActivityCard tickets={tickets} />
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2">
            <RecentActivity 
              orders={data.recentOrders} 
              userType={userType === 'admin' ? 'expert' : userType}
            />
          </div>
          <div>
            <QuickActions userType={userType === 'admin' ? 'expert' : userType} />
          </div>
        </div>
      </div>
    </div>
  );
}