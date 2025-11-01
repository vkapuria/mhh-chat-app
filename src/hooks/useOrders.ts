'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Order, OrderWithUnread, OrderGroup } from '@/types/order';
import { User } from '@/types/user';

export function useOrders(user: User | null) {
  const [orders, setOrders] = useState<OrderWithUnread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    fetchOrders();

    // Subscribe to order changes
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchOrders(); // Refresh when orders change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('orders')
        .select(`
          *,
          experts:expert_id (name, email)
        `)
        .order('created_at', { ascending: false });

      // Filter based on user type
      if (user.user_type === 'customer') {
        query = query.eq('customer_email', user.email);
      } else if (user.user_type === 'expert') {
        query = query
          .eq('expert_id', user.expert_id)
          .neq('status', 'Pending'); // Experts don't see pending orders
      }

      const { data: ordersData, error: ordersError } = await query;

      if (ordersError) throw ordersError;

      // Fetch unread counts for each order
      const ordersWithUnread = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('order_id', order.id)
            .eq('is_read', false)
            .neq('sender_type', user.user_type); // Don't count own messages

          // Get last message preview
          const { data: lastMessages } = await supabase
            .from('chat_messages')
            .select('message_content, created_at')
            .eq('order_id', order.id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          const lastMessage = lastMessages?.[0];

          return {
            ...order,
            expert_name: order.experts?.name,
            expert_email: order.experts?.email,
            unread_count: count || 0,
            last_message_at: lastMessage?.created_at,
            last_message_preview: lastMessage?.message_content,
          };
        })
      );

      setOrders(ordersWithUnread);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Group orders by status
  const groupedOrders: OrderGroup[] = [
    {
      label: 'Pending Assignment',
      orders: orders.filter((o) => o.status === 'Pending'),
      count: orders.filter((o) => o.status === 'Pending').length,
    },
    {
      label: 'Active Orders',
      orders: orders.filter((o) =>
        ['Assigned', 'Revision'].includes(o.status)
      ),
      count: orders.filter((o) =>
        ['Assigned', 'Revision'].includes(o.status)
      ).length,
    },
    {
      label: 'Completed',
      orders: orders.filter((o) => o.status === 'Completed'),
      count: orders.filter((o) => o.status === 'Completed').length,
    },
  ];

  return {
    orders,
    groupedOrders,
    loading,
    error,
    refetch: fetchOrders,
  };
}