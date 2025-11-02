'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatWindow } from '@/components/messages/ChatWindow';

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

  async function fetchConversations() {
    try {
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

  // Debug: Log the IDs
console.log('🔍 Debug Info:', {
  userId,
  userType,
  selectedConversation: selectedConversation?.title,
  otherPartyId,
  expert_user_id: selectedConversation?.expert_user_id,
  customer_user_id: selectedConversation?.customer_user_id,
});

  return (
    <div className="h-full flex">
      {/* Left: Conversation List */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Conversations</h2>
          <p className="text-sm text-slate-500">{conversations.length} active</p>
        </div>
        <ConversationList
          conversations={conversations}
          userType={userType}
          activeOrderId={selectedOrderId || undefined}
          onSelectConversation={setSelectedOrderId}
          currentUserId={userId}
        />
      </div>

      {/* Right: Chat Window */}
      <div className="flex-1 bg-slate-50">
        {selectedOrderId && selectedConversation ? (
          <ChatWindow
            orderId={selectedOrderId}
            orderTitle={selectedConversation.title}
            currentUserType={userType}
            currentUserId={userId}
            otherPartyName={otherPartyName || 'Unknown'}
            otherPartyEmail={otherPartyEmail}
            otherPartyId={otherPartyId}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-slate-500 text-lg">Select a conversation to start chatting</p>
              <p className="text-sm text-slate-400 mt-2">
                Choose a conversation from the list on the left
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}