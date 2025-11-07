'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  UserCircleIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';

// Available avatars in /public/avatars/admin/
const AVAILABLE_AVATARS = [
  '/avatars/admin/nick-kessler.png',
  '/avatars/admin/mhh.png',
];

const TEAMS = [
  { value: 'admin', label: 'Admin' },
  { value: 'support', label: 'Support' },
];

export function AdminProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [team, setTeam] = useState('admin');
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
        setTeam(user.user_metadata?.team || 'admin');
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

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: displayName.trim(),
          team: team,
          avatar_url: avatarUrl,
        },
      });

      if (error) throw error;

      toast.success('Profile updated successfully!');
      setIsOpen(false);
      
      // Reload page to reflect changes
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
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
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold border-2 border-slate-200">
            {getInitials(displayName)}
          </div>
        )}
        <span className="text-sm font-medium text-slate-700 hidden md:block">
          {displayName}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 shadow-lg border border-slate-200 z-50">
          <div className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
              <UserCircleIcon className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Admin Profile</h3>
            </div>

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
                placeholder="Enter your name"
                className="w-full"
              />
            </div>

            {/* Team Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Team
              </Label>
              <Select value={team} onValueChange={setTeam}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Avatar Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Profile Picture
              </Label>
              <div className="grid grid-cols-4 gap-3">
                {AVAILABLE_AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setAvatarUrl(avatar)}
                    className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
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
                  <p className="text-xs text-slate-600 capitalize">{team} Team</p>
                </div>
              </div>
            </div>

            {/* Save Button */}
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