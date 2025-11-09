'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePresenceStore } from '@/store/presence-store';

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const { setUserOnline, setUserOffline } = usePresenceStore();

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
      console.log('👤 Setting up global presence for user:', user.id);

      // Create GLOBAL presence channel (all users subscribe to this)
      presenceChannel = supabase.channel('global-presence', {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel!.presenceState();
          const onlineUserIds = Object.keys(state);
          
          console.log('✅ Global presence synced:', onlineUserIds.length, 'users online');
          
          // Update store with ALL online users
          onlineUserIds.forEach(id => setUserOnline(id));
        })
        .on('presence', { event: 'join' }, ({ key }) => {
          console.log('🟢 User joined globally:', key);
          setUserOnline(key);
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          console.log('⚪ User left globally:', key);
          setUserOffline(key);
        })
        .subscribe(async (status) => {
          console.log('📡 Global presence subscription status:', status);
          if (status === 'SUBSCRIBED') {
            // Track current user's presence
            const trackResult = await presenceChannel?.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
            console.log('🟢 User is now online globally:', trackResult);
          }
        });
    }

    setupPresence();

    // Cleanup on unmount or logout
    return () => {
      if (presenceChannel) {
        console.log('🔴 Cleaning up global presence channel');
        supabase.removeChannel(presenceChannel);
      }
    };
  }, [setUserOnline, setUserOffline]);

  return <>{children}</>;
}