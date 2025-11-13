'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { PortalSidebar } from '@/components/portal/PortalSidebar';
import { PresenceProvider } from '@/components/providers/PresenceProvider';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useTicketRealtime } from '@/hooks/useTicketRealtime';
import { useMessagesRealtime } from '@/hooks/useMessagesRealtime';
import { useActivityTracker } from '@/hooks/useActivityTracker';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  
  // Get user from global store (no API call!)
  const { user, loading } = useAuthStore();

  // Track user activity
  useActivityTracker(); // ← ADD THIS LINE
  
  
  // Setup realtime subscriptions
  useTicketRealtime(user?.id || null);
  useMessagesRealtime(user?.id || null);

  // Redirect if not authenticated or if admin
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.user_type === 'admin') {
        router.push('/admin');
      }
    }
  }, [user, loading, router]);

  // Show loading only on initial load
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

  // Don't render if no user
  if (!user || user.user_type === 'admin') {
    return null;
  }

  return (
    <PresenceProvider>
      <div className="flex h-screen bg-slate-50">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <PortalSidebar user={user} />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-80">
            <PortalSidebar user={user} onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="md:hidden sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 relative">
              <Image
                src="/icons/mhh-logo.png"
                alt="Homework Hub"
                width={80}
                height={44}
                className="object-contain"
              />
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <h1 className="font-bold text-lg text-slate-900 whitespace-nowrap">
                  Homework Hub
                </h1>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors z-10"
                aria-label="Open menu"
              >
                <Bars3Icon className="w-6 h-6 text-slate-700" />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </PresenceProvider>
  );
}