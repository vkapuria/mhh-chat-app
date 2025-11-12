'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, DollarSign, IndianRupee, Calendar, User } from 'lucide-react';
import { OrderSearchResult } from '@/types/support';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface RecipientSelectorProps {
  order: OrderSearchResult;
  onSelect: (recipient: { type: 'customer' | 'expert'; id: string; email: string; name: string }) => void;
  onBack: () => void;
}

export function RecipientSelector({ order, onSelect, onBack }: RecipientSelectorProps) {
  // Debug: Check what we're receiving
  console.log('🔍 RecipientSelector - Order data:', {
    expert_name: order.expert_name,
    expert_id: order.expert_id,
    expert_email: order.expert_email,
  });

  const [selected, setSelected] = useState<string>('');


  const handleNext = () => {
    if (!selected) return;

    const [type, recipientData] = selected.split('|');
    
    if (type === 'customer') {
      onSelect({
        type: 'customer',
        id: order.customer_email,
        email: order.customer_email,
        name: order.customer_display_name || order.customer_name,
      });
    } else {
      onSelect({
        type: 'expert',
        id: order.expert_id!,
        email: order.expert_email!,
        name: order.expert_display_name || order.expert_name!,
      });
    }
  };

  // Check if expert exists
  const hasExpert = order.expert_name && order.expert_id;

  // Build dropdown options
  const customerOption = {
    value: `customer|${order.customer_email}`,
    label: `${order.customer_display_name || order.customer_name} (Customer)`,
  };

  const expertOption = hasExpert ? {
    value: `expert|${order.expert_id}`,
    label: `${order.expert_display_name || order.expert_name} (Expert)`,
  } : null;

  return (
    <div className="space-y-6">
      {/* Order Context Card */}
      <Card className="p-5 bg-slate-50 border-2 border-slate-200">
        <div className="space-y-3">
          <div className="pb-3 border-b border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-1">{order.title}</h4>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-500" />
              <span className="font-mono text-xs text-slate-600">{order.id}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-slate-600">Price:</span>
              <span className="font-semibold text-slate-900">${order.amount}</span>
            </div>
            {order.expert_fee && (
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-green-500" />
                <span className="text-slate-600">Fee:</span>
                <span className="font-semibold text-slate-900">₹{order.expert_fee}</span>
              </div>
            )}
            <div className="flex items-center gap-2 col-span-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">Ordered:</span>
              <span className="text-slate-900">{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Recipient Selection Dropdown */}
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          Who would you like to contact regarding this order? <span className="text-red-500">*</span>
        </label>
        
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select recipient" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={customerOption.value}>
              {customerOption.label}
            </SelectItem>
            {expertOption && (
              <SelectItem value={expertOption.value}>
                {expertOption.label}
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        {!hasExpert && (
          <p className="text-sm text-slate-500 italic mt-2">
            No expert assigned to this order yet. You can only contact the customer.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!selected}>
          Next
        </Button>
      </div>
    </div>
  );
}