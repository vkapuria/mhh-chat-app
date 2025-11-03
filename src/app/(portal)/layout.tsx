'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/user';
import { PortalSidebar } from '@/components/portal/PortalSidebar';
import { PortalHeader } from '@/components/portal/PortalHeader';
import { PresenceProvider } from '@/components/providers/PresenceProvider';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Bars3Icon } from '@heroicons/react/24/outline';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();

      if (error || !authUser) {
        router.push('/login');
        return;
      }

      // Check if admin trying to access portal
      const userType = authUser.user_metadata?.user_type;
      if (userType === 'admin') {
        router.push('/admin');
        return;
      }

      // Map auth user to our User type
      const mappedUser: User = {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || 'User',
        display_name: authUser.user_metadata?.display_name || 'User',
        user_type: userType || 'customer',
        expert_id: authUser.user_metadata?.expert_id,
        created_at: authUser.created_at,
      };

      setUser(mappedUser);
    } catch (error) {
      console.error('Auth check error:', error);
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
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PresenceProvider>
      <div className="flex h-screen bg-slate-50">
        {/* Desktop Sidebar - Hidden on Mobile */}
        <div className="hidden md:block">
          <PortalSidebar user={user} />
        </div>

        {/* Mobile Sidebar - Sheet/Drawer */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-80">
            <PortalSidebar user={user} onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header with Hamburger */}
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-6 h-6 text-slate-700" />
            </button>
            <div>
              <h1 className="font-bold text-lg">MyHomeworkHelp</h1>
              <p className="text-xs text-slate-500">
                {user.user_type === 'customer' ? 'Customer Portal' : 'Expert Portal'}
              </p>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:block">
            <PortalHeader user={user} />
          </div>

          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </PresenceProvider>
  );
}