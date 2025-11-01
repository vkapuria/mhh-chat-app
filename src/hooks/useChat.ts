'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ChatMessage, SendMessageData, ChatState } from '@/types/chat';
import { User } from '@/types/user';
import {
  subscribeToMessages,
  subscribeToMessageUpdates,
  unsubscribeFromChannel,
} from '@/lib/realtime';
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

  // Send message
  // Send message
  const sendMessage = async (data: SendMessageData) => {
    console.log('🔵 Step 1: sendMessage called', { data, user, orderId });
    
    if (!user || !orderId) {
      console.error('🔴 No user or orderId');
      return { success: false, error: 'Not authenticated' };
    }

    console.log('🔵 Step 2: User and orderId OK');

    try {
      console.log('🔵 Step 3: Building insert data...');
      
      const insertData = {
        order_id: data.order_id,
        sender_type: user.user_type,
        sender_id: user.id,
        sender_name: user.name,
        message_content: data.message_content,
        notification_sent: data.send_notification || false,
      };

      console.log('🔵 Step 4: Insert data built:', insertData);

      console.log('🔵 Step 5: Calling supabase.from...');
      
      const insertPromise = supabase
        .from('chat_messages')
        .insert(insertData)
        .select()
        .single();

      console.log('🔵 Step 6: Waiting for response...');
      
      const { data: newMessage, error } = await insertPromise;

      console.log('🔵 Step 7: Got response:', { newMessage, error });

      if (error) {
        console.error('🔴 Insert error:', error);
        throw error;
      }

      console.log('✅ Step 8: Message sent successfully');

      // Add to local state
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, newMessage],
      }));

      console.log('✅ Step 9: State updated');

      return { success: true, error: null };
    } catch (err) {
      console.error('🔴 Caught error at some step:', err);
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

    console.log('🔵 Setting up realtime for order:', orderId);

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
        (payload) => {
          console.log('🟢 New message received:', payload.new);
          const newMessage = payload.new as ChatMessage;
          
          // Only add if not from current user (avoid duplicates from optimistic update)
          if (newMessage.sender_id !== user.id) {
            setState((prev) => ({
              ...prev,
              messages: [...prev.messages, newMessage],
            }));
          }
        }
      )
      .subscribe((status) => {
        console.log('🔵 Messages channel status:', status);
      });

    // Subscribe to message updates (read status)
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
          console.log('🟡 Message updated:', payload.new);
          const updatedMessage = payload.new as ChatMessage;
          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            ),
          }));
        }
      )
      .subscribe((status) => {
        console.log('🔵 Updates channel status:', status);
      });

    setChannels([messagesChannel, updatesChannel]);

    return () => {
      console.log('🔴 Cleaning up realtime channels');
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(updatesChannel);
    };
  }, [orderId, user?.id]); // Changed dependency

  return {
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    sendMessage,
    refetch: fetchMessages,
  };
}