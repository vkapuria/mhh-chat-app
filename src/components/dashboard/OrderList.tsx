'use client';

import { OrderGroup } from '@/types/order';
import { OrderCard } from './OrderCard';
import { Separator } from '@/components/ui/separator';

interface OrderListProps {
  groupedOrders: OrderGroup[];
  userType: string;
}

export function OrderList({ groupedOrders, userType }: OrderListProps) {
  // Filter out empty groups
  const visibleGroups = groupedOrders.filter((group) => group.count > 0);

  if (visibleGroups.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No orders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleGroups.map((group, index) => (
        <div key={group.label}>
          {/* Group Header */}
          <div className="px-2 py-2 sticky top-0 bg-white z-10">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {group.label} ({group.count})
            </h3>
          </div>

          {/* Orders in Group */}
          <div className="space-y-2">
            {group.orders.map((order) => (
              <OrderCard key={order.id} order={order} userType={userType} />
            ))}
          </div>

          {/* Separator between groups */}
          {index < visibleGroups.length - 1 && (
            <Separator className="my-4" />
          )}
        </div>
      ))}
    </div>
  );
}