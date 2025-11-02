'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  FlagIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface Chat {
  id: string;
  title: string;
  customer_name: string;
  customer_email: string;
  expert_name: string;
  status: string;
  messageCount: number;
  unreadCount: number;
  latestMessage: {
    message_content: string;
    created_at: string;
    sender_name: string;
    sender_type: string;
  } | null;
  isFlagged: boolean;
  flagReason?: string;
}

export default function ChatMonitoringPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchChats();
  }, [statusFilter]);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/chats?${params}`);
      const data = await response.json();

      if (data.success) {
        setChats(data.chats);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter((chat) => {
    const searchLower = search.toLowerCase();
    return (
      chat.customer_name?.toLowerCase().includes(searchLower) ||
      chat.expert_name?.toLowerCase().includes(searchLower) ||
      chat.id?.toLowerCase().includes(searchLower) ||
      chat.title?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Assigned':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Under Review':
        return 'bg-purple-100 text-purple-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Chat Monitoring</h2>
        <p className="mt-2 text-slate-600">
          Monitor all active conversations between customers and experts
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="search"
            placeholder="Search by customer, expert, order ID, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'Assigned' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('Assigned')}
          >
            Assigned
          </Button>
          <Button
            variant={statusFilter === 'In Progress' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('In Progress')}
          >
            In Progress
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-slate-600">Total Chats</div>
          <div className="text-2xl font-bold text-slate-900">{chats.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Flagged</div>
          <div className="text-2xl font-bold text-red-600">
            {chats.filter((c) => c.isFlagged).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Active Now</div>
          <div className="text-2xl font-bold text-green-600">
            {chats.filter((c) => c.status === 'In Progress').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Total Messages</div>
          <div className="text-2xl font-bold text-blue-600">
            {chats.reduce((sum, c) => sum + c.messageCount, 0)}
          </div>
        </Card>
      </div>

      {/* Chats List */}
      <div className="space-y-4">
        {filteredChats.length === 0 ? (
          <Card className="p-8 text-center">
            <ChatBubbleLeftRightIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No active chats found</p>
          </Card>
        ) : (
          filteredChats.map((chat) => (
            <Card key={chat.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-slate-900">
                      {chat.title}
                    </h3>
                    <Badge className={getStatusColor(chat.status)}>
                      {chat.status}
                    </Badge>
                    {chat.isFlagged && (
                      <Badge className="bg-red-100 text-red-800">
                        <FlagIcon className="w-3 h-3 mr-1" />
                        Flagged
                      </Badge>
                    )}
                    {chat.unreadCount > 0 && (
                      <Badge className="bg-blue-100 text-blue-800">
                        {chat.unreadCount} unread
                      </Badge>
                    )}
                  </div>

                  {/* Order ID */}
                  <div className="text-sm text-slate-500 mb-3">
                    Order ID: <span className="font-mono">{chat.id}</span>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center gap-6 text-sm mb-3">
                    <div>
                      <span className="text-slate-500">Customer:</span>{' '}
                      <span className="font-medium text-slate-900">
                        {chat.customer_name}
                      </span>
                      <span className="text-slate-400 ml-1">({chat.customer_email})</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Expert:</span>{' '}
                      <span className="font-medium text-slate-900">{chat.expert_name}</span>
                    </div>
                  </div>

                  {/* Latest Message */}
                  {chat.latestMessage && (
                    <div className="bg-slate-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-700">
                          {chat.latestMessage.sender_name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(chat.latestMessage.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {chat.latestMessage.message_content}
                      </p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="text-xs text-slate-500">
                    {chat.messageCount} messages total
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <Link href={`/admin/chats/${chat.id}`}>
                    <Button size="sm">
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View Chat
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Results Count */}
      <p className="text-sm text-slate-500 text-center mt-6">
        Showing {filteredChats.length} of {chats.length} active chats
      </p>
    </div>
  );
}