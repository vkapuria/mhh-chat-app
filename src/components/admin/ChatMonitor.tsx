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
  EyeIcon 
} from '@heroicons/react/24/outline';

interface Chat {
  id: string;
  taskCode: string;
  title: string;
  customerName: string;
  customerEmail: string;
  expertName: string;
  status: string;
  messageCount: number;
  unreadCount: number;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastMessageFrom: string | null;
  createdAt: string;
  updatedAt: string;
}

export function ChatMonitor() {
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
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      chat.customerName.toLowerCase().includes(searchLower) ||
      chat.expertName?.toLowerCase().includes(searchLower) ||
      chat.taskCode.toLowerCase().includes(searchLower) ||
      chat.title.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Assigned':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
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
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Chats</p>
              <p className="text-2xl font-bold text-slate-900">{chats.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Active</p>
              <p className="text-2xl font-bold text-slate-900">
                {chats.filter((c) => c.status === 'Assigned' || c.status === 'In Progress').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Unread Messages</p>
              <p className="text-2xl font-bold text-slate-900">
                {chats.reduce((sum, chat) => sum + chat.unreadCount, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Messages</p>
              <p className="text-2xl font-bold text-slate-900">
                {chats.reduce((sum, chat) => sum + chat.messageCount, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Search by customer, expert, order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('Assigned')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === 'Assigned'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Assigned
          </button>
          <button
            onClick={() => setStatusFilter('In Progress')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === 'In Progress'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            In Progress
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="space-y-3">
        {filteredChats.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-slate-500">No chats found</p>
          </Card>
        ) : (
          filteredChats.map((chat) => (
            <Card key={chat.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {chat.title}
                    </h3>
                    <Badge className={getStatusColor(chat.status)}>
                      {chat.status}
                    </Badge>
                    {chat.unreadCount > 0 && (
                      <Badge variant="destructive">{chat.unreadCount} unread</Badge>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 mb-3">{chat.taskCode}</p>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-slate-500">Customer</p>
                      <p className="text-sm font-medium text-slate-900">{chat.customerName}</p>
                      <p className="text-xs text-slate-500">{chat.customerEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Expert</p>
                      <p className="text-sm font-medium text-slate-900">
                        {chat.expertName || 'Not assigned'}
                      </p>
                    </div>
                  </div>

                  {chat.lastMessage && (
                    <div className="bg-slate-50 rounded p-3 mb-3">
                      <p className="text-xs text-slate-500 mb-1">
                        Last message from {chat.lastMessageFrom} •{' '}
                        {formatDistanceToNow(new Date(chat.lastMessageAt!), { addSuffix: true })}
                      </p>
                      <p className="text-sm text-slate-700 line-clamp-2">{chat.lastMessage}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>💬 {chat.messageCount} messages</span>
                    <span>
                      Updated {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <Link href={`/admin/chats/${chat.id}`}>
                  <Button size="sm" className="shrink-0">
                    <EyeIcon className="w-4 h-4 mr-2" />
                    View Chat
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Results Count */}
      <p className="text-sm text-slate-500 text-center">
        Showing {filteredChats.length} of {chats.length} chats
      </p>
    </div>
  );
}