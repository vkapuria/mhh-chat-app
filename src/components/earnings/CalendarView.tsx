'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
    approved_at?: string;  // 🆕 ADD THIS if missing
    period_paid_at?: string;
    period_approved_at?: string;
    rating?: {
      average?: number;
      count?: number;
      status?: string;
      days_since_completion?: number;
    };
  }

interface CalendarViewProps {
  orders: Order[];
}

function PaymentStatusBadge({ order, compact }: { order: Order; compact?: boolean }) {
    // Not in payroll yet
    if (!order.payment_status) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100/80 text-slate-600 text-[10px] font-medium backdrop-blur-sm">
          <AlertCircle className="w-3 h-3" />
          Not Submitted
        </span>
      );
    }
  
    // Rejected
    if (order.payment_status === 'rejected') {
      return (
        <span 
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100/80 text-red-700 text-[10px] font-medium backdrop-blur-sm cursor-help"
          title={order.rejected_reason || 'Order rejected'}
        >
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    }
  
    // Paid - Solid style with checkmark
    if (order.period_status === 'paid' && order.payment_status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-600 text-white text-[10px] font-semibold backdrop-blur-sm shadow-sm">
          <CheckCircle className="w-3 h-3" />
          Paid
        </span>
      );
    }
  
    // Approved for payment - Lighter green with outline
    if (order.payment_status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-400 bg-emerald-50/80 text-emerald-700 text-[10px] font-medium backdrop-blur-sm">
          <CheckCircle className="w-3 h-3" />
          Approved
        </span>
      );
    }
  
    // Pending review
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-700 text-[10px] font-medium backdrop-blur-sm">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  }

  function OrderDetailsModal({ order, open, onClose }: { order: Order | null; open: boolean; onClose: () => void }) {
  if (!order) return null;

  // Remove the debug console.log now that it works
  const completedDate = new Date(order.completed_at || order.updated_at);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col p-0">
        {/* Sticky Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 py-4 space-y-4">
          {/* Order Info */}
          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">Order ID</div>
              <div className="font-mono font-semibold text-slate-900">{order.id}</div>
            </div>
            
            <div>
              <div className="text-xs text-slate-500 mb-1">Title</div>
              <div className="text-slate-900">{order.title}</div>
            </div>
            
            <div>
              <div className="text-xs text-slate-500 mb-1">Customer</div>
              <div className="text-slate-900">{order.customer_display_name || order.customer_name || 'Unknown'}</div>
            </div>
          </div>

          {/* Amount */}
          <div className="pt-4 border-t">
            <div className="text-xs text-slate-500 mb-1">Amount</div>
            <div className="text-2xl font-bold text-slate-900">
              ₹{(order.expert_fee || order.amount).toLocaleString()}
            </div>
          </div>

          {/* Rating */}
          <div className="pt-4 border-t">
            <div className="text-xs text-slate-500 mb-2">Customer Rating</div>
            {order.rating ? (
              order.rating.average ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-amber-600">
                    <img src="/icons/favourite.svg" alt="Rating" className="w-5 h-5" />
                    <span className="font-semibold text-lg">{order.rating.average}</span>
                  </div>
                  <span className="text-sm text-slate-500">({order.rating.count} review{order.rating.count !== 1 ? 's' : ''})</span>
                </div>
              ) : order.rating.status === 'pending' ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <img src="/icons/like.svg" alt="Pending" className="w-5 h-5" />
                  <span className="text-sm">
                    {order.rating.days_since_completion !== undefined
                      ? `Day ${order.rating.days_since_completion} - Rating available in ${Math.max(0, 30 - order.rating.days_since_completion)} days`
                      : 'Rating pending'}
                  </span>
                </div>
              ) : (
                <span className="text-slate-400 text-sm">No rating yet</span>
              )
            ) : (
              <span className="text-slate-400 text-sm">No rating data</span>
            )}
          </div>

          {/* Payment Timeline */}
          <div className="pt-4 border-t">
            <div className="text-xs text-slate-500 mb-3">Payment History</div>
            <div className="bg-slate-50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-200">
                  {/* Task Completed */}
                  <tr>
                    <td className="px-4 py-3 text-slate-600 font-medium">Task Completed</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-slate-900">
                          {format(completedDate, 'MMM d, yyyy')}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Payment Approved */}
                  {order.period_approved_at ? (
                    <tr>
                      <td className="px-4 py-3 text-slate-600 font-medium">Payment Approved</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span className="font-medium text-slate-900">
                            {format(new Date(order.period_approved_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : order.payment_status === 'pending' ? (
                    <tr>
                      <td className="px-4 py-3 text-slate-600 font-medium">Payment Approved</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span className="text-slate-500 text-sm">Pending review</span>
                        </div>
                      </td>
                    </tr>
                  ) : !order.payment_status ? (
                    <tr>
                      <td className="px-4 py-3 text-slate-600 font-medium">Payment Approved</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <AlertCircle className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-400 text-sm">Not submitted</span>
                        </div>
                      </td>
                    </tr>
                  ) : null}

                  {/* Payment Complete */}
                  {order.period_paid_at ? (
                    <tr>
                      <td className="px-4 py-3 text-slate-600 font-medium">Payment Complete</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-slate-900">
                            {format(new Date(order.period_paid_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : order.payment_status === 'approved' ? (
                    <tr>
                      <td className="px-4 py-3 text-slate-600 font-medium">Payment Complete</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-600 text-sm font-medium">Processing...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td className="px-4 py-3 text-slate-600 font-medium">Payment Complete</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-400 text-sm">Awaiting approval</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Rejection Row (if rejected) */}
                  {order.payment_status === 'rejected' && (
                    <tr className="bg-red-50">
                      <td className="px-4 py-3 text-red-700 font-medium">Payment Rejected</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-red-600 text-sm">
                            {order.rejected_reason || 'See admin'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Status Description */}
            {order.period_status === 'paid' && order.period_paid_at && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  💰 Payment has been transferred to your bank account.
                </p>
              </div>
            )}
            {order.payment_status === 'approved' && order.period_status !== 'paid' && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  ✓ Payment approved! Bank transfer will be processed soon.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CalendarView({ orders }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Get calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get starting day of week (0 = Sunday)
  const startingDayOfWeek = monthStart.getDay();
  
  // Create calendar grid (prepend empty days for alignment)
  const calendarDays = [
    ...Array(startingDayOfWeek).fill(null),
    ...daysInMonth
  ];

  // Group orders by date
  const ordersByDate = orders.reduce((acc, order) => {
    const date = format(new Date(order.completed_at || order.updated_at), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const today = new Date();

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {orders.filter(o => {
              const orderDate = new Date(o.completed_at || o.updated_at);
              return isSameMonth(orderDate, currentMonth);
            }).length} orders this month
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Calendar Grid - Glassmorphic Design */}
      <div className="rounded-xl overflow-hidden shadow-lg backdrop-blur-xl bg-white/60 border border-white/20">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gradient-to-br from-slate-50/80 to-slate-100/80 backdrop-blur-sm border-b border-slate-200/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200/30">
          {calendarDays.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[120px] bg-slate-50/30 backdrop-blur-sm"
                />
              );
            }

            const dateKey = format(day, 'yyyy-MM-dd');
            const dayOrders = ordersByDate[dateKey] || [];
            const isToday = isSameDay(day, today);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={dateKey}
                className={`min-h-[120px] p-2 transition-all backdrop-blur-sm ${
                  isToday
                    ? 'bg-blue-50/60 ring-2 ring-blue-400/50 ring-inset'
                    : isCurrentMonth
                    ? 'bg-white/40 hover:bg-white/60'
                    : 'bg-slate-50/20'
                }`}
              >
                {/* Date Number */}
                <div className={`text-sm font-semibold mb-2 ${
                  isToday
                    ? 'text-blue-600'
                    : isCurrentMonth
                    ? 'text-slate-900'
                    : 'text-slate-400'
                }`}>
                  {format(day, 'd')}
                </div>

                {/* Orders for this day */}
                <div className="space-y-1">
                  {dayOrders.slice(0, 2).map((order) => (
                    <button
                      key={order.id}
                      onClick={() => handleOrderClick(order)}
                      className="w-full text-left p-1.5 rounded-lg bg-white/80 hover:bg-white border border-slate-200/50 hover:border-slate-300/50 shadow-sm hover:shadow-md transition-all backdrop-blur-sm group"
                    >
                      <div className="text-[10px] font-mono text-slate-600 truncate group-hover:text-slate-900">
                        {order.id}
                      </div>
                      <div className="mt-0.5">
                        <PaymentStatusBadge order={order} compact />
                      </div>
                      <div className="text-xs font-semibold text-green-600 mt-0.5">
                        ₹{(order.expert_fee || order.amount).toLocaleString()}
                      </div>
                    </button>
                  ))}
                  
                  {dayOrders.length > 2 && (
                    <div className="text-[10px] text-slate-500 font-medium px-1.5 py-1 bg-slate-100/60 rounded backdrop-blur-sm">
                      +{dayOrders.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedOrder(null);
        }}
      />
    </div>
  );
}