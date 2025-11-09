import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UnreadOrder {
  orderId: string;
  unreadCount: number;
  lastMessageAt: string;
}

interface UnreadMessagesStore {
  // State
  unreadOrders: Record<string, UnreadOrder>; // orderId -> unread info
  
  // Computed
  getTotalUnread: () => number;
  getOrderUnread: (orderId: string) => number;
  
  // Actions
  incrementUnread: (orderId: string, messageTimestamp: string) => void;
  markOrderAsRead: (orderId: string) => void;
  markAllAsRead: () => void;
  
  // Initialize from server data (when page loads)
  initializeFromConversations: (conversations: any[]) => void;
}

export const useUnreadMessagesStore = create<UnreadMessagesStore>()(
  persist(
    (set, get) => ({
      unreadOrders: {},

      // Get total unread count across all orders
      getTotalUnread: () => {
        const unreadOrders = get().unreadOrders;
        return Object.values(unreadOrders).reduce(
          (total, order) => total + order.unreadCount,
          0
        );
      },

      // Get unread count for specific order
      getOrderUnread: (orderId: string) => {
        return get().unreadOrders[orderId]?.unreadCount || 0;
      },

      // Increment unread count when new message arrives
      incrementUnread: (orderId: string, messageTimestamp: string) => {
        set((state) => {
          const currentCount = state.unreadOrders[orderId]?.unreadCount || 0;
          const newCount = currentCount + 1;
          
          console.log('📨 Incrementing message unread:', {
            orderId,
            currentCount,
            newCount,
            timestamp: messageTimestamp
          });
          
          return {
            unreadOrders: {
              ...state.unreadOrders,
              [orderId]: {
                orderId,
                unreadCount: newCount,
                lastMessageAt: messageTimestamp,
              },
            },
          };
        });
      },

      // Mark specific order as read (when user opens chat)
      markOrderAsRead: (orderId: string) => {
        console.log('✅ Marking order as read:', orderId);
        set((state) => {
          const { [orderId]: _, ...rest } = state.unreadOrders;
          return { unreadOrders: rest };
        });
      },

      // Clear all unread (optional)
      markAllAsRead: () => {
        set({ unreadOrders: {} });
      },

      // Initialize store from server data when app loads
      initializeFromConversations: (conversations: any[]) => {
        const unreadOrders: Record<string, UnreadOrder> = {};
        
        conversations.forEach((conv) => {
          // Use existing unreadCount from API response
          if (conv.unreadCount > 0) {
            const existingUnread = get().unreadOrders[conv.id];
            
            if (!existingUnread) {
              // New unread order
              unreadOrders[conv.id] = {
                orderId: conv.id,
                unreadCount: conv.unreadCount,
                lastMessageAt: conv.lastMessage?.created_at || new Date().toISOString(),
              };
            } else {
              // Keep existing unread count
              unreadOrders[conv.id] = existingUnread;
            }
          }
        });
        
        set({ unreadOrders });
      },
    }),
    {
      name: 'unread-messages-storage', // localStorage key
      partialize: (state) => ({ unreadOrders: state.unreadOrders }),
    }
  )
);