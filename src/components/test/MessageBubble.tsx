'use client';

import { ChatMessage } from '@/types/chat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  viewAs: 'customer' | 'expert';
}

export function MessageBubble({ message, isCurrentUser, viewAs }: MessageBubbleProps) {
  const isSystem = message.sender_type === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full">
          {message.message_content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback 
          className={
            message.sender_type === 'customer' 
              ? 'bg-blue-600 text-white' 
              : 'bg-green-600 text-white'
          }
        >
          {message.sender_name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Message */}
      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs font-medium">
            {message.sender_name}
          </span>
          <span className="text-xs text-slate-500">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        </div>
        
        <div
          className={`rounded-2xl px-4 py-2 ${
            isCurrentUser
              ? viewAs === 'customer'
                ? 'bg-blue-600 text-white'
                : 'bg-green-600 text-white'
              : 'bg-slate-200 text-slate-900'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.message_content}
          </p>
        </div>
      </div>
    </div>
  );
}