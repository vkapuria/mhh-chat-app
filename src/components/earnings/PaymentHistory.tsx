'use client';

import { useState } from 'react';
import { CalendarView } from './CalendarView';
import { format, formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronRight, Calendar, List } from 'lucide-react';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface Order {
  id: string;
  title: string;
  task_code: string;
  amount: number;
  expert_fee?: number;
  customer_name?: string;
  customer_display_name?: string;
  updated_at: string;
  created_at: string;
  completed_at?: string;
  payment_status?: string;
  period_status?: string;
  rejected_reason?: string;
  rating?: {
    average?: number;
    count?: number;
    status?: string;
    days_since_completion?: number;
  };
}

interface PaymentHistoryProps {
  orders: Order[];
}

function PaymentStatusBadge({ order }: { order: Order }) {
  // Not in payroll yet
  if (!order.payment_status) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
        <AlertCircle className="w-3.5 h-3.5" />
        Not Submitted
      </span>
    );
  }

  // Rejected
  if (order.payment_status === 'rejected') {
    return (
      <span 
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium cursor-help"
        title={order.rejected_reason || 'Order rejected'}
      >
        <XCircle className="w-3.5 h-3.5" />
        Rejected
      </span>
    );
  }

  // Paid - Solid style
  if (order.period_status === 'paid' && order.payment_status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-600 text-white text-xs font-semibold shadow-sm">
        <CheckCircle className="w-3.5 h-3.5" />
        Paid
      </span>
    );
  }

  // Approved for payment - Outlined style
  if (order.payment_status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-400 bg-emerald-50 text-emerald-700 text-xs font-medium">
        <CheckCircle className="w-3.5 h-3.5" />
        Approved
      </span>
    );
  }

  // Pending review
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
      <Clock className="w-3.5 h-3.5" />
      Pending
    </span>
  );
}

function ListView({ orders }: { orders: Order[] }) {
  // Sort orders by completion date (most recent first)
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.completed_at || a.updated_at).getTime();
    const dateB = new Date(b.completed_at || b.updated_at).getTime();
    return dateB - dateA;
  });

  // Group orders by month/year
  const groupedOrders = sortedOrders.reduce((groups, order) => {
    const date = new Date(order.completed_at || order.updated_at);
    const monthYear = format(date, 'MMMM yyyy');
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(order);
    
    return groups;
  }, {} as Record<string, Order[]>);

  const months = Object.keys(groupedOrders);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(
    // Expand current month by default
    months.length > 0 ? { [months[0]]: true } : {}
  );

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [month]: !prev[month]
    }));
  };

  return (
    <div className="divide-y divide-slate-200">
      {months.map((monthYear) => {
        const monthOrders = groupedOrders[monthYear];
        const isExpanded = expandedMonths[monthYear];
        
        // Calculate month totals
        const monthTotal = monthOrders.reduce((sum, order) => sum + (order.expert_fee || order.amount), 0);
        const paidCount = monthOrders.filter(o => o.period_status === 'paid').length;
        const approvedCount = monthOrders.filter(o => o.payment_status === 'approved' && o.period_status !== 'paid').length;
        const pendingCount = monthOrders.filter(o => !o.payment_status || o.payment_status === 'pending').length;

        return (
          <div key={monthYear}>
            {/* Month Header */}
            <button
              onClick={() => toggleMonth(monthYear)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
                <div className="text-left">
                  <h4 className="font-semibold text-slate-900">{monthYear}</h4>
                  <p className="text-sm text-slate-500">
                    {monthOrders.length} order{monthOrders.length !== 1 ? 's' : ''} • ₹{monthTotal.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {paidCount > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                    {paidCount} paid
                  </span>
                )}
                {approvedCount > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                    {approvedCount} approved
                  </span>
                )}
                {pendingCount > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                    {pendingCount} pending
                  </span>
                )}
              </div>
            </button>

            {/* Month Orders */}
            {isExpanded && (
              <div className="bg-slate-50">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-y border-slate-200">
                    <tr>
                      <th className="px-6 py-2 text-left text-xs font-medium text-slate-600 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-2 text-left text-xs font-medium text-slate-600 uppercase">
                        Order ID
                      </th>
                      <th className="px-6 py-2 text-right text-xs font-medium text-slate-600 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-2 text-center text-xs font-medium text-slate-600 uppercase">
                        Payment Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {monthOrders.map((order) => {
                      const completedDate = new Date(order.completed_at || order.updated_at);
                      return (
                        <tr key={order.id} className="hover:bg-white transition-colors">
                          <td className="px-6 py-3 text-slate-600">
                            {format(completedDate, 'MMM d')}
                          </td>
                          <td className="px-6 py-3">
                            <span className="font-mono text-slate-900">{order.id}</span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className="font-semibold text-green-600">
                              ₹{(order.expert_fee || order.amount).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex justify-center">
                              <PaymentStatusBadge order={order} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PaymentHistory({ orders }: PaymentHistoryProps) {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-500">No payment history yet</p>
        <p className="text-sm text-slate-400 mt-2">
          Complete orders to start earning!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {/* Header with View Toggle */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Payment History</h3>
          <p className="text-sm text-slate-500">{orders.length} completed orders</p>
        </div>

        {/* View Toggle - Hidden on Mobile */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              view === 'calendar'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              view === 'list'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4" />
            List
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Desktop: Show selected view, Mobile: Always list */}
        <div className="hidden md:block">
          {view === 'calendar' ? (
            <CalendarView orders={orders} />
          ) : (
            <ListView orders={orders} />
          )}
        </div>
        
        {/* Mobile: Always show list view */}
        <div className="md:hidden">
          <ListView orders={orders} />
        </div>
      </div>
    </div>
  );
}