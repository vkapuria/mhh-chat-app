'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OrderSelector } from './OrderSelector';
import { TicketCreationForm } from './TicketCreationForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface NewTicketModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalView = 'order-selection' | 'ticket-form' | 'all-orders' | 'general-inquiry';

export function NewTicketModal({ open, onClose, onSuccess }: NewTicketModalProps) {
  const [view, setView] = useState<ModalView>('order-selection');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const handleOrderSelect = (order: any) => {
    setSelectedOrder(order);
    setView('ticket-form');
  };

  const handleGeneralInquiry = () => {
    setSelectedOrder({
      id: 'general-inquiry',
      order_id: 'GENERAL',
      title: 'General Support Request',
      amount: null,
      expert_fee: null,
    });
    setView('ticket-form');
  };

  const handleBack = () => {
    setView('order-selection');
    setSelectedOrder(null);
  };

  const handleSuccess = () => {
    setView('order-selection');
    setSelectedOrder(null);
    onSuccess();
    onClose();
  };

  const handleCloseModal = () => {
    setView('order-selection');
    setSelectedOrder(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {view === 'order-selection' && 'Create Support Ticket'}
            {view === 'ticket-form' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="p-0 h-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <span>Create Ticket</span>
              </div>
            )}
            {view === 'all-orders' && 'Select Order'}
            {view === 'general-inquiry' && 'General Inquiry'}
          </DialogTitle>
        </DialogHeader>

        {view === 'order-selection' && (
          <OrderSelector
            onOrderSelect={handleOrderSelect}
            onViewAll={() => setView('all-orders')}
            onGeneralInquiry={handleGeneralInquiry}
          />
        )}

        {view === 'ticket-form' && selectedOrder && (
          <TicketCreationForm
            order={selectedOrder}
            onSuccess={handleSuccess}
            onCancel={handleBack}
          />
        )}

        {view === 'all-orders' && (
          <OrderSelector
            onOrderSelect={handleOrderSelect}
            showAll={true}
            onBack={handleBack}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}