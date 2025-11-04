'use client';

import { useEffect, useState, useMemo } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { fetcher } from '@/lib/fetcher';
import { OrderCard } from '@/components/orders/OrderCard';
import { OrderFilters } from '@/components/orders/OrderFilters';
import { OrderSearch } from '@/components/orders/OrderSearch';

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
    refreshInterval: 60000, // 60s instead of 30s
    revalidateOnFocus: false, // Don't refetch when returning to tab
    revalidateOnReconnect: false, // Don't refetch on reconnect
    dedupingInterval: 15000, // 15s dedup window (up from 5s)
    revalidateOnMount: true, // Still fetch on first mount
  }
);

  const orders = data?.orders || [];

  // Get user type AND userId on mount
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

  // Fetch unread counts (separate from orders API)
  useEffect(() => {
    fetchUnreadCounts();
    
    // Refresh unread counts every 15 seconds
    const interval = setInterval(fetchUnreadCounts, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchUnreadCounts() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
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

  // ✨ Memoized filtering (only re-compute when dependencies change)
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Apply status filter
    if (activeFilter === 'pending') {
      filtered = filtered.filter(o => o.status === 'Pending');
    } else if (activeFilter === 'active') {
      filtered = filtered.filter(o => o.status === 'Assigned' || o.status === 'In Progress');
    } else if (activeFilter === 'completed') {
      filtered = filtered.filter(o => o.status === 'Completed');
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        o => o.id.toLowerCase().includes(query) || o.title.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [orders, activeFilter, searchQuery]);

  // ✨ Memoized counts
  const counts = useMemo(() => ({
    all: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    active: orders.filter(o => o.status === 'Assigned' || o.status === 'In Progress').length,
    completed: orders.filter(o => o.status === 'Completed').length,
  }), [orders]);

  // Loading state
  if (isLoading || !data) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-12 bg-slate-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-200 rounded"></div>
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
            <p className="text-red-800 font-medium">Failed to load orders</p>
            <p className="text-red-600 text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {userType === 'customer' ? 'My Orders' : 'My Assignments'}
          </h1>
          <p className="text-slate-600 mt-1">
            {userType === 'customer' 
              ? 'Track and manage your homework orders'
              : 'View and work on your assigned tasks'}
          </p>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4">
          <OrderSearch value={searchQuery} onChange={setSearchQuery} />
          <OrderFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={counts}
          />
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-500">
              {searchQuery
                ? 'No orders found matching your search'
                : activeFilter === 'all'
                ? 'No orders yet'
                : `No ${activeFilter} orders`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                userType={userType}
                unreadCount={unreadCounts[order.id] || 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}