'use client';

import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface LoginRow {
  user_id: string;
  user_name: string;
  user_email: string;
  user_type: string;
  avatar_url?: string;
  created_at: string;
}

export function TodaysLoginCard({ list }: { list: LoginRow[] }) {
  return (
    <Card className="p-4 md:p-8 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
      <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">🔐 Today&apos;s Logins</h2>
  
      {list.length === 0 ? (
        <div className="text-center py-8 md:py-12 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-slate-500 text-xs md:text-sm">No logins yet today.</p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4 max-h-[400px] overflow-y-auto pr-1 md:pr-2">
          {list.map((user) => (
            <div 
              key={`${user.user_id}-${user.created_at}`} 
              className="flex items-center justify-between p-3 md:p-4 bg-white rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 md:gap-3">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.user_name}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover ring-2 ring-slate-100"
                  />
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center ring-2 ring-slate-100">
                    <span className="text-slate-700 font-bold text-sm md:text-base">
                      {user.user_name?.charAt(0) || user.user_email?.charAt(0)}
                    </span>
                  </div>
                )}
  
                <div>
                  <p className="font-semibold text-sm md:text-base text-slate-900">
                    {user.user_name || user.user_email}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
  
              <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 shadow-sm">
                {user.user_type}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}