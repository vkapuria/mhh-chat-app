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
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

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
      border-top: 4px solid #4f46e5;
    }

    .container {
      padding: 48px 40px;
    }

    .header {
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 1px solid #e2e8f0;
    }

    .logo-section img {
      width: 140px;
      height: auto;
      display: block;
    }

    .date-section {
      text-align: right;
      font-size: 14px;
      color: #718096;
    }

    .tagline {
      margin-bottom: 24px;
      background: #f8fafc;
      border-radius: 10px;
      padding: 10px 14px;
      border: 1px solid #e2e8f0;
      font-size: 14px;
      color: #4a5568;
    }

    .content {
      font-size: 16px;
      line-height: 1.7;
      color: #2d3748;
    }

    .content p {
      margin: 0 0 18px 0;
    }

    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 18px;
    }

    .order-box {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 18px 16px;
      margin: 22px 0;
      font-size: 14px;
    }

    .order-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .order-row:last-child {
      margin-bottom: 0;
    }

    .order-label {
      color: #718096;
      font-weight: 500;
    }

    .order-value {
      color: #1f2933;
      font-weight: 600;
      text-align: right;
    }

    .message-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 16px 16px 18px 16px;
      margin: 22px 0 26px 0;
      font-size: 14px;
    }

    .message-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #9ca3af;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      gap: 8px;
      flex-wrap: wrap;
    }

    .sender-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .sender-avatar {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      border: 1px solid #d1d5db;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: #4b5563;
      font-size: 13px;
    }

    .sender-name {
      color: #111827;
      font-weight: 600;
      font-size: 14px;
    }

    .message-time {
      font-size: 12px;
      color: #9ca3af;
    }

    .message-text {
      color: #4b5563;
      line-height: 1.6;
      margin: 0;
      white-space: pre-wrap;
    }

    .cta-section {
      text-align: center;
      margin: 32px 0 10px 0;
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

    .tip-line {
      font-size: 13px;
      color: #94a3b8;
      text-align: center;
      margin-top: 8px;
    }

    .signature-section {
      margin-top: 36px;
      padding-top: 26px;
      border-top: 1px solid #e2e8f0;
    }

    .signature {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 18px;
      line-height: 1.6;
      color: #2d3748;
    }

    .help-section {
      font-size: 14px;
      color: #718096;
      margin-top: 10px;
    }

    .help-section p {
      margin: 0 0 6px 0;
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
        padding: 30px 24px;
      }
      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }
      .date-section {
        text-align: left;
      }
      .order-row {
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
      }
      .order-value {
        text-align: left;
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
          <img src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png" alt="MyHomeworkHelp" />
        </div>
        <div class="date-section">
          ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div class="tagline">
        You have a new message about one of your orders.
      </div>

      <div class="content">
        <div class="greeting">
          New message from your ${senderLabel}
        </div>

        <p>Hi <strong>${recipientName}</strong>,</p>

        <p>You've received a new message regarding the order below:</p>

        <div class="order-box">
          <div class="order-row">
            <span class="order-label">Order</span>
            <span class="order-value">${orderTitle}</span>
          </div>
          <div class="order-row">
            <span class="order-label">Order ID</span>
            <span class="order-value">${orderId}</span>
          </div>
          <div class="order-row">
            <span class="order-label">From</span>
            <span class="order-value">${senderName} (${senderLabel})</span>
          </div>
        </div>

        <div class="message-box">
          <div class="message-label">Message preview</div>

          <div class="message-header">
            <div class="sender-info">
              <div class="sender-avatar">${getInitials(senderName)}</div>
              <div class="sender-name">${senderName}</div>
            </div>
            <div class="message-time">${sentAt}</div>
          </div>

          <p class="message-text">${messageContent}</p>
        </div>

        <p>To read the full conversation and reply, please open your dashboard:</p>

        <div class="cta-section">
          <a href="${messageUrl}" class="view-btn">
            View conversation
          </a>
        </div>

        <div class="tip-line">
          Replies sent from your dashboard stay linked to this order for easy tracking.
        </div>
      </div>

      <div class="signature-section">
        <div class="signature">
          Best regards,<br />
          <strong>MyHomeworkHelp Team</strong>
        </div>

        <div class="help-section">
          <p><strong>Need help?</strong> Contact us at <a href="mailto:orders@myhomeworkhelp.com">orders@myhomeworkhelp.com</a></p>
          <p style="font-size: 13px; color: #a0aec0;">Support Hours: 8am – 8pm ET, Mon–Fri</p>
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
        border-top: 4px solid #4f46e5;
      }
      .container { 
        padding: 50px 40px;
      }
      .header { 
        margin-bottom: 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 24px;
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
      .tagline {
        margin: 16px 0 32px 0;
        font-size: 14px;
        color: #4a5568;
        background: #f8fafc;
        border-radius: 10px;
        padding: 12px 16px;
        border: 1px solid #e2e8f0;
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
        margin-bottom: 18px;
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
        margin: 35px 0 30px 0;
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
      
      .feature-list {
        padding-left: 20px; 
        margin: 0 0 20px 0;
      }
      .feature-list li {
        margin-bottom: 6px;
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
        margin-top: 10px;
      }
      .help-section p {
        margin: 0 0 8px 0;
      }
      .footer-note {
        margin-top: 18px;
        font-size: 12px;
        color: #a0aec0;
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
          gap: 8px;
        }
        .date-section {
          text-align: left;
          margin-top: 4px;
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
            <img src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png" alt="MyHomeworkHelp" width="140" style="height: auto; display: block;">
          </div>
          <div class="date-section">
            ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div class="tagline">
          Your dashboard is ready — log in and manage all your homework assignments in one place.
        </div>
        
        <div class="content">
          <div class="greeting">
            Welcome to your MyHomeworkHelp dashboard
          </div>
          
          <p>Hi <strong>${name}</strong>,</p>
          
          <p>
            Your MyHomeworkHelp account has been successfully created. You can now log in, track your orders in real time, 
            chat with your assigned experts, and manage all homework tasks from a single, secure workspace.
          </p>
          
          <div class="credentials-box">
            <h3>Your Login Details</h3>
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
            <p>
              <strong>For your security:</strong> Please change this temporary password after your first login and 
              avoid sharing your credentials with anyone, including MyHomeworkHelp staff.
            </p>
          </div>
          
          <p>Click the button below to access your dashboard:</p>
          
          <div class="cta-section">
            <a href="${loginUrl}" class="login-btn">
              Log in to MyHomeworkHelp
            </a>
          </div>
          
          <p>Once inside your dashboard, you’ll be able to:</p>
          <ul class="feature-list">
            <li>View and track all your assignments in real time</li>
            <li>Communicate directly with your assigned expert</li>
            <li>Upload files and review progress updates</li>
            <li>Track payments, invoices, and deadlines</li>
            <li>Manage support tickets and notification settings</li>
          </ul>
          
          <p>
            If you need any help getting started, simply reply to this email — our support team will be happy to assist you.
          </p>
        </div>
        
        <div class="signature-section">
          <div class="signature">
            Best regards,<br>
            <strong>MyHomeworkHelp Team</strong><br>
          </div>
          
          <div class="help-section">
            <p><strong>Need help?</strong> Contact us at <a href="mailto:orders@myhomeworkhelp.com">orders@myhomeworkhelp.com</a></p>
            <p style="font-size: 13px; color: #a0aec0;">Support Hours: 8am – 8pm ET, Mon–Fri</p>
          </div>

          <div class="footer-note">
            You are receiving this email because a MyHomeworkHelp account was created for you on our platform. 
            If you believe this was a mistake, please contact our support team.
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
  <meta charset="utf-8" />
  <title>New Reply to Your Ticket</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f7fafc;
      color: #111827;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji";
      -webkit-font-smoothing: antialiased;
    }

    a {
      color: #4f46e5;
      text-decoration: none;
    }

    img {
      border: 0;
      outline: none;
      text-decoration: none;
      max-width: 100%;
    }

    table {
      border-collapse: collapse;
    }

    .wrap {
      width: 100%;
      padding: 28px 0;
    }

    .container {
      width: 100%;
      max-width: 640px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.05);
      border-top: 4px solid #4f46e5;
      border-left: 1px solid #e5e7eb;
      border-right: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }

    .inner {
      padding: 40px 38px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 24px;
    }

    .logo {
      display: block;
      height: auto;
    }

    .date {
      font-size: 14px;
      color: #6b7280;
      text-align: right;
    }

    .tagline {
      margin-bottom: 22px;
      background: #f8fafc;
      border-radius: 10px;
      padding: 10px 14px;
      border: 1px solid #e5e7eb;
      font-size: 14px;
      color: #4b5563;
    }

    .h1 {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 16px 0;
      color: #111827;
    }

    .section-text {
      font-size: 15px;
      line-height: 1.7;
      color: #111827;
    }

    .section-text p {
      margin: 0 0 16px 0;
    }

    .grid {
      width: 100%;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
      margin: 18px 0 22px 0;
      font-size: 14px;
    }

    .grid-row {
      padding: 10px 14px;
    }

    .grid-row:nth-child(odd) {
      background: #f9fafb;
    }

    .label {
      color: #4b5563;
      width: 40%;
      white-space: nowrap;
    }

    .value {
      color: #111827;
      font-weight: 600;
      text-align: right;
    }

    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, "Liberation Mono", monospace;
    }

    .reply-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px 14px 16px 14px;
      margin: 8px 0 22px 0;
      font-size: 14px;
      color: #374151;
    }

    .reply-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #9ca3af;
      font-weight: 600;
      margin-bottom: 6px;
    }

    .reply-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .reply-meta {
      font-size: 13px;
      color: #6b7280;
    }

    .reply-from {
      font-weight: 600;
      color: #111827;
    }

    .reply-timestamp {
      font-size: 12px;
      color: #9ca3af;
    }

    .reply-body {
      margin: 0;
      line-height: 1.6;
      white-space: pre-wrap;
      color: #374151;
    }

    .email-reply-box {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 14px 14px 14px 16px;
      border-radius: 8px;
      margin-top: 10px;
      font-size: 13px;
    }

    .email-reply-box strong {
      color: #92400e;
    }

    .email-reply-box p {
      margin: 6px 0 0 0;
      color: #78350f;
      line-height: 1.5;
    }

    .cta {
      text-align: center;
      margin-top: 26px;
    }

    .btn {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff !important;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
      transition: all 0.2s ease;
    }

    .btn:hover {
      background: #4338ca;
      box-shadow: 0 6px 12px rgba(79, 70, 229, 0.3);
    }

    .foot {
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      padding: 18px 12px 20px 12px;
    }

    .foot p {
      margin: 0 0 6px 0;
    }

    @media (max-width: 620px) {
      .inner {
        padding: 28px 22px;
      }
      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }
      .date {
        text-align: left;
      }
      .grid-row {
        display: block;
      }
      .label,
      .value {
        display: block;
        width: 100%;
        text-align: left;
      }
      .value {
        margin-top: 2px;
      }
    }
  </style>
</head>
<body>
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${adminName} from support has replied to your ticket. View the response and reply back.
  </div>

  <table role="presentation" class="wrap" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" class="container" cellspacing="0" cellpadding="0">
          <tr>
            <td class="inner">
              <!-- Header -->
              <div class="header">
                <img
                  class="logo"
                  src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png"
                  alt="MyHomeworkHelp"
                  width="150"
                  height="auto"
                />
                <div class="date">
                  ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              <!-- Tagline -->
              <div class="tagline">
                You’ve received a new reply from our support team regarding one of your tickets.
              </div>

              <!-- Main content -->
              <div class="section-text">
                <h1 class="h1">New reply to your support ticket</h1>

                <p>Hi <strong>${recipientName}</strong>,</p>

                <p>
                  Our support team has responded to your ticket. Here’s a quick summary of the ticket details:
                </p>

                <!-- Ticket summary -->
                <table role="presentation" class="grid" cellpadding="0" cellspacing="0">
                  <tr class="grid-row">
                    <td class="label">Ticket ID</td>
                    <td class="value mono">${ticketNumber}</td>
                  </tr>
                  <tr class="grid-row">
                    <td class="label">Related Order</td>
                    <td class="value mono">${orderId}</td>
                  </tr>
                  <tr class="grid-row">
                    <td class="label">Issue Type</td>
                    <td class="value">${issueType}</td>
                  </tr>
                </table>

                <!-- Reply preview -->
                <div class="reply-box">
                  <div class="reply-label">Support reply</div>
                  <div class="reply-header">
                    <span class="reply-meta">
                      <span class="reply-from">${adminName}</span> • Support Team
                    </span>
                    <span class="reply-timestamp">${repliedAt}</span>
                  </div>
                  <p class="reply-body">${replyMessage}</p>
                </div>

                <!-- Email reply tip -->
                <div class="email-reply-box">
                  <strong>Tip:</strong>
                  <p>
                    You can reply directly to this email to continue the conversation — your response will be
                    added to the ticket, and our team will be notified.
                  </p>
                </div>

                <!-- CTA -->
                <div class="cta">
                  <a class="btn" href="${ticketUrl}">View ticket in dashboard</a>
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="foot">
              <p>© ${new Date().getFullYear()} MyHomeworkHelp</p>
              <p>You’re receiving this email because you have an active support ticket.</p>
              <p style="margin-top: 6px;">
                <a href="https://chat.myhomeworkhelp.com/support" style="color:#6b7280;">Open Support Center</a>
              </p>
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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f7fafc;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #2d3748;
    }

    .email-wrapper {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 8px 16px rgba(0,0,0,0.05);
      overflow: hidden;
    }

    .header {
      padding: 26px 36px;
      border-bottom: 1px solid #e5e7eb;
      text-align: center;
    }

    .header img {
      width: 150px;
      height: auto;
    }

    .title {
      margin: 22px 0 0 0;
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
    }

    .container {
      padding: 40px 36px;
      font-size: 16px;
      line-height: 1.7;
    }

    p { margin: 0 0 20px; }

    .details-box {
      border: 1px solid #e2e8f0;
      background: #f9fafb;
      border-radius: 10px;
      padding: 20px;
      margin: 28px 0;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 14px;
    }

    .detail-row:last-child { margin-bottom: 0; }

    .label {
      color: #6b7280;
      font-weight: 500;
    }

    .value {
      font-weight: 600;
      color: #1f2937;
    }

    .info-box {
      background: #eef2ff;
      border-left: 4px solid #4f46e5;
      padding: 16px;
      border-radius: 8px;
      margin-top: 28px;
      font-size: 15px;
      color: #3730a3;
    }

    .cta {
      text-align: center;
      margin: 36px 0 16px;
    }

    .button {
      display: inline-block;
      padding: 14px 34px;
      background: #4f46e5;
      color: #fff !important;
      font-weight: 600;
      border-radius: 8px;
      text-decoration: none;
      font-size: 16px;
      box-shadow: 0 4px 6px rgba(79,70,229,0.25);
    }

    .signature-section {
      border-top: 1px solid #e5e7eb;
      padding: 30px 36px;
      font-size: 14px;
      color: #6b7280;
    }

    .signature-section strong {
      color: #1f2937;
    }

    @media (max-width: 640px) {
      .email-wrapper { margin: 20px; }
      .container { padding: 28px 24px; }
      .header { padding: 24px; }
    }
  </style>
</head>

<body>
<div class="email-wrapper">

  <!-- Header -->
  <div class="header">
    <img src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png" alt="MyHomeworkHelp">
    <div class="title">Your Support Ticket Is Confirmed</div>
  </div>

  <!-- Body -->
  <div class="container">
    <p>Hi <strong>${recipientName}</strong>,</p>
    <p>Thanks for contacting us! Your request has been received and a support ticket has been created. Our team will review it shortly.</p>

    <!-- Ticket Details -->
    <div class="details-box">
      <div class="detail-row">
        <span class="label">🧾 Ticket ID:</span>
        <span class="value">${ticketNumber}</span>
      </div>
      <div class="detail-row">
        <span class="label">📦 Order:</span>
        <span class="value">${orderId}</span>
      </div>
      <div class="detail-row">
        <span class="label">🏷 Issue:</span>
        <span class="value">${issueType}</span>
      </div>
      <div class="detail-row">
        <span class="label">🗓 Created:</span>
        <span class="value">${createdAt}</span>
      </div>
    </div>

    <!-- Info -->
    <div class="info-box">
      <strong>What happens next:</strong><br>
      Our support team typically responds within <strong>24 hours</strong>. If you need to add more information, you can simply reply to this email — it will automatically attach to your ticket.
    </div>

    <!-- CTA -->
    <div class="cta">
      <a href="${ticketUrl}" class="button">View Ticket</a>
    </div>
  </div>

  <!-- Footer -->
  <div class="signature-section">
    <strong>MyHomeworkHelp Team</strong><br>
    We're here Monday–Friday, 8am–8pm ET  
    <br><br>
    If you didn't request support, you can ignore this email.
  </div>

</div>
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
    updatedAt,
  } = params;

  // Status styling
  const statusConfig: Record<string, { bg: string; text: string; label: string; emoji: string }> = {
    submitted:   { bg: '#fef3c7', text: '#92400e', label: 'Submitted',   emoji: '📝' },
    in_progress: { bg: '#dbeafe', text: '#1e40af', label: 'In Progress', emoji: '⚙️' },
    resolved:    { bg: '#d1fae5', text: '#065f46', label: 'Resolved',    emoji: '✅' },
  };

  const oldStatusStyle = statusConfig[oldStatus] || statusConfig.submitted;
  const newStatusStyle = statusConfig[newStatus] || statusConfig.submitted;

  // Status-specific messages
  const statusMessages: Record<string, { title: string; message: string }> = {
    in_progress: {
      title: "We're working on your ticket",
      message: `Your ticket about <strong>${issueType}</strong> is now <strong>In Progress</strong>. Our support team is actively reviewing your request and will follow up with more details soon.`,
    },
    resolved: {
      title: 'Your ticket has been resolved',
      message: `Good news! Your ticket regarding <strong>${issueType}</strong> has been marked as <strong>Resolved</strong>.<br><br>If you feel something is still not fully addressed, you can reply to this email and we’ll be happy to take another look.`,
    },
  };

  // Fallback message for other status transitions
  const statusMessage =
    statusMessages[newStatus] || {
      title: `${newStatusStyle.emoji} Ticket status updated`,
      message: `The status of your ticket has been updated to <strong>${newStatusStyle.label}</strong>. We’ll keep you informed of any further changes. If you have questions, you can reply directly to this email.`,
    };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Ticket Status Update</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f7fafc;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji";
      -webkit-font-smoothing: antialiased;
      color: #111827;
    }

    a {
      color: #4f46e5;
      text-decoration: none;
    }

    img {
      border: 0;
      outline: none;
      text-decoration: none;
      max-width: 100%;
    }

    .email-wrapper {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 10px 20px rgba(0,0,0,0.05);
      overflow: hidden;
      border-top: 4px solid #4f46e5;
    }

    .header {
      padding: 26px 36px 22px 36px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .header img {
      width: 140px;
      height: auto;
    }

    .header-title {
      text-align: right;
      font-size: 14px;
      color: #6b7280;
    }

    .header-title-strong {
      display: block;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }

    .container {
      padding: 36px 36px 34px 36px;
      font-size: 16px;
      line-height: 1.7;
      color: #1f2937;
    }

    p { margin: 0 0 18px; }

    .status-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 22px 0 10px 0;
      flex-wrap: wrap;
      font-size: 14px;
    }

    .status-label {
      font-size: 13px;
      color: #6b7280;
      font-weight: 500;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid #e5e7eb;
      background: #f9fafb;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
    }

    .status-pill-new {
      border: none;
      background: ${newStatusStyle.bg};
      color: ${newStatusStyle.text};
      font-weight: 600;
    }

    .status-arrow {
      font-size: 16px;
      color: #9ca3af;
    }

    .details-box {
      border: 1px solid #e2e8f0;
      background: #f9fafb;
      border-radius: 10px;
      padding: 18px 18px 16px 18px;
      margin: 18px 0 26px 0;
      font-size: 14px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }

    .detail-row:last-child {
      margin-bottom: 0;
    }

    .detail-label {
      color: #6b7280;
      font-weight: 500;
    }

    .detail-value {
      color: #111827;
      font-weight: 600;
      text-align: right;
    }

    .info-box {
      background: #eef2ff;
      border-left: 4px solid #4f46e5;
      padding: 16px 16px 16px 18px;
      border-radius: 8px;
      margin-top: 6px;
      font-size: 14px;
      color: #1e293b;
    }

    .info-box-title {
      font-size: 15px;
      font-weight: 600;
      margin: 0 0 6px 0;
    }

    .info-box p {
      margin: 0;
      line-height: 1.6;
      color: #374151;
    }

    .cta {
      text-align: center;
      margin: 30px 0 10px;
    }

    .btn {
      display: inline-block;
      padding: 12px 28px;
      border-radius: 8px;
      background: #4f46e5;
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      box-shadow: 0 4px 6px rgba(79,70,229,0.25);
    }

    .foot {
      border-top: 1px solid #e5e7eb;
      padding: 22px 32px 24px 32px;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.6;
    }

    .foot a {
      color: #6b7280;
      text-decoration: underline;
    }

    @media (max-width: 640px) {
      .email-wrapper { margin: 20px; }
      .header { padding: 22px 20px; flex-direction: column; align-items: flex-start; }
      .header-title { text-align: left; }
      .container { padding: 26px 20px 24px 20px; }
      .detail-row { flex-direction: column; align-items: flex-start; }
      .detail-value { text-align: left; }
    }
  </style>
</head>

<body>
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Your ticket status has been updated to ${newStatusStyle.label}. View the latest details.
  </div>

  <div class="email-wrapper">
    <!-- Header -->
    <div class="header">
      <img src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png" alt="MyHomeworkHelp" />
      <div class="header-title">
        <span class="header-title-strong">${newStatusStyle.emoji} Ticket status updated</span>
        <span>Updated on ${updatedAt}</span>
      </div>
    </div>

    <!-- Body -->
    <div class="container">
      <p>Hi <strong>${recipientName}</strong>,</p>
      <p>We’ve updated the status of your support ticket. Here’s a quick summary:</p>

      <!-- Status row -->
      <div class="status-row">
        <span class="status-label">Status:</span>
        <span class="status-pill">${oldStatusStyle.emoji} ${oldStatusStyle.label}</span>
        <span class="status-arrow">→</span>
        <span class="status-pill status-pill-new">${newStatusStyle.emoji} ${newStatusStyle.label}</span>
      </div>

      <!-- Ticket details -->
      <div class="details-box">
        <div class="detail-row">
          <span class="detail-label">Ticket ID</span>
          <span class="detail-value">${ticketNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Related order</span>
          <span class="detail-value">${orderId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Issue</span>
          <span class="detail-value">${issueType}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Last updated</span>
          <span class="detail-value">${updatedAt}</span>
        </div>
      </div>

      <!-- Status-specific explanation -->
      <div class="info-box">
        <div class="info-box-title">${statusMessage.title}</div>
        <p>${statusMessage.message}</p>
        <p style="margin-top:10px;">
          You can reply directly to this email if you’d like to share more details or ask a follow-up question.
        </p>
      </div>

      <!-- CTA -->
      <div class="cta">
        <a href="${ticketUrl}" class="btn">View ticket in dashboard</a>
      </div>
    </div>

    <!-- Footer -->
    <div class="foot">
      <div>© ${new Date().getFullYear()} MyHomeworkHelp</div>
      <div>You’re receiving this email because you have an active support ticket with us.</div>
      <div style="margin-top:6px;">
        You can also review all your tickets at
        <a href="https://chat.myhomeworkhelp.com/support">chat.myhomeworkhelp.com/support</a>.
      </div>
    </div>
  </div>
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
  <title>New Support Request</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.7;
      color: #1f2937;
      margin: 0;
      padding: 0;
      background: #f7fafc;
      -webkit-font-smoothing: antialiased;
    }

    .email-wrapper {
      max-width: 640px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 10px 20px rgba(0,0,0,0.05);
      overflow: hidden;
      border-top: 4px solid #4f46e5;
      border-left: 1px solid #e5e7eb;
      border-right: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }

    .container {
      padding: 36px 36px 30px 36px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 22px;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 22px;
      gap: 10px;
    }

    .logo {
      width: 140px;
      height: auto;
      display: block;
    }

    .meta {
      text-align: right;
      font-size: 12px;
      color: #6b7280;
    }

    .meta span {
      display: block;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      background: #fef3c7;
      border: 1px solid #fbbf24;
      color: #92400e;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 6px;
    }

    .pill-emoji {
      font-size: 13px;
    }

    .content {
      font-size: 15px;
      line-height: 1.7;
      color: #111827;
    }

    .content p {
      margin: 0 0 18px 0;
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
      margin: 22px 0 10px 0;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .info-box {
      background: #f9fafb;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      margin: 10px 0 4px 0;
    }

    .info-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
      gap: 12px;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 500;
      color: #6b7280;
      min-width: 120px;
    }

    .info-value {
      color: #111827;
      font-weight: 600;
      flex: 1;
    }

    .message-box {
      background: #f9fafb;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      padding: 14px 14px 16px 14px;
      margin: 8px 0 6px 0;
      font-size: 14px;
      line-height: 1.6;
      color: #374151;
      white-space: pre-wrap;
    }

    .message-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #9ca3af;
      font-weight: 600;
      margin-bottom: 6px;
    }

    .cta {
      text-align: center;
      margin-top: 24px;
    }

    .reply-btn {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(79,70,229,0.2);
    }

    .foot {
      margin-top: 26px;
      font-size: 12px;
      color: #9ca3af;
      line-height: 1.6;
    }

    @media screen and (max-width: 640px) {
      .email-wrapper {
        margin: 20px;
      }
      .container {
        padding: 26px 22px 24px 22px;
      }
      .header {
        flex-direction: column;
        align-items: flex-start;
      }
      .meta {
        text-align: left;
      }
      .info-row {
        flex-direction: column;
      }
      .info-label {
        min-width: 0;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <img
          src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png"
          alt="MyHomeworkHelp"
          class="logo"
        />
        <div class="meta">
          <span>Internal – Support Alert</span>
          <span>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}</span>
          <span class="pill">
            <span class="pill-emoji">🚨</span>
            New support request
          </span>
        </div>
      </div>

      <!-- Content -->
      <div class="content">
        <p>
          A new support request has been submitted for order
          <strong>${taskCode}</strong>.
        </p>

        <!-- Request details -->
        <div class="section-title">Request details</div>
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Issue type</span>
            <span class="info-value">${issueType}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Submitted by</span>
            <span class="info-value">
              ${userType === 'customer' ? 'Customer' : 'Expert'}: ${userName}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Contact email</span>
            <span class="info-value">${userEmail}</span>
          </div>
        </div>

        <!-- Message -->
        <div class="section-title">Message from user</div>
        <div class="message-box">
          <div class="message-label">Original message</div>
          ${message}
        </div>

        <!-- Order details -->
        <div class="section-title">Order details</div>
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
            <span class="info-label">Order value</span>
            <span class="info-value">
              $${amount}${expertFee ? ` / ₹${expertFee}` : ''}
            </span>
          </div>
        </div>

        <!-- CTA -->
        <div class="cta">
          <a href="mailto:${userEmail}" class="reply-btn">
            Reply to ${userName}
          </a>
        </div>

        <div class="foot">
          You’re receiving this internal alert because you’re part of the
          MyHomeworkHelp support team.
        </div>
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
  <title>New Reply to Support Ticket</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.7;
      color: #1f2937;
      margin: 0;
      padding: 0;
      background: #f7fafc;
      -webkit-font-smoothing: antialiased;
    }

    .email-wrapper {
      max-width: 640px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 10px 20px rgba(0,0,0,0.05);
      overflow: hidden;
      border-top: 4px solid #4f46e5;
      border-left: 1px solid #e5e7eb;
      border-right: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }

    .container {
      padding: 36px 36px 30px 36px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 22px;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 22px;
      gap: 10px;
    }

    .logo {
      width: 140px;
      height: auto;
      display: block;
    }

    .meta {
      text-align: right;
      font-size: 12px;
      color: #6b7280;
    }

    .meta span {
      display: block;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      background: #dbeafe;
      border: 1px solid #60a5fa;
      color: #1e40af;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 6px;
    }

    .pill-emoji {
      font-size: 13px;
    }

    .content {
      font-size: 15px;
      line-height: 1.7;
      color: #111827;
    }

    .content p {
      margin: 0 0 18px 0;
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
      margin: 22px 0 10px 0;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .info-box {
      background: #f9fafb;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      margin: 10px 0 4px 0;
    }

    .info-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
      gap: 12px;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 500;
      color: #6b7280;
      min-width: 120px;
    }

    .info-value {
      color: #111827;
      font-weight: 600;
      flex: 1;
    }

    .reply-box {
      background: #f9fafb;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      padding: 14px 14px 16px 14px;
      margin: 8px 0 6px 0;
      font-size: 14px;
      line-height: 1.6;
      color: #374151;
      white-space: pre-wrap;
    }

    .reply-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #9ca3af;
      font-weight: 600;
      margin-bottom: 6px;
    }

    .reply-meta {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 6px;
    }

    .reply-name {
      font-weight: 600;
      color: #111827;
    }

    .cta {
      text-align: center;
      margin-top: 24px;
    }

    .view-btn {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(79,70,229,0.2);
    }

    .foot {
      margin-top: 26px;
      font-size: 12px;
      color: #9ca3af;
      line-height: 1.6;
    }

    @media screen and (max-width: 640px) {
      .email-wrapper {
        margin: 20px;
      }
      .container {
        padding: 26px 22px 24px 22px;
      }
      .header {
        flex-direction: column;
        align-items: flex-start;
      }
      .meta {
        text-align: left;
      }
      .info-row {
        flex-direction: column;
      }
      .info-label {
        min-width: 0;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <img
          src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png"
          alt="MyHomeworkHelp"
          class="logo"
        />
        <div class="meta">
          <span>Internal – Ticket Reply</span>
          <span>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}</span>
          <span class="pill">
            <span class="pill-emoji">🔔</span>
            New reply ${replySource === 'email' ? '(via email)' : ''}
          </span>
        </div>
      </div>

      <!-- Content -->
      <div class="content">
        <p>
          <strong>${userName}</strong> has replied to their support ticket.
        </p>

        <!-- Ticket details -->
        <div class="section-title">Ticket details</div>
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
            <span class="info-label">Issue type</span>
            <span class="info-value">${issueType}</span>
          </div>
        </div>

        <!-- Reply content -->
        <div class="section-title">Reply from user</div>
        <div class="reply-box">
          <div class="reply-label">Latest reply</div>
          <div class="reply-meta">
            <span class="reply-name">${userName}</span>
            ${replySource === 'email' ? ' • via email' : ''}
          </div>
          ${replyMessage}
        </div>

        <!-- CTA -->
        <div class="cta">
          <a href="${adminPanelUrl}" class="view-btn">
            View ticket in admin panel
          </a>
        </div>

        <div class="foot">
          You’re receiving this internal alert because you’re part of the
          MyHomeworkHelp support team and are subscribed to ticket updates.
        </div>
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
  <title>You Have New Messages</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.7;
      color: #1f2937;
      margin: 0;
      padding: 0;
      background: #f7fafc;
      -webkit-font-smoothing: antialiased;
    }

    .email-wrapper {
      max-width: 640px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 10px 20px rgba(0,0,0,0.05);
      overflow: hidden;
      border-top: 4px solid #4f46e5;
      border-left: 1px solid #e5e7eb;
      border-right: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }

    .container {
      padding: 40px 36px 32px 36px;
    }

    .header {
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 22px;
      border-bottom: 1px solid #e2e8f0;
      gap: 10px;
    }

    .logo-section {
      flex: 1;
    }

    .logo-section img {
      display: block;
    }

    .date-section {
      text-align: right;
      font-size: 13px;
      color: #6b7280;
    }

    .content {
      font-size: 15px;
      line-height: 1.7;
      color: #111827;
    }

    .content p {
      margin: 0 0 18px 0;
    }

    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 18px;
    }

    .message-count-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #eef2ff;
      color: #3730a3;
      padding: 6px 14px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 13px;
      border: 1px solid #c7d2fe;
      margin-bottom: 18px;
    }

    .message-count-badge span {
      font-size: 15px;
    }

    .order-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px 16px;
      margin: 16px 0 22px 0;
      font-size: 14px;
    }

    .order-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .order-row:last-child {
      margin-bottom: 0;
    }

    .order-label {
      color: #6b7280;
      font-weight: 500;
    }

    .order-value {
      color: #111827;
      font-weight: 600;
      text-align: right;
    }

    .chat-window {
      background: #f9fafb;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      padding: 16px;
      margin: 10px 0 24px 0;
      max-height: 480px;
      overflow-y: auto;
    }

    .chat-message {
      display: flex;
      align-items: flex-start;
      margin-bottom: 14px;
      gap: 10px;
    }

    .chat-message:last-child {
      margin-bottom: 0;
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      background: #4f46e5;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: #ffffff;
      font-size: 13px;
      flex-shrink: 0;
    }

    .message-content {
      flex: 1;
      min-width: 0;
    }

    .message-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 4px;
    }

    .message-sender {
      font-weight: 600;
      color: #111827;
      font-size: 14px;
    }

    .message-time {
      font-size: 12px;
      color: #9ca3af;
      white-space: nowrap;
    }

    .message-body {
      background: #ffffff;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      padding: 10px 12px;
    }

    .message-text {
      color: #374151;
      line-height: 1.5;
      margin: 0;
      font-size: 14px;
      word-wrap: break-word;
      white-space: pre-wrap;
    }

    .more-messages {
      background: #eef2ff;
      border-radius: 8px;
      border: 1px dashed #818cf8;
      padding: 10px 12px;
      text-align: center;
      color: #4338ca;
      font-weight: 500;
      font-size: 13px;
      margin-top: 10px;
    }

    .cta-section {
      text-align: center;
      margin: 28px 0 18px 0;
    }

    .view-btn {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff !important;
      padding: 12px 26px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 6px rgba(79,70,229,0.2);
      transition: all 0.2s;
    }

    .view-btn:hover {
      background: #4338ca;
      box-shadow: 0 6px 12px rgba(79,70,229,0.3);
    }

    .signature-section {
      margin-top: 26px;
      padding-top: 22px;
      border-top: 1px solid #e5e7eb;
    }

    .signature {
      font-size: 15px;
      font-weight: 500;
      margin-bottom: 20px;
      line-height: 1.6;
      color: #111827;
    }

    .help-section {
      font-size: 13px;
      color: #6b7280;
      margin-top: 10px;
    }

    .help-section p {
      margin: 0 0 6px 0;
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
        border-radius: 10px;
      }
      .container {
        padding: 28px 22px 24px 22px;
      }
      .header {
        flex-direction: column;
        align-items: flex-start;
      }
      .date-section {
        text-align: left;
      }
      .order-row {
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
      }
      .order-value {
        text-align: left;
      }
      .chat-window {
        padding: 12px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-section">
          <img
            src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png"
            alt="MyHomeworkHelp"
            width="140"
            style="height: auto;"
          />
        </div>
        <div class="date-section">
          ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      <div class="content">
        <div class="greeting">
          You Have New Messages 💬
        </div>

        <p>Hi <strong>${recipientName}</strong>,</p>

        <div class="message-count-badge">
          <span>•</span>
          ${totalMessageCount} New ${totalMessageCount === 1 ? 'Message' : 'Messages'}
        </div>

        <p>
          Your ${senderLabel.toLowerCase()} has sent you
          ${totalMessageCount === 1 ? 'a message' : 'multiple messages'}
          about your order:
        </p>

        <div class="order-box">
          <div class="order-row">
            <span class="order-label">📦 Order</span>
            <span class="order-value">${orderTitle}</span>
          </div>
          <div class="order-row">
            <span class="order-label">🆔 Order ID</span>
            <span class="order-value">${orderId}</span>
          </div>
          <div class="order-row">
            <span class="order-label">👤 From</span>
            <span class="order-value">${senderDisplayName} (${senderLabel})</span>
          </div>
        </div>

        <div class="chat-window">
          ${messages
            .map(
              (msg) => `
            <div class="chat-message">
              <div class="message-avatar">${getInitials(msg.senderName)}</div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-sender">${msg.senderName}</span>
                  <span class="message-time">${msg.sentAt}</span>
                </div>
                <div class="message-body">
                  <p class="message-text">${msg.content}</p>
                </div>
              </div>
            </div>
          `
            )
            .join('')}

          ${hasMoreMessages
            ? `
            <div class="more-messages">
              📬 ...and ${remainingCount} more ${
                remainingCount === 1 ? 'message' : 'messages'
              } waiting in your dashboard.
            </div>
          `
            : ''}
        </div>

        <p>Click below to view the full conversation and respond:</p>

        <div class="cta-section">
          <a href="${messageUrl}" class="view-btn">
            View Full Conversation
          </a>
        </div>

        <p style="font-size: 13px; color: #6b7280;">
          💡 <strong>Tip:</strong> Reply directly in the dashboard to keep all messages and files
          organized in one place.
        </p>
      </div>

      <div class="signature-section">
        <div class="signature">
          Best regards,<br />
          <strong>MyHomeworkHelp Team</strong>
        </div>

        <div class="help-section">
          <p><strong>Need help?</strong> Email us at <a href="mailto:orders@myhomeworkhelp.com">orders@myhomeworkhelp.com</a></p>
          <p style="font-size: 12px; color: #9ca3af;">Support Hours: 8am – 8pm ET, Mon–Fri</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// =====================================================
// ONBOARDING FOLLOW-UP EMAILS (Added Nov 15, 2025)
// =====================================================

// Template: Onboarding Reminder #1 (Day 2 - FOMO)
export function generateOnboardingReminder1Email(params: {
  name: string;
  email: string;
  loginUrl: string;
}) {
  const { name, email, loginUrl } = params;

  return `
    <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

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
      border-top: 4px solid #4f46e5;
    }

    .container {
      padding: 48px 40px;
    }

    .header {
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 1px solid #e2e8f0;
    }

    .logo-section img {
      width: 140px;
      height: auto;
      display: block;
    }

    .date-section {
      text-align: right;
      font-size: 14px;
      color: #718096;
    }

    .tagline {
      margin-bottom: 28px;
      background: #f8fafc;
      border-radius: 10px;
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      font-size: 14px;
      color: #4a5568;
    }

    .greeting {
      font-size: 20px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 18px;
    }

    .content {
      font-size: 16px;
      color: #2d3748;
    }

    .content p {
      margin: 0 0 18px 0;
    }

    .soft-alert {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 16px 18px;
      border-radius: 8px;
      margin: 22px 0;
      font-size: 14px;
      color: #78350f;
    }

    .soft-alert strong {
      color: #92400e;
    }

    .benefits-box {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 22px 20px;
      margin: 26px 0;
    }

    .benefits-box h3 {
      margin: 0 0 14px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a202c;
    }

    .benefits-list {
      margin: 0;
      padding-left: 0;
      list-style: none;
      font-size: 14px;
      color: #4b5563;
    }

    .benefits-list li {
      display: flex;
      align-items: flex-start;
      margin-bottom: 10px;
    }

    .benefit-icon {
      font-size: 18px;
      margin-right: 10px;
      flex-shrink: 0;
      line-height: 1.4;
    }

    .benefit-text strong {
      color: #1a202c;
      font-weight: 600;
    }

    .cta-section {
      text-align: center;
      margin: 34px 0 10px 0;
    }

    .login-btn {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff !important;
      padding: 14px 38px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
      transition: all 0.2s;
    }

    .login-btn:hover {
      background: #4338ca;
      transform: translateY(-1px);
      box-shadow: 0 6px 12px rgba(79, 70, 229, 0.3);
    }

    .tip-line {
      font-size: 13px;
      color: #94a3b8;
      text-align: center;
      margin-top: 10px;
    }

    .signature-section {
      margin-top: 40px;
      padding-top: 26px;
      border-top: 1px solid #e2e8f0;
    }

    .signature {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 18px;
      line-height: 1.6;
    }

    .signature strong {
      font-weight: 600;
    }

    .help-section {
      font-size: 14px;
      color: #718096;
    }

    .help-section p {
      margin: 0 0 6px 0;
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
        padding: 30px 24px;
      }
      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }
      .date-section {
        text-align: left;
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
          <img src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png" alt="MyHomeworkHelp" />
        </div>
        <div class="date-section">
          ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div class="tagline">
        Your dashboard is set up and ready whenever you are.
      </div>

      <div class="content">
        <div class="greeting">
          Your account is ready, ${name}
        </div>

        <p>
          You recently created a MyHomeworkHelp account, but it looks like you haven’t logged in yet.
          No rush — we’ve saved your spot.
        </p>

        <div class="soft-alert">
          <strong>Why log in now?</strong><br/>
          It only takes a moment, and you’ll have everything related to your homework in one place.
        </div>

        <div class="benefits-box">
          <h3>Here’s what your dashboard lets you do:</h3>
          <ul class="benefits-list">
            <li>
              <span class="benefit-icon">💬</span>
              <div class="benefit-text">
                <strong>Chat with your expert</strong> as soon as one is assigned, instead of waiting on email.
              </div>
            </li>
            <li>
              <span class="benefit-icon">📊</span>
              <div class="benefit-text">
                <strong>See all your orders and deadlines</strong> in one clear timeline.
              </div>
            </li>
            <li>
              <span class="benefit-icon">📎</span>
              <div class="benefit-text">
                <strong>Upload files and instructions</strong> directly to your order whenever something changes.
              </div>
            </li>
            <li>
              <span class="benefit-icon">🎫</span>
              <div class="benefit-text">
                <strong>Reach support quickly</strong> via tickets, without searching through old emails.
              </div>
            </li>
          </ul>
        </div>

        <p>
          When you’re ready, just click below to sign in and take a quick look around:
        </p>

        <div class="cta-section">
          <a href="${loginUrl}" class="login-btn">
            Log in to MyHomeworkHelp
          </a>
        </div>

        <div class="tip-line">
          You can always come back later — your account and dashboard will be waiting.
        </div>
      </div>

      <div class="signature-section">
        <div class="signature">
          Best regards,<br/>
          <strong>MyHomeworkHelp Team</strong>
        </div>

        <div class="help-section">
          <p><strong>Need help?</strong> Email us at <a href="mailto:orders@myhomeworkhelp.com">orders@myhomeworkhelp.com</a></p>
          <p style="font-size: 13px; color: #a0aec0;">Support Hours: 8am – 8pm ET, Mon–Fri</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Template: Onboarding Reminder #2 (Day 5 - Urgency)
export function generateOnboardingReminder2Email(params: {
  name: string;
  email: string;
  loginUrl: string;
}) {
  const { name, email, loginUrl } = params;

  return `
    <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

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
      border-top: 4px solid #4f46e5;
    }

    .container {
      padding: 48px 40px;
    }

    .header {
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 1px solid #e2e8f0;
    }

    .logo-section img {
      width: 140px;
      height: auto;
      display: block;
    }

    .date-section {
      text-align: right;
      font-size: 14px;
      color: #718096;
    }

    .tagline {
      margin-bottom: 26px;
      background: #f8fafc;
      border-radius: 10px;
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      font-size: 14px;
      color: #4a5568;
    }

    .greeting {
      font-size: 20px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 18px;
    }

    .content p {
      margin: 0 0 18px 0;
      font-size: 16px;
    }

    .soft-alert {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 16px 18px;
      border-radius: 8px;
      margin: 22px 0;
      font-size: 14px;
      color: #78350f;
    }

    .soft-alert strong {
      color: #92400e;
    }

    .highlight-box {
      background: #eef2ff;
      border-radius: 10px;
      border: 1px solid #c7d2fe;
      padding: 20px 18px;
      margin: 26px 0;
      font-size: 14px;
      color: #1e3a8a;
    }

    .highlight-box h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1e3a8a;
    }

    .highlight-box ul {
      margin: 10px 0 0 0;
      padding-left: 20px;
      color: #334155;
    }

    .highlight-box li {
      margin-bottom: 6px;
    }

    .cta-section {
      text-align: center;
      margin: 34px 0 10px 0;
    }

    .login-btn {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff !important;
      padding: 14px 38px;
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

    .tip-line {
      font-size: 13px;
      color: #94a3b8;
      text-align: center;
      margin-top: 10px;
    }

    .signature-section {
      margin-top: 40px;
      padding-top: 26px;
      border-top: 1px solid #e2e8f0;
    }

    .signature {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 18px;
      line-height: 1.6;
    }

    .help-section {
      font-size: 14px;
      color: #718096;
    }

    .help-section p {
      margin: 0 0 6px 0;
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
        padding: 30px 24px;
      }
      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }
      .date-section {
        text-align: left;
      }
      .content p {
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
          <img src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png" alt="MyHomeworkHelp" />
        </div>
        <div class="date-section">
          ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div class="tagline">
        Just a quick final reminder that your MyHomeworkHelp dashboard is ready whenever you are.
      </div>

      <div class="content">
        <div class="greeting">
          Final reminder about your account, ${name}
        </div>

        <p>
          It’s been a few days since we created your MyHomeworkHelp account, and we noticed you haven’t logged in yet.
          That’s completely okay — we just wanted to check in once more.
        </p>

        <div class="soft-alert">
          <strong>Why this matters:</strong><br/>
          Logging in ensures you don’t miss updates, messages, or any changes related to your homework help.
        </div>

        <p>
          Your dashboard is already set up and waiting. With a quick sign-in, you’ll be able to see everything in one place.
        </p>

        <div class="highlight-box">
          <h3>From your dashboard, you can:</h3>
          <ul>
            <li>Review current and past orders in a clear timeline</li>
            <li>Chat with your assigned expert (when available)</li>
            <li>Upload additional files or updated instructions</li>
            <li>Reach support quickly if you need assistance</li>
          </ul>
        </div>

        <p>
          If you’re planning to use MyHomeworkHelp for an upcoming assignment, logging in now will make things smoother later.
        </p>

        <div class="cta-section">
          <a href="${loginUrl}" class="login-btn">
            Log in to MyHomeworkHelp
          </a>
        </div>

        <div class="tip-line">
          If you’re not ready yet, no problem — your account will still be here when you need it.
        </div>
      </div>

      <div class="signature-section">
        <div class="signature">
          Best regards,<br/>
          <strong>MyHomeworkHelp Team</strong>
        </div>

        <div class="help-section">
          <p><strong>Questions?</strong> Just reply to this email or contact us at <a href="mailto:orders@myhomeworkhelp.com">orders@myhomeworkhelp.com</a></p>
          <p style="font-size: 13px; color: #a0aec0;">Support Hours: 8am – 8pm ET, Mon–Fri</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Template: Welcome Email (1 hour after onboarding completion)
export function generateOnboardingWelcomeEmail(params: {
  name: string;
  email: string;
  dashboardUrl: string;
}) {
  const { name, email, dashboardUrl } = params;

  return `
    <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f7fafc;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #2d3748;
      line-height: 1.7;
    }

    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      border-top: 4px solid #4f46e5;
    }

    .container {
      padding: 44px 40px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 28px;
    }

    .date {
      font-size: 14px;
      color: #718096;
    }

    .tagline {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 14px;
      color: #4a5568;
      margin-bottom: 30px;
    }

    .greeting {
      font-size: 22px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 16px;
    }

    .intro {
      font-size: 16px;
      margin-bottom: 22px;
    }

    .simple-box {
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      padding: 18px 20px;
      border-radius: 10px;
      margin: 28px 0;
      font-size: 15px;
      color: #312e81;
      line-height: 1.6;
    }

    .list {
      margin: 20px 0 30px 0;
      padding-left: 20px;
      color: #4b5563;
      font-size: 15px;
    }

    .list li {
      margin-bottom: 8px;
    }

    .cta {
      text-align: center;
      margin: 36px 0;
    }

    .cta-btn {
      background: #4f46e5;
      color: #ffffff !important;
      padding: 14px 36px;
      border-radius: 8px;
      text-decoration: none;
      display: inline-block;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
      transition: all 0.2s ease;
    }

    .cta-btn:hover {
      background: #4338ca;
      transform: translateY(-1px);
    }

    .signature-section {
      margin-top: 40px;
      padding-top: 26px;
      border-top: 1px solid #e2e8f0;
    }

    .signature {
      font-size: 16px;
      margin-bottom: 20px;
      font-weight: 500;
    }

    .signature-title {
      font-size: 14px;
      color: #718096;
    }

    .footer-help {
      font-size: 14px;
      color: #718096;
    }

    @media(max-width: 640px) {
      .container { padding: 30px 24px; }
      .header { flex-direction: column; align-items: flex-start; }
      .date { margin-top: 8px; }
    }
  </style>
</head>

<body>

<div class="wrapper">
  <div class="container">

    <div class="header">
      <img src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png" width="140" />
      <div class="date">
        ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}
      </div>
    </div>

    <div class="tagline">
      Thanks for logging in — here’s a quick welcome from us.
    </div>

    <div class="greeting">Hi ${name}, welcome again 👋</div>

    <p class="intro">
      We noticed your first successful login — great to have you inside your dashboard.  
      This email is simply a warm welcome and a short reminder of what you can do at anytime.
    </p>

    <div class="simple-box">
      Your dashboard is now fully active.  
      You can access your orders, send messages, upload files, and view updates whenever you need.
    </div>

    <p style="font-size:16px; margin-bottom:12px;"><strong>A few things you can check anytime:</strong></p>

    <ul class="list">
      <li>Open your active orders and review deadlines</li>
      <li>Chat with your assigned expert when available</li>
      <li>Upload files or new instructions if needed</li>
      <li>Review your order history and updates</li>
    </ul>

    <div class="cta">
      <a class="cta-btn" href="${dashboardUrl}">Return to Dashboard</a>
    </div>

    <div class="signature-section">
      <div class="signature">
        Best regards,<br/>
        <strong>Nick Kessler</strong><br/>
        <span class="signature-title">Academic Services Coordinator — MyHomeworkHelp</span>
      </div>

      <div class="footer-help">
        Need assistance? Email us at  
        <a href="mailto:orders@myhomeworkhelp.com">orders@myhomeworkhelp.com</a>
      </div>
    </div>

  </div>
</div>

</body>
</html>

  `;
}