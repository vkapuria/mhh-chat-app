'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ChatViewer } from '@/components/admin/ChatViewer';

export default function AdminChatViewPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  return (
    <div>
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/chats')}
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to All Chats
        </Button>
      </div>

      {/* Mobile-style container */}
      <div className="flex justify-center">
        <div className="w-full max-w-md relative">
          {/* Phone Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-slate-900 rounded-b-3xl z-10"></div>
          
          {/* Phone Frame */}
          <div className="bg-white rounded-3xl shadow-2xl border-8 border-slate-900 overflow-hidden">
            {/* Phone-like header */}
            <div className="border-b border-slate-200 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Order {orderId}
                  </h2>
                  <p className="text-xs text-white/80">
                    👻 Ghost Mode Active
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.print()}
                    className="text-xs"
                  >
                    📸
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs text-red-600"
                  >
                    🚩
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat container with fixed height */}
            <div className="h-[65vh] bg-slate-50" id="chat-messages">
              <ChatViewer orderId={orderId} />
            </div>

            {/* Home indicator (like iPhone) */}
            <div className="h-8 bg-slate-900 flex items-center justify-center">
              <div className="w-32 h-1 bg-slate-700 rounded-full"></div>
            </div>
          </div>

          {/* Info below phone */}
          <div className="mt-4 text-center text-sm text-slate-500">
            <p>📱 Mobile Preview - Scroll to see all messages</p>
            <p className="text-xs text-slate-400 mt-1">Users cannot see you viewing this chat</p>
          </div>
        </div>
      </div>
    </div>
  );
}