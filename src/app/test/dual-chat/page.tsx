'use client';

import { useState } from 'react';
import { DualChatView } from '@/components/test/DualChatView';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DualChatTestPage() {
  const [orderId, setOrderId] = useState('TEST-2025-001');

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">🎭 Dual Chat Test View</h1>
            <p className="text-slate-400 text-sm">Customer vs Expert - Side by Side</p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
              placeholder="Order ID"
            />
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/chat'}
              className="text-white border-slate-600"
            >
              Exit Test Mode
            </Button>
          </div>
        </div>
      </div>

      {/* Dual View */}
      <div className="flex-1 overflow-hidden">
        <DualChatView orderId={orderId} />
      </div>
    </div>
  );
}