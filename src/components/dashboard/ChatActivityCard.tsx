'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUnreadMessagesStore } from '@/store/unread-messages-store';
import { ChatBubbleLeftRightIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface ChatActivityCardProps {
  conversations: any[];
  userType: 'customer' | 'expert';
}

export function ChatActivityCard({ conversations, userType }: ChatActivityCardProps) {
  const router = useRouter();
  const getOrderUnread = useUnreadMessagesStore((state) => state.getOrderUnread);

  // Get top 3 conversations with unread messages
  const unreadConversations = conversations
    .map(conv => ({
      ...conv,
      unreadCount: getOrderUnread(conv.id),
    }))
    .filter(conv => conv.unreadCount > 0)
    .sort((a, b) => b.unreadCount - a.unreadCount)
    .slice(0, 3);

  const totalUnread = unreadConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Active Chats</h3>
            <p className="text-xs text-slate-500">
              {totalUnread > 0 ? `${totalUnread} unread` : 'All caught up'}
            </p>
          </div>
        </div>
        {totalUnread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center min-w-[28px] h-7 px-2 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse"
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </motion.span>
        )}
      </div>

      {/* Conversations List */}
      {unreadConversations.length > 0 ? (
        <div className="space-y-2 mb-4">
          {unreadConversations.map((conv) => {
            const otherPartyName = userType === 'customer'
              ? (conv.expert_display_name || conv.expert_name)
              : (conv.customer_display_name || conv.customer_name);

            return (
              <button
                key={conv.id}
                onClick={() => router.push(`/messages?orderId=${conv.id}`)}
                className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors group"
              >
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {conv.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {otherPartyName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full">
                    {conv.unreadCount}
                  </span>
                  <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-500">No unread messages</p>
          <p className="text-xs text-slate-400 mt-1">You're all caught up! 🎉</p>
        </div>
      )}

      {/* View All Button */}
      <button
        onClick={() => router.push('/messages')}
        className="w-full py-2.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all"
      >
        View All Messages →
      </button>
    </motion.div>
  );
}
