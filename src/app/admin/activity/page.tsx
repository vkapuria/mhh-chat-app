import { ActivityStats } from '@/components/admin/activity/ActivityStats';
import { OnlineUsersCard } from '@/components/admin/activity/OnlineUsersCard';
import { RecentActivityCard } from '@/components/admin/activity/RecentActivityCard';

export const metadata = {
  title: 'User Activity | Admin',
  description: 'Monitor user activity and online presence',
};

export default function ActivityPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">User Activity Monitor</h1>
        <p className="mt-2 text-slate-600">
          Track online users, login activity, and page views in real-time
        </p>
      </div>

      <div className="space-y-6">
        {/* Stats */}
        <ActivityStats />

        {/* Online Users */}
        <OnlineUsersCard />

        {/* Recent Activity */}
        <RecentActivityCard />
      </div>
    </div>
  );
}