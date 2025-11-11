import { Resend } from 'resend';
import { formatTicketNumber } from './ticket-utils';

// Validate environment variable
if (!process.env.RESEND_API_KEY) {
  console.error('⚠️ RESEND_API_KEY is not set in environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Status color coding for ticket emails
const statusStyles = {
  submitted: {
    bg: '#fef3c7',
    text: '#92400e',
    label: '📝 Submitted'
  },
  in_progress: {
    bg: '#dbeafe',
    text: '#1e40af',
    label: '⚙️ In Progress'
  },
  resolved: {
    bg: '#d1fae5',
    text: '#065f46',
    label: '✅ Resolved'
  }
} as const;

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

// Template: New message notification (order chat)
export function generateNewMessageEmail(params: {
  recipientName: string;
  senderName: string;
  senderType: 'customer' | 'expert';
  orderId: string;
  orderTitle: string;
  messageContent: string;
  messageUrl: string;
  sentAt: string;
}) {
  const { 
    recipientName, 
    senderName, 
    senderType,
    orderId, 
    orderTitle, 
    messageContent,
    messageUrl,
    sentAt
  } = params;

  // Get sender avatar initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const senderLabel = senderType === 'expert' ? 'Expert' : 'Customer';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.7;
          color: #2d3748;
          margin: 0;
          padding: 0;
          background: #f7fafc;
          -webkit-font-smoothing: antialiased;
        }
        .email-wrapper {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        .container { 
          padding: 50px 40px;
        }
        .header { 
          margin-bottom: 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 30px;
          border-bottom: 1px solid #e2e8f0;
        }
        .logo-section {
          flex: 1;
        }
        .date-section {
          text-align: right;
          font-size: 14px;
          color: #718096;
        }
        .content { 
          font-size: 16px; 
          line-height: 1.7; 
          color: #2d3748;
        }
        .content p { 
          margin: 0 0 20px 0; 
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 25px;
        }
        
        .order-box {
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          padding: 20px;
          margin: 25px 0;
        }
        .order-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }
        .order-row:last-child {
          margin-bottom: 0;
        }
        .order-label {
          color: #718096;
          font-weight: 500;
        }
        .order-value {
          color: #2d3748;
          font-weight: 600;
        }
        
        .message-box {
          background: #4f46e5;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sender-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sender-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #4f46e5;
          font-size: 14px;
        }
        .sender-name {
          color: #ffffff;
          font-weight: 600;
          font-size: 15px;
        }
        .message-time {
          font-size: 13px;
          color: #e0e7ff;
        }
        .message-text {
          color: #ffffff;
          line-height: 1.6;
          margin: 0;
          white-space: pre-wrap;
        }
        
        .cta-section {
          text-align: center;
          margin: 35px 0;
        }
        .view-btn {
          display: inline-block;
          background: #4f46e5;
          color: #ffffff !important;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
          transition: all 0.2s;
        }
        .view-btn:hover {
          background: #4338ca;
          box-shadow: 0 6px 12px rgba(79, 70, 229, 0.3);
          transform: translateY(-1px);
        }
        
        .signature-section { 
          margin-top: 40px;
          padding-top: 30px;
          border-top: 1px solid #e2e8f0;
        }
        .signature { 
          font-size: 16px; 
          font-weight: 500;
          margin-bottom: 25px;
          line-height: 1.6;
          color: #2d3748;
        }
        
        .help-section { 
          font-size: 14px; 
          color: #718096;
          margin-top: 25px;
        }
        .help-section p {
          margin: 0 0 8px 0;
        }
        a { 
          color: #4f46e5; 
          text-decoration: none; 
        }
        a:hover { 
          text-decoration: underline; 
        }
        
        @media screen and (max-width: 640px) {
          .email-wrapper {
            margin: 20px;
            border-radius: 8px;
          }
          .container { 
            padding: 30px 25px; 
          }
          .header {
            flex-direction: column;
            align-items: flex-start;
          }
          .date-section {
            text-align: left;
            margin-top: 10px;
          }
          .message-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .order-row {
            flex-direction: column;
            gap: 5px;
          }
          .content { 
            font-size: 15px; 
          }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          <div class="header">
            <div class="logo-section">
              <img src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png" alt="MyHomeworkHelp" width="140" style="height: auto;">
            </div>
            <div class="date-section">
              ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          <div class="content">
            <div class="greeting">
              New Message from Your ${senderLabel} 💬
            </div>
            
            <p>Hi <strong>${recipientName}</strong>,</p>
            
            <p>You've received a new message regarding your order. Here are the details:</p>
            
            <div class="order-box">
              <div class="order-row">
                <span class="order-label">📦 Order:</span>
                <span class="order-value">${orderTitle}</span>
              </div>
              <div class="order-row">
                <span class="order-label">🆔 Order ID:</span>
                <span class="order-value">${orderId}</span>
              </div>
              <div class="order-row">
                <span class="order-label">👤 From:</span>
                <span class="order-value">${senderName} (${senderLabel})</span>
              </div>
            </div>
            
            <div class="message-box">
              <div class="message-header">
                <div class="sender-info">
                  <div class="sender-avatar">${getInitials(senderName)}</div>
                  <div class="sender-name">${senderName}</div>
                </div>
                <div class="message-time">${sentAt}</div>
              </div>
              <p class="message-text">${messageContent}</p>
            </div>
            
            <p>Click the button below to view the full conversation and respond:</p>
            
            <div class="cta-section">
              <a href="${messageUrl}" class="view-btn">
                View Conversation
              </a>
            </div>
            
            <p style="font-size: 14px; color: #718096;">
              💡 <strong>Tip:</strong> You can also reply directly from the app to keep all your conversations organized in one place.
            </p>
          </div>
          
          <div class="signature-section">
            <div class="signature">
              Best regards,<br>
              <strong>MyHomeworkHelp Team</strong>
            </div>
            
            <div class="help-section">
              <p><strong>Need help?</strong> Contact us at <a href="mailto:orders@myhomeworkhelp.com">orders@myhomeworkhelp.com</a></p>
              <p style="font-size: 13px; color: #a0aec0;">Support Hours: 8am - 8pm ET, Mon-Fri</p>
            </div>
          </div>
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
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.7;
          color: #2d3748;
          margin: 0;
          padding: 0;
          background: #f7fafc;
          -webkit-font-smoothing: antialiased;
        }
        .email-wrapper {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        .container { 
          padding: 50px 40px;
        }
        .header { 
          margin-bottom: 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 30px;
          border-bottom: 1px solid #e2e8f0;
        }
        .logo-section {
          flex: 1;
        }
        .date-section {
          text-align: right;
          font-size: 14px;
          color: #718096;
        }
        .content { 
          font-size: 16px; 
          line-height: 1.7; 
          color: #2d3748;
        }
        .content p { 
          margin: 0 0 20px 0; 
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 25px;
        }
        
        .credentials-box {
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          padding: 25px;
          margin: 30px 0;
        }
        .credentials-box h3 {
          margin: 0 0 20px 0;
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
        }
        .credential-row {
          margin-bottom: 15px;
        }
        .credential-row:last-child {
          margin-bottom: 0;
        }
        .credential-label {
          font-size: 13px;
          color: #718096;
          font-weight: 500;
          margin-bottom: 5px;
        }
        .credential-value {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 15px;
          color: #1a202c;
          background: #ffffff;
          padding: 10px 15px;
          border-radius: 6px;
          border: 1px solid #cbd5e0;
          display: block;
          word-break: break-all;
        }
        
        .warning-box {
          background: #fffbeb;
          border-left: 4px solid #f59e0b;
          padding: 15px 20px;
          margin: 25px 0;
          border-radius: 6px;
        }
        .warning-box p {
          margin: 0;
          font-size: 14px;
          color: #78350f;
          line-height: 1.6;
        }
        .warning-box strong {
          color: #92400e;
        }
        
        .cta-section {
          text-align: center;
          margin: 35px 0;
        }
        .login-btn {
          display: inline-block;
          background: #4f46e5;
          color: #ffffff !important;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
          transition: all 0.2s;
        }
        .login-btn:hover {
          background: #4338ca;
          box-shadow: 0 6px 12px rgba(79, 70, 229, 0.3);
          transform: translateY(-1px);
        }
        
        .signature-section { 
          margin-top: 40px;
          padding-top: 30px;
          border-top: 1px solid #e2e8f0;
        }
        .signature { 
          font-size: 16px; 
          font-weight: 500;
          margin-bottom: 25px;
          line-height: 1.6;
          color: #2d3748;
        }
        .signature-title {
          font-size: 14px;
          color: #718096;
          font-weight: 400;
        }
        
        .help-section { 
          font-size: 14px; 
          color: #718096;
          margin-top: 25px;
        }
        .help-section p {
          margin: 0 0 8px 0;
        }
        a { 
          color: #4f46e5; 
          text-decoration: none; 
        }
        a:hover { 
          text-decoration: underline; 
        }
        
        @media screen and (max-width: 640px) {
          .email-wrapper {
            margin: 20px;
            border-radius: 8px;
          }
          .container { 
            padding: 30px 25px; 
          }
          .header {
            flex-direction: column;
            align-items: flex-start;
          }
          .date-section {
            text-align: left;
            margin-top: 10px;
          }
          .content { 
            font-size: 15px; 
          }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          <div class="header">
            <div class="logo-section">
              <img src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png" alt="MyHomeworkHelp" width="140" style="height: auto;">
            </div>
            <div class="date-section">
              ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          <div class="content">
            <div class="greeting">
              Welcome to MyHomeworkHelp! 👋
            </div>
            
            <p>Hi <strong>${name}</strong>,</p>
            
            <p>Your account has been successfully created! We're excited to have you on board. You can now access our platform and start managing your homework assignments.</p>
            
            <div class="credentials-box">
              <h3>🔐 Your Login Credentials</h3>
              <div class="credential-row">
                <div class="credential-label">Email Address</div>
                <div class="credential-value">${email}</div>
              </div>
              <div class="credential-row">
                <div class="credential-label">Temporary Password</div>
                <div class="credential-value">${password}</div>
              </div>
            </div>
            
            <div class="warning-box">
              <p><strong>⚠️ Important Security Notice:</strong> Please save these credentials in a secure location and change your password after your first login. Never share your password with anyone.</p>
            </div>
            
            <p>To get started, simply click the button below to log in:</p>
            
            <div class="cta-section">
              <a href="${loginUrl}" class="login-btn">
                Log In to Your Account
              </a>
            </div>
            
            <p>Once logged in, you'll be able to:</p>
            <p style="padding-left: 20px; line-height: 2;">
              • Track your orders and assignments<br>
              • Chat with experts assigned to your work<br>
              • Access support tickets and help resources<br>
              • Manage your account settings
            </p>
            
            <p>If you have any questions or need assistance getting started, our support team is here to help!</p>
          </div>
          
          <div class="signature-section">
            <div class="signature">
              Best regards,<br>
              <strong>Nick Kessler</strong><br>
              <span class="signature-title">Academic Services Coordinator</span><br>
              <span class="signature-title">MyHomeworkHelp</span>
            </div>
            
            <div class="help-section">
              <p><strong>Need help?</strong> Contact us at <a href="mailto:orders@myhomeworkhelp.com">orders@myhomeworkhelp.com</a></p>
              <p style="font-size: 13px; color: #a0aec0;">Support Hours: 8am - 8pm ET, Mon-Fri</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Template: Ticket reply notification (admin responds)
export function generateTicketReplyEmail(params: {
  recipientName: string;
  ticketId: string;       // UUID for URL
  ticketNumber: string;   // Formatted display (TCK-284019)
  orderId: string;
  issueType: string;
  replyMessage: string;
  adminName: string;      // Who replied
  repliedAt: string;      // When they replied (formatted)
  ticketUrl: string;
}) {
  const { 
    recipientName, 
    ticketId, 
    ticketNumber, 
    orderId, 
    issueType, 
    replyMessage,
    adminName,
    repliedAt,
    ticketUrl 
  } = params;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>New Reply to Your Ticket</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap" rel="stylesheet">
      <style>
        body { margin:0; padding:0; background:#f4f6fa; color:#111827; }
        a { color:#2c4dfa; text-decoration:none; }
        img { border:0; outline:none; text-decoration:none; max-width:100%; }
        table { border-collapse:collapse; }
        .font {
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                       "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji";
        }

        .wrap { width:100%; padding:28px 0; }
        .container { width:100%; max-width:680px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb; }

        .hdr { background:#0f172a; color:#fff; padding:20px 24px; text-align:center; }
        .logo { display:block; margin:0 auto 6px; height:auto; }
        .h1 { margin:0; font-size:20px; font-weight:700; }

        .section { padding:24px 28px; font-size:16px; line-height:1.6; }

        .grid { width:100%; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; margin-top:12px; }
        .grid td { padding:14px 16px; font-size:14px; }
        .grid tr:nth-child(odd) { background:#fafafa; }
        .label { color:#374151; width:210px; white-space:nowrap; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, "Liberation Mono", monospace; color:#111827; }

        .reply-box {
          background:#4f46e5;
          padding:20px;
          border-radius:8px;
          margin:20px 0;
        }
        .reply-box-header {
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin-bottom:12px;
          flex-wrap:wrap;
          gap:8px;
        }
        .reply-box strong { color:#fff; font-size:16px; }
        .reply-timestamp {
          font-size:13px;
          color:#e0e7ff;
        }
        .reply-box p { 
          margin:0; 
          color:#fff; 
          line-height:1.6;
          white-space:pre-wrap;
        }

        .email-reply-box {
          background:#fef3c7;
          border-left:4px solid #f59e0b;
          padding:16px;
          border-radius:8px;
          margin-top:16px;
        }
        .email-reply-box strong { color:#92400e; }
        .email-reply-box p { margin:8px 0 0 0; color:#78350f; line-height:1.5; }

        .cta { text-align:center; margin-top:22px; }
        .btn {
          display:inline-block; background:#2c4dfa; color:#fff !important;
          padding:12px 22px; border-radius:8px; font-weight:700;
          font-size:15px;
        }
        .btn:hover { opacity:.95; }

        .foot { text-align:center; font-size:12px; color:#6b7280; padding:20px 10px; }

        @media (max-width: 620px) {
          .label { width:150px; }
          .section { padding:22px; }
          .reply-box-header { flex-direction:column; align-items:flex-start; }
        }
      </style>
    </head>
    <body class="font">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
        ${adminName} from support has replied to your ticket. See the response and reply back.
      </div>

      <table role="presentation" class="wrap" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <table role="presentation" class="container" cellpadding="0" cellspacing="0">
              <tr>
                <td class="hdr">
                  <img class="logo" src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png" alt="MyHomeworkHelp" width="160" height="auto">
                  <div class="h1">💬 New Reply to Your Ticket</div>
                </td>
              </tr>

              <tr>
                <td class="section">
                  <p>Hi <strong>${recipientName}</strong>,</p>
                  <p>Great news! Our support team has responded to your ticket:</p>

                  <table role="presentation" class="grid" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td class="label">🧾 Ticket ID</td>
                      <td class="mono">${ticketNumber}</td>
                    </tr>
                    <tr>
                      <td class="label">📦 Order</td>
                      <td class="mono">${orderId}</td>
                    </tr>
                    <tr>
                      <td class="label">🏷️ Issue Type</td>
                      <td>${issueType}</td>
                    </tr>
                  </table>

                  <div class="reply-box">
                    <div class="reply-box-header">
                      <strong>✨ Support Team Response:</strong>
                      <span class="reply-timestamp">${adminName} • ${repliedAt}</span>
                    </div>
                    <p>${replyMessage}</p>
                  </div>

                  <div class="email-reply-box">
                    <strong>💡 Quick Tip:</strong>
                    <p><strong>You can reply directly to this email</strong> to continue the conversation — no need to log in! Your response will be automatically added to the ticket, and we'll be notified right away.</p>
                  </div>

                  <div class="cta">
                    <a class="btn" href="${ticketUrl}">View Full Conversation</a>
                  </div>
                </td>
              </tr>

              <tr>
                <td class="foot">
                  <p>© ${new Date().getFullYear()} MyHomeworkHelp • You're receiving this because you have an active support ticket.</p>
                  <p style="margin-top:8px;"><a href="https://chat.myhomeworkhelp.com/support" style="color:#6b7280;">Manage Support Tickets</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Template: Ticket confirmation with reply-by-email feature
export function generateTicketConfirmationEmail(params: {
  recipientName: string;
  ticketId: string;       // UUID for URL
  ticketNumber: string;   // Formatted display (TCK-284019)
  orderId: string;
  issueType: string;
  ticketUrl: string;      // Full URL to ticket page
  createdAt: string;      // Formatted date/time
  status?: string;        // For color coding (default: submitted)
}) {
  const { 
    recipientName, 
    ticketId, 
    ticketNumber, 
    orderId, 
    issueType, 
    ticketUrl, 
    createdAt,
    status = 'submitted' 
  } = params;

  // Get status styling
  const statusStyle = statusStyles[status as keyof typeof statusStyles] || statusStyles.submitted;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Ticket Confirmation</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap" rel="stylesheet">
      <style>
        body { margin:0; padding:0; background:#f4f6fa; color:#111827; }
        a { color:#2c4dfa; text-decoration:none; }
        img { border:0; outline:none; text-decoration:none; max-width:100%; }
        table { border-collapse:collapse; }
        .font {
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                       "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji";
        }

        .wrap { width:100%; padding:28px 0; }
        .container { width:100%; max-width:680px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb; }

        /* Header */
        .hdr { background:#0f172a; color:#fff; padding:20px 24px; text-align:center; }
        .logo { display:block; margin:0 auto 6px; height:auto; }
        .h1 { margin:0; font-size:20px; font-weight:700; }

        /* Section */
        .section { padding:24px 28px; font-size:16px; line-height:1.6; }

        /* Grid (details) */
        .grid { width:100%; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; margin-top:12px; }
        .grid td { padding:14px 16px; font-size:14px; }
        .grid tr:nth-child(odd) { background:#fafafa; }
        .label { color:#374151; width:210px; white-space:nowrap; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, "Liberation Mono", monospace; color:#111827; }

        /* Status Badge */
        .status-badge { 
          display:inline-block; 
          background:${statusStyle.bg}; 
          color:${statusStyle.text}; 
          padding:6px 12px; 
          border-radius:6px; 
          font-weight:600; 
          font-size:14px;
        }

        /* Timeline */
        .timeline { margin-top:18px; text-align:center; }
        .step { display:inline-block; margin:0 10px; }
        .bubble { width:12px; height:12px; border-radius:50%; display:inline-block; vertical-align:middle; background:#d1d5db; }
        .active .bubble { background:#2c4dfa; }
        .name { font-size:12px; color:#6b7280; margin-left:6px; vertical-align:middle; }

        /* Info Box */
        .info-box { 
          background:#eff6ff; 
          border-left:4px solid #2c4dfa; 
          padding:16px; 
          border-radius:8px; 
          margin-top:20px;
        }
        .info-box strong { color:#1e40af; }
        .info-box p { margin:8px 0 0 0; color:#1e3a8a; }

        /* Reply Box */
        .reply-box {
          background:#fef3c7;
          border-left:4px solid #f59e0b;
          padding:16px;
          border-radius:8px;
          margin-top:16px;
        }
        .reply-box strong { color:#92400e; }
        .reply-box p { margin:8px 0 0 0; color:#78350f; line-height:1.5; }

        /* CTA */
        .cta { text-align:center; margin-top:22px; }
        .btn {
          display:inline-block; background:#2c4dfa; color:#fff !important;
          padding:12px 22px; border-radius:8px; font-weight:700;
          font-size:15px;
        }
        .btn:hover { opacity:.95; }

        /* Footer */
        .foot { text-align:center; font-size:12px; color:#6b7280; padding:20px 10px; }

        @media (max-width: 620px) {
          .label { width:150px; }
          .section { padding:22px; }
        }
      </style>
    </head>
    <body class="font">
      <!-- Preheader -->
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
        We've received your ticket. Here's a quick summary and what happens next.
      </div>

      <table role="presentation" class="wrap" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <table role="presentation" class="container" cellpadding="0" cellspacing="0">
              <!-- Header -->
              <tr>
                <td class="hdr">
                  <img class="logo" src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png" alt="MyHomeworkHelp" width="160" height="auto">
                  <div class="h1">✓ Ticket Confirmed</div>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td class="section">
                  <p>Hi <strong>${recipientName}</strong>,</p>
                  <p>Thanks for reaching out. We've logged your request and created a support ticket. Our team is on it!</p>

                  <!-- Details -->
                  <table role="presentation" class="grid" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td class="label">🧾 Ticket ID</td>
                      <td class="mono">${ticketNumber}</td>
                    </tr>
                    <tr>
                      <td class="label">📦 Order</td>
                      <td class="mono">${orderId}</td>
                    </tr>
                    <tr>
                      <td class="label">🏷️ Issue Type</td>
                      <td>${issueType}</td>
                    </tr>
                    <tr>
                      <td class="label">🗓️ Created</td>
                      <td>${createdAt}</td>
                    </tr>
                    <tr>
                      <td class="label">💬 Status</td>
                      <td><span class="status-badge">${statusStyle.label}</span></td>
                    </tr>
                  </table>

                  <!-- Timeline -->
                  <div class="timeline">
                    <span class="step active"><span class="bubble"></span><span class="name">Submitted</span></span>
                    <span class="step"><span class="bubble"></span><span class="name">In Review</span></span>
                    <span class="step"><span class="bubble"></span><span class="name">Resolved</span></span>
                  </div>

                  <!-- Expected Response Time -->
                  <div class="info-box">
                    <strong>⏱️ What to Expect:</strong>
                    <p>Our support team will review your ticket and respond within <strong>24 hours</strong> (usually much sooner during business hours).</p>
                  </div>

                  <!-- Email Reply Feature -->
                  <div class="reply-box">
                    <strong>💡 Quick Tip:</strong>
                    <p><strong>You can reply directly to this email</strong> to add more details to your ticket — no need to log in! Your response will be automatically added to the conversation, and we'll be notified right away.</p>
                  </div>

                  <!-- CTA -->
                  <div class="cta">
                    <a class="btn" href="${ticketUrl}">View Your Ticket</a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td class="foot">
                  <p>© ${new Date().getFullYear()} MyHomeworkHelp • You're receiving this because you contacted support.</p>
                  <p style="margin-top:8px;"><a href="https://chat.myhomeworkhelp.com/support" style="color:#6b7280;">Manage Support Tickets</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Template: Ticket status change (merged/consolidated)
export function generateTicketStatusChangeEmail(params: {
  recipientName: string;
  ticketId: string;       // UUID for URL
  ticketNumber: string;   // Formatted display (TCK-284019)
  orderId: string;
  issueType: string;
  oldStatus: string;
  newStatus: string;
  ticketUrl: string;
  updatedAt: string;      // Formatted date/time
}) {
  const { 
    recipientName, 
    ticketId, 
    ticketNumber, 
    orderId, 
    issueType, 
    oldStatus,
    newStatus,
    ticketUrl, 
    updatedAt 
  } = params;

  // Status styling
  const statusConfig: Record<string, { bg: string; text: string; label: string; emoji: string }> = {
    submitted: { bg: '#fef3c7', text: '#92400e', label: 'Submitted', emoji: '📝' },
    in_progress: { bg: '#dbeafe', text: '#1e40af', label: 'In Progress', emoji: '⚙️' },
    resolved: { bg: '#d1fae5', text: '#065f46', label: 'Resolved', emoji: '✅' },
  };

  const oldStatusStyle = statusConfig[oldStatus] || statusConfig.submitted;
  const newStatusStyle = statusConfig[newStatus] || statusConfig.submitted;

  // Status-specific messages
  const statusMessages: Record<string, { title: string; message: string; boxClass: string }> = {
    in_progress: {
      title: '🔄 We\'re Working on It!',
      message: `Thank you for reaching out. I wanted to let you know that we're actively working on your ticket regarding <strong>${issueType}</strong>.<br><br>We'll update you as soon as we have more information. In the meantime, if you have any additional details or questions, feel free to reply to this email and we'll be notified right away.`,
      boxClass: 'msg-in-progress'
    },
    resolved: {
      title: '✅ Your Ticket Has Been Resolved',
      message: `Great news! Your ticket regarding <strong>${issueType}</strong> has been resolved.<br><br>If you have any questions about the resolution or need further assistance, please don't hesitate to submit a new ticket. We're always here to help!`,
      boxClass: 'msg-resolved'
    }
  };

  // Fallback message for other status transitions
  const statusMessage = statusMessages[newStatus] || {
    title: `${newStatusStyle.emoji} Status Updated`,
    message: `Your ticket status has been updated to <strong>${newStatusStyle.label}</strong>.<br><br>We'll keep you informed as we work on resolving your issue. If you have any questions, feel free to reply to this email.`,
    boxClass: 'msg-in-progress'
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Ticket Status Update</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap" rel="stylesheet">
      <style>
        body { margin:0; padding:0; background:#f4f6fa; color:#111827; }
        a { color:#2c4dfa; text-decoration:none; }
        img { border:0; outline:none; text-decoration:none; max-width:100%; }
        table { border-collapse:collapse; }
        .font {
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                       "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji";
        }

        .wrap { width:100%; padding:28px 0; }
        .container { width:100%; max-width:680px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb; }

        .hdr { background:#0f172a; color:#fff; padding:20px 24px; text-align:center; }
        .logo { display:block; margin:0 auto 6px; height:auto; }
        .h1 { margin:0; font-size:20px; font-weight:700; }

        .section { padding:24px 28px; font-size:16px; line-height:1.6; }

        .status-banner {
          background:linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          padding:20px;
          text-align:center;
          border-radius:10px;
          margin:16px 0;
        }
        .status-row {
          display:flex;
          align-items:center;
          justify-content:center;
          gap:12px;
          flex-wrap:wrap;
        }
        .status-badge {
          display:inline-block;
          padding:10px 18px;
          border-radius:8px;
          font-weight:600;
          font-size:15px;
        }
        .status-old { background:#f3f4f6; color:#6b7280; }
        .arrow { font-size:24px; color:#6b7280; }

        .grid { width:100%; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; margin-top:12px; }
        .grid td { padding:14px 16px; font-size:14px; }
        .grid tr:nth-child(odd) { background:#fafafa; }
        .label { color:#374151; width:210px; white-space:nowrap; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, "Liberation Mono", monospace; color:#111827; }

        .message-box {
          padding:18px;
          border-radius:8px;
          margin:20px 0;
          border-left:4px solid;
        }
        .msg-submitted { background:#fef3c7; border-color:#f59e0b; }
        .msg-in-progress { background:#eff6ff; border-color:#2c4dfa; }
        .msg-resolved { background:#ecfdf5; border-color:#10b981; }
        .message-box strong { font-size:16px; }
        .message-box p { margin:10px 0 0 0; line-height:1.6; }

        .reply-box {
          background:#fef3c7;
          border-left:4px solid #f59e0b;
          padding:16px;
          border-radius:8px;
          margin-top:16px;
        }
        .reply-box strong { color:#92400e; }
        .reply-box p { margin:8px 0 0 0; color:#78350f; line-height:1.5; }

        .cta { text-align:center; margin-top:22px; }
        .btn {
          display:inline-block; background:#2c4dfa; color:#fff !important;
          padding:12px 22px; border-radius:8px; font-weight:700;
          font-size:15px;
        }
        .btn:hover { opacity:.95; }

        .foot { text-align:center; font-size:12px; color:#6b7280; padding:20px 10px; }

        @media (max-width: 620px) {
          .label { width:150px; }
          .section { padding:22px; }
          .status-row { flex-direction:column; }
        }
      </style>
    </head>
    <body class="font">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
        Your ticket status has been updated. See what's next.
      </div>

      <table role="presentation" class="wrap" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <table role="presentation" class="container" cellpadding="0" cellspacing="0">
              <tr>
                <td class="hdr">
                  <img class="logo" src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png" alt="MyHomeworkHelp" width="160" height="auto">
                  <div class="h1">${newStatusStyle.emoji} Ticket Status Updated</div>
                </td>
              </tr>

              <tr>
                <td class="section">
                  <p>Hi <strong>${recipientName}</strong>,</p>
                  <p>We've updated the status of your support ticket:</p>

                  <div class="status-banner">
                    <div class="status-row">
                      <span class="status-badge status-old">${oldStatusStyle.emoji} ${oldStatusStyle.label}</span>
                      <span class="arrow">→</span>
                      <span class="status-badge" style="background:${newStatusStyle.bg}; color:${newStatusStyle.text};">${newStatusStyle.emoji} ${newStatusStyle.label}</span>
                    </div>
                  </div>

                  <table role="presentation" class="grid" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td class="label">🧾 Ticket ID</td>
                      <td class="mono">${ticketNumber}</td>
                    </tr>
                    <tr>
                      <td class="label">📦 Order</td>
                      <td class="mono">${orderId}</td>
                    </tr>
                    <tr>
                      <td class="label">🏷️ Issue Type</td>
                      <td>${issueType}</td>
                    </tr>
                    <tr>
                      <td class="label">🗓️ Updated</td>
                      <td>${updatedAt}</td>
                    </tr>
                  </table>

                  <div class="message-box ${statusMessage.boxClass}">
                    <strong style="color:${newStatusStyle.text};">${statusMessage.title}</strong>
                    <p style="color:${newStatusStyle.text};">${statusMessage.message}</p>
                  </div>

                  <div class="reply-box">
                    <strong>💡 Quick Tip:</strong>
                    <p><strong>You can reply directly to this email</strong> to respond or add more details — no need to log in! Your response will be automatically added to the ticket conversation.</p>
                  </div>

                  <div class="cta">
                    <a class="btn" href="${ticketUrl}">View Your Ticket</a>
                  </div>
                </td>
              </tr>

              <tr>
                <td class="foot">
                  <p>© ${new Date().getFullYear()} MyHomeworkHelp • You're receiving this because you have an active support ticket.</p>
                  <p style="margin-top:8px;"><a href="https://chat.myhomeworkhelp.com/support" style="color:#6b7280;">Manage Support Tickets</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Template: Admin notification - New support request submitted
export function generateAdminSupportRequestEmail(params: {
  userName: string;
  userEmail: string;
  userType: string;
  orderId: string;
  orderTitle: string;
  taskCode: string;
  customerName: string;
  expertName?: string;
  amount: string;
  expertFee?: string;
  issueType: string;
  message: string;
}) {
  const { 
    userName, userEmail, userType, orderId, orderTitle, taskCode,
    customerName, expertName, amount, expertFee, issueType, message 
  } = params;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.7;
          color: #2d3748;
          margin: 0;
          padding: 0;
          background: #f7fafc;
        }
        .email-wrapper {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        .container { padding: 40px; }
        .header { 
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
        }
        .logo { width: 130px; height: auto; }
        .alert-badge {
          display: inline-block;
          background: #fef3c7;
          color: #92400e;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          margin-top: 15px;
        }
        .content { font-size: 15px; line-height: 1.7; color: #2d3748; }
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          margin: 25px 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-box {
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin: 12px 0;
        }
        .info-row {
          display: flex;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
        }
        .info-row:last-child { border-bottom: none; }
        .info-label {
          font-weight: 500;
          color: #718096;
          min-width: 110px;
        }
        .info-value {
          color: #2d3748;
          font-weight: 600;
        }
        .message-box {
          background: #f7fafc;
          border-left: 4px solid #4f46e5;
          padding: 16px;
          margin: 15px 0;
          border-radius: 4px;
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
          white-space: pre-wrap;
        }
        .reply-btn {
          display: inline-block;
          background: #4f46e5;
          color: #ffffff !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          margin: 20px 0;
        }
        @media screen and (max-width: 640px) {
          .email-wrapper { margin: 20px; }
          .container { padding: 25px; }
          .info-row { flex-direction: column; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          <div class="header">
            <img src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png" alt="MHH" class="logo">
            <div class="alert-badge">🚨 New Support Request</div>
          </div>
          
          <div class="content">
            <p>A support request has been submitted for order <strong>${taskCode}</strong>.</p>
            
            <div class="section-title">📩 Request Details</div>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Issue Type</span>
                <span class="info-value">${issueType}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Submitted By</span>
                <span class="info-value">${userType === 'customer' ? 'Customer' : 'Expert'}: ${userName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Contact</span>
                <span class="info-value">${userEmail}</span>
              </div>
            </div>
            
            <div class="section-title">💬 Message</div>
            <div class="message-box">${message}</div>
            
            <div class="section-title">📦 Order Details</div>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Order ID</span>
                <span class="info-value">${taskCode}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Title</span>
                <span class="info-value">${orderTitle}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Customer</span>
                <span class="info-value">${customerName}</span>
              </div>
              ${expertName ? `
              <div class="info-row">
                <span class="info-label">Expert</span>
                <span class="info-value">${expertName}</span>
              </div>` : ''}
              <div class="info-row">
                <span class="info-label">Value</span>
                <span class="info-value">$${amount}${expertFee ? ` / ₹${expertFee}` : ''}</span>
              </div>
            </div>
            
            <center>
              <a href="mailto:${userEmail}" class="reply-btn">Reply to ${userName}</a>
            </center>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Template: Admin notification - Customer replied to ticket (portal or email)
export function generateAdminTicketReplyEmail(params: {
  ticketId: string;
  ticketNumber: string;
  orderId: string;
  issueType: string;
  userName: string;
  userEmail: string;
  replyMessage: string;
  replySource: 'portal' | 'email';
  adminPanelUrl: string;
}) {
  const { 
    ticketId, ticketNumber, orderId, issueType, 
    userName, userEmail, replyMessage, replySource, adminPanelUrl 
  } = params;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.7;
          color: #2d3748;
          margin: 0;
          padding: 0;
          background: #f7fafc;
        }
        .email-wrapper {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        .container { padding: 40px; }
        .header { 
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
        }
        .logo { width: 130px; height: auto; }
        .alert-badge {
          display: inline-block;
          background: #dbeafe;
          color: #1e40af;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          margin-top: 15px;
        }
        .content { font-size: 15px; line-height: 1.7; color: #2d3748; }
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          margin: 25px 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-box {
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin: 12px 0;
        }
        .info-row {
          display: flex;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
        }
        .info-row:last-child { border-bottom: none; }
        .info-label {
          font-weight: 500;
          color: #718096;
          min-width: 110px;
        }
        .info-value {
          color: #2d3748;
          font-weight: 600;
        }
        .reply-box {
          background: #4f46e5;
          color: #ffffff;
          padding: 20px;
          margin: 15px 0;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .view-btn {
          display: inline-block;
          background: #4f46e5;
          color: #ffffff !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          margin: 20px 0;
        }
        @media screen and (max-width: 640px) {
          .email-wrapper { margin: 20px; }
          .container { padding: 25px; }
          .info-row { flex-direction: column; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          <div class="header">
            <img src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png" alt="MHH" class="logo">
            <div class="alert-badge">🔔 New Reply ${replySource === 'email' ? '(via Email)' : ''}</div>
          </div>
          
          <div class="content">
            <p><strong>${userName}</strong> has replied to their support ticket.</p>
            
            <div class="section-title">🎫 Ticket Details</div>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Ticket</span>
                <span class="info-value">${ticketNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Order ID</span>
                <span class="info-value">${orderId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">From</span>
                <span class="info-value">${userName} (${userEmail})</span>
              </div>
              <div class="info-row">
                <span class="info-label">Issue Type</span>
                <span class="info-value">${issueType}</span>
              </div>
            </div>
            
            <div class="section-title">💬 Reply</div>
            <div class="reply-box">${replyMessage}</div>
            
            <center>
              <a href="${adminPanelUrl}" class="view-btn">View in Admin Panel</a>
            </center>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Template: Admin notification - New ticket created
export function generateAdminTicketCreatedEmail(params: {
  ticketNumber: string;
  orderId: string;
  orderTitle: string;
  issueType: string;
  userName: string;
  userEmail: string;
  userType: string;
  message: string;
  ticketUrl: string;
}) {
  const { 
    ticketNumber, orderId, orderTitle, issueType,
    userName, userEmail, userType, message, ticketUrl
  } = params;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.7;
          color: #2d3748;
          margin: 0;
          padding: 0;
          background: #f7fafc;
        }
        .email-wrapper {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        .container { padding: 40px; }
        .header { 
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
        }
        .logo { width: 130px; height: auto; }
        .alert-badge {
          display: inline-block;
          background: #dbeafe;
          color: #1e40af;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          margin-top: 15px;
        }
        .content { font-size: 15px; line-height: 1.7; color: #2d3748; }
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          margin: 25px 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-box {
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin: 12px 0;
        }
        .info-row {
          display: flex;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
        }
        .info-row:last-child { border-bottom: none; }
        .info-label {
          font-weight: 500;
          color: #718096;
          min-width: 110px;
        }
        .info-value {
          color: #2d3748;
          font-weight: 600;
        }
        .message-box {
          background: #f7fafc;
          border-left: 4px solid #4f46e5;
          padding: 16px;
          margin: 15px 0;
          border-radius: 4px;
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
          white-space: pre-wrap;
        }
        .view-btn {
          display: inline-block;
          background: #4f46e5;
          color: #ffffff !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          margin: 20px 0;
        }
        @media screen and (max-width: 640px) {
          .email-wrapper { margin: 20px; }
          .container { padding: 25px; }
          .info-row { flex-direction: column; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          <div class="header">
            <img src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png" alt="MHH" class="logo">
            <div class="alert-badge">🎫 New Support Ticket</div>
          </div>
          
          <div class="content">
            <p>A new support ticket has been created.</p>
            
            <div class="section-title">🎫 Ticket Details</div>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Ticket</span>
                <span class="info-value">${ticketNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Order</span>
                <span class="info-value">${orderId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Title</span>
                <span class="info-value">${orderTitle}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Issue Type</span>
                <span class="info-value">${issueType}</span>
              </div>
            </div>
            
            <div class="section-title">👤 Submitted By</div>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Name</span>
                <span class="info-value">${userName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-value">${userEmail}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Type</span>
                <span class="info-value">${userType === 'customer' ? 'Customer' : 'Expert'}</span>
              </div>
            </div>
            
            <div class="section-title">💬 Message</div>
            <div class="message-box">${message}</div>
            
            <center>
              <a href="${ticketUrl}" class="view-btn">View Ticket in Admin Panel</a>
            </center>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateBatchMessageEmail(params: {
  recipientName: string;
  senderDisplayName: string;
  senderType: 'customer' | 'expert';
  orderId: string;
  orderTitle: string;
  messages: Array<{
    senderName: string;
    content: string;
    sentAt: string;
  }>;
  totalMessageCount: number;
  hasMoreMessages: boolean;
  remainingCount: number;
  messageUrl: string;
}) {
  const { 
    recipientName, 
    senderDisplayName,
    senderType,
    orderId, 
    orderTitle, 
    messages,
    totalMessageCount,
    hasMoreMessages,
    remainingCount,
    messageUrl
  } = params;

  // Get sender avatar initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const senderLabel = senderType === 'expert' ? 'Expert' : 'Customer';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.7;
          color: #2d3748;
          margin: 0;
          padding: 0;
          background: #f7fafc;
          -webkit-font-smoothing: antialiased;
        }
        .email-wrapper {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        .container { 
          padding: 50px 40px;
        }
        .header { 
          margin-bottom: 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 30px;
          border-bottom: 1px solid #e2e8f0;
        }
        .logo-section {
          flex: 1;
        }
        .date-section {
          text-align: right;
          font-size: 14px;
          color: #718096;
        }
        .content { 
          font-size: 16px; 
          line-height: 1.7; 
          color: #2d3748;
        }
        .content p { 
          margin: 0 0 20px 0; 
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 25px;
        }
        
        .order-box {
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          padding: 20px;
          margin: 25px 0;
        }
        .order-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }
        .order-row:last-child {
          margin-bottom: 0;
        }
        .order-label {
          color: #718096;
          font-weight: 500;
        }
        .order-value {
          color: #2d3748;
          font-weight: 600;
        }
        
        .message-count-badge {
          display: inline-block;
          background: #4f46e5;
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 20px;
        }
        
        .chat-window {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          margin: 25px 0;
          max-height: 500px;
          overflow-y: auto;
        }
        
        .chat-message {
          display: flex;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        
        .chat-message:last-child {
          margin-bottom: 0;
        }
        
        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #ffffff;
          font-size: 14px;
          flex-shrink: 0;
          margin-right: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .message-content {
          flex: 1;
          max-width: 85%;
        }
        
        .message-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        
        .message-sender {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }
        
        .message-time {
          font-size: 12px;
          color: #64748b;
        }
        
        .message-bubble {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          border-top-left-radius: 4px;
          padding: 12px 16px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          position: relative;
        }
        
        .message-bubble::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 0;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 8px 8px 0;
          border-color: transparent #e2e8f0 transparent transparent;
        }
        
        .message-bubble::after {
          content: '';
          position: absolute;
          left: -7px;
          top: 0;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 7px 7px 0;
          border-color: transparent #ffffff transparent transparent;
        }
        
        .message-text {
          color: #334155;
          line-height: 1.5;
          margin: 0;
          font-size: 14px;
          word-wrap: break-word;
          white-space: pre-wrap;
        }
        
        .more-messages {
          background: #e0e7ff;
          border: 2px dashed #818cf8;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          color: #4338ca;
          font-weight: 500;
          font-size: 13px;
          margin-top: 12px;
        }
        
        .cta-section {
          text-align: center;
          margin: 35px 0;
        }
        .view-btn {
          display: inline-block;
          background: #4f46e5;
          color: #ffffff !important;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
          transition: all 0.2s;
        }
        .view-btn:hover {
          background: #4338ca;
          box-shadow: 0 6px 12px rgba(79, 70, 229, 0.3);
          transform: translateY(-1px);
        }
        
        .signature-section { 
          margin-top: 40px;
          padding-top: 30px;
          border-top: 1px solid #e2e8f0;
        }
        .signature { 
          font-size: 16px; 
          font-weight: 500;
          margin-bottom: 25px;
          line-height: 1.6;
          color: #2d3748;
        }
        
        .help-section { 
          font-size: 14px; 
          color: #718096;
          margin-top: 25px;
        }
        .help-section p {
          margin: 0 0 8px 0;
        }
        a { 
          color: #4f46e5; 
          text-decoration: none; 
        }
        a:hover { 
          text-decoration: underline; 
        }
        
        @media screen and (max-width: 640px) {
          body {
            padding: 10px;
          }
          .email-wrapper {
            margin: 20px auto;
            border-radius: 8px;
          }
          .container { 
            padding: 30px 25px; 
          }
          .header {
            flex-direction: column;
            align-items: flex-start;
          }
          .date-section {
            text-align: left;
            margin-top: 10px;
          }
          .order-row {
            flex-direction: column;
            gap: 5px;
          }
          .content { 
            font-size: 15px; 
          }
          .chat-window {
            padding: 15px;
          }
          .message-content {
            max-width: 80%;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          <div class="header">
            <div class="logo-section">
              <img src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png" alt="MyHomeworkHelp" width="140" style="height: auto;">
            </div>
            <div class="date-section">
              ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          <div class="content">
            <div class="greeting">
              You Have New Messages 💬
            </div>
            
            <p>Hi <strong>${recipientName}</strong>,</p>
            
            <span class="message-count-badge">${totalMessageCount} New ${totalMessageCount === 1 ? 'Message' : 'Messages'}</span>
            
            <p>Your ${senderLabel.toLowerCase()} has sent you ${totalMessageCount === 1 ? 'a message' : 'multiple messages'} about your order:</p>
            
            <div class="order-box">
              <div class="order-row">
                <span class="order-label">📦 Order:</span>
                <span class="order-value">${orderTitle}</span>
              </div>
              <div class="order-row">
                <span class="order-label">🆔 Order ID:</span>
                <span class="order-value">${orderId}</span>
              </div>
              <div class="order-row">
                <span class="order-label">👤 From:</span>
                <span class="order-value">${senderDisplayName} (${senderLabel})</span>
              </div>
            </div>
            
            <div class="chat-window">
              ${messages.map((msg) => `
                <div class="chat-message">
                  <div class="message-avatar">${getInitials(msg.senderName)}</div>
                  <div class="message-content">
                    <div class="message-header">
                      <span class="message-sender">${msg.senderName}</span>
                      <span class="message-time">${msg.sentAt}</span>
                    </div>
                    <div class="message-bubble">
                      <p class="message-text">${msg.content}</p>
                    </div>
                  </div>
                </div>
              `).join('')}
              
              ${hasMoreMessages ? `
                <div class="more-messages">
                  📬 ...and ${remainingCount} more ${remainingCount === 1 ? 'message' : 'messages'}
                </div>
              ` : ''}
            </div>
            
            <p>Click below to view the full conversation and respond:</p>
            
            <div class="cta-section">
              <a href="${messageUrl}" class="view-btn">
                View Full Conversation
              </a>
            </div>
            
            <p style="font-size: 14px; color: #718096;">
              💡 <strong>Tip:</strong> Reply directly in the app to keep all conversations organized in one place.
            </p>
          </div>
          
          <div class="signature-section">
            <div class="signature">
              Best regards,<br>
              <strong>MyHomeworkHelp Team</strong>
            </div>
            
            <div class="help-section">
              <p><strong>Need help?</strong> Contact us at <a href="mailto:orders@myhomeworkhelp.com">orders@myhomeworkhelp.com</a></p>
              <p style="font-size: 13px; color: #a0aec0;">Support Hours: 8am - 8pm ET, Mon-Fri</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}