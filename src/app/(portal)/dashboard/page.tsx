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

// Lottie animations
import targetAnimation from '@/../public/icons/target.json';  // Completed
import taskAnimation   from '@/../public/icons/task.json';    // Active orders/tasks
import ticketAnimation from '@/../public/icons/ticket.json';  // Support
import chatAnimation   from '@/../public/icons/chat.json';    // Messages

const ACCENTS = {
  messages: '#3b82f6',  // blue
  support:  '#ef4444',  // red
  active:   '#f59e0b',  // amber
  completed:'#10b981',  // green
};

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
  // Auth / user
  const { user } = useAuthStore();
  const userType = user?.user_type || 'customer';
  const userId = user?.id || '';
  const displayName = user?.display_name || user?.name || 'there';

  // Unread counts (Zustand)
  const unreadOrders = useUnreadMessagesStore((s) => s.unreadOrders);
  const totalUnreadMessages = Object.values(unreadOrders).reduce(
    (sum, o) => sum + o.unreadCount,
    0
  );

  const unreadTickets = useUnreadTicketsStore((s) => s.unreadTickets);
  const totalUnreadTickets = Object.values(unreadTickets).reduce(
    (sum, t) => sum + t.unreadCount,
    0
  );

  // Stats
  const { data, error, isLoading } = useSWR<DashboardData>(
    userId ? ['/api/dashboard', userId] : null,
    ([url]) => fetcher(url),
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 15_000,
      revalidateOnMount: true,
    }
  );

  // Conversations / Tickets
  const { data: conversationsData } = useSWR(
    userId ? '/api/conversations' : null,
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: false }
  );

  const { data: ticketsResponse } = useSWR(
    userId ? '/api/support/tickets' : null,
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: false }
  );

  if (isLoading || !data) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="p-3 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Failed to load dashboard</p>
            <p className="text-red-600 text-sm mt-1">{(error as any)?.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const conversations = conversationsData?.conversations || [];
  const tickets = ticketsResponse?.tickets || [];

  return (
    <div className="p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Welcome */}
        <WelcomeCard
          displayName={displayName}
          userType={userType === 'admin' ? 'expert' : userType}
          activeOrders={data.stats.activeOrders}
        />

        {/* Desktop/Tablet: 4 cards */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatsCard
            title="Messages"
            value={totalUnreadMessages}
            lottieAnimation={chatAnimation}
            link="/messages"
            badge={totalUnreadMessages}
            subtitle={
              totalUnreadMessages > 0
                ? `${totalUnreadMessages} unread conversation${totalUnreadMessages > 1 ? 's' : ''}`
                : 'All caught up!'
            }
            accentColor={ACCENTS.messages}
          />

          <StatsCard
            title="Support"
            value={totalUnreadTickets}
            lottieAnimation={ticketAnimation}
            link="/support"
            badge={totalUnreadTickets}
            subtitle={
              totalUnreadTickets > 0
                ? `${totalUnreadTickets} ticket${totalUnreadTickets > 1 ? 's' : ''} need${totalUnreadTickets === 1 ? 's' : ''} reply`
                : 'No pending tickets'
            }
            accentColor={ACCENTS.support}
          />

          <StatsCard
            title={userType === 'customer' ? 'Active Orders' : 'Active Tasks'}
            value={data.stats.activeOrders}
            lottieAnimation={taskAnimation}
            link="/orders"
            badge={data.stats.activeOrders}
            subtitle={
              data.stats.activeOrders > 0
                ? `${data.stats.activeOrders} in progress`
                : 'No active orders'
            }
            accentColor={ACCENTS.active}
          />

          <StatsCard
            title="Completed"
            value={data.stats.completedOrders}
            lottieAnimation={targetAnimation}
            link="/orders"
            subtitle={`${data.stats.totalOrders} total order${data.stats.totalOrders > 1 ? 's' : ''}`}
            accentColor={ACCENTS.completed}
          />
        </div>

        {/* Mobile: 2 combined cards (Lottie above, stat below, with divider) */}
        <div className="grid sm:hidden grid-cols-1 gap-3">
          {/* Card 1: Messages + Support */}
          <StatsCard
            title="Messages"
            value={totalUnreadMessages}
            lottieAnimation={chatAnimation}
            link="/messages"
            badge={totalUnreadMessages}
            subtitle={
              totalUnreadMessages > 0
                ? `${totalUnreadMessages} unread conversation${totalUnreadMessages > 1 ? 's' : ''}`
                : 'All caught up!'
            }
            accentColor={ACCENTS.messages}
            secondaryTitle="Support"
            secondaryValue={totalUnreadTickets}
            secondarySubtitle={
              totalUnreadTickets > 0
                ? `${totalUnreadTickets} need${totalUnreadTickets === 1 ? 's' : ''} reply`
                : 'No pending tickets'
            }
            secondaryLottieAnimation={ticketAnimation}
          />

          {/* Card 2: Active + Completed */}
          <StatsCard
            title={userType === 'customer' ? 'Active Orders' : 'Active Tasks'}
            value={data.stats.activeOrders}
            lottieAnimation={taskAnimation}
            link="/orders"
            badge={data.stats.activeOrders}
            subtitle={
              data.stats.activeOrders > 0
                ? `${data.stats.activeOrders} in progress`
                : 'No active orders'
            }
            accentColor={ACCENTS.active}
            secondaryTitle="Completed"
            secondaryValue={data.stats.completedOrders}
            secondarySubtitle={`${data.stats.totalOrders} total`}
            secondaryLottieAnimation={targetAnimation}
          />
        </div>

        {/* Activity */}
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
