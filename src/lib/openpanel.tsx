'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { OpenPanel } from '@openpanel/sdk';

let opClient: OpenPanel | null = null;

export function getOpenPanel() {
  if (!opClient && typeof window !== 'undefined') {
    opClient = new OpenPanel({
      clientId: process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!,
    });
  }
  return opClient;
}

export function OpenPanelProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID) {
      const op = getOpenPanel();
      
      // Track page view on every route change
      if (op) {
        op.track('📄 page_view', {
          path: pathname,
          url: window.location.href,
        });
        console.log('📊 Tracked page view:', pathname);
      }
    }
  }, [pathname]); // Re-run when pathname changes

  return null;
}