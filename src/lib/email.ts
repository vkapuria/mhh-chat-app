import { Resend } from 'resend';
import { formatTicketNumber } from './ticket-utils';

// Validate environment variable
if (!process.env.RESEND_API_KEY) {
  console.error('⚠️ RESEND_API_KEY is not set in environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

// Send email using Resend
export async function sendEmail({ to, subject, html, from, replyTo }: SendEmailParams) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { 
        success: false, 
        error: 'Email service not configured - missing RESEND_API_KEY' 
      };
    }

    const emailPayload: any = {
      from: from || 'MyHomeworkHelp Orders <orders@myhomeworkhelp.com>',
      to,
      subject,
      html,
    };

    // Add reply-to if provided
    if (replyTo) {
      emailPayload.replyTo = replyTo;
    }

    const { data, error } = await resend.emails.send(emailPayload);

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Email send exception:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to send email' 
    };
  }
}

// Template: New message notification
export function generateNewMessageEmail(params: {
  recipientName: string;
  senderName: string;
  orderId: string;
  messagePreview: string;
  chatUrl: string;
}) {
  const { recipientName, senderName, orderId, messagePreview, chatUrl } = params;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e293b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
          .message-preview { background: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">💬 New Message</h2>
          </div>
          <div class="content">
            <p>Hi ${recipientName},</p>
            <p><strong>${senderName}</strong> sent you a message about order <strong>${orderId}</strong>:</p>
            
            <div class="message-preview">
              ${messagePreview}
            </div>
            
            <a href="${chatUrl}" class="button">View and Reply</a>
            
            <p style="color: #64748b; font-size: 14px;">
              You're receiving this because you have an active conversation about this order.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MyHomeworkHelp. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Template: Welcome email with login credentials
export function generateWelcomeEmail(params: {
  name: string;
  email: string;
  password: string;
  loginUrl: string;
}) {
  const { name, email, password, loginUrl } = params;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .credentials { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .credential-row { margin: 10px 0; }
          .credential-label { font-weight: bold; color: #4b5563; display: inline-block; width: 100px; }
          .credential-value { color: #1f2937; font-family: monospace; background: white; padding: 4px 8px; border-radius: 4px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .button:hover { background: #2563eb; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Welcome to MyHomeworkHelp!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your account has been created</p>
          </div>
          
          <div class="content">
            <p>Hi ${name},</p>
            
            <p>Your account has been created for the MyHomeworkHelp Chat System. You can now log in and start using the platform.</p>
            
            <div class="credentials">
              <h3 style="margin-top: 0; color: #1f2937;">Your Login Credentials</h3>
              <div class="credential-row">
                <span class="credential-label">Email:</span>
                <span class="credential-value">${email}</span>
              </div>
              <div class="credential-row">
                <span class="credential-label">Password:</span>
                <span class="credential-value">${password}</span>
              </div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> Please save these credentials in a secure location. For security reasons, we recommend changing your password after your first login.
            </div>
            
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Log In Now</a>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>MyHomeworkHelp Team</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} MyHomeworkHelp. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Template: Ticket reply notification
export function generateTicketReplyEmail(params: {
  recipientName: string;
  ticketId: string;
  orderId: string;
  issueType: string;
  replyMessage: string;
  ticketUrl: string;
}) {
  const { recipientName, ticketId, orderId, issueType, replyMessage, ticketUrl } = params;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
          .ticket-info { background: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 4px; }
          .reply-box { background: #ecfdf5; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">💬 New Response to Your Support Ticket</h2>
          </div>
          <div class="content">
            <p>Hi ${recipientName},</p>
            <p>Our support team has responded to your ticket:</p>
            
            <div class="ticket-info">
              <p style="margin: 0; font-size: 14px; color: #64748b;">Ticket ID</p>
              <p style="margin: 5px 0 10px 0; font-family: monospace; font-weight: bold;">${ticketId}</p>
              <p style="margin: 0; font-size: 14px; color: #64748b;">Order</p>
              <p style="margin: 5px 0 10px 0; font-family: monospace;">${orderId}</p>
              <p style="margin: 0; font-size: 14px; color: #64748b;">Issue Type</p>
              <p style="margin: 5px 0 0 0;">${issueType}</p>
            </div>

            <div class="reply-box">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #059669;">Support Team Response:</p>
              <p style="margin: 0; white-space: pre-wrap;">${replyMessage}</p>
            </div>
            
            <a href="${ticketUrl}" class="button">View Full Conversation</a>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            💬 <strong>You can reply directly to this email</strong> to add more details to your ticket. We'll receive your message and respond as soon as possible.
          </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MyHomeworkHelp. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Template: Ticket status update notification
export function generateTicketStatusUpdateEmail(params: {
  recipientName: string;
  ticketId: string;
  orderId: string;
  issueType: string;
  oldStatus: string;
  newStatus: string;
  ticketUrl: string;
}) {
  const { recipientName, ticketId, orderId, issueType, oldStatus, newStatus, ticketUrl } = params;

  const statusColors: Record<string, string> = {
    submitted: '#3b82f6',
    in_progress: '#f59e0b',
    resolved: '#10b981',
  };

  const statusEmojis: Record<string, string> = {
    submitted: '📝',
    in_progress: '⚙️',
    resolved: '✅',
  };

  const statusLabels: Record<string, string> = {
    submitted: 'Submitted',
    in_progress: 'In Progress',
    resolved: 'Resolved',
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${statusColors[newStatus]} 0%, #1e40af 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
          .status-change { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; margin: 0 10px; }
          .ticket-info { background: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">${statusEmojis[newStatus]} Ticket Status Updated</h2>
          </div>
          <div class="content">
            <p>Hi ${recipientName},</p>
            <p>The status of your support ticket has been updated:</p>
            
            <div class="status-change">
              <span class="status-badge" style="background: #e2e8f0; color: #64748b;">
                ${statusLabels[oldStatus]}
              </span>
              <span style="font-size: 24px;">→</span>
              <span class="status-badge" style="background: ${statusColors[newStatus]}; color: white;">
                ${statusLabels[newStatus]}
              </span>
            </div>

            <div class="ticket-info">
              <p style="margin: 0; font-size: 14px; color: #64748b;">Ticket ID</p>
              <p style="margin: 5px 0 10px 0; font-family: monospace; font-weight: bold;">${ticketId}</p>
              <p style="margin: 0; font-size: 14px; color: #64748b;">Order</p>
              <p style="margin: 5px 0 10px 0; font-family: monospace;">${orderId}</p>
              <p style="margin: 0; font-size: 14px; color: #64748b;">Issue Type</p>
              <p style="margin: 5px 0 0 0;">${issueType}</p>
            </div>

            ${newStatus === 'resolved' 
              ? '<p style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;"><strong style="color: #059669;">✓ Your issue has been resolved!</strong><br/>If you need further assistance, feel free to submit a new ticket.</p>'
              : newStatus === 'in_progress'
              ? '<p style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;"><strong style="color: #d97706;">⚙️ We\'re working on it!</strong><br/>Our team is actively addressing your issue. We\'ll update you soon.</p>'
              : ''
            }
            
            <a href="${ticketUrl}" class="button">View Ticket Details</a>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              Thank you for your patience. We're here to help!
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MyHomeworkHelp. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}