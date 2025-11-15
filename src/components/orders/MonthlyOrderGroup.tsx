'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
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
  const activeOrders = orders.filter((o) =>
    ['Assigned', 'In Progress', 'Pending', 'Revision'].includes(o.status)
  );
  const completedOrders = orders.filter((o) => o.status === 'Completed');

  // Earnings (expert only)
  const totalEarnings =
    userType === 'expert'
      ? completedOrders.reduce(
          (sum, order) => sum + (order.expert_fee || 0),
          0
        )
      : 0;

  const hasOrders = orders.length > 0;

  return (
    <div className="mb-6">
      {/* Month Header */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="
          w-full flex items-center justify-between
          rounded-xl border border-slate-200 bg-white
          px-4 py-3 md:py-4
          hover:bg-slate-50 hover:shadow-sm
          transition-all group
        "
        aria-expanded={isExpanded}
      >
        {/* Left side: chevron + month + mobile count */}
        <div className="flex items-center gap-3">
          {/* Chevron with rotation */}
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="text-slate-500 group-hover:text-slate-700"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </motion.div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
            <h2 className="text-base md:text-lg font-semibold text-slate-900">
              {month}
            </h2>

            {/* Mobile: total orders */}
            {hasOrders && (
              <span className="mt-0.5 sm:mt-0 inline-flex md:hidden items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'}
              </span>
            )}
          </div>
        </div>

        {/* Right side: stats (desktop) */}
        {hasOrders ? (
          <div className="hidden md:flex items-center gap-3 text-xs md:text-sm">
            {activeOrders.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>{activeOrders.length} active</span>
              </span>
            )}

            {completedOrders.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{completedOrders.length} completed</span>
              </span>
            )}

            {userType === 'expert' && totalEarnings > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-700 font-semibold">
                <span>₹{totalEarnings.toLocaleString()} earned</span>
              </span>
            )}

            {/* Total orders pill (desktop) */}
            <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-0.5 text-xs font-medium text-white">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>
        ) : (
          <span className="text-xs md:text-sm text-slate-400 italic">
            No orders this month
          </span>
        )}
      </button>

      {/* Order Cards - Animated */}
      <AnimatePresence initial={false}>
        {isExpanded && hasOrders && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: index * 0.03 }}
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
