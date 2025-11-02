'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { 
  PaperAirplaneIcon, 
  BellIcon,
  CheckIcon,
  } from '@heroicons/react/24/outline';
import { createClient } from '@supabase/supabase-js';

interface Message {
  id: string;
  order_id: string;
  sender_type: 'customer' | 'expert';
  sender_id: string;
  sender_name: string;
  message_content: string;
  is_read: boolean;
  notification_sent: boolean;
  created_at: string;
}

interface ChatWindowProps {
  orderId: string;
  orderTitle: string;
  currentUserType: 'customer' | 'expert';
  currentUserId: string;
  otherPartyName: string;
  otherPartyEmail?: string;
  otherPartyId?: string;  // Add this!
}

export function ChatWindow({
  orderId,
  orderTitle,
  currentUserType,
  currentUserId,
  otherPartyName,
  otherPartyEmail,
  otherPartyId,  // Add this line!
}: ChatWindowProps) {

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOtherPartyOnline, setIsOtherPartyOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add this new useEffect right after the state declarations (around line 50)
useEffect(() => {
  // Reset presence state when conversation changes
  setIsOtherPartyOnline(false);
  console.log('🔄 Conversation changed, resetting presence state');
}, [orderId]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up real-time subscriptions
  useEffect(() => {
    // IMMEDIATELY reset presence state when conversation changes
    setIsOtherPartyOnline(false);
    console.log('🔄 Conversation changed, resetting presence to false');

    fetchMessages();
    
    // Set up message subscription for this order
    const messageChannel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log('📨 New message received:', payload);
          setMessages((prev) => [...prev, payload.new as Message]);
          
          // Mark as read if not from current user
          if (payload.new.sender_id !== currentUserId) {
            markAsRead(payload.new.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log('✏️ Message updated:', payload);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? (payload.new as Message) : msg
            )
          );
        }
      )
      .subscribe();

    // Set up presence subscription for other party (ONLY if we have their ID)
    let presenceChannel: ReturnType<typeof supabase.channel> | null = null;

    if (otherPartyId) {
      console.log('👥 Subscribing to other party presence:', otherPartyId);
      console.log('📢 Subscribing to channel:', `presence-user-${otherPartyId}`);
      
      presenceChannel = supabase.channel(`presence-user-${otherPartyId}`, {
        config: {
          presence: {
            key: currentUserId,
          },
        },
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel!.presenceState();
          const onlineUsers = Object.keys(state);
          
          // Check if other party is online (they'll have their own ID as key)
          const isOnline = onlineUsers.includes(otherPartyId);
          setIsOtherPartyOnline(isOnline);
          console.log('👥 Presence sync in ChatWindow:', { 
            state, 
            onlineUsers, 
            otherPartyId,
            isOnline 
          });
        })
        .on('presence', { event: 'join' }, ({ key }) => {
          console.log('✅ User joined presence in ChatWindow:', key);
          if (key === otherPartyId) {
            setIsOtherPartyOnline(true);
          }
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          console.log('❌ User left presence in ChatWindow:', key);
          if (key === otherPartyId) {
            setIsOtherPartyOnline(false);
          }
        })
        .subscribe((status) => {
          console.log('📡 ChatWindow subscription status:', status);
        });
    } else {
      console.log('⚠️ No otherPartyId provided, keeping presence as false');
    }

    // Cleanup function - CRITICAL!
    return () => {
      console.log('🧹 Cleaning up channels for order:', orderId);
      supabase.removeChannel(messageChannel);
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
      // Reset state on cleanup too
      setIsOtherPartyOnline(false);
    };
  }, [orderId, currentUserId, otherPartyId]);  // Re-run when ANY of these change

  async function fetchMessages() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
  
      const response = await fetch(`/api/messages?orderId=${orderId}`, {
        headers,
      });
      
      const data = await response.json();
      
      console.log('📨 Fetched messages:', data.messages?.length || 0);
      
      if (data.success) {
        setMessages(data.messages || []);
        
        // Mark unread messages as read
        const unreadMessages = data.messages.filter(
          (msg: Message) => !msg.is_read && msg.sender_id !== currentUserId
        );
        
        for (const msg of unreadMessages) {
          await markAsRead(msg.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(messageId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messageId }),
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  async function sendMessage(notify: boolean = false) {
    if (!newMessage.trim() || sending) return;
  
    setSending(true);
  
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !session) {
        console.error('No user session');
        setSending(false);
        return;
      }
  
      console.log('Sending message with data:', {
        order_id: orderId,
        sender_type: currentUserType,
        sender_id: currentUserId,
        sender_name: user.user_metadata?.name || 'User',
      });
  
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          sender_type: currentUserType,     // Make sure this is included!
          sender_id: currentUserId,         // Make sure this is included!
          sender_name: user.user_metadata?.name || 'User',
          message_content: newMessage.trim(),
          send_notification: notify,
        }),
      });
  
      if (response.ok) {
        setNewMessage('');
        console.log('✅ Message sent successfully');
        
        // If notify requested, send email
        if (notify && otherPartyEmail) {
          console.log('📧 Sending notification email...');
          await fetch('/api/messages/notify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              orderId,
              orderTitle,
              recipientEmail: otherPartyEmail,
              recipientName: otherPartyName,
              senderName: user.user_metadata?.name,
              messageContent: newMessage.trim(),
            }),
          });
        }
      } else {
        const error = await response.json();
        console.error('Failed to send message:', error);
      }
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setSending(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
<div className="border-b border-slate-200 bg-white">
  {/* Status Bar - Show for everyone */}
  {isOtherPartyOnline ? (
    // Online - Green bar
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-2 border-b border-green-200">
      <div className="flex items-center justify-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span className="text-sm font-semibold text-green-700">
          {currentUserType === 'customer' ? 'Expert' : 'Customer'} Online
        </span>
      </div>
    </div>
  ) : (
    // Offline - Black bar with red dot
    <div className="bg-slate-800 px-6 py-2 border-b border-slate-700">
      <div className="flex items-center justify-center gap-2">
        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
        <span className="text-sm font-medium text-white">
          {currentUserType === 'customer' ? 'Expert' : 'Customer'} Offline
        </span>
      </div>
    </div>
  )}

  {/* Title Bar */}
  <div className="px-6 py-4 bg-slate-50">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{orderTitle}</h2>
        <p className="text-sm text-slate-600">
          Chatting with {otherPartyName}
        </p>
      </div>
    </div>
  </div>
</div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isOwn && (
                    <span className="text-xs text-slate-500 mb-1 px-1">
                      {message.sender_name}
                    </span>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.message_content}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 mt-1 px-1">
                    <span className="text-xs text-slate-400">
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                    {isOwn && (
                      <span className="text-xs">
                        {message.is_read ? (
                          <span className="flex items-center gap-0.5">
                            <CheckIcon className="w-3 h-3 text-blue-500" />
                            <CheckIcon className="w-3 h-3 text-blue-500 -ml-1.5" />
                          </span>
                        ) : (
                          <CheckIcon className="w-3 h-3 text-slate-400" />
                        )}
                      </span>
                    )}
                    {isOwn && message.notification_sent && (
                      <BellIcon className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
        <div className="flex gap-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={sending}
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={() => sendMessage(false)}
              disabled={sending || !newMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              Send
            </button>
            <button
              onClick={() => sendMessage(true)}
              disabled={sending || !newMessage.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              <BellIcon className="w-4 h-4" />
              Notify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}