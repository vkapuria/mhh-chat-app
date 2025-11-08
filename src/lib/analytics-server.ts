import { OpenPanel } from '@openpanel/sdk';

// Server-side OpenPanel client
let serverOpClient: OpenPanel | null = null;

function getServerOpenPanel() {
  if (!serverOpClient) {
    const clientId = process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID;
    const clientSecret = process.env.OPENPANEL_SECRET; // ✅ No NEXT_PUBLIC_ prefix for server secrets
    
    console.log('🔍 OpenPanel Server Init:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId?.length,
      secretLength: clientSecret?.length,
    });
    
    if (!clientId || !clientSecret) {
      console.error('❌ OpenPanel credentials missing!');
      return null;
    }
    
    serverOpClient = new OpenPanel({
      clientId,
      clientSecret,
    });
    
    console.log('✅ OpenPanel server client initialized');
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
    console.log('📊 Tracking ticket_replied (server):', params);
    const op = getServerOpenPanel();
    if (op) {
      op.track('💭 ticket_replied', params);
      console.log('✅ ticket_replied tracked successfully');
    } else {
      console.error('❌ OpenPanel client not available');
    }
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
    console.log('📊 Tracking ticket_resolved (server):', params);
    const op = getServerOpenPanel();
    if (op) {
      op.track('✅ ticket_resolved', params);
      console.log('✅ ticket_resolved tracked successfully');
    } else {
      console.error('❌ OpenPanel client not available');
    }
  } catch (error) {
    console.error('❌ Failed to track ticket_resolved:', error);
  }
};