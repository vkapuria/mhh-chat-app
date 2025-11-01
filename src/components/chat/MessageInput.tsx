'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PaperAirplaneIcon, BellIcon } from '@heroicons/react/24/outline';

interface MessageInputProps {
  onSend: (content: string, sendNotification: boolean) => Promise<void>;
  otherUserOnline: boolean;
}

export function MessageInput({ onSend, otherUserOnline }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (sendNotification: boolean) => {
    if (!message.trim() || sending) return;

    setSending(true);
    await onSend(message, sendNotification);
    setMessage('');
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
      
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
        
        <div className="flex gap-2">
          {/* Send button (no notification) */}
          <Button
            onClick={() => handleSubmit(false)}
            disabled={!message.trim() || sending}
            variant="outline"
            size="sm"
          >
            <PaperAirplaneIcon className="w-4 h-4 mr-2" />
            Send
          </Button>

          {/* Send & Notify button (appears when other user is offline) */}
          {!otherUserOnline && (
            <Button
              onClick={() => handleSubmit(true)}
              disabled={!message.trim() || sending}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <BellIcon className="w-4 h-4 mr-2" />
              Send & Notify
            </Button>
          )}

          {/* When both online, just show one button */}
          {otherUserOnline && (
            <Button
              onClick={() => handleSubmit(false)}
              disabled={!message.trim() || sending}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <PaperAirplaneIcon className="w-4 h-4 mr-2" />
              {sending ? 'Sending...' : 'Send'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}