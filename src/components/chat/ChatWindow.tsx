'use client';

import { useChat } from '@/hooks/useChat';
import { usePresence } from '@/hooks/usePresence';
import { User } from '@/types/user';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { PresenceIndicator } from './PresenceIndicator';
import { Card } from '@/components/ui/card';

interface ChatWindowProps {
  orderId: string;
  user: User;
}

export function ChatWindow({ orderId, user }: ChatWindowProps) {
  const { messages, loading, error, sendMessage } = useChat(orderId, user);
  const presence = usePresence(orderId, user);

  const handleSendMessage = async (content: string, sendNotification: boolean) => {
    await sendMessage({
      order_id: orderId,
      message_content: content,
      send_notification: sendNotification,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Card className="p-6 max-w-md">
          <p className="text-red-600 text-center">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Presence Indicator */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <PresenceIndicator presence={presence} userType={user.user_type} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} currentUserId={user.id} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 p-4">
        <MessageInput 
          onSend={handleSendMessage} 
          otherUserOnline={presence.otherUserOnline}
        />
      </div>
    </div>
  );
}