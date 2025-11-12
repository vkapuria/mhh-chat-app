'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  count: number;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  count,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (input === 'DELETE') {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setInput('');
      onClose();
    }
  };

  const isValid = input === 'DELETE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Delete {count} Ticket{count > 1 ? 's' : ''}?
            </h3>
            <p className="text-sm text-slate-500">This action cannot be undone</p>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-900">
            <strong>Warning:</strong> You are about to permanently delete {count} support ticket{count > 1 ? 's' : ''} 
            and all associated replies. This data cannot be recovered.
          </p>
        </div>

        {/* Confirmation Input */}
        <div className="space-y-2">
          <label htmlFor="delete-confirm" className="block text-sm font-medium text-slate-700">
            Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm:
          </label>
          <input
            id="delete-confirm"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isValid && !isDeleting) {
                handleConfirm();
              }
            }}
            disabled={isDeleting}
            placeholder="Type DELETE here"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100"
            autoFocus
          />
          {input && !isValid && (
            <p className="text-xs text-red-600">
              Must type DELETE exactly (in capital letters)
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleClose}
            disabled={isDeleting}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isDeleting}
            variant="destructive"
            className="flex-1"
          >
            {isDeleting ? 'Deleting...' : 'Delete Forever'}
          </Button>
        </div>
      </div>
    </div>
  );
}