'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { KeyIcon, NoSymbolIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  name: string;
  userType: string;
  expertId?: string;
  createdAt: string;
  lastSignIn: string | null;
  confirmed: boolean;
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'customer' | 'expert'>('all');

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('userType', filter);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = search.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'customer':
        return 'bg-blue-100 text-blue-800';
      case 'expert':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-600">Loading users...</p>
        </div>
      </div>
    );
  }

  const handleResetPassword = async (userId: string, email: string, name: string) => {
    if (!confirm(`Reset password for ${name}? They will receive an email with the new password.`)) {
      return;
    }
  
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', sendEmail: true }),
      });
  
      const data = await response.json();
  
      if (data.success) {
        alert(`Password reset!\n\nNew password: ${data.password}\n\nEmail sent to: ${email}`);
      } else {
        alert(`Failed to reset password: ${data.error}`);
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };
  
  const handleToggleStatus = async (userId: string, name: string, currentlyDisabled: boolean) => {
    const action = currentlyDisabled ? 'enable' : 'disable';
    if (!confirm(`${action.toUpperCase()} account for ${name}?`)) {
      return;
    }
  
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-status', disabled: !currentlyDisabled }),
      });
  
      const data = await response.json();
  
      if (data.success) {
        alert(`User ${action}d successfully!`);
        fetchUsers(); // Refresh the list
      } else {
        alert(`Failed to ${action} user: ${data.error}`);
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setFilter('customer')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'customer'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => setFilter('expert')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'expert'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Experts
          </button>
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Last Sign In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
                
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-slate-900">{user.name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                        {user.expertId && (
                          <div className="text-xs text-slate-400 mt-1">
                            Expert ID: {user.expertId.slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getUserTypeColor(user.userType)}>
                        {user.userType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={
                          user.confirmed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {user.confirmed ? 'Active' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {user.lastSignIn
                        ? formatDistanceToNow(new Date(user.lastSignIn), { addSuffix: true })
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
  <div className="flex gap-2">
    <Button
      size="sm"
      variant="outline"
      onClick={() => handleResetPassword(user.id, user.email, user.name)}
      title="Reset Password"
    >
      <KeyIcon className="w-4 h-4" />
    </Button>
    <Button
      size="sm"
      variant={user.confirmed ? "outline" : "default"}
      onClick={() => handleToggleStatus(user.id, user.name, !user.confirmed)}
      title={user.confirmed ? "Disable User" : "Enable User"}
    >
      {user.confirmed ? (
        <NoSymbolIcon className="w-4 h-4 text-red-600" />
      ) : (
        <CheckCircleIcon className="w-4 h-4 text-green-600" />
      )}
    </Button>
  </div>
</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Results Count */}
      <p className="text-sm text-slate-500 text-center">
        Showing {filteredUsers.length} of {users.length} users
      </p>
    </div>
  );
}