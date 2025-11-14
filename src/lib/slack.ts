import { WebClient } from '@slack/web-api';

// Initialize Slack client
const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

export const SLACK_CHANNEL_ID = process.env.SLACK_SUPPORT_CHANNEL_ID!;

// Post new ticket to Slack
export async function postTicketToSlack(ticket: {
  id: string;
  user_display_name: string;
  user_email: string;
  user_type: string;
  order_id: string;
  order_title: string;
  issue_type: string;
  message: string;
  created_at: string;
}) {
  try {
    const ticketNumber = `TKT-${ticket.id.substring(0, 8).toUpperCase()}`;
    const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mhh-chat-app.vercel.app'}/admin/support/${ticket.id}`;

    const result = await slackClient.chat.postMessage({
      channel: SLACK_CHANNEL_ID,
      text: `🎫 New Support Ticket: ${ticketNumber}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🎫 ${ticketNumber}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*From:*\n${ticket.user_display_name}`,
            },
            {
              type: 'mrkdwn',
              text: `*Type:*\n${ticket.user_type}`,
            },
            {
              type: 'mrkdwn',
              text: `*Order:*\n${ticket.order_id}`,
            },
            {
              type: 'mrkdwn',
              text: `*Email:*\n${ticket.user_email}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Issue:* ${ticket.issue_type}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Message:*\n${ticket.message}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '👁️ View Full Ticket',
                emoji: true,
              },
              url: ticketUrl,
              style: 'primary',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '🔄 In Progress',
                emoji: true,
              },
              value: `in_progress_${ticket.id}`,
              action_id: 'status_in_progress',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '✅ Resolve',
                emoji: true,
              },
              value: `resolved_${ticket.id}`,
              action_id: 'status_resolved',
              style: 'danger',
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `💬 Reply in this thread to respond to the user`,
            },
          ],
        },
      ],
    });

    // Return the thread timestamp (unique ID for this message)
    return result.ts as string;
  } catch (error) {
    console.error('Error posting to Slack:', error);
    return null;
  }
}

// Post reply to existing Slack thread
export async function postReplyToSlackThread(
  threadTs: string,
  reply: {
    sender: string;
    senderType: 'admin' | 'user';
    message: string;
    created_at: string;
  }
) {
  try {
    const emoji = reply.senderType === 'admin' ? '👨‍💼' : '👤';
    
    await slackClient.chat.postMessage({
      channel: SLACK_CHANNEL_ID,
      thread_ts: threadTs,
      text: `${emoji} ${reply.sender} replied`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${emoji} ${reply.sender}* replied:\n\n${reply.message}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `_${new Date(reply.created_at).toLocaleString('en-US', { 
                timeZone: 'America/New_York',
                dateStyle: 'medium',
                timeStyle: 'short'
              })} EST_`,
            },
          ],
        },
      ],
    });

    return true;
  } catch (error) {
    console.error('Error posting reply to Slack:', error);
    return false;
  }
}

// Update ticket status in Slack message
export async function updateSlackTicketStatus(
    threadTs: string,
    ticketId: string,
    newStatus: string
  ) {
    try {
      const statusEmoji: { [key: string]: string } = {
        submitted: '🆕',
        in_progress: '🔄',
        resolved: '✅',
      };
  
      const statusText: { [key: string]: string } = {
        submitted: 'Open',
        in_progress: 'In Progress',
        resolved: 'Resolved',
      };
  
      const emoji = statusEmoji[newStatus] || '📋';
      const text = statusText[newStatus] || newStatus;
  
      const history = await slackClient.conversations.history({
        channel: SLACK_CHANNEL_ID,
        latest: threadTs,
        limit: 1,
        inclusive: true,
      });
  
      if (!history.messages || history.messages.length === 0) {
        return false;
      }
  
      const originalMessage = history.messages[0];
      
      // Reconstruct blocks without type issues
      const newBlocks: any[] = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} TKT-${ticketId.substring(0, 8).toUpperCase()} [${text.toUpperCase()}]`,
            emoji: true,
          },
        },
      ];
  
      // Add back the original blocks (skip first header)
      if (originalMessage.blocks && originalMessage.blocks.length > 1) {
        for (let i = 1; i < originalMessage.blocks.length; i++) {
          newBlocks.push(originalMessage.blocks[i]);
        }
      }
  
      await slackClient.chat.update({
        channel: SLACK_CHANNEL_ID,
        ts: threadTs,
        text: `${emoji} Ticket ${ticketId.substring(0, 8).toUpperCase()} - ${text}`,
        blocks: newBlocks,
      });
  
      return true;
    } catch (error) {
      console.error('Error updating Slack message:', error);
      return false;
    }
  }

// ✨ NEW: Notify when user completes onboarding
export async function notifyOnboardingCompleted({
  userId,
  userEmail,
  userName,
  userType,
  completedAt,
}: {
  userId: string;
  userEmail: string;
  userName: string;
  userType: 'customer' | 'expert';
  completedAt: string;
}) {
  try {
    const channelId = process.env.SLACK_ONBOARDING_CHANNEL_ID;
    
    if (!channelId) {
      console.error('SLACK_ONBOARDING_CHANNEL_ID not configured');
      return false;
    }

    const emoji = userType === 'expert' ? '👨‍💼' : '👤';
    const typeLabel = userType === 'expert' ? 'Expert' : 'Customer';
    const timestamp = new Date(completedAt).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    await slackClient.chat.postMessage({
      channel: channelId,
      text: `✅ ${userName} completed onboarding!`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '✅ Onboarding Completed',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*User:*\n${emoji} ${userName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Type:*\n${typeLabel}`,
            },
            {
              type: 'mrkdwn',
              text: `*Email:*\n${userEmail}`,
            },
            {
              type: 'mrkdwn',
              text: `*Completed:*\n${timestamp} EST`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `User ID: \`${userId.substring(0, 8)}...\``,
            },
          ],
        },
      ],
    });

    console.log('✅ Onboarding completion posted to Slack');
    return true;
  } catch (error) {
    console.error('Error posting onboarding to Slack:', error);
    return false;
  }
}

// Notify when chat is initiated for an order
export async function notifyChatInitiated({
  orderId,
  orderTitle,
  customerName,
  customerEmail,
  expertName,
  expertEmail,
  initiatedBy,
  timestamp,
}: {
  orderId: string;
  orderTitle: string;
  customerName: string;
  customerEmail: string;
  expertName: string;
  expertEmail: string;
  initiatedBy: 'customer' | 'expert';
  timestamp: string;
}) {
  try {
    const channelId = process.env.SLACK_CHAT_CHANNEL_ID;
    
    if (!channelId) {
      console.error('SLACK_CHAT_CHANNEL_ID not configured');
      return false;
    }

    const initiatorEmoji = initiatedBy === 'expert' ? '👨‍💼' : '👤';
    const initiatorLabel = initiatedBy === 'expert' ? 'Expert' : 'Customer';
    const chatUrl = `${process.env.NEXT_PUBLIC_APP_URL}/messages`;
    
    const formattedTime = new Date(timestamp).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    await slackClient.chat.postMessage({
      channel: channelId,
      text: `💬 Chat started for ${orderId}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `💬 Chat Initiated - ${orderId}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Customer:*\n👤 ${customerName}\n${customerEmail}`,
            },
            {
              type: 'mrkdwn',
              text: `*Expert:*\n👨‍💼 ${expertName}\n${expertEmail}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Order:*\n${orderTitle}`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Started:*\n${formattedTime} EST`,
            },
            {
              type: 'mrkdwn',
              text: `*Initiated by:*\n${initiatorEmoji} ${initiatorLabel}`,
            },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '👁️ View in Portal',
                emoji: true,
              },
              url: chatUrl,
              style: 'primary',
            },
          ],
        },
      ],
    });

    console.log('✅ Chat initiation posted to Slack');
    return true;
  } catch (error) {
    console.error('Error posting chat initiation to Slack:', error);
    return false;
  }
}

export { slackClient };