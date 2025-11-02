'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { PersonalInfoForm } from '@/components/profile/PersonalInfoForm';
import { PasswordChangeForm } from '@/components/profile/PasswordChangeForm';
import { Card } from '@/components/ui/card';

interface Profile {
  id: string;
  email: string;
  name: string;
  user_type: string;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setProfile(result.profile);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-red-600">Failed to load profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
          <p className="text-slate-600 mt-1">
            Manage your account information and preferences
          </p>
        </div>

        {/* Avatar Section */}
        <Card className="p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Profile Picture</h2>
          <AvatarUpload
            currentAvatarUrl={profile.avatar_url}
            userName={profile.name}
            onUploadSuccess={(url) => {
              setProfile({ ...profile, avatar_url: url });
            }}
          />
        </Card>

        {/* Personal Info Section */}
        <Card className="p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Personal Information</h2>
          <div className="max-w-md">
            <PersonalInfoForm
              initialName={profile.name}
              initialEmail={profile.email}
              onSaveSuccess={fetchProfile}
            />
          </div>
        </Card>

        {/* Account Type Info */}
        <Card className="p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Account Type</h2>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium capitalize">
              {profile.user_type}
            </div>
            <p className="text-sm text-slate-600">
              Your account type cannot be changed
            </p>
          </div>
        </Card>

        {/* Password Section */}
        <Card className="p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Change Password</h2>
          <div className="max-w-md">
            <PasswordChangeForm />
          </div>
        </Card>
      </div>
    </div>
  );
}