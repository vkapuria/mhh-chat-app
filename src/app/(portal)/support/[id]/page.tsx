'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { formatTicketNumber } from '@/lib/ticket-utils';
import Image from 'next/image';
import {
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useUnreadTicketsStore } from '@/store/unread-tickets-store';

// Helper component for the status badge
function StatusBadge({ status }: { status: string }) {
  if (status === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
        Resolved
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
      Open
    </span>
  );
}

export default function CustomerTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [optimisticReplies, setOptimisticReplies] = useState<any[]>([]);

  useEffect(() => {
    const abortController = new AbortController();
    
    fetchTicket(abortController.signal);
    fetchCurrentUser();

    return () => {
      abortController.abort();
    };
  }, [ticketId]);

  // Mark ticket as read when page loads
  const markTicketAsRead = useUnreadTicketsStore((state) => state.markTicketAsRead);

  useEffect(() => {
    if (ticketId) {
      markTicketAsRead(ticketId);
    }
  }, [ticketId, markTicketAsRead]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserName(user.user_metadata?.display_name || user.email?.split('@')[0] || 'You');
        setCurrentUserAvatar(user.user_metadata?.avatar_url || null);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchTicket = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setLoading(false);
        router.push('/login?redirect=/support/' + ticketId);
        return;
      }

      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        signal,
      });

      if (response.status === 401 || response.status === 403) {
        setLoading(false);
        router.push('/login?redirect=/support/' + ticketId);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch ticket data');
      }

      const result = await response.json();

      if (result.success) {
        setTicket(result.ticket);
      } else {
        toast.error(result.error || 'Failed to load ticket');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      
      console.error('Fetch ticket error:', error);
      toast.error(error.message || 'Failed to load ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const optimisticReply = {
      id: `temp-${Date.now()}`,
      message: replyMessage.trim(),
      reply_type: 'user',
      created_at: new Date().toISOString(),
    };

    setOptimisticReplies(prev => [...prev, optimisticReply]);
    
    const messageCopy = replyMessage;
    setReplyMessage('');
    setSendingReply(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        router.push('/login?redirect=/support/' + ticketId);
        return;
      }

      const response = await fetch(`/api/support/tickets/${ticketId}/customer-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: messageCopy,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/login?redirect=/support/' + ticketId);
        return;
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Reply sent successfully!');
        setOptimisticReplies([]);
        fetchTicket();
      } else {
        setOptimisticReplies(prev => prev.filter(r => r.id !== optimisticReply.id));
        setReplyMessage(messageCopy);
        toast.error(result.error || 'Failed to send reply. Please try again.');
      }
    } catch (error: any) {
      console.error('Send reply error:', error);
      setOptimisticReplies(prev => prev.filter(r => r.id !== optimisticReply.id));
      setReplyMessage(messageCopy);
      const errorMsg = error.message || 'Network error. Check your connection and try again.';
      toast.error(errorMsg);
    } finally {
      setSendingReply(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return name.charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 max-w-7xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-96 max-w-7xl mx-auto">
        <div className="text-center">
          <p className="text-slate-900 font-semibold mb-2">Ticket not found</p>
          <Button onClick={() => router.push('/support')} variant="outline">
            Back to Support
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3 md:p-8 bg-gray-50 min-h-screen">
      {/* Back Button */}
      <div className="mb-3 md:mb-4">
        <Button
          variant="secondary"
          onClick={() => router.push('/support')}
          className="gap-1.5 text-sm"
          size="sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Support</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </div>

      {/* Ticket Header Card */}
      <Card className="shadow-sm mb-4 md:mb-6 lg:mb-8">
        <div className="py-3 px-4 md:py-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
            <div>
              <div className="flex items-center gap-2 md:gap-3 mb-1">
                <span className="font-mono text-xs md:text-sm text-gray-500">
                  {formatTicketNumber(ticket.id)}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                {ticket.issue_type}
              </h1>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Layout: 2/3 content, 1/3 sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">

        {/* Left Column: Conversation + Reply */}
        <div className="lg:col-span-2 space-y-6">

          {/* Conversation History */}
          <Card className="shadow-sm">
            <div className="p-4 md:p-5 border-b border-gray-200">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">
                Conversation History ({(ticket.replies?.length || 0) + optimisticReplies.length})
              </h3>
            </div>
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              
              {/* Original Post */}
              <div className="flex items-start gap-3 md:gap-4">
                {currentUserAvatar ? (
                  <Image 
                    src={currentUserAvatar} 
                    alt={currentUserName}
                    width={36}
                    height={36}
                    className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-gray-400"
                  />
                ) : (
                  <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-sm md:text-lg">
                    {getInitials(currentUserName)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm md:text-base">You</span>
                    <span className="text-xs text-gray-500">&middot; {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                  </div>
                  <div className="p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-700 text-xs md:text-sm whitespace-pre-wrap break-words">
                      {ticket.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Replies Loop */}
              {(() => {
                const allReplies = [...(ticket.replies || []), ...optimisticReplies];
                return allReplies.length > 0 ? (
                  allReplies.map((reply: any) => {
                    const isAdminReply = reply.reply_type === 'admin';
                    
                    return (
                      <div key={reply.id} className="flex items-start gap-3 md:gap-4">
                        {/* Avatar */}
                        {isAdminReply ? (
                          reply.admin_avatar ? (
                            <Image 
                              src={reply.admin_avatar} 
                              alt={reply.admin_name}
                              width={36}
                              height={36}
                              className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-blue-600"
                            />
                          ) : (
                            <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm md:text-lg">
                              {getInitials(reply.admin_name)}
                            </div>
                          )
                        ) : (
                          currentUserAvatar ? (
                            <Image 
                              src={currentUserAvatar} 
                              alt={currentUserName}
                              width={36}
                              height={36}
                              className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-gray-400"
                            />
                          ) : (
                            <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-sm md:text-lg">
                              {getInitials(currentUserName)}
                            </div>
                          )
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 md:gap-2 mb-1 flex-wrap">
                            <span className={`font-semibold text-sm md:text-base ${isAdminReply ? 'text-blue-900' : 'text-gray-900'}`}>
                              {isAdminReply ? reply.admin_name : 'You'}
                            </span>
                            {isAdminReply && (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] md:text-xs font-medium text-blue-800 capitalize">
                                {reply.admin_team || 'Support'}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">&middot; {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</span>
                          </div>
                          <div className={`p-3 md:p-4 ${
                            isAdminReply 
                              ? 'bg-indigo-600 rounded-tr-lg rounded-br-lg rounded-bl-lg' 
                              : 'bg-slate-700 rounded-tr-lg rounded-br-lg rounded-bl-lg'
                          }`}>
                            <p className="text-xs md:text-sm whitespace-pre-wrap break-words text-white">
                              {reply.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm border-t border-gray-100">
                    <p>No replies yet. Our support team will respond soon!</p>
                  </div>
                );
              })()}
            </div>
          </Card>

          {/* Reply Form */}
          {ticket.status !== 'resolved' ? (
            <Card className="shadow-sm">
              <div className="p-4 md:p-5 border-b border-gray-200">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Send Reply</h3>
              </div>
              <div className="p-4 md:p-5">
                <p className="text-xs md:text-sm text-slate-600 mb-4">
                  💡 <strong>Tip:</strong> You can also reply directly to our email notifications!
                </p>
                <Textarea
                  placeholder="Type your response here..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                  className="mb-4 text-xs md:text-sm"
                  disabled={sendingReply}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyMessage.trim()}
                    className="bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold w-full sm:w-auto"
                  >
                    {sendingReply ? 'Sending...' : 'Post Reply'}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-green-700 font-bold text-lg mb-1">
                    ✓ Ticket Resolved
                  </p>
                  <p className="text-sm text-green-600">
                    This ticket was marked as resolved and is now closed.
                  </p>
                </div>
                
                {ticket.resolved_at && (
                  <div className="text-center text-xs text-green-600 border-t border-green-200 pt-3">
                    <p>
                      Closed on {format(new Date(ticket.resolved_at), 'MMM d, yyyy \'at\' h:mm a')} EST
                    </p>
                  </div>
                )}
          
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-slate-700 text-center mb-2">
                    <strong>Need more help?</strong>
                  </p>
                  <p className="text-xs text-slate-600 text-center">
                    This ticket is closed, but you can submit a new ticket anytime for additional assistance.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Sidebar */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm">
            <div className="p-4 md:p-5">
              {/* Ticket Info */}
              <h4 className="text-xs font-semibold uppercase text-black mb-3 flex items-center gap-1.5">
                <Image 
                  src="/icons/thumb-tack.svg" 
                  alt="" 
                  width={24} 
                  height={24}
                  className="w-6 h-6"
                />
                Ticket Info
              </h4>
              <dl className="text-sm space-y-3 mb-6">
                <div className="flex justify-between items-center gap-2">
                  <dt className="font-medium text-gray-500">Status</dt>
                  <dd>
                    <StatusBadge status={ticket.status} />
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-medium text-gray-500">Created</dt>
                  <dd className="text-gray-700 text-right">{format(new Date(ticket.created_at), 'MMM d, yyyy, h:mm a')}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-medium text-gray-500">Last Update</dt>
                  <dd className="text-gray-700 text-right">{format(new Date(ticket.updated_at), 'MMM d, yyyy, h:mm a')}</dd>
                </div>
              </dl>
              
              {/* Order Info */}
              <h4 className="text-xs font-semibold uppercase text-black mb-3 border-t pt-5 flex items-center gap-1.5">
                <Image 
                  src="/icons/table-lamp.svg" 
                  alt="" 
                  width={20} 
                  height={20}
                  className="w-6 h-6"
                />
                Order Info
              </h4>
              <dl className="text-sm space-y-3 mb-6">
                <div className="flex justify-between items-center gap-2">
                  <dt className="font-medium text-gray-500">Order ID</dt>
                  <dd className="font-mono text-gray-700">{ticket.order_id || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-medium text-gray-500">Title</dt>
                  <dd className="text-gray-700 text-right truncate">{ticket.order_title || '—'}</dd>
                </div>
              </dl>

              {/* Help Info */}
              <div className="border-t pt-5">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 text-sm mb-2">Need Help?</h4>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Our support team typically responds within 24 hours. For urgent matters, 
                    email <strong>orders@myhomeworkhelp.com</strong>
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}