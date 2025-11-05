'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { fetcher } from '@/lib/fetcher';
import { EarningsCard } from '@/components/earnings/EarningsCard';
import { EarningsChart } from '@/components/earnings/EarningsChart';
import { PaymentHistory } from '@/components/earnings/PaymentHistory';
import { EarningsSkeleton } from '@/components/loaders/EarningsSkeleton';
import { 
  CurrencyDollarIcon, 
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface EarningsData {
  success: boolean;
  stats: {
    totalEarnings: number;
    thisMonthEarnings: number;
    completedOrders: number;
    totalOrders: number;
    completionRate: number;
    avgEarningsPerOrder: number;
  };
  orders: any[];
}

export default function EarningsPage() {
  const [userType, setUserType] = useState('');
  const [userId, setUserId] = useState('');
  const [isExpert, setIsExpert] = useState<boolean | null>(null);
  const router = useRouter();

  // Check access control
  useEffect(() => {
    async function checkAccess() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const type = user.user_metadata?.user_type;
        setUserType(type);
        setUserId(user.id);

        // Only experts can access earnings
        if (type !== 'expert') {
          setIsExpert(false);
          router.push('/dashboard');
          return;
        }

        setIsExpert(true);
      } catch (error) {
        console.error('Access check error:', error);
        router.push('/dashboard');
      }
    }
    checkAccess();
  }, [router]);

  // ✨ SWR for earnings with USER-SPECIFIC caching
  const { data, error, isLoading } = useSWR<EarningsData>(
    isExpert && userId ? ['/api/earnings', userId] : null,
    ([url]) => fetcher(url),
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
    }
  );

  // Loading state with beautiful skeleton
  if (isExpert === null || isLoading || !data) {
    return <EarningsSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Failed to load earnings data</p>
            <p className="text-red-600 text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Access denied (shouldn't reach here due to redirect, but safety check)
  if (isExpert === false) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Earnings Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Track your income and payment history
          </p>
        </div>

        {/* Stats & Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Earnings */}
          <EarningsCard
            title="Total Earnings"
            amount={data.stats.totalEarnings}
            subtitle="All time"
            icon={<CurrencyDollarIcon className="w-6 h-6" />}
            color="green"
          />
          {/* Card 2: This Month */}
          <EarningsCard
            title="This Month"
            amount={data.stats.thisMonthEarnings}
            subtitle="Month to date"
            icon={<ChartBarIcon className="w-6 h-6" />}
            color="purple"
          />
          {/* Card 3: Chart (takes 2 columns) */}
          <div className="lg:col-span-2">
            <EarningsChart orders={data.orders} />
          </div>
        </div>

        {/* Payment History */}
        <div>
          <PaymentHistory orders={data.orders} />
        </div>
      </div>
    </div>
  );
}