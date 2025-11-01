// Order types matching your invoice-generator database
export type OrderStatus = 
  | 'Pending' 
  | 'Assigned' 
  | 'Completed' 
  | 'Revision' 
  | 'Refunded';

export interface Order {
  id: string;
  task_code?: string;
  title: string;
  description?: string;
  customer_name: string;
  customer_email: string;
  customer_id?: string;
  expert_id?: string;
  expert_name?: string;
  expert_email?: string;
  status: OrderStatus;
  amount: number;
  expert_fee?: number;
  deadline?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  assigned_at?: string;
}

export interface OrderWithUnread extends Order {
  unread_count: number;
  last_message_at?: string;
  last_message_preview?: string;
}

// For grouping orders in sidebar
export interface OrderGroup {
  label: string;
  orders: OrderWithUnread[];
  count: number;
}