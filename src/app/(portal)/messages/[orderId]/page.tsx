'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function IndividualChatPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  useEffect(() => {
    // Redirect to messages page with this order selected
    router.push(`/messages?orderId=${orderId}`);
  }, [orderId, router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}