import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Subscribe to new messages in a specific order
export function subscribeToMessages(
  orderId: string,
  onNewMessage: (message: any) => void
): RealtimeChannel {
  const channel = supabase
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
        onNewMessage(payload.new);
      }
    )
    .subscribe();

  return channel;
}

// Subscribe to message updates (read status, etc.)
export function subscribeToMessageUpdates(
  orderId: string,
  onMessageUpdate: (message: any) => void
): RealtimeChannel {
  const channel = supabase
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
        onMessageUpdate(payload.new);
      }
    )
    .subscribe();

  return channel;
}

// Subscribe to presence (who's online)
export function subscribeToPresence(
  orderId: string,
  userId: string,
  userName: string,
  userType: 'customer' | 'expert',
  onPresenceChange: (presence: any) => void
): RealtimeChannel {
  const channel = supabase.channel(`order-${orderId}-presence`, {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  // Track own presence
  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      onPresenceChange(state);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', key, leftPresences);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          user_name: userName,
          user_type: userType,
          online_at: new Date().toISOString(),
        });
      }
    });

  return channel;
}

// Unsubscribe from a channel
export function unsubscribeFromChannel(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}

// Unsubscribe from all channels
export function unsubscribeAll() {
  supabase.removeAllChannels();
}