'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OrderSearchAndSelector } from './OrderSearchAndSelector';
import { RecipientSelector } from './RecipientSelector';
import { AdminTicketForm } from './AdminTicketForm';
import { OrderSearchResult } from '@/types/support';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminTicketCreationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalStep = 'order-selection' | 'recipient-selection' | 'ticket-form';

export function AdminTicketCreationModal({ open, onClose, onSuccess }: AdminTicketCreationModalProps) {
  const [step, setStep] = useState<ModalStep>('order-selection');
  const [selectedOrder, setSelectedOrder] = useState<OrderSearchResult | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<{
    type: 'customer' | 'expert';
    id: string;
    email: string;
    name: string;
  } | null>(null);

  const handleOrderSelect = (order: OrderSearchResult) => {
    setSelectedOrder(order);
    setStep('recipient-selection');
  };

  const handleRecipientSelect = (recipient: { type: 'customer' | 'expert'; id: string; email: string; name: string }) => {
    setSelectedRecipient(recipient);
    setStep('ticket-form');
  };

  const handleSuccess = () => {
    setStep('order-selection');
    setSelectedOrder(null);
    setSelectedRecipient(null);
    onSuccess();
    onClose();
  };

  const handleCloseModal = () => {
    setStep('order-selection');
    setSelectedOrder(null);
    setSelectedRecipient(null);
    onClose();
  };

  const handleBackFromRecipient = () => {
    setStep('order-selection');
    setSelectedOrder(null);
  };

  const handleBackFromForm = () => {
    setStep('recipient-selection');
    setSelectedRecipient(null);
  };

  const getStepTitle = () => {
    switch (step) {
      case 'order-selection':
        return 'Step 1/3: Select Order';
      case 'recipient-selection':
        return 'Step 2/3: Select Recipient';
      case 'ticket-form':
        return 'Step 3/3: Create Ticket';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl md:text-2xl font-bold">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {getStepTitle()}
              </motion.div>
            </AnimatePresence>
          </DialogTitle>
          <p className="text-sm text-slate-600 mt-1">
            Create a proactive support ticket for a customer or expert
          </p>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'order-selection' && (
            <motion.div
              key="order-selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <OrderSearchAndSelector onOrderSelect={handleOrderSelect} />
            </motion.div>
          )}

          {step === 'recipient-selection' && selectedOrder && (
            <motion.div
              key="recipient-selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <RecipientSelector
                order={selectedOrder}
                onSelect={handleRecipientSelect}
                onBack={handleBackFromRecipient}
              />
            </motion.div>
          )}

          {step === 'ticket-form' && selectedOrder && selectedRecipient && (
            <motion.div
              key="ticket-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <AdminTicketForm
                order={selectedOrder}
                recipient={selectedRecipient}
                onSuccess={handleSuccess}
                onBack={handleBackFromForm}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}