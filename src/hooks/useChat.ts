'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ChatMessage, SendMessageData, ChatState } from '@/types/chat';
import { User } from '@/types/user';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useChat(orderId: string | null, user: User | null) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    loading: true,
    error: null,
    hasMore: false,
  });

  const [channels, setChannels] = useState<RealtimeChannel[]>([]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!orderId || !user) return;

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setState({
        messages: data || [],
        loading: false,
        error: null,
        hasMore: false,
      });

      // Mark messages as read
      await markMessagesAsRead(orderId, user);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch messages',
      }));
    }
  }, [orderId, user]);

  // Send message with email notification support
  const sendMessage = async (data: SendMessageData) => {
    if (!user || !orderId) {
      return { success: false, error: 'Not authenticated' };
    }
  
    try {
      const insertData = {
        order_id: data.order_id,
        sender_type: user.user_type,
        sender_id: user.id,
        sender_name: user.name,
        message_content: data.message_content,
        notification_sent: false,
      };
  
      const { data: newMessage, error } = await supabase
        .from('chat_messages')
        .insert(insertData)
        .select()
        .single();
  
      if (error) {
        console.error('Insert error:', error);
        return { success: false, error: error.message };
      }
  
      // Add to local state
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, newMessage],
      }));
  
      // Send email if requested
      if (data.send_notification) {
        try {
          const response = await fetch('/api/messages/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: data.order_id,
              messageId: newMessage.id,
            }),
          });
  
          const result = await response.json();
          
          return { 
            success: true, 
            error: null, 
            emailSent: result.emailSent || false 
          };
        } catch (emailError) {
          return { 
            success: true, 
            error: null, 
            emailSent: false 
          };
        }
      }
  
      return { success: true, error: null, emailSent: false };
    } catch (err) {
      console.error('Send message error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to send message',
      };
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (orderId: string, user: User) => {
    await supabase
      .from('chat_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('order_id', orderId)
      .eq('is_read', false)
      .neq('sender_type', user.user_type);
  };

  // Subscribe to realtime updates
useEffect(() => {
  if (!orderId || !user) return;

  fetchMessages();

  // Subscribe to new messages
  const messagesChannel = supabase
    .channel(`order-${orderId}-messages`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `order_id=eq.${orderId}`,
      },
      async (payload) => {
        const newMessage = payload.new as ChatMessage;
        
        // Only add if not from current user (avoid duplicates from optimistic update)
        if (newMessage.sender_id !== user.id) {
          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, newMessage],
          }));

          // Immediately mark as read since user is viewing the chat
          await supabase
            .from('chat_messages')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', newMessage.id)
            .eq('is_read', false);
        }
      }
    )
    .subscribe();

  // Subscribe to message updates (read status, notification_sent updates)
  const updatesChannel = supabase
    .channel(`order-${orderId}-updates`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `order_id=eq.${orderId}`,
      },
      (payload) => {
        const updatedMessage = payload.new as ChatMessage;
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === updatedMessage.id ? updatedMessage : msg
          ),
        }));
      }
    )
    .subscribe();

  setChannels([messagesChannel, updatesChannel]);

  return () => {
    supabase.removeChannel(messagesChannel);
    supabase.removeChannel(updatesChannel);
  };
}, [orderId, user?.id]);

  return {
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    sendMessage,
    refetch: fetchMessages,
  };
}