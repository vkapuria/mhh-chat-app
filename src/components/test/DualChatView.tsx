'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChatMessage } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface DualChatViewProps {
  orderId: string;
}

export function DualChatView({ orderId }: DualChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [customerMessage, setCustomerMessage] = useState('');
  const [expertMessage, setExpertMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch messages and subscribe to realtime
  useEffect(() => {
    if (!orderId) return;

    console.log('🔵 Test page: Setting up for order:', orderId);
    
    fetchMessages();

    // Subscribe to realtime
    const channel = supabase
      .channel(`test-dual-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log('🟢 Test page: Realtime message received!', payload.new);
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe((status) => {
        console.log('🔵 Test page: Subscription status:', status);
      });

    return () => {
      console.log('🔴 Test page: Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const customerDiv = document.getElementById('customer-messages');
    const expertDiv = document.getElementById('expert-messages');
    
    if (customerDiv) customerDiv.scrollTop = customerDiv.scrollHeight;
    if (expertDiv) expertDiv.scrollTop = expertDiv.scrollHeight;
  }, [messages]);

  const fetchMessages = async () => {
    const response = await fetch(`/api/test/messages?orderId=${orderId}`);
    const result = await response.json();
    
    if (result.success && result.messages) {
      setMessages(result.messages);
    }
  };

  const sendMessage = async (senderType: 'customer' | 'expert', content: string) => {
    if (!content.trim() || loading) return;

    setLoading(true);

    const messageData = {
      order_id: orderId,
      sender_type: senderType,
      sender_id: senderType === 'customer' 
        ? 'a1285bd1-2f03-45c4-b00b-3d49bbf2e239' 
        : '2150a07b-203c-49c2-ab37-5d3c48a311b4',
      sender_name: senderType === 'customer' ? 'Test Customer' : 'Test Expert Support',
      message_content: content,
      notification_sent: false,
    };

    // Use direct Supabase insert (will trigger realtime)
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(messageData)
      .select()
      .single();

    if (!error && data) {
      if (senderType === 'customer') {
        setCustomerMessage('');
      } else {
        setExpertMessage('');
      }
    } else {
      console.error('Insert error:', error);
    }

    setLoading(false);
  };

  return (
    <div className="h-full flex">
      {/* Customer Side */}
      <div className="flex-1 flex flex-col border-r-4 border-blue-500 bg-white">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4">
          <h2 className="text-xl font-bold">👤 CUSTOMER VIEW</h2>
          <p className="text-blue-100 text-sm">customer@test.com</p>
        </div>

        {/* Messages */}
        <div 
          id="customer-messages" 
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              isCurrentUser={msg.sender_type === 'customer'}
              viewAs="customer"
            />
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-slate-50">
          <div className="flex gap-2">
            <Textarea
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage('customer', customerMessage);
                }
              }}
              placeholder="Type as customer..."
              rows={2}
              disabled={loading}
            />
            <Button
              onClick={() => sendMessage('customer', customerMessage)}
              disabled={!customerMessage.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expert Side */}
      <div className="flex-1 flex flex-col border-l-4 border-green-500 bg-white">
        {/* Header */}
        <div className="bg-green-600 text-white px-6 py-4">
          <h2 className="text-xl font-bold">👨‍💼 EXPERT VIEW</h2>
          <p className="text-green-100 text-sm">expert@test.com</p>
        </div>

        {/* Messages */}
        <div 
          id="expert-messages"
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              isCurrentUser={msg.sender_type === 'expert'}
              viewAs="expert"
            />
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-slate-50">
          <div className="flex gap-2">
            <Textarea
              value={expertMessage}
              onChange={(e) => setExpertMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage('expert', expertMessage);
                }
              }}
              placeholder="Type as expert..."
              rows={2}
              disabled={loading}
            />
            <Button
              onClick={() => sendMessage('expert', expertMessage)}
              disabled={!expertMessage.trim() || loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}