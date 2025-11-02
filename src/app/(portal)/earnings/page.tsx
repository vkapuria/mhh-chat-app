'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { EarningsCard } from '@/components/earnings/EarningsCard';
import { EarningsChart } from '@/components/earnings/EarningsChart';
import { PaymentHistory } from '@/components/earnings/PaymentHistory';
import { 
  CurrencyDollarIcon, 
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface EarningsData {
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
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const type = user.user_metadata?.user_type;
      setUserType(type);

      // Only experts can access earnings
      if (type !== 'expert') {
        router.push('/dashboard');
        return;
      }

      await fetchEarnings();
    } catch (error) {
      console.error('Access check error:', error);
      router.push('/dashboard');
    }
  }

  async function fetchEarnings() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/earnings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="h-32 bg-slate-200 rounded"></div>
              <div className="h-32 bg-slate-200 rounded"></div>
              <div className="h-32 bg-slate-200 rounded lg:col-span-2"></div>
            </div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-600">Failed to load earnings data</p>
        </div>
      </div>
    );
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

        {/* --- MODIFIED TOP ROW --- */}
        {/* New 4-column grid layout */}
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
          {/* Card 3: New Bar Chart (takes 2 columns) */}
          <div className="lg:col-span-2">
            <EarningsChart orders={data.orders} />
          </div>
        </div>
        {/* --- END OF MODIFIED ROW --- */}


        {/* --- MODIFIED BOTTOM ROW --- */}
        {/* Payment history is now full-width on its own */}
        <div>
          <PaymentHistory orders={data.orders} />
        </div>
        {/* --- END OF MODIFIED ROW --- */}

      </div>
    </div>
  );
}
