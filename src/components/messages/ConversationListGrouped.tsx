'use client';

import { useState, useMemo } from 'react';
import { ChevronDownIcon, ChevronRightIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useUnreadMessagesStore } from '@/store/unread-messages-store';

interface Conversation {
    id: string;
    title: string;
    task_code: string;
    order_date: string;
    amount: number;
    expert_fee?: number;
    customer_name?: string;
    customer_display_name?: string;
    customer_email?: string;
    expert_name?: string;
    expert_display_name?: string;
    expert_email?: string;
    status?: string;
    updated_at?: string;  // ADD THIS LINE
    chat_status?: string;
    chat_closed_at?: string;
    conversation_status?: 'active' | 'ready' | 'closed';
    lastMessage?: {
      sender_id: string;
      message_content: string;
      created_at: string;
    };
    unreadCount: number;
  }

interface ConversationListGroupedProps {
  conversations: Conversation[];
  userType: 'customer' | 'expert';
  activeOrderId?: string;
  onSelectConversation: (orderId: string) => void;
  currentUserId: string;
}

export function ConversationListGrouped({
  conversations,
  userType,
  activeOrderId,
  onSelectConversation,
  currentUserId,
}: ConversationListGroupedProps) {
  
  const [closedExpanded, setClosedExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const getOrderUnread = useUnreadMessagesStore((state) => state.getOrderUnread);

  // Filter and sort conversations
const { filteredAndSorted, searchResultsCount } = useMemo(() => {
  // Apply search filter
  let filtered = conversations;
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = conversations.filter(c => {
      const otherPartyName = userType === 'customer' 
        ? (c.expert_display_name || c.expert_name || '')
        : (c.customer_display_name || c.customer_name || '');
      
      return (
        c.title?.toLowerCase().includes(query) ||
        c.task_code?.toLowerCase().includes(query) ||
        c.id?.toLowerCase().includes(query) ||
        otherPartyName.toLowerCase().includes(query)
      );
    });
  }

  // Sort by status and date
  const sortedFiltered = [...filtered].sort((a, b) => {
    // Active: Most recent message first
    if (a.conversation_status === 'active' && b.conversation_status === 'active') {
      const aTime = a.lastMessage?.created_at || a.updated_at || a.order_date;
      const bTime = b.lastMessage?.created_at || b.updated_at || b.order_date;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    }
    
    // Ready: Newest assignment first
    if (a.conversation_status === 'ready' && b.conversation_status === 'ready') {
      return new Date(b.order_date).getTime() - new Date(a.order_date).getTime();
    }
    
    // Closed: Most recent order date first
    if (a.conversation_status === 'closed' && b.conversation_status === 'closed') {
        return new Date(b.order_date).getTime() - new Date(a.order_date).getTime();
    }
    
    return 0;
  });

  // Group by status
  const active = sortedFiltered.filter(c => c.conversation_status === 'active');
  const ready = sortedFiltered.filter(c => c.conversation_status === 'ready');
  const closed = sortedFiltered.filter(c => c.conversation_status === 'closed');
  
  return { 
    filteredAndSorted: { active, ready, closed },
    searchResultsCount: filtered.length 
  };
}, [conversations, searchQuery, userType]);

const grouped = filteredAndSorted;

  const renderConversation = (conversation: Conversation) => {
    const isActive = conversation.id === activeOrderId;
    const otherPartyName = userType === 'customer' 
      ? (conversation.expert_display_name || conversation.expert_name)
      : (conversation.customer_display_name || conversation.customer_name);

    const price = userType === 'expert' 
      ? conversation.expert_fee || conversation.amount 
      : conversation.amount;

    return (
      <div
        key={conversation.id}
        onClick={() => onSelectConversation(conversation.id)}
        className={`
          p-4 border-b border-slate-200 cursor-pointer transition-colors
          hover:bg-slate-50
          ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}
        `}
      >
        {/* Title & Price */}
<div className="flex items-start justify-between gap-2 mb-2">
  <h3 className="font-semibold text-slate-900 line-clamp-2 flex-1 text-sm">
    {conversation.title}
  </h3>
  <span className="text-green-600 font-bold whitespace-nowrap text-sm">
    ₹{price}
  </span>
</div>

        {/* Task Code & Date */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <span>{conversation.id}</span>
          <span>•</span>
          <span>📅 {new Date(conversation.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>

        {/* Chatting with / Chat with */}
        <div className="text-sm text-slate-600 mb-2">
          <span className="text-slate-500">
            {conversation.lastMessage ? 'Chatting with' : 'Chat with'} {userType === 'customer' ? 'Expert' : 'Customer'}:
          </span>{' '}
          <span className="bg-black text-white px-2 py-0.5 rounded text-xs font-medium">
            {otherPartyName}
          </span>
        </div>

        {/* Last Message or Status */}
{conversation.conversation_status === 'closed' ? (
  // Closed chat messaging
  <div className="space-y-1">
    {conversation.lastMessage ? (
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <span>💬</span>
        <span>Last activity: {formatRelativeTime(conversation.lastMessage.created_at)}</span>
      </div>
    ) : (
      <div className="flex items-center gap-1.5 text-xs italic text-slate-400">
        <span>🔇</span>
        <span>No messages received</span>
      </div>
    )}
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <span>🔒</span>
      <span>
        Closed {conversation.chat_closed_at 
          ? formatRelativeTime(conversation.chat_closed_at)
          : 'after completion'}
      </span>
    </div>
  </div>
) : conversation.lastMessage ? (
  // Active/Ready with messages
  <div className="flex items-center gap-1.5 text-xs text-slate-500">
    <span>💬</span>
    <span>Last activity: {formatRelativeTime(conversation.lastMessage.created_at)}</span>
  </div>
) : (
  // Active/Ready without messages
  <div className="flex items-center gap-1.5 text-xs italic text-slate-400">
    <span>🔇</span>
    <span>No messages yet</span>
  </div>
)}

        {/* Unread Badge */}
        {getOrderUnread(conversation.id) > 0 && (
          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shrink-0">
            {getOrderUnread(conversation.id) > 9 ? '9+' : getOrderUnread(conversation.id)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
    {/* Search Bar */}
    <div className="sticky top-0 z-20 bg-white border-b border-slate-200 p-3">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversations..."
          className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      {searchQuery && (
        <p className="text-xs text-slate-500 mt-2">
          {searchResultsCount} result{searchResultsCount !== 1 ? 's' : ''} for "{searchQuery}"
        </p>
      )}
    </div>
     {/* Scrollable Content */}
     <div className="flex-1 overflow-y-auto min-h-0">

      {/* Active Chats */}
      {grouped.active.length > 0 && (
        <div className="mb-0">
          <div className="bg-green-50 border-b border-green-100 px-4 py-2.5 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide">
                Active Chats ({grouped.active.length})
              </h3>
            </div>
          </div>
          {grouped.active.map(renderConversation)}
        </div>
      )}

      {/* Ready to Start */}
      {grouped.ready.length > 0 && (
        <div className="mb-0">
          <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide">
                Ready to Start ({grouped.ready.length})
              </h3>
            </div>
          </div>
          {grouped.ready.map(renderConversation)}
        </div>
      )}

      {/* Closed Conversations - Collapsible */}
      {grouped.closed.length > 0 && (
        <div>
          <button
            onClick={() => setClosedExpanded(!closedExpanded)}
            className="w-full bg-slate-100 border-b border-slate-200 px-4 py-2.5 sticky top-0 z-10 flex items-center justify-between hover:bg-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              {closedExpanded ? (
                <ChevronDownIcon className="w-4 h-4 text-slate-600" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-slate-600" />
              )}
              <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">
                Closed ({grouped.closed.length})
              </h3>
            </div>
          </button>
          
          {closedExpanded && grouped.closed.map(renderConversation)}
        </div>
      )}

      {/* Empty State */}
      {conversations.length === 0 && (
        <div className="p-8 text-center text-slate-400">
          <p>No conversations yet</p>
        </div>
      )}
    </div>
    </div>
  );
}

// Helper function for relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMins < 1) return 'just now';
  if (diffInMins < 60) return `${diffInMins} min${diffInMins > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}