import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend'; // ← ADD THIS

const resend = new Resend(process.env.RESEND_API_KEY!); // ← ADD THIS

// Create service role client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    console.log('📧 Inbound email received:', {
        from: payload.data.from,
        to: payload.data.to,
        subject: payload.data.subject,
      });
      
      // DEBUG: See what fields Resend is actually sending
      console.log('🔍 Full payload.data keys:', Object.keys(payload.data));
      console.log('🔍 Has text?', !!payload.data.text);
      console.log('🔍 Has html?', !!payload.data.html);
      console.log('🔍 Has body?', !!payload.data.body);
      console.log('🔍 Has plain?', !!payload.data.plain);

    // Extract ticket ID from email address
    const toEmail = payload.data.to[0];
    const match = toEmail.match(/support\+([^@]+)@/);
    
    if (!match) {
      console.error('❌ Could not parse ticket ID from:', toEmail);
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const ticketId = match[1];
    console.log('🎫 Ticket ID extracted:', ticketId);

    // Get ticket to verify it exists and get user info
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();
    
    if (ticketError || !ticket) {
      console.error('❌ Ticket not found:', ticketId);
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Verify sender is the ticket owner (normalize Gmail aliases)
    const senderEmail = extractEmail(payload.data.from);
    const normalizedSender = normalizeEmail(senderEmail);
    const normalizedTicketEmail = normalizeEmail(ticket.user_email);

    if (normalizedSender !== normalizedTicketEmail) {
      console.error('❌ Unauthorized sender:', senderEmail, 'vs', ticket.user_email);
      console.error('   Normalized:', normalizedSender, 'vs', normalizedTicketEmail);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('✅ Sender verified:', senderEmail);

    // Fetch full email content from Resend Receiving API
    console.log('📬 Fetching email content for:', payload.data.email_id);
    const { data: emailData, error: fetchError } = await resend.emails.receiving.get(payload.data.email_id);

    if (fetchError || !emailData) {
    console.error('❌ Failed to fetch email:', fetchError);
    return NextResponse.json({ error: 'Failed to fetch email content' }, { status: 500 });
    }

    console.log('📧 Email fetched, available fields:', Object.keys(emailData));

    // Parse email content (use text, fallback to html)
    const rawContent = (emailData as any).text || (emailData as any).html || '';
    console.log('📝 Raw content length:', rawContent.length);
    
    const cleanedMessage = parseEmailBody(rawContent);
    console.log('📝 Cleaned message length:', cleanedMessage.length);

    if (!cleanedMessage.trim()) {
      console.error('❌ Empty message after parsing');
      console.error('   Raw content preview:', rawContent.substring(0, 200));
      return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    }

    console.log('💬 Cleaned message:', cleanedMessage.substring(0, 100) + '...');

    // Create reply from user
    const { data: reply, error: replyError } = await supabaseAdmin
      .from('ticket_replies')
      .insert({
        ticket_id: ticketId,
        admin_id: ticket.user_id,
        admin_name: ticket.user_display_name,
        message: cleanedMessage,
        reply_type: 'user',
      })
      .select()
      .single();

    if (replyError) {
      console.error('❌ Failed to create reply:', replyError);
      return NextResponse.json({ error: replyError.message }, { status: 500 });
    }

    console.log('✅ Reply created:', reply.id);
    // Update ticket's updated_at timestamp
    await supabaseAdmin
    .from('support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId);

    console.log('🕐 Ticket timestamp updated');

    // Reopen ticket if it was resolved
    if (ticket.status === 'resolved') {
      await supabaseAdmin
        .from('support_tickets')
        .update({ 
          status: 'in_progress',
          resolved_at: null,
        })
        .eq('id', ticketId);
      
      console.log('🔄 Ticket reopened from resolved to in_progress');
    }

    return NextResponse.json({ 
      success: true,
      ticket_id: ticketId,
      reply_id: reply.id,
    });
  } catch (error) {
    console.error('❌ Inbound email error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Extract email address from "Name <email@domain.com>" format
function extractEmail(fromField: string): string {
  const match = fromField.match(/<(.+?)>/);
  return match ? match[1] : fromField;
}

// Normalize email for comparison (handle Gmail aliases)
function normalizeEmail(email: string): string {
  const lower = email.toLowerCase().trim();
  
  // For Gmail/Google Workspace: remove +alias and dots
  if (lower.includes('@gmail.com') || lower.includes('@googlemail.com')) {
    const [local, domain] = lower.split('@');
    const normalized = local.split('+')[0].replace(/\./g, '');
    return `${normalized}@${domain}`;
  }
  
  // For other providers: just remove +alias
  const [local, domain] = lower.split('@');
  const normalized = local.split('+')[0];
  return `${normalized}@${domain}`;
}

// Parse email body to remove quoted text and signatures
function parseEmailBody(text: string): string {
  const lines = text.split('\n');
  const cleanLines: string[] = [];
  let foundContent = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines at the start
    if (!foundContent && !trimmed) {
      continue;
    }
    
    // Stop at common reply markers
    if (
      trimmed.startsWith('>') || // Quoted text
      (trimmed.startsWith('On ') && trimmed.includes('wrote:')) || // Gmail/Outlook quote
      trimmed === '--' || // Signature delimiter
      trimmed.startsWith('-----Original Message-----') || // Outlook
      trimmed.startsWith('From:') && trimmed.includes('@') // Email headers
    ) {
      break;
    }
    
    foundContent = true;
    cleanLines.push(line);
  }
  
  return cleanLines.join('\n').trim();
}