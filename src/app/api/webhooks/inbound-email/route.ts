import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create service role client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Need to add this to .env
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

    // Extract ticket ID from email address
    // support+abc123@chueulkoia.resend.app → abc123
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

    // Verify sender is the ticket owner
    const senderEmail = extractEmail(payload.data.from);
    if (senderEmail.toLowerCase() !== ticket.user_email.toLowerCase()) {
      console.error('❌ Unauthorized sender:', senderEmail, 'vs', ticket.user_email);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse email content (use text, fallback to html)
    const rawContent = payload.data.text || payload.data.html || '';
    const cleanedMessage = parseEmailBody(rawContent);

    if (!cleanedMessage.trim()) {
      console.error('❌ Empty message after parsing');
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
        reply_type: 'user', // Mark as user reply
      })
      .select()
      .single();

    if (replyError) {
      console.error('❌ Failed to create reply:', replyError);
      return NextResponse.json({ error: replyError.message }, { status: 500 });
    }

    console.log('✅ Reply created:', reply.id);

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

// Parse email body to remove quoted text and signatures
function parseEmailBody(text: string): string {
  const lines = text.split('\n');
  const cleanLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Stop at common reply markers
    if (
      trimmed.startsWith('>') || // Quoted text
      trimmed.startsWith('On ') && trimmed.includes('wrote:') || // Gmail/Outlook quote
      trimmed === '--' || // Signature delimiter
      trimmed.startsWith('-----Original Message-----') // Outlook
    ) {
      break;
    }
    
    cleanLines.push(line);
  }
  
  return cleanLines.join('\n').trim();
}