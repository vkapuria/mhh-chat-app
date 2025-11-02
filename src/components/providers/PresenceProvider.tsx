'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let presenceChannel: ReturnType<typeof supabase.channel> | null = null;

    async function setupPresence() {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('❌ No user - skipping presence setup');
        return;
      }

      setUserId(user.id);
      console.log('👤 Setting up presence for user:', user.id);
      console.log('📢 Channel name:', `presence-user-${user.id}`);

      // Create user-specific presence channel
      presenceChannel = supabase.channel(`presence-user-${user.id}`, {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel!.presenceState();
          console.log('✅ Presence synced, state:', state);
        })
        .on('presence', { event: 'join' }, ({ key }) => {
          console.log('✅ Joined presence, key:', key);
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          console.log('❌ Left presence, key:', key);
        })
        .subscribe(async (status) => {
          console.log('📡 Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            // Track presence - this keeps the user "online" globally
            const trackResult = await presenceChannel?.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
            console.log('🟢 Track result:', trackResult);
            console.log('🟢 User is now online globally');
          }
        });
    }

    setupPresence();

    // Cleanup on unmount or logout
    return () => {
      if (presenceChannel) {
        console.log('🔴 Cleaning up presence channel');
        supabase.removeChannel(presenceChannel);
      }
    };
  }, []);

  return <>{children}</>;
}