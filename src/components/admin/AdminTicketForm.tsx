'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { HelpCircle, PenSquare } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { OrderSearchResult } from '@/types/support';

const ISSUE_TYPES = [
  'Question about order progress/status',
  'Request for revision or changes',
  'Payment or billing inquiry',
  'Technical issue with platform',
  'Communication problem with expert/customer',
  'Clarification needed',
  'Quality assurance check',
  'Deadline extension request',
  'Other (please specify)',
];

const MAX_CHARS = 1500;
const SUBJECT_MAX = 100;

interface AdminTicketFormProps {
  order: OrderSearchResult;
  recipient: {
    type: 'customer' | 'expert';
    id: string;
    email: string;
    name: string;
  };
  onSuccess: () => void;
  onBack: () => void;
}

export function AdminTicketForm({ order, recipient, onSuccess, onBack }: AdminTicketFormProps) {
  const [issueType, setIssueType] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!issueType) {
      toast.error('Please select an issue type');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (message.length > MAX_CHARS) {
      toast.error(`Message is too long (max ${MAX_CHARS} characters)`);
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please log in');
        return;
      }

      const response = await fetch('/api/admin/tickets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          order_id: order.id,
          recipient_type: recipient.type,
          recipient_id: recipient.id,
          recipient_email: recipient.email,
          recipient_name: recipient.name,
          issue_type: issueType,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Proactive support ticket created successfully!');
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Create admin ticket error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Context Card */}
      <Card className="p-4 bg-blue-50 border-2 border-blue-200">
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-blue-900">Creating ticket for:</span>{' '}
            <span className="font-semibold text-blue-700">{recipient.name}</span>
          </div>
          <div>
            <span className="font-medium text-blue-900">Order:</span>{' '}
            <span className="font-mono text-blue-700">{order.id}</span>
          </div>
          <div>
            <span className="font-medium text-blue-900">Recipient Type:</span>{' '}
            <span className="capitalize font-semibold text-blue-700">{recipient.type}</span>
          </div>
        </div>
      </Card>

      {/* Issue Category & Subject - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Issue Type */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            Issue Category <span className="text-red-500">*</span>
          </label>
          <Select value={issueType} onValueChange={setIssueType}>
            <SelectTrigger>
              <SelectValue placeholder="Select issue type" />
            </SelectTrigger>
            <SelectContent>
              {ISSUE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
            <PenSquare className="w-4 h-4 text-slate-500" />
            Subject <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="Brief summary of the issue"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={SUBJECT_MAX}
            disabled={loading}
          />
          <p className="text-xs text-slate-500 mt-1 text-right">
            {subject.length} / {SUBJECT_MAX}
          </p>
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
          <PenSquare className="w-4 h-4 text-slate-500" />
          Message <span className="text-red-500">*</span>
        </label>
        <Textarea
          placeholder="Provide details about why you're reaching out to this user..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={8}
          maxLength={MAX_CHARS}
          className="resize-none"
          disabled={loading}
        />
        <p className="text-xs text-slate-500 mt-2 text-right">
          {message.length} / {MAX_CHARS} characters
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading || !issueType || !subject.trim() || !message.trim()}
        >
          {loading ? 'Creating Ticket...' : 'Create Ticket'}
        </Button>
      </div>
    </div>
  );
}