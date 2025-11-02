import { Resend } from 'resend';

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
}

// Send email using Resend
export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { 
        success: false, 
        error: 'Email service not configured - missing RESEND_API_KEY' 
      };
    }

    const { data, error } = await resend.emails.send({
      from: from || 'MyHomeworkHelp Orders <orders@myhomeworkhelp.com>',
      to,
      subject,
      html,
    });

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