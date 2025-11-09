import { create } from 'zustand';

interface PresenceStore {
  // State: Set of user IDs who are currently online
  onlineUsers: Set<string>;
  
  // Actions
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  isUserOnline: (userId: string) => boolean;
  
  // Batch updates (for syncing with Supabase presence)
  syncOnlineUsers: (userIds: string[]) => void;
}

export const usePresenceStore = create<PresenceStore>((set, get) => ({
  onlineUsers: new Set<string>(),

  setUserOnline: (userId: string) => {
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      newSet.add(userId);
      console.log('🟢 User online:', userId, 'Total online:', newSet.size);
      return { onlineUsers: newSet };
    });
  },

  setUserOffline: (userId: string) => {
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      newSet.delete(userId);
      console.log('⚪ User offline:', userId, 'Total online:', newSet.size);
      return { onlineUsers: newSet };
    });
  },

  isUserOnline: (userId: string) => {
    return get().onlineUsers.has(userId);
  },

  syncOnlineUsers: (userIds: string[]) => {
    set({ onlineUsers: new Set(userIds) });
    console.log('🔄 Synced online users:', userIds.length, 'users');
  },
}));