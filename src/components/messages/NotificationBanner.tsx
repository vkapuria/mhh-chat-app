'use client';

import { useEffect, useState } from 'react';
import { useNotificationCooldownStore } from '@/store/notification-cooldown-store';
import { usePresenceStore } from '@/store/presence-store';
import { InformationCircleIcon, BoltIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface NotificationBannerProps {
  orderId: string;
  recipientUserId: string;
  recipientName: string;
  recipientType: 'customer' | 'expert';
  onSendBatchNotification: () => Promise<void>;
}

export function NotificationBanner({
  orderId,
  recipientUserId,
  recipientName,
  recipientType,
  onSendBatchNotification,
}: NotificationBannerProps) {
  const isRecipientOnline = usePresenceStore((state) => state.isUserOnline(recipientUserId));
  const canNotifyNow = useNotificationCooldownStore((state) => state.canNotifyNow(orderId));
  const minutesRemaining = useNotificationCooldownStore((state) => 
    state.getMinutesUntilNextNotification(orderId)
  );
  const messageCount = useNotificationCooldownStore((state) => 
    state.getMessagesSinceLastNotification(orderId)
  );
  
  const [sending, setSending] = useState(false);
  const [currentMinutes, setCurrentMinutes] = useState(minutesRemaining);

  // Update countdown every minute
  useEffect(() => {
    setCurrentMinutes(minutesRemaining);
    
    const interval = setInterval(() => {
      setCurrentMinutes(prev => Math.max(0, prev - 1));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [minutesRemaining]);

  // Don't show banner if recipient is online
  if (isRecipientOnline) {
    return null;
  }

  // Don't show if no cooldown exists yet (no notification sent)
  if (minutesRemaining === 0 && messageCount === 0) {
    return null;
  }

  const handleSendNotification = async () => {
    setSending(true);
    try {
      await onSendBatchNotification();
    } catch (error) {
      console.error('Failed to send batch notification:', error);
    } finally {
      setSending(false);
    }
  };

  // State 5: Ready to notify (with messages)
  if (canNotifyNow && messageCount > 0) {
    return (
      <div className="border-b border-slate-200 bg-amber-50">
        <div className="px-6 py-3">
          <div className="flex items-start gap-3">
            <BoltIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-amber-900">
                {messageCount} {messageCount === 1 ? 'message' : 'messages'} waiting • Ready to send
              </div>
            </div>

            <Button
              onClick={handleSendNotification}
              disabled={sending}
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white flex-shrink-0"
            >
              {sending ? 'Sending...' : 'Send Notification'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Cooldown active + new messages sent
  if (!canNotifyNow && messageCount > 0) {
    return (
      <div className="border-b border-slate-200 bg-blue-50">
        <div className="px-6 py-3">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            
            <div className="flex-1 min-w-0">
              <div className="text-sm text-blue-900">
                <span className="font-medium">Notification sent</span>
                <span className="text-blue-700"> • {messageCount} {messageCount === 1 ? 'message' : 'messages'} waiting</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Send batch notification in {currentMinutes} {currentMinutes === 1 ? 'minute' : 'minutes'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Just notified - cooldown active (no new messages yet)
  return (
    <div className="border-b border-slate-200 bg-blue-50">
      <div className="px-6 py-3">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <div className="text-sm text-blue-900">
              <span className="font-medium">{recipientName} notified via email</span>
              <span className="text-blue-700"> • Continue typing</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Send another notification in {currentMinutes} {currentMinutes === 1 ? 'minute' : 'minutes'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}