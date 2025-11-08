export type TicketStatus = 'submitted' | 'in_progress' | 'resolved';

export interface SupportTicket {
  id: string;
  
  // Order context
  order_id: string;
  order_title: string;
  task_code: string;
  
  // User info
  user_id: string;
  user_email: string;
  user_name: string;
  user_display_name: string;
  user_avatar_url?: string | null;  // ← ADD THIS LINE
  user_type: 'customer' | 'expert';
  
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