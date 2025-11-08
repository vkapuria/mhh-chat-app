import { OpenPanel } from '@openpanel/sdk';

// Server-side OpenPanel client
let serverOpClient: OpenPanel | null = null;

function getServerOpenPanel() {
  if (!serverOpClient) {
    serverOpClient = new OpenPanel({
      clientId: process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_OPENPANEL_SECRET!,
    });
  }
  return serverOpClient;
}

// Server-side tracking functions
export const trackTicketRepliedServer = (params: {
  ticketId: string;
  repliedBy: 'admin' | 'customer' | 'expert';
  userType: 'customer' | 'expert' | 'admin';
}) => {
  try {
    getServerOpenPanel()?.track('💭 ticket_replied', params);
  } catch (error) {
    console.error('❌ Failed to track ticket_replied:', error);
  }
};

export const trackTicketResolvedServer = (params: {
  ticketId: string;
  resolvedBy: 'admin';
  resolutionTime?: number;
}) => {
  try {
    getServerOpenPanel()?.track('✅ ticket_resolved', params);
  } catch (error) {
    console.error('❌ Failed to track ticket_resolved:', error);
  }
};