'use client';

import { useRef, useEffect } from 'react';
import { ChatMessage } from '@/types/chat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircleIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <p className="text-muted-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground mt-2">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isCurrentUser = message.sender_id === currentUserId;
        const isSystem = message.sender_type === 'system';

        if (isSystem) {
          return (
            <div key={message.id} className="flex justify-center">
              <div className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full">
                {message.message_content}
              </div>
            </div>
          );
        }

        return (
          <div
            key={message.id}
            className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className={isCurrentUser ? 'bg-blue-600 text-white' : 'bg-slate-300'}>
                {message.sender_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Message Bubble */}
            <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-medium text-slate-700">
                  {message.sender_name}
                </span>
                <span className="text-xs text-slate-500">
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </span>
              </div>
              
              <div
                className={`rounded-2xl px-4 py-2 ${
                  isCurrentUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.message_content}
                </p>
              </div>

              {/* Read receipts - only show for messages YOU sent */}
              {isCurrentUser && (
                <div className="flex items-center gap-1 mt-1">
                  {message.is_read ? (
                    <>
                      <CheckCircleIcon className="w-3 h-3 text-blue-600" />
                      <span className="text-xs text-blue-600">Read</span>
                    </>
                  ) : (
                    <>
                      <ChatBubbleLeftIcon className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-400">Sent</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}