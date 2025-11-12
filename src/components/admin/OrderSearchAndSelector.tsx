'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Package, User, DollarSign, IndianRupee, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { OrderSearchResult } from '@/types/support';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface OrderSearchAndSelectorProps {
  onOrderSelect: (order: OrderSearchResult) => void;
}

export function OrderSearchAndSelector({ onOrderSelect }: OrderSearchAndSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OrderSearchResult[]>([]);
  const [activeOrders, setActiveOrders] = useState<OrderSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeLoading, setActiveLoading] = useState(true);

  // Load active orders on mount
  useEffect(() => {
    loadActiveOrders();
  }, []);

  const loadActiveOrders = async () => {
    setActiveLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        '/api/admin/orders/search?activeOnly=true',
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      const result = await response.json();
      if (result.success) {
        setActiveOrders(result.orders);
      }
    } catch (error) {
      console.error('Load active orders error:', error);
    } finally {
      setActiveLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `/api/admin/orders/search?query=${encodeURIComponent(searchQuery)}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      const result = await response.json();
      if (result.success) {
        setSearchResults(result.orders);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const renderOrderCard = (order: OrderSearchResult) => (
    <motion.div
      key={order.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
        onClick={() => onOrderSelect(order)}
      >
        <div className="space-y-3">
          {/* Title & Order ID */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">{order.title}</h4>
            <p className="text-xs font-mono text-slate-500">{order.id}</p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 truncate">
                {order.customer_display_name || order.customer_name}
              </span>
            </div>
            {order.expert_name && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-slate-600 truncate">
                  {order.expert_display_name || order.expert_name}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-slate-900 font-semibold">${order.amount}</span>
            </div>
            {order.expert_fee && (
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-green-500" />
                <span className="text-slate-900 font-semibold">₹{order.expert_fee}</span>
              </div>
            )}
          </div>

          {/* Status & Date */}
          <div className="flex items-center justify-between text-xs">
            <span className={`px-2 py-1 rounded ${
              order.status === 'Assigned' ? 'bg-blue-100 text-blue-700' :
              order.status === 'Revision' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {order.status}
            </span>
            <span className="text-slate-500">
              {format(new Date(order.created_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Search for an Order
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by Order ID, Customer, Expert..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">
            Search Results ({searchResults.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {searchResults.map(renderOrderCard)}
          </div>
        </div>
      )}

      {/* Divider */}
      {searchResults.length === 0 && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 text-sm text-slate-500 bg-white">OR</span>
          </div>
        </div>
      )}

      {/* Active Orders Quick Select */}
      {searchResults.length === 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Active Orders - Quick Select
          </h3>
          {activeLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : activeOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">No active orders at the moment</p>
            </Card>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {activeOrders.map(renderOrderCard)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}