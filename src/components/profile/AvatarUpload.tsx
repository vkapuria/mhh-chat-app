'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CameraIcon } from '@heroicons/react/24/outline';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName: string;
  onUploadSuccess: (url: string) => void;
}

export function AvatarUpload({ currentAvatarUrl, userName, onUploadSuccess }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onUploadSuccess(result.avatar_url);
      } else {
        alert(result.error || 'Failed to upload avatar');
        setPreviewUrl(currentAvatarUrl || null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload avatar');
      setPreviewUrl(currentAvatarUrl || null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Avatar"
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg">
            <span className="text-white font-bold text-4xl">
              {userName.substring(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <CameraIcon className="w-5 h-5" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {uploading && (
        <p className="text-sm text-slate-500">Uploading...</p>
      )}
      
      <p className="text-xs text-slate-500 text-center max-w-xs">
        Click the camera icon to upload a new avatar. Max size: 2MB
      </p>
    </div>
  );
}

// Note: Import supabase at top of file
import { supabase } from '@/lib/supabase';