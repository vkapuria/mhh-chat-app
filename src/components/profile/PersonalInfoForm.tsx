'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

interface PersonalInfoFormProps {
  initialName: string;
  initialEmail: string;
  initialDisplayName: string;
  onSaveSuccess: () => void;
}

export function PersonalInfoForm({ initialName, initialEmail, initialDisplayName, onSaveSuccess }: PersonalInfoFormProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setErrors({});

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ name, email, display_name: displayName }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Profile updated successfully!');
        onSaveSuccess();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = name !== initialName || email !== initialEmail || displayName !== initialDisplayName;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
          Full Name (Private - Admin Only)
        </label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
        <p className="text-xs text-slate-500 mt-1">
          Your real name is only visible to administrators
        </p>
      </div>

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-2">
          Display Name (Public)
        </label>
        <Input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How others see you"
          maxLength={30}
        />
        <p className="text-xs text-slate-500 mt-1">
          This is how customers and experts will see you in chats (2-30 characters, letters only)
        </p>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />
        <p className="text-xs text-slate-500 mt-1">
          Changing your email will require verification
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.includes('success') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={!hasChanges || saving}
        className="w-full"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}