'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { formatTicketNumber } from '@/lib/ticket-utils';
import Image from 'next/image';

import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

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
  // Default for 'submitted' or 'open'
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
      Open
    </span>
  );
}

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [currentAdminName, setCurrentAdminName] = useState('Admin');
  const [currentAdminTeam, setCurrentAdminTeam] = useState('Admin');
  const [currentAdminAvatar, setCurrentAdminAvatar] = useState<string | null>(null);
  const [optimisticReplies, setOptimisticReplies] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<'friendly' | 'professional' | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    
    fetchTicket(abortController.signal);
    fetchAdminUser();

    return () => {
      abortController.abort();
    };
  }, [ticketId]);

  const fetchAdminUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.display_name) {
        setCurrentAdminName(user.user_metadata.display_name);
      } else if (user?.email) {
        setCurrentAdminName(user.email.split('@')[0]);
      }
      
      setCurrentAdminTeam(user?.user_metadata?.team || 'Admin');
      setCurrentAdminAvatar(user?.user_metadata?.avatar_url || null);
    } catch (error) {
      console.error('Error fetching admin user:', error);
    }
  };

  const fetchTicket = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setLoading(false);
        router.push('/login?redirect=/admin/support/' + ticketId);
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
        router.push('/login?redirect=/admin/support/' + ticketId);
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

  const getTemplate = (type: 'friendly' | 'professional', status: 'in_progress' | 'resolved') => {
    if (status === 'in_progress') {
      const templates = {
        friendly: `Hi there!

Thanks for reaching out. I'm looking into your issue regarding ${ticket.issue_type} and will get back to you with an update shortly.

In the meantime, if you have any additional details or questions, feel free to reply to this email.

Best regards,
${currentAdminName}`,
        
        professional: `Thank you for contacting support.

We're actively working on your issue regarding ${ticket.issue_type}. We'll update you as soon as we have more information.

Best,
${currentAdminName}`
      };
      return templates[type];
    }
    
    // Resolved templates
    const templates = {
      friendly: `Hi there!

I wanted to follow up on your ticket regarding ${ticket.issue_type}. Based on our conversation, it looks like we've addressed your concern.

If you need any clarification or have follow-up questions, just reply to this email and your ticket will automatically reopen - we'll be notified right away.

Otherwise, I'll mark this as resolved. Thanks for reaching out, and we're always here to help!

Best regards,
${currentAdminName}`,
      
      professional: `Thanks for contacting us!

Your issue regarding ${ticket.issue_type} has been resolved. If you need further assistance, simply reply to this email and we'll reopen your ticket immediately.

Best,
${currentAdminName}`
    };
    
    return templates[type];
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const shouldUpdateStatus = pendingStatusChange !== null;
    const newStatus = pendingStatusChange;

    const optimisticReply = {
      id: `temp-${Date.now()}`,
      message: replyMessage.trim(),
      reply_type: 'admin',
      admin_name: currentAdminName,
      admin_team: currentAdminTeam,
      admin_avatar: currentAdminAvatar,
      created_at: new Date().toISOString(),
    };

    setOptimisticReplies(prev => [...prev, optimisticReply]);
    
    const messageCopy = replyMessage;
    setReplyMessage('');

    setSendingReply(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        router.push('/login?redirect=/admin/support/' + ticketId);
        return;
      }

      const response = await fetch(`/api/support/tickets/${ticketId}/replies`, {
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
        router.push('/login?redirect=/admin/support/' + ticketId);
        return;
      }

      const result = await response.json();

      if (result.success) {
        // If there's a pending status change, update it now
        if (shouldUpdateStatus && newStatus) {
          try {
            const statusResponse = await fetch(`/api/support/tickets/${ticketId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                status: newStatus,
                skip_email: true,
              }),
            });

            if (statusResponse.ok) {
              toast.success('Reply sent and status updated!');
            } else {
              toast.success('Reply sent (status update failed)');
            }
          } catch (statusError) {
            console.error('Status update error:', statusError);
            toast.success('Reply sent (status update failed)');
          }
        } else {
          toast.success('Reply sent successfully!');
        }
        
        setOptimisticReplies([]);
        setPendingStatusChange(null);
        setShowTemplateSelector(false);
        setSelectedTemplate(null);
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

  const handleStatusChange = async (newStatus: string) => {
    // If changing to in_progress or resolved, show template selector
    if ((newStatus === 'resolved' || newStatus === 'in_progress') && !replyMessage.trim()) {
      setPendingStatusChange(newStatus);
      setShowTemplateSelector(true);
      toast.info('Please select a template or write a message before changing status');
      return;
    }

    // If there's already a message, just set pending status
    if (replyMessage.trim()) {
      setPendingStatusChange(newStatus);
      toast.info('Status will be updated when you send your reply');
      return;
    }

    setUpdatingStatus(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        router.push('/login?redirect=/admin/support/' + ticketId);
        return;
      }

      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/login?redirect=/admin/support/' + ticketId);
        return;
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Status updated!');
        setShowTemplateSelector(false);
        setPendingStatusChange(null);
        fetchTicket();
      } else {
        toast.error(result.error || 'Failed to update status. Please try again.');
      }
    } catch (error: any) {
      console.error('Update status error:', error);
      const errorMsg = error.message || 'Network error. Check your connection and try again.';
      toast.error(errorMsg);
    } finally {
      setUpdatingStatus(false);
    }
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
          <Button onClick={() => router.push('/admin/support')} variant="outline">
            Back to Tickets
          </Button>
        </div>
      </div>
    );
  }
  
  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return name.charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Back Button */}
      <div className="mb-4">
        <Button
          variant="secondary"
          onClick={() => router.push('/admin/support')}
          className="gap-1.5"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Tickets
        </Button>
      </div>

      {/* Ticket Header Card */}
      <Card className="shadow-sm mb-6 lg:mb-8">
        <div className="py-4 px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-sm text-gray-500">
                  {formatTicketNumber(ticket.id)}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {ticket.issue_type}
              </h1>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Layout: 2/3 content, 1/3 sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

        {/* Left Column: Conversation + Reply */}
        <div className="lg:col-span-2 space-y-6">

          {/* Conversation History */}
          <Card className="shadow-sm">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Conversation History ({(ticket.replies?.length || 0) + optimisticReplies.length})
              </h3>
            </div>
            <div className="p-6 space-y-6">
              
              {/* Original Post */}
              <div className="flex items-start gap-4">
                {ticket.user_avatar_url ? (
                  <Image 
                    src={ticket.user_avatar_url} 
                    alt={ticket.user_display_name}
                    width={40}
                    height={40}
                    className="flex-shrink-0 w-10 h-10 rounded-full object-cover border-2 border-gray-400"
                  />
                ) : (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-lg" title={ticket.user_display_name}>
                    {getInitials(ticket.user_display_name)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{ticket.user_display_name}</span>
                    <span className="text-xs text-gray-500">&middot; {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
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
                    const displayName = isAdminReply ? reply.admin_name : ticket.user_display_name;
                    
                    const replyTeam = isAdminReply && reply.id.startsWith('temp-') 
                      ? currentAdminTeam 
                      : (reply.admin_team || 'Admin');
                    const replyAvatar = reply.id.startsWith('temp-')
                      ? (isAdminReply ? currentAdminAvatar : null)
                      : reply.admin_avatar;
                    
                    return (
                      <div key={reply.id} className="flex items-start gap-4">
                        {/* Avatar */}
                        {replyAvatar ? (
                          <Image 
                            src={replyAvatar} 
                            alt={displayName}
                            width={40}
                            height={40}
                            className={`flex-shrink-0 w-10 h-10 rounded-full object-cover border-2 ${
                              isAdminReply ? 'border-blue-600' : 'border-gray-400'
                            }`}
                          />
                        ) : (
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                            isAdminReply ? 'bg-blue-600' : 'bg-gray-700'
                          }`} title={displayName}>
                            {getInitials(displayName)}
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold ${isAdminReply ? 'text-blue-900' : 'text-gray-900'}`}>
                              {displayName}
                            </span>
                            {isAdminReply && (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 capitalize">
                                {replyTeam}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">&middot; {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</span>
                          </div>
                          <div className={`p-4 ${
                            isAdminReply 
                              ? 'bg-indigo-600 rounded-tr-lg rounded-br-lg rounded-bl-lg' 
                              : 'bg-slate-700 rounded-tr-lg rounded-br-lg rounded-bl-lg'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap text-white">
                              {reply.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm border-t border-gray-100">
                    <p>No replies yet. Be the first to respond!</p>
                  </div>
                );
              })()}
            </div>
          </Card>

          {/* Reply Form */}
          <Card className="shadow-sm">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Send Reply</h3>
            </div>
            <div className="p-5">
              {/* Template Selector */}
              {showTemplateSelector && pendingStatusChange && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-3">
                    {pendingStatusChange === 'resolved' 
                      ? 'Select a closing message template:' 
                      : 'Select an acknowledgment template:'}
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 p-3 border-2 border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                      <input
                        type="radio"
                        name="template"
                        value="friendly"
                        checked={selectedTemplate === 'friendly'}
                        onChange={(e) => {
                          setSelectedTemplate('friendly');
                          setReplyMessage(getTemplate('friendly', pendingStatusChange as 'in_progress' | 'resolved'));
                        }}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Friendly & Detailed</p>
                        <p className="text-xs text-gray-600">
                          {pendingStatusChange === 'resolved' 
                            ? 'Warm tone with explanation about reopening' 
                            : 'Warm acknowledgment with reassurance'}
                        </p>
                      </div>
                    </label>
                    
                    <label className="flex items-start gap-3 p-3 border-2 border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                      <input
                        type="radio"
                        name="template"
                        value="professional"
                        checked={selectedTemplate === 'professional'}
                        onChange={(e) => {
                          setSelectedTemplate('professional');
                          setReplyMessage(getTemplate('professional', pendingStatusChange as 'in_progress' | 'resolved'));
                        }}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Short & Professional</p>
                        <p className="text-xs text-gray-600">
                          {pendingStatusChange === 'resolved' 
                            ? 'Concise message for quick resolutions' 
                            : 'Brief acknowledgment'}
                        </p>
                      </div>
                    </label>
                  </div>
                  <Button
                    onClick={() => {
                      setShowTemplateSelector(false);
                      setPendingStatusChange(null);
                    }}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    Write Custom Message Instead
                  </Button>
                </div>
              )}

              <Textarea
                placeholder="Type your response here..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={6}
                className="mb-4 text-sm"
                disabled={sendingReply}
              />
              
              <div className="mt-4 flex items-center justify-between">
                {pendingStatusChange && (
                  <div className="text-sm text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                    Status will change to: <strong className="capitalize">{pendingStatusChange.replace('_', ' ')}</strong>
                  </div>
                )}
                
                <div className="flex items-center gap-4 ml-auto">
                  <Select
                    value={ticket.status}
                    onValueChange={handleStatusChange}
                    disabled={updatingStatus || sendingReply}
                  >
                    <SelectTrigger className="w-48 text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={handleSendReply}
                    disabled={sendingReply || updatingStatus || !replyMessage.trim()}
                    className="bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold"
                  >
                    {sendingReply ? 'Sending...' : 'Post Reply'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Metadata Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <div className="p-5">
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
              
              {/* User Info */}
              <h4 className="text-xs font-semibold uppercase text-black mb-3 border-t pt-5 flex items-center gap-1.5">
                <Image 
                  src="/icons/user-profile.svg" 
                  alt="" 
                  width={20} 
                  height={20}
                  className="w-6 h-6"
                />
                User Info
              </h4>
              <dl className="text-sm space-y-3 mb-6">
                <div className="flex justify-between gap-2">
                  <dt className="font-medium text-gray-500">Name</dt>
                  <dd className="text-gray-700 font-semibold truncate">{ticket.user_display_name}</dd>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <dt className="font-medium text-gray-500">Email</dt>
                  <dd className="text-gray-700 truncate" title={ticket.user_email}>{ticket.user_email}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-medium text-gray-500">Type</dt>
                  <dd className="text-gray-700 capitalize">{ticket.user_type || 'Customer'}</dd>
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

              {/* Links */}
              <div className="space-y-2 border-t pt-5">
                {ticket.order_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/chats/${ticket.order_id}`)}
                    className="w-full gap-1.5 justify-center"
                  >
                    View Order
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </Button>
                )}
                {ticket.user_email && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/admin/users?email=${encodeURIComponent(ticket.user_email)}`)
                    }
                    className="w-full gap-1.5 justify-center"
                  >
                    View User
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}