'use client';

import { User } from '@/types/user';
import { useOrders } from '@/hooks/useOrders';
import { OrderList } from './OrderList';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  user: User;
}

export function Sidebar({ user }: SidebarProps) {
  const { groupedOrders, loading } = useOrders(user);

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200">
        <h2 className="font-semibold text-lg">Orders</h2>
        <p className="text-sm text-muted-foreground">
          {user.user_type === 'customer' ? 'Your assignments' : 'Your work'}
        </p>
      </div>

      {/* Orders List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading orders...
            </div>
          ) : (
            <OrderList groupedOrders={groupedOrders} userType={user.user_type} />
          )}
        </div>
      </ScrollArea>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-200">
        <div className="text-xs text-muted-foreground text-center">
          Total Orders: {groupedOrders.reduce((sum, g) => sum + g.count, 0)}
        </div>
      </div>
    </div>
  );
}