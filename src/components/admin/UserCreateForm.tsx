'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Expert {
  id: string;
  name: string;
  email: string;
}

export function UserCreateForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    userType: 'customer' as 'customer' | 'expert',
    expertId: '',
    sendEmail: false,
  });

  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    password?: string;
  } | null>(null);

  // Fetch experts for dropdown
  useEffect(() => {
    fetch('/api/admin/experts')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setExperts(data.experts);
        }
      })
      .catch((err) => console.error('Failed to fetch experts:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: `User created successfully!`,
          password: data.user.password,
        });

        // Reset form
        setFormData({
          name: '',
          email: '',
          userType: 'customer',
          expertId: '',
          sendEmail: false,
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to create user',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
          />
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
            required
          />
        </div>

        {/* User Type */}
        <div>
          <Label htmlFor="userType">User Type *</Label>
          <select
            id="userType"
            value={formData.userType}
            onChange={(e) =>
              setFormData({
                ...formData,
                userType: e.target.value as 'customer' | 'expert',
                expertId: '', // Reset expert selection when changing type
              })
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            <option value="customer">Customer</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        {/* Expert Selection (only for expert type) */}
        {formData.userType === 'expert' && (
          <div>
            <Label htmlFor="expertId">Link to Expert *</Label>
            <select
              id="expertId"
              value={formData.expertId}
              onChange={(e) => setFormData({ ...formData, expertId: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            >
              <option value="">Select an expert...</option>
              {experts.map((expert) => (
                <option key={expert.id} value={expert.id}>
                  {expert.name} ({expert.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              This links the user account to an existing expert in your experts table
            </p>
          </div>
        )}

        {/* Send Email Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="sendEmail"
            checked={formData.sendEmail}
            onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <Label htmlFor="sendEmail" className="cursor-pointer">
            Send welcome email with login credentials
          </Label>
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating...' : 'Create User Account'}
        </Button>

        {/* Result Message */}
        {result && (
          <Card
            className={`p-4 ${
              result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <p
              className={`font-medium ${
                result.success ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {result.message}
            </p>
            {result.success && result.password && (
              <div className="mt-3 p-3 bg-white rounded border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-1">
                  Generated Password:
                </p>
                <p className="text-lg font-mono text-blue-600 select-all">
                  {result.password}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  ⚠️ Save this password! It won't be shown again.
                </p>
              </div>
            )}
          </Card>
        )}
      </form>
    </Card>
  );
}