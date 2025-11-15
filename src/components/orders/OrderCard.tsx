import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ContactSupportModal } from '@/components/support/ContactSupportModal';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  DollarCircleIcon,
  Calendar03Icon,
  Message02Icon,
  StarIcon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';
import { trackOrderViewed } from '@/lib/analytics';

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
    customer_avatar?: string;
    expert_name?: string;
    expert_display_name?: string;
    expert_id?: string;
    expert_avatar?: string;
    created_at: string;
    updated_at: string;
    completed_at?: string;
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.name || '');
        setUserEmail(user.email || '');
      }
    }
    getUserInfo();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Completed':
        return {
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          text: 'Completed',
        };
      case 'Assigned':
        return {
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          text: 'In Progress',
        };
      case 'Revision':
        return {
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          text: 'Under Revision',
        };
      case 'Pending':
        return {
          color: 'bg-slate-50 text-slate-700 border-slate-200',
          text: 'Pending Assignment',
        };
      case 'Cancelled':
      case 'Refunded':
        return {
          color: 'bg-red-50 text-red-700 border-red-200',
          text: status,
        };
      default:
        return {
          color: 'bg-slate-50 text-slate-700 border-slate-200',
          text: status,
        };
    }
  };

  const statusConfig = getStatusConfig(order.status);
  
  // Chat is allowed for Pending, Assigned, Revision, AND 72h after completion
  const canChat = (() => {
    // Active statuses can always chat
    if (['Pending', 'Assigned', 'Revision'].includes(order.status)) {
      return true;
    }
    
    // Completed orders: check if within 72 hours
    if (order.status === 'Completed' && order.completed_at) {
      const completedAt = new Date(order.completed_at).getTime();
      const now = new Date().getTime();
      const hoursSinceCompletion = (now - completedAt) / (1000 * 60 * 60);
      return hoursSinceCompletion < 72;
    }
    
    return false;
  })();

  // Calculate hours remaining for completed orders
  const getHoursRemaining = () => {
    if (order.status !== 'Completed' || !order.completed_at) return null;
    
    const completedAt = new Date(order.completed_at).getTime();
    const now = new Date().getTime();
    const hoursSinceCompletion = (now - completedAt) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, 72 - hoursSinceCompletion);
    
    return Math.ceil(hoursRemaining);
  };

  const hoursRemaining = getHoursRemaining();

  // Determine other party info
  const otherPartyName =
    userType === 'customer'
      ? order.expert_display_name || 'Expert'
      : order.customer_display_name || 'Student';

  const otherPartyAvatar =
    userType === 'customer' ? order.expert_avatar : order.customer_avatar;

  // Generate initials for avatar fallback
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const isClosed = ['Completed', 'Cancelled', 'Refunded'].includes(order.status);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_14px_rgba(15,23,42,0.08)] transition-all duration-200">
      {/* SECTION 1: Header */}
      <div className="px-6 pt-4 pb-2 border-b border-slate-50">
        
        <h3
          className="text-[16px] font-semibold text-slate-900 mb-1.5 leading-snug truncate"
          title={order.title}
        >
          {order.title}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">{order.id}</span>
        </div>
      </div>

      {/* SECTION 2: Key Info Block */}
      <div className="px-6 py-5 space-y-4">
        {/* Other Party (Expert/Student) with Avatar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {otherPartyAvatar ? (
              <Image
                src={otherPartyAvatar}
                alt={otherPartyName}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-700 border border-slate-200">
                {getInitials(otherPartyName)}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wide text-slate-400">
                {userType === 'customer' ? 'Your Expert' : 'Student'}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {otherPartyName}
              </span>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`${statusConfig.color} border text-[11px] font-medium px-2.5 py-0.5 rounded-full`}
          >
            {statusConfig.text}
          </Badge>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-200" />

        {/* Price / Earnings */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <HugeiconsIcon
              icon={DollarCircleIcon}
              size={22}
              strokeWidth={1.6}
              className="text-slate-400"
            />
            <span className="text-xs uppercase tracking-wide">
              {userType === 'expert' ? 'Your Earnings' : 'Amount Paid'}
            </span>
          </div>
          <span className="font-semibold text-slate-900">
            {userType === 'expert'
              ? `₹${order.expert_fee || order.amount}`
              : `$${order.amount}`}
          </span>
        </div>

        {/* Ordered Date */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <HugeiconsIcon
              icon={Calendar03Icon}
              size={22}
              strokeWidth={1.6}
              className="text-slate-400"
            />
            <span className="text-xs uppercase tracking-wide">Ordered</span>
          </div>
          <span className="text-sm text-slate-900">
            {format(new Date(order.created_at), 'MMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* SECTION 3: Secondary Info (only if relevant) */}
      {(order.status === 'Completed' || (userType === 'expert' && order.rating)) && (
        <div className="px-6 pb-4 pt-3 border-t border-slate-50 space-y-2">
          {/* Completed Date */}
          {order.status === 'Completed' && order.completed_at && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  size={22}
                  strokeWidth={1.6}
                  className="text-emerald-600"
                />
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  Completed
                </span>
              </div>
              <span className="text-sm font-semibold text-emerald-700">
                {format(new Date(order.completed_at), 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {/* Rating (Expert view only) */}
          {userType === 'expert' && order.rating && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <HugeiconsIcon
                  icon={StarIcon}
                  size={18}
                  strokeWidth={1.6}
                  className={
                    order.rating.average ? 'text-amber-500' : 'text-slate-400'
                  }
                />
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  Rating
                </span>
              </div>

              {order.rating.average ? (
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-amber-600">
                    {order.rating.average}
                  </span>
                  <span className="text-xs text-slate-400">/ 5.0</span>
                </div>
              ) : order.rating.status === 'pending' ? (
                <span className="text-xs text-slate-500 italic">
                  Pending
                  {order.rating.days_since_completion !== undefined &&
                  order.rating.days_since_completion < 6
                    ? ` · Day ${order.rating.days_since_completion}/6`
                    : ''}
                </span>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: Actions */}
      <div className="px-6 pb-6 pt-4 border-t border-slate-50 space-y-3">
        {/* Chat Button */}
        {canChat ? (
          <Link
            href={`/messages/${order.id}`}
            className="block"
            onClick={() => {
              trackOrderViewed({
                orderId: order.id,
                userType,
              });
            }}
          >
            <Button 
              className={`w-full h-11 rounded-lg font-medium flex items-center justify-center gap-2 ${
                order.status === 'Completed' && hoursRemaining
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <HugeiconsIcon
                icon={Message02Icon}
                size={18}
                strokeWidth={1.5}
                className="text-white"
              />
              <span>
                {order.status === 'Completed' && hoursRemaining
                  ? `Chat (closes in ${hoursRemaining}h)`
                  : userType === 'expert' 
                    ? 'Chat with Student' 
                    : 'Chat with Expert'
                }
              </span>
              {unreadCount > 0 && (
                <span className="ml-auto bg-white text-xs font-bold px-2 py-0.5 rounded-full ${
                  order.status === 'Completed' ? 'text-emerald-900' : 'text-slate-900'
                }">
                  {unreadCount}
                </span>
              )}
            </Button>
          </Link>
        ) : (
          <Button
            variant="outline"
            className="w-full h-11 rounded-lg text-sm"
            disabled
          >
            {isClosed ? 'Chat Closed' : statusConfig.text}
          </Button>
        )}

        {/* Support Button */}
        <ContactSupportModal
          order={order}
          userType={userType}
          userName={userName}
          userEmail={userEmail}
        >
          <Button
            variant="ghost"
            className="w-full h-11 rounded-lg bg-slate-100 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center gap-2"
          >
            <img
              src="/icons/lifesaver.svg"
              alt="Support"
              className="w-4 h-4"
            />
            <span>Get help with this order</span>
          </Button>
        </ContactSupportModal>
      </div>
    </div>
  );
}
