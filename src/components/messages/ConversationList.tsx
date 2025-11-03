'use client';

import { formatDistanceToNow, format } from 'date-fns';

interface Conversation {
  id: string;
  title: string;
  task_code: string;
  order_date: string;
  amount: number;
  expert_fee?: number;
  customer_name?: string;
  expert_name?: string;
  customer_display_name?: string;
  expert_display_name?: string;
  lastMessage?: {
    sender_id: string;
    message_content: string;
    created_at: string;
  };
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  userType: 'customer' | 'expert';
  activeOrderId?: string;
  onSelectConversation: (orderId: string) => void;
  currentUserId?: string;
}

export function ConversationList({
  conversations,
  userType,
  activeOrderId,
  onSelectConversation,
  currentUserId,
}: ConversationListProps) {
  // Split conversations into active (has messages) and inactive (no messages)
  const activeConversations = conversations.filter(c => c.lastMessage !== null);
  const inactiveConversations = conversations.filter(c => c.lastMessage === null);

  // Sort active by last message time (most recent first)
  activeConversations.sort((a, b) => {
    const aTime = a.lastMessage?.created_at || '';
    const bTime = b.lastMessage?.created_at || '';
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  // Sort inactive by order date (newest first)
  inactiveConversations.sort((a, b) => {
    return new Date(b.order_date).getTime() - new Date(a.order_date).getTime();
  });

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-slate-400 text-sm mb-2">No conversations yet</p>
          <p className="text-slate-600">
            Orders with assigned {userType === 'customer' ? 'experts' : 'customers'} will appear here
          </p>
        </div>
      </div>
    );
  }

  function renderConversationItem(conversation: Conversation, isActive: boolean) {
    const isSelected = activeOrderId === conversation.id;
    
    // Use display name for privacy
    const otherPartyDisplayName = userType === 'customer' 
      ? (conversation.expert_display_name || conversation.expert_name)
      : (conversation.customer_display_name || conversation.customer_name);

    // Contextual messaging based on chat status
    const otherPartyLabel = userType === 'customer' ? 'Expert' : 'Customer';
    const hasMessages = conversation.lastMessage !== null;
    const chatPrompt = hasMessages 
      ? `Chatting with ${otherPartyLabel}: ${otherPartyDisplayName}`
      : `Chat with ${otherPartyLabel}: ${otherPartyDisplayName}`;

    // Display amount based on user type
    const displayAmount = userType === 'customer' 
      ? `$${conversation.amount}` 
      : `₹${conversation.expert_fee || conversation.amount}`;

    const amountColor = userType === 'expert' ? 'text-green-600' : 'text-slate-700';

    return (
      <button
        key={conversation.id}
        onClick={() => onSelectConversation(conversation.id)}
        className={`w-full text-left px-4 py-4 min-h-[80px] border-b border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors relative ${
          isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
        }`}
      >
        {/* Top row: Title + Amount */}
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-slate-900 text-sm leading-tight pr-2 flex-1">
            {conversation.title}
          </h3>
          <span className={`font-bold text-sm whitespace-nowrap ${amountColor}`}>
            {displayAmount}
          </span>
        </div>

        {/* Second row: Task code + Date with emoji */}
        <div className="text-xs text-slate-500 mb-1 font-mono">
          📋 {conversation.task_code} • 📅 {format(new Date(conversation.order_date), 'MMM d, yyyy')}
        </div>

        {/* Third row: Contextual chat prompt with chip */}
        <div className="text-sm text-slate-600 mb-1 flex items-center gap-1.5 flex-wrap">
          <span>{hasMessages ? 'Chatting with' : 'Chat with'} {otherPartyLabel}:</span>
          <span className={`
            px-2 py-0.5 text-xs font-medium rounded
            ${userType === 'customer' 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'bg-green-100 text-green-700 border border-green-200'
            }
          `}>
            {otherPartyDisplayName}
          </span>
        </div>

        {/* Fourth row: Status */}
        <div className="flex items-center justify-between">
          {isActive && conversation.lastMessage ? (
            <div className="flex-1">
              <p className="text-xs text-slate-500">
                💬 Last activity: {formatDistanceToNow(new Date(conversation.lastMessage.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              📭 No messages yet
            </p>
          )}

          {/* Unread badge (only for active) */}
          {isActive && conversation.unreadCount > 0 && (
            <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Active Conversations Section */}
      {activeConversations.length > 0 && (
        <div>
          <div className="sticky top-0 bg-green-50 px-4 py-2 border-b border-green-200 z-10">
            <h3 className="text-xs font-bold text-green-700 uppercase tracking-wide">
              🟢 Active Conversations ({activeConversations.length})
            </h3>
          </div>
          {activeConversations.map(conv => renderConversationItem(conv, true))}
        </div>
      )}

      {/* Inactive Conversations Section */}
      {inactiveConversations.length > 0 && (
        <div>
          <div className="sticky top-0 bg-gray-500 px-4 py-2 border-b border-slate-200 z-10">
            <h3 className="text-xs font-bold text-white uppercase tracking-wide">
              ⚪ Inactive Conversations ({inactiveConversations.length})
            </h3>
          </div>
          {inactiveConversations.map(conv => renderConversationItem(conv, false))}
        </div>
      )}
    </div>
  );
}