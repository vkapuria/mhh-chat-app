'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  UserCircleIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// Avatar pools by user type
const CUSTOMER_AVATARS = [
  '/avatars/users/ghibli-girl-1.png',
  '/avatars/users/ghibli-girl-2.png',
  '/avatars/users/ghibli-girl-3.png',
  '/avatars/users/ghibli-boy-1.png',
  '/avatars/users/ghibli-boy-2.png',
  '/avatars/users/ghibli-boy-3.png',
  '/avatars/users/photo-girl-1.png',
  '/avatars/users/photo-girl-2.png',
  '/avatars/users/photo-girl-3.png',
  '/avatars/users/photo-girl-4.png',
  '/avatars/users/photo-boy-1.png',
  '/avatars/users/photo-boy-2.png',
  '/avatars/users/photo-boy-3.png',
  '/avatars/users/photo-boy-4.png',
];

const EXPERT_AVATARS = [
  '/avatars/experts/expert-image-1.png',
  '/avatars/experts/expert-image-2.png',
  '/avatars/experts/expert-image-3.png',
  '/avatars/experts/expert-image-4.png',
  '/avatars/experts/expert-image-5.png',
  '/avatars/experts/expert-image-6.png',
  '/avatars/experts/expert-image-7.png',
  '/avatars/experts/expert-image-8.png',
  '/avatars/experts/expert-image-9.png',
  '/avatars/experts/expert-image-10.png',
  '/avatars/experts/expert-image-11.png',
];

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: string;
}

export function UserProfileModal({ isOpen, onClose, userType = 'customer' }: UserProfileModalProps) {
  const AVAILABLE_AVATARS = userType === 'expert' ? EXPERT_AVATARS : CUSTOMER_AVATARS;

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>(AVAILABLE_AVATARS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen]);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDisplayName(user.user_metadata?.display_name || user.email?.split('@')[0] || '');
        setAvatarUrl(user.user_metadata?.avatar_url || AVAILABLE_AVATARS[0]);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter a display name');
      return;
    }

    if (displayName.length < 2 || displayName.length > 30) {
      toast.error('Display name must be 2-30 characters');
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(displayName)) {
      toast.error('Display name can only contain letters');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: displayName.trim(),
          avatar_url: avatarUrl,
        },
      });

      if (error) throw error;

      toast.success('Profile updated successfully!');
      onClose();
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-5 pb-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCircleIcon className="w-5 h-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-900">Edit Profile</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How others see you"
                    maxLength={30}
                  />
                  <p className="text-xs text-slate-500">2-30 characters, letters only</p>
                </div>

                {/* Avatar Selection */}
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                    <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                      {AVAILABLE_AVATARS.map((avatar) => (
                        <button
                          key={avatar}
                          onClick={() => setAvatarUrl(avatar)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                            avatarUrl === avatar
                              ? 'border-blue-600 ring-2 ring-blue-200'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Image src={avatar} alt="Avatar" fill className="object-cover" />
                          {avatarUrl === avatar && (
                            <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                              <CheckIcon className="w-6 h-6 text-blue-600" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="pt-3 border-t border-slate-200">
                  <Label className="mb-2 block">Preview</Label>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{displayName || 'Your Name'}</p>
                      <p className="text-xs text-slate-600">How others will see you</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 pt-3 border-t border-slate-200 flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}