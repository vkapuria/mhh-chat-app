'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { fetcher } from '@/lib/fetcher';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatWindow } from '@/components/messages/ChatWindow';
import { MessagesSkeleton } from '@/components/loaders/MessagesSkeleton';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import PullToRefresh from 'react-pull-to-refresh';

interface Conversation {
  id: string;
  title: string;
  task_code: string;
  order_date: string;
  amount: number;
  expert_fee?: number;
  customer_name?: string;
  customer_display_name?: string;
  customer_email?: string;
  expert_name?: string;
  expert_display_name?: string;
  expert_email?: string;
  expert_user_id?: string;
  customer_user_id?: string;
  lastMessage?: {
    sender_id: string;
    message_content: string;
    created_at: string;
  };
  unreadCount: number;
}

interface ConversationsResponse {
  success: boolean;
  conversations: Conversation[];
}

export default function MessagesPage() {
  const [userType, setUserType] = useState<'customer' | 'expert'>('customer');
  const [userId, setUserId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✨ SWR for conversations with USER-SPECIFIC caching
  const { data, error, isLoading, mutate } = useSWR<ConversationsResponse>(
    userId ? ['/api/conversations', userId] : null,
    ([url]) => fetcher(url),
    {
      refreshInterval: 60000, // 60s instead of 15s
      revalidateOnFocus: false, // Don't refetch when clicking into chat
      revalidateOnReconnect: false, // Don't refetch on reconnect
      dedupingInterval: 15000, // 15s dedup window (up from 3s)
      revalidateOnMount: true, // Still fetch on first mount
    }
  );

  const conversations = data?.conversations || [];

  // Get user type and userId on mount
  useEffect(() => {
    async function getUserInfo() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const type = session.user.user_metadata?.user_type || 'customer';
        setUserType(type);
        setUserId(session.user.id);
      }
    }
    getUserInfo();
  }, []);

  // Check for orderId in URL params (from redirect)
  useEffect(() => {
    const orderIdFromUrl = searchParams.get('orderId');
    if (orderIdFromUrl) {
      setSelectedOrderId(orderIdFromUrl);
    }
  }, [searchParams]);

  // ✨ Pull to refresh handler
  const handleRefresh = async () => {
    await mutate();
  };

  const selectedConversation = conversations.find(c => c.id === selectedOrderId);
  
  const otherPartyName = userType === 'customer' 
    ? (selectedConversation?.expert_display_name || selectedConversation?.expert_name)
    : (selectedConversation?.customer_display_name || selectedConversation?.customer_name);

  const otherPartyEmail = userType === 'customer'
    ? selectedConversation?.expert_email
    : selectedConversation?.customer_email;

  const otherPartyId = userType === 'customer'
    ? selectedConversation?.expert_user_id
    : selectedConversation?.customer_user_id;

  const handleBackToList = () => {
    setSelectedOrderId(null);
    router.push('/messages');
  };

  // Loading state with beautiful skeleton
  if (isLoading || !data) {
    return <MessagesSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <p className="text-red-800 font-medium">Failed to load conversations</p>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <button
            onClick={() => mutate()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Conversation List - Hidden on mobile when chat is selected */}
      <div className={`
        w-full md:w-80 border-r border-slate-200 bg-white flex flex-col
        ${selectedOrderId ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Conversations</h2>
          <p className="text-sm text-slate-500">
            {conversations.filter(c => c.lastMessage).length} active, {conversations.filter(c => !c.lastMessage).length} pending
          </p>
          {!selectedOrderId && (
            <p className="text-xs text-slate-400 mt-2">
              👇 Tap any order to start chatting
            </p>
          )}
        </div>
        <PullToRefresh
          onRefresh={handleRefresh}
          className="flex-1 overflow-hidden"
        >
          <ConversationList
            conversations={conversations}
            userType={userType}
            activeOrderId={selectedOrderId || undefined}
            onSelectConversation={setSelectedOrderId}
            currentUserId={userId}
          />
        </PullToRefresh>
      </div>

      {/* Chat Window - Full screen on mobile, right panel on desktop */}
      <div className={`
        flex-1 bg-slate-50
        ${selectedOrderId ? 'flex' : 'hidden md:flex'}
      `}>
        {selectedOrderId && selectedConversation ? (
          <div className="flex flex-col w-full h-full">
            {/* Mobile Back Button */}
            <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
              <button
                onClick={handleBackToList}
                className="p-3 min-w-[44px] min-h-[44px] hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors flex items-center justify-center"
                aria-label="Back to conversations"
              >
                <ArrowLeftIcon className="w-6 h-6 text-slate-700" />
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">
                  {selectedConversation.title}
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {otherPartyName}
                </p>
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                orderId={selectedOrderId}
                orderTitle={selectedConversation.title}
                currentUserType={userType}
                currentUserId={userId}
                otherPartyName={otherPartyName || 'Unknown'}
                otherPartyEmail={otherPartyEmail}
                otherPartyId={otherPartyId}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <p className="text-slate-400 text-sm mb-2">No conversation selected</p>
              <p className="text-slate-600 text-lg">
                👇 Choose an order below to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}