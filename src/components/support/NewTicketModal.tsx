'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OrderSelector } from './OrderSelector';
import { TicketCreationForm } from './TicketCreationForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewTicketModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalView = 'order-selection' | 'ticket-form' | 'all-orders';

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl md:text-2xl font-bold">
              <AnimatePresence mode="wait">
                {view === 'order-selection' && (
                  <motion.span
                    key="order-selection"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    Create Support Ticket
                  </motion.span>
                )}
                {view === 'ticket-form' && (
                  <motion.div
                    key="ticket-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-2"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBack}
                      className="p-0 h-auto hover:bg-transparent"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <span>Create Ticket</span>
                  </motion.div>
                )}
                {view === 'all-orders' && (
                  <motion.div
                    key="all-orders"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-2"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBack}
                      className="p-0 h-auto hover:bg-transparent"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <span>Select Order</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {view === 'order-selection' && (
              <motion.div
                key="order-selection-view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <OrderSelector
                  onOrderSelect={handleOrderSelect}
                  onViewAll={() => setView('all-orders')}
                  onGeneralInquiry={handleGeneralInquiry}
                />
              </motion.div>
            )}

            {view === 'ticket-form' && selectedOrder && (
              <motion.div
                key="ticket-form-view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <TicketCreationForm
                  order={selectedOrder}
                  onSuccess={handleSuccess}
                  onCancel={handleBack}
                />
              </motion.div>
            )}

            {view === 'all-orders' && (
              <motion.div
                key="all-orders-view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <OrderSelector
                  onOrderSelect={handleOrderSelect}
                  showAll={true}
                  onBack={handleBack}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}