'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Info, HelpCircle, PenSquareIcon } from 'lucide-react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface ContactSupportModalProps {
  order: {
    id: string;
    title: string;
    task_code: string;
    amount: number;
    expert_fee?: number;
    customer_name?: string;
    customer_display_name?: string;
    customer_email?: string;
    expert_name?: string;
    expert_display_name?: string;
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
  const [activeTab, setActiveTab] = useState('request');

  // Reset form when modal closes
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setIssueType('');
      setMessage('');
      setLoading(false);
      setActiveTab('request');
    }
  };

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
      // Step 1: Get auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please log in to submit a support ticket');
        setLoading(false);
        return;
      }
      
      const ticketResponse = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          order_id: order.id,
          order_title: order.title,
          task_code: order.id, // Use order.id directly
          issue_type: issueType,
          message: message.trim(),
          amount: order.amount,
          expert_fee: order.expert_fee,
          customer_email: order.customer_email,
          expert_email: order.expert_email,
        }),
      });

      const ticketResult = await ticketResponse.json();

      if (!ticketResult.success) {
        toast.error(ticketResult.error || 'Failed to create support ticket');
        setLoading(false);
        return;
      }

      // Step 2: Send email notification to admin
      const emailResponse = await fetch('/api/support/contact', {
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
          taskCode: order.id, // Use order.id directly
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          expertName: order.expert_name,
          expertEmail: order.expert_email,
          amount: order.amount,
          expertFee: order.expert_fee,
          issueType,
          message: message.trim(),
          ticketId: ticketResult.ticket.id, // Include ticket ID in email
        }),
      });

      const emailResult = await emailResponse.json();

      // Success even if email fails (ticket is created)
      if (emailResult.success) {
        toast.success("Support ticket created! We'll respond shortly.");
      } else {
        toast.success("Support ticket created! (Email notification pending)");
      }

      handleOpenChange(false); // Close and reset form
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>Contact Support</DialogTitle>
            <span className="text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
              <span className="font-mono font-semibold text-slate-700">{order.id}</span>
            </span>
          </div>
          <DialogDescription>
            We're here to help! Tell us what you need assistance with.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs Layout */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 relative bg-slate-100 border-b-0">
            {/* Animated background slider */}
            <motion.div
              className="absolute inset-y-1 rounded-md bg-white shadow-sm z-0"
              initial={false}
              animate={{
                left: activeTab === 'request' ? '4px' : 'calc(50% + 4px)',
                width: 'calc(50% - 8px)',
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
             
            <TabsTrigger value="request" className="flex items-center gap-2 relative z-10 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-0">
              <EnvelopeIcon className="w-4 h-4" />
              Submit Request
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2 relative z-10 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-0">
              <Info className="w-4 h-4" />
              Order Details
            </TabsTrigger>
          </TabsList>

          {/* Scrolling container for tab content */}
          <div className="py-2 overflow-y-auto pr-2">
            <AnimatePresence mode="wait">
              {/* Tab 1: Submit Request Form */}
              {activeTab === 'request' && (
                <TabsContent value="request" forceMount>
                  <motion.div
                    key="request"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="space-y-4"
                  >
                    {/* Issue Type Dropdown */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-900 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-slate-500" />
                        What do you need help with?{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <Select value={issueType} onValueChange={setIssueType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select issue type" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-[300px]">
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
                      <label className="text-sm font-medium text-slate-900 flex items-center gap-2">
                        <PenSquareIcon className="w-4 h-4" />
                        Describe your issue <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        placeholder="Please provide as much detail as possible..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={8}
                        maxLength={MAX_CHARS}
                        className="resize-none"
                      />
                      <p className="text-xs text-slate-500 text-right">
                        {message.length} / {MAX_CHARS} characters
                      </p>
                    </div>
                  </motion.div>
                </TabsContent>
              )}

              {/* Tab 2: Order Details */}
              {activeTab === 'details' && (
                <TabsContent value="details" forceMount>
                  <motion.div
                    key="details"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="h-full flex items-start"
                  >
                    <div className="bg-slate-50 p-4 rounded-lg space-y-3 text-sm border border-slate-200 w-full">
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Order Information
                      </h4>
                      <div className="space-y-2">
                        <p className="flex items-start">
                          <span className="text-slate-600 min-w-[90px]">Order ID:</span>
                          <span className="font-mono text-slate-900 font-medium">{order.id}</span>
                        </p>
                        <p className="flex items-start">
                          <span className="text-slate-600 min-w-[90px]">Title:</span>
                          <span className="text-slate-900">{order.title}</span>
                        </p>
                        <p className="flex items-start">
                          <span className="text-slate-600 min-w-[90px]">Customer:</span>
                          <span className="text-slate-900">
                            {order.customer_display_name || order.customer_name}
                          </span>
                        </p>
                        {order.expert_name && (
                          <p className="flex items-start">
                            <span className="text-slate-600 min-w-[90px]">Expert:</span>
                            <span className="text-slate-900">
                              {order.expert_display_name || order.expert_name}
                            </span>
                          </p>
                        )}
                        <p className="flex items-start">
                          <span className="text-slate-600 min-w-[90px]">
                            {userType === 'customer' ? 'Paid:' : 'Fee:'}
                          </span>
                          <span className="text-slate-900 font-semibold">
                            {userType === 'customer'
                              ? `$${order.amount}`
                              : `₹${order.expert_fee || order.amount}`}
                          </span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>
              )}
            </AnimatePresence>
          </div>
        </Tabs>

        {/* Actions (Footer) */}
        <DialogFooter className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <img src="/icons/gmail.svg" alt="Send" className="w-4 h-4 mr-2" />
            {loading ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}