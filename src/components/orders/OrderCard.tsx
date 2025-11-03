import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ContactSupportModal } from '@/components/support/ContactSupportModal';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
    customer_display_name?: string;
    customer_email?: string;
    expert_name?: string;
    expert_display_name?: string;
    expert_id?: string;
    created_at: string;
    updated_at: string;
    rating?: {
      average?: number;
      count?: number;
      status?: string;
      days_since_completion?: number;
    };
  };
  userType: 'customer' | 'expert';
  unreadCount?: number;
}

export function OrderCard({ order, userType, unreadCount = 0 }: OrderCardProps) {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    async function getUserInfo() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.name || '');
        setUserEmail(user.email || '');
      }
    }
    getUserInfo();
  }, []);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Revision':
        return 'bg-red-100 text-red-800 border-red-200';
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
          {/* Title & Task Code */}
          <div className="flex-1 min-w-0"> 
            <h3 className="text-lg font-semibold text-slate-900 truncate" title={order.title}>
              {order.title}
            </h3>
            <p className="text-sm text-slate-500 truncate">
              {order.id}
            </p>
          </div>
          {/* Badge */}
          <Badge className={`flex-shrink-0 ${getStatusColor(order.status)}`}>
            {getStatusText(order.status)}
          </Badge>
        </div>

        {/* Order Details */}
        <div className="space-y-3 mb-6">
          {userType === 'customer' && order.expert_name && (
            <div className="flex items-center text-sm text-slate-600 gap-3">
              <img src="/icons/user-profile.svg" alt="Expert" className="w-6 h-6 flex-shrink-0" />
              <span className="font-medium">Expert:</span>
              <span>{order.expert_display_name || order.expert_name}</span>
            </div>
          )}
          {userType === 'expert' && order.customer_name && (
            <div className="flex items-center text-sm text-slate-600 gap-3">
              <img src="/icons/user-profile.svg" alt="Customer" className="w-6 h-6 flex-shrink-0" />
              <span className="font-medium">Customer:</span>
              <span>{order.customer_display_name || order.customer_name}</span>
            </div>
          )}
          
          {/* Rating Display (Only for Experts on Completed Orders) */}
          {userType === 'expert' && order.rating && (
            <div className="flex items-center text-sm gap-3">
              {order.rating.average ? (
                <>
                  <img src="/icons/like.svg" alt="Rating" className="w-6 h-6 flex-shrink-0" />
                  <span className="font-medium text-slate-600">Rating:</span>
                  <span className="font-semibold text-amber-600">{order.rating.average}</span>
                  <img src="/icons/favourite.svg" alt="Star" className="w-4 h-4" />
                </>
              ) : order.rating.status === 'pending' ? (
                <>
                  <img src="/icons/like.svg" alt="Pending" className="w-6 h-6 text-slate-400 flex-shrink-0" />
                  <span className="font-medium text-slate-600">Rating:</span>
                  <span className="text-slate-500 text-xs">
                    Pending
                    {order.rating.days_since_completion !== undefined && order.rating.days_since_completion < 6
                      ? ` (Day ${order.rating.days_since_completion}/6)`
                      : ''}
                  </span>
                </>
              ) : null}
            </div>
          )}

          <div className="flex items-center text-sm text-slate-600 gap-3">
            <img src="/icons/earning.svg" alt="Amount" className="w-6 h-6 flex-shrink-0" />
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
            <img src="/icons/calendar-table.svg" alt="Date" className="w-6 h-6 flex-shrink-0" />
            <span className="font-medium">Ordered:</span>
            <span>{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Actions Block */}
      <div className="flex flex-col gap-2"> 
        {canChat ? (
          <Link href={`/messages/${order.id}`} className="w-full">
            <Button
              variant="default"
              className="w-full font-semibold bg-slate-900 text-white hover:bg-primary"
            >
              <img src="/icons/chat-bubble.svg" alt="Chat" className="w-6 h-6 mr-1" />
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

        <ContactSupportModal
          order={order}
          userType={userType}
          userName={userName}
          userEmail={userEmail}
        >
          <Button 
            variant="outline" 
            className="w-full"
          >
            <img src="/icons/lifesaver.svg" alt="Support" className="w-5 h-5 mr-1" />
            <span className="sm:hidden">Need Help?</span>
            <span className="hidden sm:inline">Need Help? Contact Support</span>
          </Button>
        </ContactSupportModal>
      </div>
    </div>
  );
}