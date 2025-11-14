import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationCooldown {
  orderId: string;
  lastNotifiedAt: string; // ISO timestamp
  lastNotifiedBy: string; // user_id
  messagesSinceLastNotification: number;
}

interface NotificationCooldownStore {
  // State
  cooldowns: Record<string, NotificationCooldown>; // orderId -> cooldown data
  
  // Computed
  getCooldown: (orderId: string) => NotificationCooldown | null;
  canNotifyNow: (orderId: string) => boolean;
  getMinutesUntilNextNotification: (orderId: string) => number;
  getMessagesSinceLastNotification: (orderId: string) => number;
  
  // Actions
  recordNotification: (orderId: string, userId: string) => void;
  incrementMessageCount: (orderId: string) => void;
  resetCooldown: (orderId: string) => void;
  clearOldCooldowns: () => void; // Clean up old entries
}

const COOLDOWN_MINUTES = 15; // 15 min

export const useNotificationCooldownStore = create<NotificationCooldownStore>()(
  persist(
    (set, get) => ({
      cooldowns: {},

      // Get cooldown data for an order
      getCooldown: (orderId: string) => {
        return get().cooldowns[orderId] || null;
      },

      // Check if we can send notification now (1 hour has passed)
      canNotifyNow: (orderId: string) => {
        const cooldown = get().cooldowns[orderId];
        if (!cooldown) return true; // No cooldown = can notify
        
        const lastNotifiedAt = new Date(cooldown.lastNotifiedAt).getTime();
        const now = Date.now();
        const minutesSince = (now - lastNotifiedAt) / (1000 * 60);
        
        return minutesSince >= COOLDOWN_MINUTES;
      },

      // Get minutes until next notification is allowed
      getMinutesUntilNextNotification: (orderId: string) => {
        const cooldown = get().cooldowns[orderId];
        if (!cooldown) return 0;
        
        const lastNotifiedAt = new Date(cooldown.lastNotifiedAt).getTime();
        const now = Date.now();
        const minutesSince = (now - lastNotifiedAt) / (1000 * 60);
        const remaining = Math.ceil(COOLDOWN_MINUTES - minutesSince);
        
        return remaining > 0 ? remaining : 0;
      },

      // Get count of messages since last notification
      getMessagesSinceLastNotification: (orderId: string) => {
        const cooldown = get().cooldowns[orderId];
        return cooldown?.messagesSinceLastNotification || 0;
      },

      // Record a new notification (resets cooldown)
      recordNotification: (orderId: string, userId: string) => {
        console.log('📧 Recording notification for order:', orderId);
        set((state) => ({
          cooldowns: {
            ...state.cooldowns,
            [orderId]: {
              orderId,
              lastNotifiedAt: new Date().toISOString(),
              lastNotifiedBy: userId,
              messagesSinceLastNotification: 0, // Reset counter
            },
          },
        }));
      },

      // Increment message count since last notification
      incrementMessageCount: (orderId: string) => {
        set((state) => {
          const existing = state.cooldowns[orderId];
          if (!existing) return state; // No cooldown = don't track
          
          return {
            cooldowns: {
              ...state.cooldowns,
              [orderId]: {
                ...existing,
                messagesSinceLastNotification: existing.messagesSinceLastNotification + 1,
              },
            },
          };
        });
      },

      // Reset cooldown for an order (e.g., when recipient comes online)
      resetCooldown: (orderId: string) => {
        console.log('🔄 Resetting cooldown for order:', orderId);
        set((state) => {
          const newCooldowns = { ...state.cooldowns };
          delete newCooldowns[orderId];
          return { cooldowns: newCooldowns };
        });
      },

      // Clean up cooldowns older than 24 hours
      clearOldCooldowns: () => {
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        set((state) => {
          const newCooldowns: Record<string, NotificationCooldown> = {};
          
          Object.entries(state.cooldowns).forEach(([orderId, cooldown]) => {
            const age = now - new Date(cooldown.lastNotifiedAt).getTime();
            if (age < oneDayMs) {
              newCooldowns[orderId] = cooldown;
            }
          });
          
          console.log('🧹 Cleaned up old cooldowns. Remaining:', Object.keys(newCooldowns).length);
          return { cooldowns: newCooldowns };
        });
      },
    }),
    {
      name: 'notification-cooldown-storage', // localStorage key
    }
  )
);