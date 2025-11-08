import { getOpenPanel } from './openpanel';

// Track when user sends a message
export const trackMessageSent = (params: {
  orderId: string;
  userType: 'customer' | 'expert';
}) => {
  getOpenPanel()?.track('message_sent', params);
};

// Track when support ticket is created
export const trackTicketCreated = (params: {
  orderId: string;
  issueType: string;
  userType: 'customer' | 'expert';
}) => {
  getOpenPanel()?.track('ticket_created', params);
};

// Track when order is viewed
export const trackOrderViewed = (params: {
  orderId: string;
  userType: 'customer' | 'expert';
}) => {
  getOpenPanel()?.track('order_viewed', params);
};

// Track user login
export const trackUserLogin = (params: {
  userType: 'customer' | 'expert' | 'admin';
  userId: string;
}) => {
  getOpenPanel()?.track('user_login', params);
};

// Track chat opened
export const trackChatOpened = (params: {
  orderId: string;
  userType: 'customer' | 'expert';
}) => {
  getOpenPanel()?.track('chat_opened', params);
};

// Track page view manually if needed
export const trackPageView = (pageName: string) => {
  getOpenPanel()?.track('page_view', { page: pageName });
};