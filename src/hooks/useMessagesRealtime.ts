'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUnreadMessagesStore } from '@/store/unread-messages-store';

/**
 * Subscribe to realtime message events
 * Increments unread count when OTHER party sends a message
 */
export function useMessagesRealtime(userId: string | null) {
  const incrementUnread = useUnreadMessagesStore((state) => state.incrementUnread);

  useEffect(() => {
    if (!userId) {
      console.log('⚠️ No userId provided, skipping messages realtime setup');
      return;
    }

    console.log('💬 Setting up messages realtime subscription for user:', userId);

    // Subscribe to new messages
    const channel = supabase
      .channel('chat-messages-realtime', {
        config: {
          broadcast: { self: true },
          presence: { key: userId },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          console.log('💬 RAW MESSAGE PAYLOAD:', JSON.stringify(payload, null, 2));
          
          const newMessage = payload.new as any;
          
          console.log('💬 Message details:', {
            messageId: newMessage.id,
            orderId: newMessage.order_id,
            senderId: newMessage.sender_id,
            senderName: newMessage.sender_display_name || newMessage.sender_name,
            content: newMessage.message_content?.substring(0, 50) + '...',
          });
          
          // Only increment unread if message is NOT from current user
          if (newMessage.sender_id !== userId) {
            console.log('✅ Message from other party, incrementing unread for order:', newMessage.order_id);
            incrementUnread(newMessage.order_id, newMessage.created_at);
          } else {
            console.log('ℹ️ Message from current user, ignoring');
          }
        }
      )
      .subscribe((status, err) => {
        console.log('💬 Messages realtime subscription status:', status);
        if (err) {
          console.error('❌ Messages subscription error:', err);
        }
      });

    // Cleanup
    return () => {
      console.log('💬 Cleaning up messages realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, incrementUnread]);
}