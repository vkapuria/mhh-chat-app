'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { fetcher } from '@/lib/fetcher';
import { EarningsChart } from '@/components/earnings/EarningsChart';
import { PaymentHistory } from '@/components/earnings/PaymentHistory';
import { PaymentStatusChart } from '@/components/earnings/PaymentStatusChart';
import { EarningsSkeleton } from '@/components/loaders/EarningsSkeleton';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

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

  // Calculate payment breakdown
  const paidAmount = data.orders
    .filter(o => o.period_status === 'paid' && o.payment_status === 'approved')
    .reduce((sum, o) => sum + (o.expert_fee || o.amount), 0);

  const approvedAmount = data.orders
    .filter(o => o.payment_status === 'approved' && o.period_status !== 'paid')
    .reduce((sum, o) => sum + (o.expert_fee || o.amount), 0);

  const pendingAmount = data.orders
    .filter(o => !o.payment_status || o.payment_status === 'pending')
    .reduce((sum, o) => sum + (o.expert_fee || o.amount), 0);

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

        {/* Top Row: Combined Earnings Card + Monthly Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Combined Earnings Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white h-full flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white/90 text-sm font-medium mb-2">Total Earnings</h3>
                  <div className="text-4xl font-bold mb-1">
                    ₹{data.stats.totalEarnings.toLocaleString()}
                  </div>
                  <p className="text-white/80 text-sm">All time</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold">
                    ₹{data.stats.thisMonthEarnings.toLocaleString()}
                  </div>
                </div>
                <p className="text-white/80 text-sm mt-1">This month</p>
              </div>
            </div>
          </div>

          {/* Monthly Chart (wider) */}
          <div className="lg:col-span-3">
            <EarningsChart orders={data.orders} />
          </div>
        </div>

        {/* Payment Status Donut Chart */}
        <PaymentStatusChart
          paidAmount={paidAmount}
          approvedAmount={approvedAmount}
          pendingAmount={pendingAmount}
        />

        {/* Payment History */}
        <div>
          <PaymentHistory orders={data.orders} />
        </div>
      </div>
    </div>
  );
}