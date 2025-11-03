import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface Order {
  id: string;
  title: string;
  status: string;
  updated_at: string;
  expert_name?: string;
  customer_name?: string;
  expert_display_name?: string;
  customer_display_name?: string;
  amount: number;
  expert_fee?: number;
  unread_count: number;
  rating?: {
    average?: number;
    count?: number;
    status?: string;
    days_since_completion?: number;
  };
}

interface RecentActivityProps {
  orders: Order[];
  userType: 'customer' | 'expert';
}

export function RecentActivity({ orders, userType }: RecentActivityProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'In Progress':
      case 'Assigned':
        return 'bg-blue-100 text-blue-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Revision':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
      }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
        <p className="text-slate-500">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
      </div>
      
      <div className="divide-y divide-slate-200">
        {orders.map((order) => {
          const isCustomer = userType === 'customer';
          const displayAmount = isCustomer
            ? `$${order.amount}`
            : `₹${order.expert_fee || order.amount}`;
          
          const amountColor = isCustomer ? 'text-slate-900' : 'text-green-600';
          const canChat = order.status === 'Assigned' || order.status === 'In Progress';

          return (
            <div key={order.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              {/* Left Side: Title and Status */}
              <div className="flex-1 mb-4 sm:mb-0">
                <p className="text-sm font-semibold text-slate-900 line-clamp-1">{order.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(order.status)}`}>
                  {order.status === 'Assigned' ? 'In Progress' : order.status === 'Revision' ? 'Under Revision' : order.status}
                </span>
                  <span className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(order.updated_at), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {/* Right Side: Rating, Amount and Chat */}
              <div className="flex items-center gap-4 flex-shrink-0">
                {/* Rating Display (Only for Experts) */}
                {userType === 'expert' && order.rating && (
                  <div className="text-sm">
                    {order.rating.average ? (
                      <div className="flex items-center gap-1 text-amber-600">
                        <img src="/icons/favourite.svg" alt="Rating" className="w-4 h-4" />
                        <span className="font-semibold">{order.rating.average}</span>
                      </div>
                    ) : order.rating.status === 'pending' ? (
                      <div className="flex items-center gap-1 text-slate-500">
                        <span className="text-base">🕐</span>
                        <span className="text-xs">
                          {order.rating.days_since_completion !== undefined && order.rating.days_since_completion < 6
                            ? `Day ${order.rating.days_since_completion}/6`
                            : 'Pending'}
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}
                
                <div className={`text-lg font-bold ${amountColor}`}>
                  {displayAmount}
                </div>
                <Link href={`/messages/${order.id}`} passHref>
                  <Button
                    variant={canChat ? 'outline' : 'secondary'}
                    size="default"
                    disabled={!canChat}
                    className="relative"
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                    {isCustomer ? 'Chat with Expert' : 'Chat with Customer'}
                    {order.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                      </span>
                    )}
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}