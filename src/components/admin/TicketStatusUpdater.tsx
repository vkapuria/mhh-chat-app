'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface TicketStatusUpdaterProps {
  ticketId: string;
  currentStatus: 'submitted' | 'in_progress' | 'resolved';
  onStatusUpdate: (newStatus: 'submitted' | 'in_progress' | 'resolved') => void;
}

export function TicketStatusUpdater({
  ticketId,
  currentStatus,
  onStatusUpdate,
}: TicketStatusUpdaterProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: 'submitted' | 'in_progress' | 'resolved') => {
    if (newStatus === currentStatus) return;

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const statusLabels = {
          submitted: 'Submitted',
          in_progress: 'In Progress',
          resolved: 'Resolved',
        };
        toast.success(`Status updated to ${statusLabels[newStatus]}`);
        onStatusUpdate(newStatus);
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-slate-700">Update Status:</span>
      <div className="flex gap-2">
        <Button
          variant={currentStatus === 'submitted' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusChange('submitted')}
          disabled={loading || currentStatus === 'submitted'}
          className="flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          Submitted
        </Button>
        <Button
          variant={currentStatus === 'in_progress' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusChange('in_progress')}
          disabled={loading || currentStatus === 'in_progress'}
          className="flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          In Progress
        </Button>
        <Button
          variant={currentStatus === 'resolved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusChange('resolved')}
          disabled={loading || currentStatus === 'resolved'}
          className="flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Resolved
        </Button>
      </div>
    </div>
  );
}