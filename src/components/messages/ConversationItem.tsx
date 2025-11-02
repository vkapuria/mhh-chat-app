import { formatDistanceToNow } from 'date-fns';

interface ConversationItemProps {
  conversation: {
    id: string;
    title: string;
    customer_name?: string;
    expert_name?: string;
    lastMessage?: {
      message_content: string;
      created_at: string;
      sender_type: string;
    } | null;
    unreadCount: number;
  };
  userType: 'customer' | 'expert';
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  userType,
  isActive,
  onClick,
}: ConversationItemProps) {
  const otherPersonName =
    userType === 'customer' ? conversation.expert_name : conversation.customer_name;

  const lastMessagePreview = conversation.lastMessage
    ? conversation.lastMessage.message_content.substring(0, 50) +
      (conversation.lastMessage.message_content.length > 50 ? '...' : '')
    : 'No messages yet';

  const lastMessageTime = conversation.lastMessage
    ? formatDistanceToNow(new Date(conversation.lastMessage.created_at), { addSuffix: true })
    : '';

  return (
    <div
      onClick={onClick}
      className={`
        p-4 border-b border-slate-200 cursor-pointer transition-colors
        ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{conversation.title}</h3>
          <p className="text-sm text-slate-600 truncate">{otherPersonName || 'Unknown'}</p>
        </div>
        {conversation.unreadCount > 0 && (
          <span className="ml-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            {conversation.unreadCount}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 truncate flex-1">{lastMessagePreview}</p>
        {lastMessageTime && <span className="text-xs text-slate-400 ml-2">{lastMessageTime}</span>}
      </div>
    </div>
  );
}