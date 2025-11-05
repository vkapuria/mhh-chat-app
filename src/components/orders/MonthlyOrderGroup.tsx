'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { OrderCard } from './OrderCard';

interface MonthlyOrderGroupProps {
  month: string; // "November 2025"
  orders: any[];
  userType: 'customer' | 'expert';
  defaultExpanded?: boolean;
  unreadCounts?: Record<string, number>;
}

export function MonthlyOrderGroup({
  month,
  orders,
  userType,
  defaultExpanded = false,
  unreadCounts = {},
}: MonthlyOrderGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Calculate stats
  const activeOrders = orders.filter(o => 
    ['Assigned', 'In Progress', 'Pending', 'Revision'].includes(o.status)
  );
  const completedOrders = orders.filter(o => o.status === 'Completed');
  
  // Calculate earnings (for experts only)
  const totalEarnings = userType === 'expert' 
    ? completedOrders.reduce((sum, order) => sum + (order.expert_fee || 0), 0)
    : 0;

  const hasOrders = orders.length > 0;

  return (
    <div className="mb-6">
      {/* Month Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          {/* Chevron Icon */}
          <div className="text-slate-500 group-hover:text-slate-700 transition-colors">
            {isExpanded ? (
              <ChevronDownIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </div>

          {/* Month Name */}
          <h2 className="text-lg font-bold text-slate-900">{month}</h2>

          {/* Stats - Desktop (Rich) */}
          {hasOrders ? (
            <>
              <div className="hidden md:flex items-center gap-3 text-sm">
                {activeOrders.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="font-medium text-slate-700">
                      {activeOrders.length} active
                    </span>
                  </span>
                )}
                {completedOrders.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="font-medium text-slate-700">
                      {completedOrders.length} completed
                    </span>
                  </span>
                )}
                {userType === 'expert' && totalEarnings > 0 && (
                  <span className="flex items-center gap-1.5 text-green-700 font-semibold">
                    <span>•</span>
                    <span>₹{totalEarnings.toLocaleString()} earned</span>
                  </span>
                )}
              </div>

              {/* Stats - Mobile (Minimal) */}
              <div className="md:hidden text-sm text-slate-600 font-medium">
                ({orders.length} {orders.length === 1 ? 'order' : 'orders'})
              </div>
            </>
          ) : (
            <span className="text-sm text-slate-400 italic">No orders this month</span>
          )}
        </div>
      </button>

      {/* Order Cards - Animated */}
      <AnimatePresence initial={false}>
        {isExpanded && hasOrders && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <OrderCard
                    order={order}
                    userType={userType}
                    unreadCount={unreadCounts[order.id] || 0}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}