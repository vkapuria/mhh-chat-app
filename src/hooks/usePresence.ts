'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { PresenceState } from '@/types/chat';
import { subscribeToPresence, unsubscribeFromChannel } from '@/lib/realtime';
import { RealtimeChannel } from '@supabase/supabase-js';

export function usePresence(orderId: string | null, user: User | null) {
  const [presence, setPresence] = useState<PresenceState>({
    isOnline: false,
    lastSeen: null,
    otherUserOnline: false,
    otherUserLastSeen: null,
  });

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!orderId || !user) return;

    const presenceChannel = subscribeToPresence(
      orderId,
      user.id,
      user.name,
      user.user_type === 'customer' ? 'customer' : 'expert',
      (presenceState) => {
        // Find other user in presence
        const presenceUsers = Object.values(presenceState).flat();
        const otherUser = presenceUsers.find(
          (p: any) => p.user_id !== user.id
        );

        setPresence({
          isOnline: true,
          lastSeen: new Date().toISOString(),
          otherUserOnline: !!otherUser,
          otherUserLastSeen: (otherUser as any)?.online_at || null,
        });
      }
    );

    setChannel(presenceChannel);

    return () => {
      if (presenceChannel) {
        unsubscribeFromChannel(presenceChannel);
      }
    };
  }, [orderId, user]);

  return presence;
}