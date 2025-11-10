'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PasswordChangeForm } from '@/components/profile/PasswordChangeForm';
import { UserProfileModal } from '@/components/user/UserProfileModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PencilIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface Profile {
  id: string;
  email: string;
  name: string;
  display_name: string;
  user_type: string;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    <>
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
            <p className="text-slate-600 mt-1">
              Manage your account information and preferences
            </p>
          </div>

          {/* Profile Information Section */}
          <Card className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Profile Information</h2>
                <p className="text-sm text-slate-600 mt-1">View and edit your profile details</p>
              </div>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <PencilIcon className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>

            <div className="space-y-6">
              {/* Avatar and Display Name */}
              <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-200">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-semibold">
                      {profile.display_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{profile.display_name}</h3>
                  <p className="text-sm text-slate-600">Display Name (Public)</p>
                </div>
              </div>

              {/* Full Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name (Private - Admin Only)
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
                    {profile.name || 'Not set'}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Your real name is only visible to administrators
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
                    {profile.email}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Your login email address
                  </p>
                </div>
              </div>

              {/* Info Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Note:</span> Display name and profile picture can only be changed once every 30 days. Click "Edit Profile" to update your information.
                </p>
              </div>
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

      {/* Profile Edit Modal */}
      <UserProfileModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          fetchProfile(); // Refresh profile data when modal closes
        }}
        userType={profile.user_type}
      />
    </>
  );
}