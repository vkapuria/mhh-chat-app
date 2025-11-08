'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Package, DollarSign, User, Calendar, IndianRupee, HelpCircle, PenSquareIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { trackTicketCreated } from '@/lib/analytics';

const ISSUE_TYPES = [
  'Question about order progress/status',
  'Request for revision or changes',
  'Payment or billing inquiry',
  'Technical issue with platform',
  'Communication problem with expert/customer',
  'Other (please specify)',
];

const MAX_CHARS = 1200;

interface TicketCreationFormProps {
  order: {
    id: string;
    order_id?: string;
    title: string;
    amount: number | null;
    expert_fee: number | null;
    expert_name?: string;
    expert_display_name?: string;
    customer_name?: string;
    customer_display_name?: string;
    created_at?: string;
    status?: string;
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

      const response = await fetch('/api/support/tickets', {
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
        // Track the event
        trackTicketCreated({
          orderId: order.id,
          issueType: issueType,
          userType: userType || 'customer',
        });
        
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
      {/* Detailed Order Info Card */}
      {!isGeneralInquiry ? (
        <Card className="p-4 md:p-5 bg-slate-50 border-2 border-slate-200">
          <div className="space-y-3">
            {/* Title */}
            <div className="pb-3 border-b border-slate-200">
              <h4 className="font-semibold text-sm md:text-base text-slate-900 mb-1">
                {order.title}
              </h4>
              {order.order_id && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-500" />
                  <span className="font-mono text-xs text-slate-600">
                    {order.order_id}
                  </span>
                </div>
              )}
            </div>

            {/* Details Grid */}
            <div className="space-y-2 text-sm">
              {/* Customer/Expert Name */}
              {userType === 'customer' && (order.expert_display_name || order.expert_name) && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-600">Expert:</span>
                  <span className="text-slate-900 font-medium">
                    {order.expert_display_name || order.expert_name}
                  </span>
                </div>
              )}
              
              {userType === 'expert' && (order.customer_display_name || order.customer_name) && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-600">Customer:</span>
                  <span className="text-slate-900 font-medium">
                    {order.customer_display_name || order.customer_name}
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-2">
                {userType === 'expert' && order.expert_fee ? (
                  <>
                    <IndianRupee className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-slate-600">Fee:</span>
                    <span className="text-green-700 font-semibold">₹{order.expert_fee.toLocaleString('en-IN')}</span>
                  </>
                ) : order.amount ? (
                  <>
                    <DollarSign className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-slate-600">Price:</span>
                    <span className="text-blue-700 font-semibold">${order.amount}</span>
                  </>
                ) : null}
              </div>

              {/* Date */}
              {order.created_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-600">Ordered:</span>
                  <span className="text-slate-900">
                    {format(new Date(order.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-900 font-medium">
              General Inquiry - Not linked to a specific {userType === 'expert' ? 'task' : 'order'}
            </p>
          </div>
        </Card>
      )}

      {/* Issue Type */}
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          What do you need help with? <span className="text-red-500">*</span>
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
        <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
          <PenSquareIcon className="w-4 h-4 text-slate-500" />
          Please describe your issue <span className="text-red-500">*</span>
        </label>
        <Textarea
          placeholder="Provide as much detail as possible to help us assist you better..."
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