'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/card';

interface ChatMessage {
  id: string;
  order_id: string;
  sender_type: 'customer' | 'expert' | 'system';
  sender_id: string;
  sender_name: string;
  message_content: string;
  is_read: boolean;
  notification_sent: boolean;
  created_at: string;
}

interface ChatViewerProps {
  orderId: string;
}

export function ChatViewer({ orderId }: ChatViewerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrderAndMessages();
    subscribeToMessages();
  }, [orderId]);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchOrderAndMessages = async () => {
    try {
      // Use admin API to bypass RLS
      const response = await fetch(`/api/admin/chats/${orderId}`);
      const data = await response.json();
  
      if (!data.success) {
        throw new Error(data.error || 'Failed to load chat');
      }
  
      setOrderInfo(data.order);
      setMessages(data.messages);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    // Subscribe to new messages in real-time
    const channel = supabase
      .channel(`admin-chat-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-600">Loading chat...</p>
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
    <div className="flex flex-col h-full">
      {/* Order Info Header */}
      {orderInfo && (
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-700">Customer:</span>{' '}
              <span className="text-slate-900">{orderInfo.customer_name}</span>
              <span className="text-slate-500 ml-2">({orderInfo.customer_email})</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Expert:</span>{' '}
              <span className="text-slate-900">{orderInfo.expert_name || 'Not assigned'}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Status:</span>{' '}
              <span className="text-slate-900">{orderInfo.status}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Amount:</span>{' '}
              <span className="text-slate-900">${orderInfo.amount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-slate-500">No messages yet</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isCustomer = message.sender_type === 'customer';
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
                className={`flex gap-3 ${isCustomer ? 'flex-row' : 'flex-row-reverse'}`}
              >
                {/* Avatar */}
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback
                    className={isCustomer ? 'bg-slate-300' : 'bg-blue-600 text-white'}
                  >
                    {message.sender_name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Message Bubble */}
                <div
                  className={`flex flex-col ${
                    isCustomer ? 'items-start' : 'items-end'
                  } max-w-[70%]`}
                >
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
                      isCustomer
                        ? 'bg-white border border-slate-200 text-slate-900'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.message_content}
                    </p>
                  </div>

                  {/* Read status indicator */}
                  <div className="flex items-center gap-1 mt-1">
                    {message.is_read ? (
                      <span className="text-xs text-blue-600">✓ Read</span>
                    ) : (
                      <span className="text-xs text-slate-400">Sent</span>
                    )}
                    {message.notification_sent && (
                      <span className="text-xs text-slate-400 ml-2">📧 Notified</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ghost Mode Indicator */}
      <div className="bg-purple-50 border-t border-purple-200 px-4 py-3 text-center">
        <p className="text-sm text-purple-700">
          👻 <strong>Ghost Mode Active:</strong> You are viewing this chat in read-only mode.
          Users cannot see you.
        </p>
      </div>
    </div>
  );
}