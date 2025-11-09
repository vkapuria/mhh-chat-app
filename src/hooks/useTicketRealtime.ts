'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUnreadTicketsStore } from '@/store/unread-tickets-store';

/**
 * Subscribe to realtime ticket reply events
 * Increments unread count when admin replies to user's tickets
 */
export function useTicketRealtime(userId: string | null) {
  const incrementUnread = useUnreadTicketsStore((state) => state.incrementUnread);

  useEffect(() => {
    if (!userId) {
      console.log('⚠️ No userId provided, skipping realtime setup');
      return;
    }

    console.log('🔔 Setting up ticket realtime subscription for user:', userId);

    // Subscribe to new ticket replies
    const channel = supabase
      .channel('ticket-replies-realtime', {
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
          table: 'ticket_replies',
        },
        (payload) => {
          console.log('🔔 RAW PAYLOAD RECEIVED:', JSON.stringify(payload, null, 2));
          
          const newReply = payload.new as any;
          
          console.log('🔔 Reply details:', {
            replyId: newReply.id,
            ticketId: newReply.ticket_id,
            replyType: newReply.reply_type,
            adminId: newReply.admin_id,
            message: newReply.message?.substring(0, 50) + '...',
          });
          
          // Only increment unread for admin replies (not user's own replies)
          if (newReply.reply_type === 'admin') {
            console.log('✅ Admin reply detected, incrementing unread for ticket:', newReply.ticket_id);
            incrementUnread(newReply.ticket_id, newReply.created_at);
          } else {
            console.log('ℹ️ User reply detected, ignoring:', newReply.reply_type);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('🔔 Ticket realtime subscription status:', status);
        if (err) {
          console.error('❌ Subscription error:', err);
        }
      });

    // Cleanup
    return () => {
      console.log('🔔 Cleaning up ticket realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, incrementUnread]);
}