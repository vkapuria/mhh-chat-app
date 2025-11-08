'use client';

import { useEffect } from 'react';
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
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID) {
      const op = getOpenPanel();
      
      // Track page views
      if (op) {
        op.track('page_view', {
          path: window.location.pathname,
          url: window.location.href,
        });
      }
    }
  }, []);

  return null;
}