'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AdminNav } from '@/components/admin/AdminNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    console.log('🟣 Admin layout: Checking admin access');
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('🟣 Admin layout: User data:', user);
      console.log('🟣 Admin layout: Error:', error);
  
      if (error || !user) {
        console.log('🔴 Admin layout: No user, redirecting to login');
        router.push('/login?redirect=/admin');
        return;
      }
  
      // Check if user is admin
      const userType = user.user_metadata?.user_type;
      console.log('🟣 Admin layout: User type:', userType);
      
      if (userType !== 'admin') {
        console.log('🔴 Admin layout: Not admin, redirecting to home');
        alert('Access denied. Admin privileges required.');
        router.push('/');
        return;
      }
  
      console.log('🟢 Admin layout: Admin access granted!');
      setIsAdmin(true);
    } catch (error) {
      console.error('🔴 Admin layout: Error during check:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
              <p className="text-sm text-slate-500">MyHomeworkHelp Chat System</p>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
              }}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <AdminNav />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}