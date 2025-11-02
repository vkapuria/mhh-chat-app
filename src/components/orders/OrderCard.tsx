import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon, 
  CurrencyDollarIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
// Removed ChatBubbleLeftRightIcon and LifebuoyIcon
import { IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
// Note: Using <img> here. If /public/icons/ is correct, this will work.
// For Next.js <Image>, you'd import Image from 'next/image' and provide width/height.

interface OrderCardProps {
  order: {
    id: string;
    title: string;
    task_code: string;
    status: string;
    amount: number;
    expert_fee?: number;
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
        return 'bg-blue-100 text-blue-800 border-blue-200'; // Blue
      case 'Revision':
        return 'bg-red-100 text-red-800 border-red-200'; // Red
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelled':
      case 'Refunded':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Assigned':
        return 'In Progress';
      case 'Revision':
        return 'Under Revision';
      default:
        return order.status;
    }
  };

  const canChat = order.expert_id && order.status !== 'Completed' && order.status !== 'Cancelled' && order.status !== 'Refunded';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
      {/* Top Section */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          {/* Title & Task Code - Fixed with min-w-0 */}
          <div className="flex-1 min-w-0"> 
            <h3 className="text-lg font-semibold text-slate-900 truncate" title={order.title}>
              {order.title}
            </h3>
            <p className="text-sm text-slate-500 truncate">
              {order.task_code}
            </p>
          </div>
          {/* Badge */}
          <Badge className={`flex-shrink-0 ${getStatusColor(order.status)}`}>
            {getStatusText(order.status)}
          </Badge>
        </div>

        {/* Order Details - New Icon Layout */}
        <div className="space-y-3 mb-6">
          {userType === 'customer' && order.expert_name && (
            <div className="flex items-center text-sm text-slate-600 gap-3">
              <UserCircleIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <span className="font-medium">Expert:</span>
              <span>{order.expert_name}</span>
            </div>
          )}
          {userType === 'expert' && order.customer_name && (
             <div className="flex items-center text-sm text-slate-600 gap-3">
              <UserCircleIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <span className="font-medium">Customer:</span>
              <span>{order.customer_name}</span>
            </div>
          )}
          <div className="flex items-center text-sm text-slate-600 gap-3">
            {userType === 'expert' ? (
              <IndianRupee className="w-5 h-5 text-slate-400 flex-shrink-0" />
            ) : (
              <CurrencyDollarIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
            )}
            <span className="font-medium">
              {userType === 'expert' ? 'Earnings:' : 'Price:'}
            </span>
            <span className="font-semibold">
              {userType === 'expert'
                ? `₹${order.expert_fee || order.amount}`
                : `$${order.amount}`}
            </span>
          </div>
          <div className="flex items-center text-sm text-slate-600 gap-3">
            <CalendarIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <span className="font-medium">Ordered:</span>
            <span>{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      {/* --- MODIFIED ACTIONS BLOCK --- */}
      <div className="flex flex-col gap-2"> 
        {canChat ? (
          <Link href={`/messages/${order.id}`} className="w-full">
            <Button
              variant="default"
              className="w-full font-semibold bg-slate-900 text-white hover:bg-primary"
            >
              {/* Using <img> for custom SVG */}
              <img src="/icons/chat-bubble.svg" alt="Chat" className="w-5 h-5 mr-1" />
              {userType === 'expert' ? 'Chat with Customer' : 'Chat with Expert'}
              {unreadCount > 0 && (
                <span className="ml-2 bg-white text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Button>
          </Link>
        ) : (
          <Button 
            variant="outline" 
            className="w-full" 
            disabled
          >
            {(order.status === 'Completed' || order.status === 'Cancelled' || order.status === 'Refunded')
              ? 'Chat Closed'
              : getStatusText(order.status)
            }
          </Button>
        )}

        <Button 
          variant="outline" 
          className="w-full"
        >
          {/* Using <img> for custom SVG */}
          <img src="/icons/lifesaver.svg" alt="Support" className="w-5 h-5 mr-1" />
          {/* Responsive Button Text */}
          <span className="sm:hidden">Need Help?</span>
          <span className="hidden sm:inline">Need Help? Contact Support</span>
        </Button>
      </div>
      {/* --- END OF MODIFIED BLOCK --- */}
    </div>
  );
}

