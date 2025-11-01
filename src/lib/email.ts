import { Resend } from 'resend';

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
    const { data, error } = await resend.emails.send({
      from: from || 'Chat App <noreply@yourdomain.com>', // Update with your domain
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
            <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
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
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e293b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
          .credentials { background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">🎉 Welcome to Chat App</h2>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Your account has been created! You can now access your orders and chat with your assigned expert/customers.</p>
            
            <div class="credentials">
              <h3 style="margin-top: 0;">Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px;">${password}</code></p>
            </div>
            
            <a href="${loginUrl}" class="button">Login Now</a>
            
            <p style="color: #dc2626; font-size: 14px;">
              ⚠️ Please change your password after your first login for security.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}