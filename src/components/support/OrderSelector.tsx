'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, DollarSign, User, Calendar, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Order {
  id: string;
  order_id: string;
  title: string;
  amount: number | null;
  expert_fee: number | null;
  expert_name?: string;
  created_at: string;
  status?: string;
}

interface OrderSelectorProps {
  onOrderSelect: (order: Order) => void;
  onViewAll?: () => void;
  onGeneralInquiry?: () => void;
  showAll?: boolean;
  onBack?: () => void;
}

export function OrderSelector({
  onOrderSelect,
  onViewAll,
  onGeneralInquiry,
  showAll = false,
  onBack,
}: OrderSelectorProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<'customer' | 'expert' | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [showAll]);

  const fetchOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please log in');
        return;
      }

      // Get user type
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserType = user?.user_metadata?.user_type || 'customer';
      setUserType(currentUserType);

      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        let orderList = result.orders;
        
        // If not showing all, filter to recent orders (last 30 days)
        if (!showAll) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          orderList = orderList.filter((order: Order) => 
            new Date(order.created_at) > thirtyDaysAgo
          );
          // Limit to 5 most recent
          orderList = orderList.slice(0, 5);
        }

        setOrders(orderList);
      } else {
        toast.error('Failed to load orders');
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!showAll && (
        <p className="text-sm text-slate-600">
          Select the order you need help with:
        </p>
      )}

      {orders.length === 0 ? (
        <Card className="p-6 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 mb-4">No recent orders found</p>
          {onGeneralInquiry && (
            <Button onClick={onGeneralInquiry} variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" />
              Submit General Inquiry
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="p-4 hover:shadow-md transition-all cursor-pointer hover:border-blue-500"
              onClick={() => onOrderSelect(order)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="font-mono text-xs font-semibold text-slate-900">
                    {order.order_id}
                  </span>
                </div>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                </span>
              </div>

              <h4 className="font-medium text-sm text-slate-900 mb-2 line-clamp-2">
                {order.title}
              </h4>

              <div className="flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center gap-3">
                  {/* Show $ amount only to customers */}
                  {userType === 'customer' && order.amount && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span className="text-xs">${order.amount}</span>
                    </div>
                  )}
                  {/* Show ₹ amount only to experts */}
                  {userType === 'expert' && order.expert_fee && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span className="text-xs">₹{order.expert_fee}</span>
                    </div>
                  )}
                </div>
                {order.expert_name && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="text-xs">{order.expert_name}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {!showAll && orders.length > 0 && (
        <div className="space-y-2 pt-4 border-t">
          {onViewAll && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onViewAll}
            >
              <Package className="w-4 h-4 mr-2" />
              View All Orders
            </Button>
          )}
          {onGeneralInquiry && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onGeneralInquiry}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              General Inquiry (No specific order)
            </Button>
          )}
        </div>
      )}

      {showAll && onBack && (
        <Button variant="outline" className="w-full" onClick={onBack}>
          Back to Recent Orders
        </Button>
      )}
    </div>
  );
}