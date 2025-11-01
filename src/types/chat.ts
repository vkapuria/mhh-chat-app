// Chat and messaging types
export type SenderType = 'customer' | 'expert' | 'admin' | 'system';

export interface ChatMessage {
  id: string;
  order_id: string;
  sender_type: SenderType;
  sender_id: string;
  sender_name: string;
  message_content: string;
  notification_sent: boolean;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface ChatPresence {
  user_id: string;
  user_type: 'customer' | 'expert';
  user_name: string;
  is_online: boolean;
  last_seen: string;
}

export interface SendMessageData {
  order_id: string;
  message_content: string;
  send_notification?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

export interface PresenceState {
  isOnline: boolean;
  lastSeen: string | null;
  otherUserOnline: boolean;
  otherUserLastSeen: string | null;
}