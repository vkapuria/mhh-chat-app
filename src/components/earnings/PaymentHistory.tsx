import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface Order {
  id: string;
  title: string;
  task_code: string;
  amount: number;
  expert_fee?: number;
  customer_name?: string;
  updated_at: string;
  created_at: string;
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

export function PaymentHistory({ orders }: PaymentHistoryProps) {
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
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Payment History</h3>
        <p className="text-sm text-slate-500">{orders.length} completed orders</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Completed
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-slate-900">{order.title}</div>
                    <div className="text-sm text-slate-500">{order.id}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {order.customer_name || 'Unknown'}
                </td>
                <td className="px-6 py-4 text-sm">
                  {order.rating ? (
                    order.rating.average ? (
                      <div className="flex items-center gap-1 text-amber-600">
                        <img src="/icons/favourite.svg" alt="Rating" className="w-4 h-4" />
                        <span className="font-semibold">{order.rating.average}</span>
                      </div>
                    ) : order.rating.status === 'pending' ? (
                      <div className="flex items-center gap-1 text-slate-500">
                        <img src="/icons/like.svg" alt="Pending" className="w-4 h-4" />
                        <span className="text-xs">
                          {order.rating.days_since_completion !== undefined && order.rating.days_since_completion < 6
                            ? `Day ${order.rating.days_since_completion}/6`
                            : 'Pending'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-green-600">
                    ₹{order.expert_fee || order.amount}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {formatDistanceToNow(new Date(order.completed_at || order.updated_at), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}