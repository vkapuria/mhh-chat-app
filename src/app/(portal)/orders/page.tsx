'use client';

import { useEffect, useState, useMemo } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { fetcher } from '@/lib/fetcher';
import { OrderFilters } from '@/components/orders/OrderFilters';
import { OrderSearch } from '@/components/orders/OrderSearch';
import { OrdersSkeleton } from '@/components/loaders/OrdersSkeleton';
import { OrdersGroupedView } from '@/components/orders/OrdersGroupedView';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface Order {
  id: string;
  title: string;
  task_code: string;
  status: string;
  amount: number;
  deadline?: string;
  customer_name?: string;
  customer_email?: string;
  expert_name?: string;
  expert_id?: string;
  created_at: string;
  updated_at: string;
  rating?: any;
}

interface OrdersResponse {
  success: boolean;
  orders: Order[];
}

export default function OrdersPage() {
  const [userType, setUserType] = useState<'customer' | 'expert'>('customer');
  const [userId, setUserId] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // ✨ SWR for orders with USER-SPECIFIC caching
  const { data, error, isLoading } = useSWR<OrdersResponse>(
    userId ? ['/api/orders', userId] : null,
    ([url]) => fetcher(url),
    {
      refreshInterval: 60000, // 60s
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 15000,
      revalidateOnMount: true,
    }
  );

  const orders = data?.orders || [];

  // Get user type AND userId on mount
  useEffect(() => {
    async function getUserInfo() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const type = session.user.user_metadata?.user_type || 'customer';
        setUserType(type);
        setUserId(session.user.id);
      }
    }
    getUserInfo();
  }, []);

  // Fetch unread counts (separate from orders API)
  useEffect(() => {
    fetchUnreadCounts();

    // Refresh unread counts every 15 seconds
    const interval = setInterval(fetchUnreadCounts, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchUnreadCounts() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: messages } = await supabase
        .from('chat_messages')
        .select('order_id')
        .eq('is_read', false)
        .neq('sender_id', user.id);

      if (messages) {
        const counts: Record<string, number> = {};
        messages.forEach((msg) => {
          counts[msg.order_id] = (counts[msg.order_id] || 0) + 1;
        });
        setUnreadCounts(counts);
      }
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  }

  // ✨ Memoized filtering
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Apply status filter
    if (activeFilter === 'pending') {
      filtered = filtered.filter((o) => o.status === 'Pending');
    } else if (activeFilter === 'active') {
      filtered = filtered.filter(
        (o) => o.status === 'Assigned' || o.status === 'Revision'
      );
    } else if (activeFilter === 'completed') {
      filtered = filtered.filter((o) => o.status === 'Completed');
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.id.toLowerCase().includes(query) ||
          o.title.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [orders, activeFilter, searchQuery]);

  // ✨ Memoized counts
  const counts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((o) => o.status === 'Pending').length,
      active: orders.filter(
        (o) => o.status === 'Assigned' || o.status === 'Revision'
      ).length,
      completed: orders.filter((o) => o.status === 'Completed').length,
    }),
    [orders]
  );

  // Loading state with skeleton
  if (isLoading || !data) {
    return <OrdersSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-800 font-medium">Failed to load orders</p>
            <p className="text-red-600 text-sm mt-1">{(error as any).message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">
            {userType === 'customer' ? 'My Orders' : 'My Assignments'}
          </h1>
          <p className="text-slate-600">
            {userType === 'customer'
              ? 'Track and manage your homework orders in one place.'
              : 'Review and work on your assigned tasks.'}
          </p>
        </div>

        {/* Search & Filters toolbar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-md">
            <OrderSearch value={searchQuery} onChange={setSearchQuery} />
          </div>
          <OrderFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={counts}
          />
        </div>

        {/* Orders Grouped by Month */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="rounded-full bg-slate-100 p-3">
                <ClipboardDocumentListIcon className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-800">
                {searchQuery
                  ? 'No orders match your search.'
                  : activeFilter === 'all'
                  ? 'You don’t have any orders yet.'
                  : `No ${activeFilter} orders to show.`}
              </p>
              <p className="text-xs text-slate-500 max-w-sm">
                {searchQuery
                  ? 'Try a different keyword or clear the search to see all your orders.'
                  : userType === 'customer'
                  ? 'Place a new order to see it appear here and track it in real time.'
                  : 'New assignments will appear here as soon as they are allocated to you.'}
              </p>
            </div>
          </div>
        ) : (
          <OrdersGroupedView
            orders={filteredOrders}
            userType={userType}
            unreadCounts={unreadCounts}
          />
        )}
      </div>
    </div>
  );
}
