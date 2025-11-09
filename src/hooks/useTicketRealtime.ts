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
    if (!userId) return;

    console.log('🔔 Setting up ticket realtime subscription for user:', userId);

    // Subscribe to new ticket replies
    const channel = supabase
      .channel('ticket-replies-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_replies',
        },
        (payload) => {
          console.log('🔔 New ticket reply:', payload);
          
          const newReply = payload.new as any;
          
          // Only increment unread for admin replies (not user's own replies)
          if (newReply.reply_type === 'admin') {
            console.log('✅ Admin reply detected, incrementing unread for ticket:', newReply.ticket_id);
            incrementUnread(newReply.ticket_id, newReply.created_at);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Ticket realtime subscription status:', status);
      });

    // Cleanup
    return () => {
      console.log('🔔 Cleaning up ticket realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, incrementUnread]);
}
