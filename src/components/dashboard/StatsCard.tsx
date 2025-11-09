'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  link: string;
  badge?: number; // Unread/pending count
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  subtitle?: string;
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  icon,
  link,
  badge,
  trend,
  subtitle,
  loading = false,
}: StatsCardProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <motion.button
      onClick={() => router.push(link)}
      whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
      whileTap={{ scale: 0.98 }}
      className="w-full bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-5 text-left transition-all group relative overflow-hidden"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Content */}
      <div className="relative">
        {/* Header: Icon + Badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-slate-600 group-hover:text-slate-900 transition-colors">
              {icon}
            </div>
            <h3 className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
              {title}
            </h3>
          </div>

          {/* Badge - pulsing if value > 0 */}
          {badge !== undefined && badge > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center justify-center min-w-[24px] h-6 px-2 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse"
            >
              {badge > 99 ? '99+' : badge}
            </motion.span>
          )}
        </div>

        {/* Main Value */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-slate-900">
            {value}
          </span>

          {/* Trend Indicator */}
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend.direction === 'up' ? 'text-green-600' :
              trend.direction === 'down' ? 'text-red-600' :
              'text-slate-500'
            }`}>
              {trend.direction === 'up' && <ArrowTrendingUpIcon className="w-4 h-4" />}
              {trend.direction === 'down' && <ArrowTrendingDownIcon className="w-4 h-4" />}
              <span>{trend.value > 0 ? '+' : ''}{trend.value} {trend.label}</span>
            </div>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors">
            {subtitle}
          </p>
        )}

        {/* Arrow indicator */}
        <div className="mt-3 flex items-center text-xs font-medium text-slate-400 group-hover:text-blue-600 transition-colors">
          <span>View all</span>
          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </motion.button>
  );
}