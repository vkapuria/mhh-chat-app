'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

/**
 * Tracks user activity and logs to database
 * - Logs page views
 * - Sends heartbeats every 30s
 * - Updates current_page in user_presence
 * - Logs login/logout events
 */
export function useActivityTracker() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const lastLoggedPath = useRef<string | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const sessionStart = useRef<Date>(new Date());
  const isCleaningUp = useRef(false); // ADD THIS LINE

  // Log activity to database
  const logActivity = async (action: string, pagePath?: string) => {
    if (!user || isCleaningUp.current) return; // MODIFY THIS LINE


    try {
      await supabase.from('activity_log').insert({
        user_id: user.id,
        user_email: user.email,
        user_name: user.name,
        user_type: user.user_type,
        action,
        page_path: pagePath || pathname,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  // Update presence in database using UPSERT
  const updatePresence = async (status: 'online' | 'away' | 'offline', currentPage?: string) => {
    if (!user) return;

    try {
      // Use UPSERT to avoid duplicate key errors
      const { error } = await supabase
        .from('user_presence')
        .upsert(
          {
            user_id: user.id,
            user_email: user.email,
            user_name: user.name,
            user_type: user.user_type,
            status,
            last_seen: new Date().toISOString(),
            current_page: currentPage || pathname,
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            session_start: sessionStart.current.toISOString(),
          },
          {
            onConflict: 'user_id', // Update if user_id already exists
          }
        );

      if (error) {
        console.error('Failed to update presence:', error);
      }
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  };

  // Track page views
  useEffect(() => {
    if (!user || !pathname) return;

    // Only log if path changed
    if (pathname !== lastLoggedPath.current) {
      console.log('📊 Logging page view:', pathname);
      logActivity('page_view', pathname);
      updatePresence('online', pathname);
      lastLoggedPath.current = pathname;
    }
  }, [pathname, user]);

  // Send heartbeat every 30 seconds
  useEffect(() => {
    if (!user) return;

    // Initial heartbeat
    updatePresence('online');

    // Set up interval
    heartbeatInterval.current = setInterval(() => {
      console.log('💓 Sending heartbeat');
      logActivity('heartbeat');
      updatePresence('online');
    }, 30000); // 30 seconds

    // Cleanup
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [user]);

  // Handle logout/page close (mark offline)
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = () => {
      isCleaningUp.current = true; // ADD THIS
      
      // Use sendBeacon for reliable logout tracking
      const sessionDuration = Math.floor((Date.now() - sessionStart.current.getTime()) / 1000);
      
      const data = JSON.stringify({
        user_id: user.id,
        action: 'logout',
        session_duration: sessionDuration,
      });

      // Try sendBeacon (most reliable)
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/admin/activity', data);
      }
    };

    // Handle visibility change (tab hidden/shown)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('👁️ Tab hidden, marking as away');
        updatePresence('away');
      } else {
        console.log('👁️ Tab visible, marking as online');
        updatePresence('online');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Log login on mount (only once per session)
  useEffect(() => {
    if (!user) return;

    // Check if we already logged this session
    const sessionKey = `login_logged_${user.id}`;
    const alreadyLogged = sessionStorage.getItem(sessionKey);

    if (!alreadyLogged) {
      console.log('🔓 Logging user login');
      logActivity('login');
      sessionStorage.setItem(sessionKey, 'true');
      sessionStart.current = new Date();
    }
  }, [user?.id]); // Only run when user ID changes

  return null;
}