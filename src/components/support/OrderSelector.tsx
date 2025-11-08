'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, User, Calendar, MessageSquare, IndianRupee, DollarSign } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
  id: string;
  order_id: string;
  title: string;
  amount: number | null;
  expert_fee: number | null;
  expert_name?: string;
  customer_name?: string;
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
        
        // If not showing all, show recent 2 orders only
        if (!showAll) {
          orderList = orderList.slice(0, 2);
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
        {[1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="h-32 bg-slate-100 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  const isExpert = userType === 'expert';

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {!showAll && (
        <motion.p 
          className="text-sm md:text-base text-slate-700 font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {isExpert 
            ? 'First, select the task you need help with:' 
            : 'First, select the order you need help with:'}
        </motion.p>
      )}

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-4">
              {isExpert ? 'No tasks found' : 'No orders found'}
            </p>
            {onGeneralInquiry && (
              <Button onClick={onGeneralInquiry} variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Submit General Inquiry
              </Button>
            )}
          </Card>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <AnimatePresence>
              {orders.map((order, index) => (
                <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="p-4 hover:shadow-xl transition-all cursor-pointer border-2 border-slate-300 hover:border-blue-500 shadow-md relative overflow-visible"
                  onClick={() => onOrderSelect(order)}
                >
                  {/* Status Badge - Top Right */}
                  {order.status && (
                    <div className="absolute -top-2 -right-2">
                      <Badge className={`text-xs px-2 py-0.5 shadow-sm ${
                        order.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-300' :
                        order.status === 'In Progress' || order.status === 'Assigned' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                        order.status === 'Revision' ? 'bg-red-100 text-red-700 border-red-300' :
                        'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {order.status}
                      </Badge>
                    </div>
                  )}
                    {/* Header: Icon + Date */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] text-slate-500">
                            {order.id}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {order.order_id}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(order.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="font-semibold text-sm md:text-base text-slate-900 mb-3 line-clamp-2 min-h-[2.5rem]">
                      {order.title}
                    </h4>

                    {/* Footer: Price + Name */}
                    <div className="flex items-center justify-between text-xs md:text-sm pt-3 border-t border-slate-100">
                      {/* Price */}
                      <div className="flex items-center gap-1.5">
                        {isExpert && order.expert_fee ? (
                          <>
                            <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
                              <IndianRupee className="w-3.5 h-3.5 text-green-600" />
                            </div>
                            <span className="font-semibold text-green-700">₹{order.expert_fee.toLocaleString('en-IN')}</span>
                          </>
                        ) : order.amount ? (
                          <>
                            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                              <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <span className="font-semibold text-blue-700">${order.amount}</span>
                          </>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>

                      {/* Name */}
                      {(order.expert_name || order.customer_name) && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <User className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[100px]">
                            {isExpert ? order.customer_name : order.expert_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {!showAll && orders.length > 0 && (
            <motion.div 
              className="space-y-3 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {onViewAll && (
                <Button
                  variant="outline"
                  className="w-full hover:bg-slate-50 transition-colors"
                  onClick={onViewAll}
                >
                  <Package className="w-4 h-4 mr-2" />
                  {isExpert ? 'View All Tasks' : 'View Other Orders'}
                </Button>
              )}

              {onGeneralInquiry && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-500 font-medium">or</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full border border-slate-200 hover:bg-slate-50 transition-colors"
                    onClick={onGeneralInquiry}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    General Inquiry (No specific {isExpert ? 'task' : 'order'})
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </>
      )}

      {showAll && onBack && (
        <Button variant="outline" className="w-full" onClick={onBack}>
          Back to Recent {isExpert ? 'Tasks' : 'Orders'}
        </Button>
      )}
    </motion.div>
  );
}