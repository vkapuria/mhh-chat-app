'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

export default function OrderChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4 bg-white">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/orders')}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
            <div>
              <h2 className="text-lg font-semibold">Order: {orderId}</h2>
              <p className="text-sm text-muted-foreground">Chat with your {user.user_type === 'customer' ? 'expert' : 'customer'}</p>
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow orderId={orderId} user={user} />
        </div>
      </div>
    </DashboardLayout>
  );
}