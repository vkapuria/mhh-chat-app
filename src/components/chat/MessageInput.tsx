'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useNotificationCooldownStore } from '@/store/notification-cooldown-store';

interface MessageInputProps {
  onSend: (content: string, shouldNotify: boolean) => Promise<any>;
  otherUserOnline: boolean;
  orderId: string;
  currentUserId: string;
}

export function MessageInput({ onSend, otherUserOnline, orderId, currentUserId }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning' | null;
    message: string;
  }>({ type: null, message: '' });

  const recordNotification = useNotificationCooldownStore((state) => state.recordNotification);
  const incrementMessageCount = useNotificationCooldownStore((state) => state.incrementMessageCount);
  const getCooldown = useNotificationCooldownStore((state) => state.getCooldown);

  const handleSubmit = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    setFeedback({ type: null, message: '' });

    const cooldown = getCooldown(orderId);
    const isFirstMessage = !cooldown;
    
    // Auto-notify logic:
    // - If recipient offline AND first message → notify
    // - Otherwise → just send to chat
    const shouldNotify = !otherUserOnline && isFirstMessage;

    const result = await onSend(message, shouldNotify);

    if (result.success) {
      setMessage('');
      
      if (shouldNotify) {
        // Record this notification in cooldown store
        recordNotification(orderId, currentUserId);
        
        if (result.emailSent) {
          setFeedback({
            type: 'success',
            message: '✅ Message sent & recipient notified via email'
          });
        } else {
          setFeedback({
            type: 'warning',
            message: '⚠️ Message sent but email notification failed'
          });
        }
      } else {
        // Just increment message count (for batch notification later)
        if (!otherUserOnline && cooldown) {
          incrementMessageCount(orderId);
        }
      }
      
      // Clear feedback after 3 seconds
      setTimeout(() => {
        setFeedback({ type: null, message: '' });
      }, 3000);
    } else {
      setFeedback({
        type: 'error',
        message: `❌ Failed to send: ${result.error}`
      });
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={sending}
        rows={3}
        className="resize-none"
      />
      
      {/* Feedback Message */}
      {feedback.type && (
        <div className={`text-xs px-3 py-2 rounded-md ${
          feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          feedback.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-yellow-50 text-yellow-700 border border-yellow-200'
        }`}>
          {feedback.message}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {sending ? 'Sending...' : 'Press Enter to send, Shift+Enter for new line'}
        </p>
        
        {/* Single Send Button */}
        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || sending}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Sending...
            </>
          ) : (
            <>
              <PaperAirplaneIcon className="w-4 h-4 mr-2" />
              Send
            </>
          )}
        </Button>
      </div>
    </div>
  );
}