'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  UserCircleIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';

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

interface UserProfileDropdownProps {
  userType?: string;
}

export function UserProfileDropdown({ userType = 'customer' }: UserProfileDropdownProps) {
  // Select avatar pool based on user type
  const AVAILABLE_AVATARS = userType === 'expert' ? EXPERT_AVATARS : CUSTOMER_AVATARS;

  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>(AVAILABLE_AVATARS[0]);
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUserProfile();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  
    // Validate display name (2-30 chars, letters only)
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
      // 🆕 Get session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please log in again.');
        setSaving(false);
        return;
      }
  
      // 🆕 Call your API endpoint instead of direct auth update
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          display_name: displayName.trim(),
          avatar_url: avatarUrl,
        }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }
  
      // 🆕 Force session refresh BEFORE reload
      await supabase.auth.refreshSession();
  
      toast.success('Profile updated successfully!');
      setIsOpen(false);
      
      // 🆕 Small delay to ensure session is refreshed
      setTimeout(() => {
        window.location.reload();
      }, 500);
  
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return name.charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-cover border-2 border-slate-200"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold border-2 border-slate-200">
            {getInitials(displayName)}
          </div>
        )}
        <span className="text-sm font-medium text-slate-700 hidden md:block">
          {displayName}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 shadow-lg border border-slate-200 z-50 flex flex-col max-h-[600px]">
          {/* Fixed Header */}
          <div className="p-5 pb-3 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <UserCircleIcon className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Profile Settings</h3>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium text-slate-700">
                Display Name
              </Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How others see you"
                maxLength={30}
                className="w-full"
              />
              <p className="text-xs text-slate-500">
                2-30 characters, letters only
              </p>
            </div>

            {/* Avatar Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Profile Picture
              </Label>
              <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                  {AVAILABLE_AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => setAvatarUrl(avatar)}
                      className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 flex-shrink-0 ${
                        avatarUrl === avatar
                          ? 'border-blue-600 ring-2 ring-blue-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Image
                        src={avatar}
                        alt="Avatar option"
                        fill
                        className="object-cover"
                      />
                      {avatarUrl === avatar && (
                        <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                          <CheckIcon className="w-6 h-6 text-blue-600 drop-shadow-lg" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Scroll to see more options
              </p>
            </div>

            {/* Preview */}
            <div className="pt-3 border-t border-slate-200">
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Preview
              </Label>
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

          {/* Fixed Save Button */}
          <div className="p-5 pt-3 border-t border-slate-200 bg-white flex-shrink-0">
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}