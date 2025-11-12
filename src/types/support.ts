export type TicketStatus = 'submitted' | 'in_progress' | 'resolved';

export interface SupportTicket {
  id: string;
  
  // Order context
  order_id: string;
  order_title: string;
  task_code: string;
  order_amount?: number; // ADD THIS if missingorder_amount?: number; // ADD THIS if missing
  
  // User info
  user_id: string;
  user_email: string;
  user_name: string;
  user_display_name: string;
  user_avatar_url?: string | null;  // ← ADD THIS LINE
  user_type: 'customer' | 'expert';

  // Admin creation tracking
  created_by_admin_id?: string | null;
  created_by_admin_name?: string | null;
  
  // Ticket details
  issue_type: string;
  message: string;
  status: TicketStatus;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  
  // Metadata
  amount?: number;
  expert_fee?: number;
  customer_email?: string;
  expert_email?: string;
  
  // Relations (joined data)
  replies?: TicketReply[];
  reply_count?: number;

  last_reply_by?: 'admin' | 'user' | null;
}

export interface TicketReply {
  id: string;
  ticket_id: string;
  admin_id: string;
  admin_name: string;
  message: string;
  created_at: string;
}

export interface CreateTicketRequest {
  order_id: string;
  order_title: string;
  task_code: string;
  issue_type: string;
  message: string;
  
  // Order context
  amount?: number;
  expert_fee?: number;
  customer_email?: string;
  expert_email?: string;
}

export interface UpdateTicketStatusRequest {
  status: TicketStatus;
}

export interface CreateReplyRequest {
  message: string;
}

// Admin ticket creation types
export interface AdminCreateTicketRequest {
  order_id: string;
  recipient_type: 'customer' | 'expert';
  recipient_id: string;
  recipient_email: string;
  recipient_name: string;
  issue_type: string;
  subject: string;
  message: string;
}

export interface OrderSearchResult {
  id: string;
  title: string;
  task_code?: string;
  status: string;
  customer_name: string;
  customer_display_name?: string;
  customer_email: string;
  customer_id: string;
  expert_name?: string;
  expert_display_name?: string;
  expert_email?: string;
  expert_id?: string;
  amount: number;
  expert_fee?: number;
  created_at: string;
  updated_at: string;
}