'use client';

import { useRouter } from 'next/navigation';
import { OrderWithUnread } from '@/types/order';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChatBubbleLeftIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';

interface OrderCardProps {
  order: OrderWithUnread;
  userType: string;
}

export function OrderCard({ order, userType }: OrderCardProps) {
  const router = useRouter();
  const isChatEnabled = order.status !== 'Pending';

  const handleChatClick = () => {
    if (isChatEnabled) {
      router.push(`/chat/${order.id}`);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      Assigned: 'bg-blue-100 text-blue-700 border-blue-200',
      Revision: 'bg-purple-100 text-purple-700 border-purple-200',
      Completed: 'bg-green-100 text-green-700 border-green-200',
      Refunded: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Pending') return <ClockIcon className="w-3 h-3" />;
    if (status === 'Completed') return <CheckCircleIcon className="w-3 h-3" />;
    return null;
  };

  return (
    <Card 
      className={`p-3 hover:shadow-md transition-all cursor-pointer ${
        !isChatEnabled ? 'opacity-60' : ''
      }`}
      onClick={handleChatClick}
    >
      <div className="space-y-2">
        {/* Title and Status */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm line-clamp-1">{order.title}</h4>
          <Badge variant="outline" className={`text-xs ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            <span className="ml-1 capitalize">{order.status}</span>
          </Badge>
        </div>

        {/* Order ID */}
        <p className="text-xs text-muted-foreground">
          {order.task_code || order.id}
        </p>

        {/* Expert/Customer Info */}
        {userType === 'customer' && order.expert_name && (
          <p className="text-xs text-muted-foreground">
            Expert: {order.expert_name}
          </p>
        )}
        {userType === 'expert' && (
          <p className="text-xs text-muted-foreground">
            Customer: {order.customer_name}
          </p>
        )}

{/* Chat Button and Unread Count */}
<div className="flex flex-col gap-2 pt-2">
          <Button
            size="sm"
            variant={isChatEnabled ? "default" : "secondary"}
            disabled={!isChatEnabled}
            className={`text-xs ${
              isChatEnabled ? 'bg-green-600 hover:bg-green-700' : ''
            }`}
          >
            <ChatBubbleLeftIcon className="w-3.5 h-3.5 mr-1" />
            {isChatEnabled ? 'Chat' : 'Pending'}
          </Button>

          {/* Unread Messages */}
          {order.unread_count > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-red-600">
              <ChatBubbleLeftIcon className="w-3.5 h-3.5" />
              <span className="font-medium">
                {order.unread_count} unread {order.unread_count === 1 ? 'message' : 'messages'}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}