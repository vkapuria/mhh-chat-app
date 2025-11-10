'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUnreadMessagesStore } from '@/store/unread-messages-store';
import { ChatBubbleLeftRightIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface ChatActivityCardProps {
  conversations: any[];
  userType: 'customer' | 'expert';
}

function getInitials(name?: string) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function trimText(s?: string, max = 72) {
  if (!s) return '';
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

function formatRelative(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffSec = Math.max(1, Math.floor((now.getTime() - d.getTime()) / 1000));

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ChatActivityCard({ conversations, userType }: ChatActivityCardProps) {
  const router = useRouter();
  const getOrderUnread = useUnreadMessagesStore((s) => s.getOrderUnread);

  const enriched = conversations.map((conv) => {
    const unreadCount = getOrderUnread(conv.id);
    const otherPartyName =
      userType === 'customer'
        ? (conv.expert_display_name || conv.expert_name)
        : (conv.customer_display_name || conv.customer_name);

    // Get avatar URL
    const otherPartyAvatar = 
      userType === 'customer'
        ? conv.expert_avatar
        : conv.customer_avatar;

    const last = conv.lastMessage || null;
    const lastText = trimText(last?.message_content || conv.last_message || '');
    const lastTime = formatRelative(last?.created_at || conv.updated_at || conv.chat_closed_at || '');

    return {
      ...conv,
      otherPartyName,
      otherPartyAvatar,
      unreadCount,
      lastText,
      lastTime,
    };
  });

  const unread = enriched.filter((c) => c.unreadCount > 0).sort((a, b) => b.unreadCount - a.unreadCount);
  const fallbackLatest = enriched
    .slice()
    .sort((a, b) => new Date(b.updated_at || b.lastMessage?.created_at || 0).getTime()
                   - new Date(a.updated_at || a.lastMessage?.created_at || 0).getTime());

  const list = (unread.length ? unread : fallbackLatest).slice(0, 3);
  const totalUnread = unread.reduce((s, c) => s + c.unreadCount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05 }}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 leading-none">Active Chats</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'All caught up'}
            </p>
          </div>
        </div>
      </div>

      {/* Bubble strips with separators */}
      {list.length ? (
        <div className="space-y-0 mb-3">
          {list.map((c: any, index: number) => (
            <div key={c.id}>
              <button
                onClick={() => router.push(`/messages?orderId=${c.id}`)}
                className="w-full text-left px-3 py-2.5 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar - Real or Initials */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center mt-0.5 ring-2 ring-white shadow-sm">
                    {c.otherPartyAvatar ? (
                      <Image
                        src={c.otherPartyAvatar}
                        alt={c.otherPartyName}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      getInitials(c.otherPartyName)
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate">{c.id}</p>
                      <span className="text-[11px] text-slate-400 shrink-0">{c.lastTime}</span>
                    </div>

                    {/* tiny meta row */}
                    <div className="text-[11px] text-slate-500 mb-1">{c.otherPartyName}</div>

                    {/* message bubble */}
                    <div className="inline-block max-w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 shadow-sm shadow-slate-900/20">
                      <p className="text-xs text-white/95 truncate">{c.lastText || '—'}</p>
                    </div>
                  </div>

                  {/* Right: unread + arrow */}
                  <div className="flex items-center gap-2 ml-1">
                    {c.unreadCount > 0 && (
                      <span className="flex items-center justify-center min-w-[22px] h-5 px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full">
                        {c.unreadCount > 99 ? '99+' : c.unreadCount}
                      </span>
                    )}
                    <ArrowRightIcon className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </button>

              {/* Separator - Don't show after last item */}
              {index < list.length - 1 && (
                <div className="border-b border-slate-300 my-1.5" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-500">No unread messages</p>
          <p className="text-xs text-slate-400 mt-1">You're all caught up! 🎉</p>
        </div>
      )}

      {/* View All */}
      <button
        onClick={() => router.push('/messages')}
        className="w-full py-2.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all"
      >
        View All Messages →
      </button>
    </motion.div>
  );
}