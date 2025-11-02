import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatBubbleLeftRightIcon, CalendarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface OrderCardProps {
  order: {
    id: string;
    title: string;
    task_code: string;
    status: string;
    amount: number;
    expert_fee?: number;  // Add this line
    deadline?: string;
    customer_name?: string;
    customer_email?: string;
    expert_name?: string;
    expert_id?: string;
    created_at: string;
    updated_at: string;
  };
  userType: 'customer' | 'expert';
  unreadCount?: number;
}

export function OrderCard({ order, userType, unreadCount = 0 }: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Assigned':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const canChat = order.expert_id && order.status !== 'Completed' && order.status !== 'Cancelled';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {order.title}
          </h3>
          <p className="text-sm text-slate-500">
            {order.task_code}
          </p>
        </div>
        <Badge className={getStatusColor(order.status)}>
          {order.status}
        </Badge>
      </div>

      {/* Order Details */}
      <div className="space-y-2 mb-4">
        {userType === 'customer' && order.expert_name && (
          <div className="flex items-center text-sm text-slate-600">
            <span className="font-medium mr-2">Expert:</span>
            <span>{order.expert_name}</span>
          </div>
        )}
        {userType === 'expert' && order.customer_name && (
          <div className="flex items-center text-sm text-slate-600">
            <span className="font-medium mr-2">Customer:</span>
            <span>{order.customer_name}</span>
          </div>
        )}
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <CurrencyDollarIcon className="w-4 h-4" />
          {userType === 'expert' 
    ? `₹${order.expert_fee || order.amount}` 
    : `$${order.amount}`}          </div>
          {order.deadline && (
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              <span>Due {formatDistanceToNow(new Date(order.deadline), { addSuffix: true })}</span>
            </div>
          )}
        </div>
        <div className="text-xs text-slate-500">
          Updated {formatDistanceToNow(new Date(order.updated_at), { addSuffix: true })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {canChat ? (
          <Link href={`/messages/${order.id}`} className="flex-1">
            <Button variant="default" className="w-full">
              <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
              Open Chat
              {unreadCount > 0 && (
                <span className="ml-2 bg-white text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Button>
          </Link>
        ) : order.status === 'Pending' ? (
          <Button variant="outline" className="w-full" disabled>
            Waiting for Expert Assignment
          </Button>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            Order {order.status}
          </Button>
        )}
      </div>
    </div>
  );
}