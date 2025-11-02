import { ReactNode } from 'react';

interface EarningsCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  icon: ReactNode;
  color: 'green' | 'blue' | 'purple' | 'orange';
}

export function EarningsCard({ title, amount, subtitle, icon, color }: EarningsCardProps) {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  const bgClasses = {
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-pink-600',
    orange: 'from-orange-500 to-red-600',
  };

  return (
    <div className={`bg-gradient-to-br ${bgClasses[color]} rounded-lg shadow-lg p-6 text-white`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="text-3xl font-bold mt-2">₹{amount.toLocaleString()}</p>
          {subtitle && (
            <p className="text-sm text-white/70 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}