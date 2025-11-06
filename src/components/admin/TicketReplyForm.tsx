'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Send } from 'lucide-react';

interface TicketReplyFormProps {
  ticketId: string;
  onReplySubmit: () => void;
}

export function TicketReplyForm({ ticketId, onReplySubmit }: TicketReplyFormProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/support/tickets/${ticketId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: message.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Reply sent successfully!');
        setMessage('');
        onReplySubmit();
      } else {
        toast.error(result.error || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Reply error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Type your response here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={6}
        className="resize-none"
        disabled={loading}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {message.length} characters
        </p>
        <Button onClick={handleSubmit} disabled={loading || !message.trim()}>
          <Send className="w-4 h-4 mr-2" />
          {loading ? 'Sending...' : 'Send Reply'}
        </Button>
      </div>
    </div>
  );
}