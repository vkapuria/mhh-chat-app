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

  const shouldExpand = (month: string, ordersForMonth: any[]) => {
    // Always expand current month
    if (month === currentMonth) return true;

    // Expand if it has active orders
    const hasActive = ordersForMonth.some((o) =>
      ['Assigned', 'Pending', 'Revision'].includes(o.status)
    );
    return hasActive;
  };

  if (groupedOrders.length === 0) {
    // This is mostly defensive – parent already handles empty state
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
        <p className="text-sm text-slate-500">No orders to show yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groupedOrders.map(({ month, orders: monthOrders }) => (
        <MonthlyOrderGroup
          key={month}
          month={month}
          orders={monthOrders}
          userType={userType}
          defaultExpanded={shouldExpand(month, monthOrders)}
          unreadCounts={unreadCounts}
        />
      ))}
    </div>
  );
}
