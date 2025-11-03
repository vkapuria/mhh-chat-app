'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ContactSupportModalProps {
  order: {
    id: string;
    title: string;
    task_code: string;
    amount: number;
    expert_fee?: number;
    customer_name?: string;
    customer_email?: string;
    expert_name?: string;
    expert_email?: string;
  };
  userType: 'customer' | 'expert';
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}

const ISSUE_TYPES = [
  'Question about order progress/status',
  'Request for revision or changes',
  'Payment or billing inquiry',
  'Technical issue with platform',
  'Communication problem with expert/customer',
  'Other (please specify)',
];

const MAX_CHARS = 1200; // Approx 200 words

export function ContactSupportModal({
  order,
  userType,
  userName,
  userEmail,
  children,
}: ContactSupportModalProps) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
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
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName,
          userEmail,
          userType,
          orderId: order.id,
          orderTitle: order.title,
          taskCode: order.id,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          expertName: order.expert_name,
          expertEmail: order.expert_email,
          amount: order.amount,
          expertFee: order.expert_fee,
          issueType,
          message,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Support request sent! We\'ll get back to you soon.');
        setOpen(false);
        setIssueType('');
        setMessage('');
      } else {
        toast.error(result.error || 'Failed to send support request');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
          <DialogDescription>
            We're here to help! Tell us what you need assistance with.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Details (Read-only) */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
            <h4 className="font-semibold text-slate-900 mb-2">Order Details</h4>
            <p><span className="text-slate-600">Order ID:</span> <span className="font-mono text-slate-900">{order.id}</span></p>
            <p><span className="text-slate-600">Title:</span> <span className="text-slate-900">{order.title}</span></p>
            <p><span className="text-slate-600">Customer:</span> <span className="text-slate-900">{order.customer_name}</span></p>
            {order.expert_name && (
              <p><span className="text-slate-600">Expert:</span> <span className="text-slate-900">{order.expert_name}</span></p>
            )}
            <p>
              <span className="text-slate-600">Amount:</span>{' '}
              <span className="text-slate-900">
                {userType === 'customer' ? `$${order.amount}` : `₹${order.expert_fee || order.amount}`}
              </span>
            </p>
          </div>

          {/* Issue Type Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">
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

          {/* Message Textarea */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">
              Describe your issue <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Please provide as much detail as possible..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              maxLength={MAX_CHARS}
              className="resize-none"
            />
            <p className="text-xs text-slate-500 text-right">
              {message.length} / {MAX_CHARS} characters
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}