'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { 
  PaperAirplaneIcon, 
  BellIcon,
  } from '@heroicons/react/24/outline';
import { trackMessageSent } from '@/lib/analytics';
import { usePresenceStore } from '@/store/presence-store';

interface Message {
  id: string;
  order_id: string;
  sender_type: 'customer' | 'expert';
  sender_id: string;
  sender_name: string;
  sender_display_name: string;
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
  otherPartyId?: string;
  isClosed?: boolean;
  closedReason?: string;
}

export function ChatWindow({
  orderId,
  orderTitle,
  currentUserType,
  currentUserId,
  otherPartyName,
  otherPartyEmail,
  otherPartyId,
  isClosed = false,
  closedReason,
}: ChatWindowProps) {

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isOtherPartyTyping, setIsOtherPartyTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const otherPartyTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use global presence store instead of local state
  const isUserOnline = usePresenceStore((state) => state.isUserOnline);
  const isOtherPartyOnline = otherPartyId ? isUserOnline(otherPartyId) : false;

  // Debug: Log state changes
  useEffect(() => {
    console.log('🎨 isOtherPartyTyping changed to:', isOtherPartyTyping);
  }, [isOtherPartyTyping]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when window becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const unreadMessages = messages.filter(
          (msg) => !msg.is_read && msg.sender_id !== currentUserId
        );
        
        unreadMessages.forEach((msg) => {
          markAsRead(msg.id);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [messages, currentUserId]);

  // Set up real-time subscriptions
  useEffect(() => {
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

    // Set up typing indicator channel
    const typingChannel = supabase.channel(`typing-${orderId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    typingChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('⌨️ Typing event received:', payload);
        
        // Only show typing if it's from the other party
        if (payload.payload.user_id === otherPartyId && payload.payload.is_typing) {
          console.log('✅ Setting isOtherPartyTyping to TRUE');
          setIsOtherPartyTyping(true);
          
          // Clear existing timeout
          if (otherPartyTypingTimeoutRef.current) {
            clearTimeout(otherPartyTypingTimeoutRef.current);
          }
          
          // Auto-hide after 5 seconds
          otherPartyTypingTimeoutRef.current = setTimeout(() => {
            setIsOtherPartyTyping(false);
          }, 5000);
        } else if (payload.payload.user_id === otherPartyId && !payload.payload.is_typing) {
          setIsOtherPartyTyping(false);
          if (otherPartyTypingTimeoutRef.current) {
            clearTimeout(otherPartyTypingTimeoutRef.current);
          }
        }
      })
      .subscribe((status) => {
        console.log('📡 Typing channel subscription status:', status);
        if (status === 'SUBSCRIBED') {
          typingChannelRef.current = typingChannel;
          console.log('✅ Typing channel ready for broadcasting');
        }
      });

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up channels for order:', orderId);
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(typingChannel);
      
      if (otherPartyTypingTimeoutRef.current) {
        clearTimeout(otherPartyTypingTimeoutRef.current);
      }
      
      setIsOtherPartyTyping(false);
    };
  }, [orderId, currentUserId, otherPartyId]);

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
        
        if (document.visibilityState === 'visible') {
          const unreadMessages = data.messages.filter(
            (msg: Message) => !msg.is_read && msg.sender_id !== currentUserId
          );
          
          for (const msg of unreadMessages) {
            await markAsRead(msg.id);
          }
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
  
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          sender_type: currentUserType,
          sender_id: currentUserId,
          sender_name: user.user_metadata?.name || 'User',
          sender_display_name: user.user_metadata?.display_name || 'User',
          message_content: newMessage.trim(),
          send_notification: notify,
        }),
      });
  
      if (response.ok) {
        trackMessageSent({
          orderId: orderId,
          userType: currentUserType,
          messageLength: newMessage.trim().length,
        });
        
        setNewMessage('');
        console.log('✅ Message sent successfully');
        
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
              senderName: user.user_metadata?.display_name || user.user_metadata?.name,
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

  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  function broadcastTyping(isTyping: boolean) {
    if (!typingChannelRef.current) {
      console.warn('⚠️ Typing channel not ready');
      return;
    }
    
    console.log('📤 Broadcasting typing:', { user_id: currentUserId, is_typing: isTyping });
    
    typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: currentUserId,
        is_typing: isTyping,
      },
    });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setNewMessage(e.target.value);
    
    if (e.target.value.trim() && !isTyping) {
      setIsTyping(true);
      broadcastTyping(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      broadcastTyping(false);
    }, 5000);
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
        {/* Status Bar */}
        {isOtherPartyOnline ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-2 border-b border-green-200">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-semibold text-green-700">
                {currentUserType === 'customer' ? 'Expert' : 'Customer'} Online
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 px-6 py-2 border-b border-slate-700">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="text-sm font-medium text-white">
                {currentUserType === 'customer' ? 'Expert' : 'Customer'} Offline
              </span>
            </div>
          </div>
        )}

        {/* Title Bar - Hidden on mobile */}
        <div className="hidden md:block px-6 py-4 bg-slate-50 border-b border-slate-200">
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
                      {message.sender_display_name}
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
                  {/* Status line */}
                  <div className="flex items-center gap-2 mt-1 px-1 text-xs">
                    {isOwn && (
                      <div className="flex items-center gap-1">
                        <AnimatePresence mode="wait">
                          {message.is_read ? (
                            <motion.div
                              key="read"
                              initial={{ y: 10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -10, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="flex items-center gap-1"
                            >
                              <div className="flex items-center -space-x-1">
                                <motion.img
                                  src="/icons/read.svg"
                                  alt=""
                                  className="w-3 h-3"
                                  initial={{ y: 10, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  transition={{ duration: 0.3, delay: 0 }}
                                />
                                <motion.img
                                  src="/icons/read.svg"
                                  alt=""
                                  className="w-3 h-3"
                                  initial={{ y: 10, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  transition={{ duration: 0.3, delay: 0.15 }}
                                />
                              </div>
                              <motion.span
                                className="text-blue-600 font-medium"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.3 }}
                              >
                                Read
                              </motion.span>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="sent"
                              initial={{ y: 10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -10, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="flex items-center gap-1"
                            >
                              <img src="/icons/sent.svg" alt="" className="w-3 h-3" />
                              <span className="text-slate-500">Sent</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                    
                    {isOwn && message.notification_sent && (
                      <>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-1">
                          <img src="/icons/gmail.svg" alt="" className="w-3 h-3" />
                          <span className="text-slate-500">Emailed</span>
                        </div>
                      </>
                    )}
                    
                    {(isOwn || true) && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400">
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <AnimatePresence>
        {isOtherPartyTyping && (
          <div className="px-6 py-0 flex justify-center">
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full md:w-4/5 bg-slate-900 rounded-t-xl px-4 py-2 overflow-hidden"
            >
              <div className="flex items-center justify-center gap-2">
                <div className="flex gap-1">
                  <motion.span
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.span
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.span
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
                <span className="text-sm text-white font-medium">
                  {otherPartyName} is typing...
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Input or Closed Banner */}
      {isClosed ? (
        <div className="px-6 py-8 border-t border-slate-200 bg-slate-50">
          <div className="max-w-md mx-auto text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Chat Closed
              </h3>
              <p className="text-sm text-slate-600">
                {closedReason || 'This conversation was auto-closed 48 hours after order completion.'}
              </p>
            </div>
            <div className="pt-4">
              <button
                onClick={() => window.location.href = '/support'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Contact Support
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex gap-3">
            <textarea
              value={newMessage}
              onChange={handleInputChange}
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
                className="px-4 py-3 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Send</span>
              </button>
              <button
                onClick={() => sendMessage(true)}
                disabled={sending || !newMessage.trim()}
                className="px-4 py-3 min-h-[44px] bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
              >
                <BellIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Notify</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}