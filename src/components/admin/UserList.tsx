'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KeyIcon, NoSymbolIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  name: string;
  displayName: string;
  userType: string;
  expertId?: string;
  createdAt: string;
  lastSignIn: string | null;
  confirmed: boolean;
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchExpert, setSearchExpert] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
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

  const customers = users.filter(u => u.userType === 'customer');
  const experts = users.filter(u => u.userType === 'expert');

  const filteredCustomers = customers.filter((user) => {
    const searchLower = searchCustomer.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  const filteredExperts = experts.filter((user) => {
    const searchLower = searchExpert.toLowerCase();
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
        fetchUsers();
      } else {
        alert(`Failed to ${action} user: ${data.error}`);
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const renderUserTable = (userList: User[], emptyMessage: string) => (
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
            {userList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              userList.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-slate-900">{user.name}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                      <div className="text-xs text-blue-600 mt-1">
                        Shows as: {user.displayName}
                      </div>
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
  );

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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="customers">
            Customers ({customers.length})
          </TabsTrigger>
          <TabsTrigger value="experts">
            Experts ({experts.length})
          </TabsTrigger>
        </TabsList>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <div className="flex items-center justify-between">
            <Input
              type="search"
              placeholder="Search customers by name or email..."
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
              className="max-w-md"
            />
            <p className="text-sm text-slate-500">
              Showing {filteredCustomers.length} of {customers.length} customers
            </p>
          </div>
          {renderUserTable(filteredCustomers, 'No customers found')}
        </TabsContent>

        {/* Experts Tab */}
        <TabsContent value="experts" className="space-y-4">
          <div className="flex items-center justify-between">
            <Input
              type="search"
              placeholder="Search experts by name or email..."
              value={searchExpert}
              onChange={(e) => setSearchExpert(e.target.value)}
              className="max-w-md"
            />
            <p className="text-sm text-slate-500">
              Showing {filteredExperts.length} of {experts.length} experts
            </p>
          </div>
          {renderUserTable(filteredExperts, 'No experts found')}
        </TabsContent>
      </Tabs>
    </div>
  );
}