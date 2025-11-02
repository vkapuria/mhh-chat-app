import React, { ReactElement } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactElement;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

export function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const bgClasses = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-green-500 to-emerald-600',
    purple: 'from-purple-500 to-pink-600',
    orange: 'from-orange-500 to-red-600',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br p-6 text-white shadow-lg ${bgClasses[color]}`}
    >
      {/* Watermark Icon */}
      <div className="absolute -right-4 -top-4 text-white/20">
        {React.cloneElement(icon, {
          className: 'w-24 h-24',
        })}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <p className="text-sm font-medium text-white/80">{title}</p>
        <p className="mt-2 text-4xl font-bold">{value}</p>
      </div>
    </div>
  );
}