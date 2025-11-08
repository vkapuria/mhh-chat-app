import { getOpenPanel } from './openpanel';

// 💬 Track when user sends a message
export const trackMessageSent = (params: {
  orderId: string;
  userType: 'customer' | 'expert';
  messageLength?: number;
}) => {
  getOpenPanel()?.track('💬 message_sent', params);
};

// 📦 Track when order is created
export const trackOrderCreated = (params: {
  orderId: string;
  amount: number;
  userType: 'customer';
}) => {
  getOpenPanel()?.track('📦 order_created', params);
};

// 🎫 Track when support ticket is created
export const trackTicketCreated = (params: {
  orderId: string;
  issueType: string;
  userType: 'customer' | 'expert';
}) => {
  getOpenPanel()?.track('🎫 ticket_created', params);
};

// 💭 Track when someone replies to a ticket
export const trackTicketReplied = (params: {
  ticketId: string;
  repliedBy: 'admin' | 'customer' | 'expert';
  userType: 'customer' | 'expert' | 'admin';
}) => {
  getOpenPanel()?.track('💭 ticket_replied', params);
};

// ✅ Track when ticket is resolved
export const trackTicketResolved = (params: {
  ticketId: string;
  resolvedBy: 'admin';
  resolutionTime?: number; // in minutes
}) => {
  getOpenPanel()?.track('✅ ticket_resolved', params);
};

// 👁️ Track when order is viewed
export const trackOrderViewed = (params: {
  orderId: string;
  userType: 'customer' | 'expert';
}) => {
  getOpenPanel()?.track('👁️ order_viewed', params);
};

// 💬 Track chat opened
export const trackChatOpened = (params: {
  orderId: string;
  userType: 'customer' | 'expert';
}) => {
  getOpenPanel()?.track('💬 chat_opened', params);
};

// 🔐 Track user login
export const trackUserLogin = (params: {
  userType: 'customer' | 'expert' | 'admin';
  userId: string;
}) => {
  getOpenPanel()?.track('🔐 user_login', params);
};

// 📄 Track page view manually if needed
export const trackPageView = (pageName: string) => {
  getOpenPanel()?.track('📄 page_view', { page: pageName });
};