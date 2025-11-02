'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PaperAirplaneIcon, BellIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface MessageInputProps {
  onSend: (content: string, sendNotification: boolean) => Promise<any>;
  otherUserOnline: boolean;
}

export function MessageInput({ onSend, otherUserOnline }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleSubmit = async (sendNotification: boolean) => {
    if (!message.trim() || sending) return;

    setSending(true);
    setFeedback({ type: null, message: '' });

    const result = await onSend(message, sendNotification);

    if (result.success) {
      setMessage('');
      
      // Show feedback based on notification status
      if (sendNotification) {
        if (result.emailSent) {
          setFeedback({
            type: 'success',
            message: '✅ Message sent & email notification delivered!'
          });
        } else if (result.emailError) {
          setFeedback({
            type: 'warning',
            message: '⚠️ Message sent but email notification failed'
          });
        } else {
          setFeedback({
            type: 'success',
            message: '✅ Message sent successfully'
          });
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
      handleSubmit(!otherUserOnline); // Auto-notify if other user is offline
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
        
        <div className="flex gap-2">
          {/* When both online, just show one Send button */}
          {otherUserOnline ? (
            <Button
              onClick={() => handleSubmit(false)}
              disabled={!message.trim() || sending}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
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
          ) : (
            <>
              {/* Send without notification */}
              <Button
                onClick={() => handleSubmit(false)}
                disabled={!message.trim() || sending}
                variant="outline"
                size="sm"
              >
                <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                Send Only
              </Button>

              {/* Send with email notification */}
              <Button
                onClick={() => handleSubmit(true)}
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
                    <BellIcon className="w-4 h-4 mr-2" />
                    Send & Notify
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}