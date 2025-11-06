'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Package, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const ISSUE_TYPES = [
  'Payment issue',
  'Delivery delay',
  'Quality concern',
  'Revision request',
  'Technical issue with platform',
  'Communication issue',
  'Other',
];

interface TicketCreationFormProps {
  order: {
    id: string;
    order_id: string;
    title: string;
    amount: number | null;
    expert_fee: number | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function TicketCreationForm({ order, onSuccess, onCancel }: TicketCreationFormProps) {
  const [issueType, setIssueType] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<'customer' | 'expert' | null>(null);

  useEffect(() => {
    const getUserType = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserType = user?.user_metadata?.user_type || 'customer';
      setUserType(currentUserType);
    };
    getUserType();
  }, []);

  const isGeneralInquiry = order.id === 'general-inquiry';

  const handleSubmit = async () => {
    if (!issueType) {
      toast.error('Please select an issue type');
      return;
    }

    if (!message.trim()) {
      toast.error('Please describe your issue');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please log in');
        return;
      }

      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          order_id: order.id,
          issue_type: issueType,
          message: message.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Support ticket created successfully!');
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Create ticket error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Order Info */}
      {!isGeneralInquiry && (
        <Card className="p-4 bg-slate-50">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <Package className="w-4 h-4" />
            <span className="font-mono font-semibold">{order.order_id}</span>
          </div>
          <p className="text-sm text-slate-900 mb-2">{order.title}</p>
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <DollarSign className="w-3 h-3" />
            {/* Show only relevant amount based on user type */}
            {userType === 'customer' && order.amount && (
              <span>${order.amount}</span>
            )}
            {userType === 'expert' && order.expert_fee && (
              <span>₹{order.expert_fee}</span>
            )}
          </div>
        </Card>
      )}

      {isGeneralInquiry && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>General Inquiry:</strong> This ticket is not linked to a specific order.
          </p>
        </Card>
      )}

      {/* Issue Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          What do you need help with?
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

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Please describe your issue
        </label>
        <Textarea
          placeholder="Provide as much detail as possible to help us assist you better..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="resize-none"
          disabled={loading}
        />
        <p className="text-xs text-slate-500 mt-2">
          {message.length} characters
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !issueType || !message.trim()}>
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </Button>
      </div>
    </div>
  );
}