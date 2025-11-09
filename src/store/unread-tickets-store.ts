import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UnreadTicket {
  ticketId: string;
  unreadCount: number;
  lastReplyAt: string;
}

interface UnreadTicketsStore {
  // State
  unreadTickets: Record<string, UnreadTicket>; // ticketId -> unread info
  
  // Computed
  getTotalUnread: () => number;
  getTicketUnread: (ticketId: string) => number;
  
  // Actions
  incrementUnread: (ticketId: string, replyTimestamp: string) => void;
  markTicketAsRead: (ticketId: string) => void;
  markAllAsRead: () => void;
  
  // Initialize from server data (when page loads)
  initializeFromTickets: (tickets: any[]) => void;
}

export const useUnreadTicketsStore = create<UnreadTicketsStore>()(
  persist(
    (set, get) => ({
      unreadTickets: {},

      // Get total unread count across all tickets
      getTotalUnread: () => {
        const unreadTickets = get().unreadTickets;
        return Object.values(unreadTickets).reduce(
          (total, ticket) => total + ticket.unreadCount,
          0
        );
      },

      // Get unread count for specific ticket
      getTicketUnread: (ticketId: string) => {
        return get().unreadTickets[ticketId]?.unreadCount || 0;
      },

      // Increment unread count when new admin reply comes in
      incrementUnread: (ticketId: string, replyTimestamp: string) => {
        set((state) => ({
          unreadTickets: {
            ...state.unreadTickets,
            [ticketId]: {
              ticketId,
              unreadCount: (state.unreadTickets[ticketId]?.unreadCount || 0) + 1,
              lastReplyAt: replyTimestamp,
            },
          },
        }));
      },

      // Mark specific ticket as read (when user opens it)
      markTicketAsRead: (ticketId: string) => {
        set((state) => {
          const { [ticketId]: _, ...rest } = state.unreadTickets;
          return { unreadTickets: rest };
        });
      },

      // Clear all unread (optional - for "mark all as read" feature)
      markAllAsRead: () => {
        set({ unreadTickets: {} });
      },

      // Initialize store from server data when app loads
      // This checks which tickets have admin replies after user's last visit
      initializeFromTickets: (tickets: any[]) => {
        const unreadTickets: Record<string, UnreadTicket> = {};
        
        tickets.forEach((ticket) => {
          // Only count tickets where last reply was from admin
          if (ticket.last_reply_by === 'admin' && ticket.status !== 'resolved') {
            // Check if ticket already has unread count in store
            const existingUnread = get().unreadTickets[ticket.id];
            
            if (!existingUnread) {
              // New unread ticket - count admin replies
              const adminReplies = ticket.replies?.filter(
                (r: any) => r.reply_type === 'admin'
              ) || [];
              
              if (adminReplies.length > 0) {
                unreadTickets[ticket.id] = {
                  ticketId: ticket.id,
                  unreadCount: 1, // Just show badge, don't count exact number
                  lastReplyAt: ticket.updated_at,
                };
              }
            } else {
              // Keep existing unread count
              unreadTickets[ticket.id] = existingUnread;
            }
          }
        });
        
        set({ unreadTickets });
      },
    }),
    {
      name: 'unread-tickets-storage', // localStorage key
      partialize: (state) => ({ unreadTickets: state.unreadTickets }), // Only persist this field
    }
  )
);
