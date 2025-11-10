'use client';

import { useMemo } from 'react';
import { MonthlyOrderGroup } from './MonthlyOrderGroup';
import { format, parseISO } from 'date-fns';

interface OrdersGroupedViewProps {
  orders: any[];
  userType: 'customer' | 'expert';
  unreadCounts?: Record<string, number>;
}

export function OrdersGroupedView({
  orders,
  userType,
  unreadCounts = {},
}: OrdersGroupedViewProps) {
  // Group orders by month
  const groupedOrders = useMemo(() => {
    const groups: Record<string, any[]> = {};

    orders.forEach((order) => {
      const date = parseISO(order.created_at);
      const monthKey = format(date, 'MMMM yyyy'); // "November 2025"

      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(order);
    });

    // Sort months in descending order (newest first)
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB.getTime() - dateA.getTime();
    });

    return sortedKeys.map((monthKey) => ({
      month: monthKey,
      orders: groups[monthKey],
    }));
  }, [orders]);

  // Determine which months should be expanded by default
  const currentMonth = format(new Date(), 'MMMM yyyy');

  const shouldExpand = (month: string, orders: any[]) => {
    // Always expand current month
    if (month === currentMonth) return true;

    // Expand if it has active orders
    const hasActive = orders.some(o =>
      ['Assigned', 'Pending', 'Revision'].includes(o.status)
    );
    return hasActive;
  };

  if (groupedOrders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-500">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedOrders.map(({ month, orders }) => (
        <MonthlyOrderGroup
          key={month}
          month={month}
          orders={orders}
          userType={userType}
          defaultExpanded={shouldExpand(month, orders)}
          unreadCounts={unreadCounts}
        />
      ))}
    </div>
  );
}