'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatWindow } from '@/components/messages/ChatWindow';
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

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<'customer' | 'expert'>('customer');
  const [userId, setUserId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations(isRefresh: boolean = false) {
    try {
      if (!isRefresh) setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userTypeFromSession = session.user.user_metadata?.user_type || 'customer';
      setUserType(userTypeFromSession);
      setUserId(session.user.id);

      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setConversations(result.conversations);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = () => {
    return fetchConversations(true);
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
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading conversations...</p>
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