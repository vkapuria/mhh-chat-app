import { SkeletonLoader, ShimmerCard, ShimmerListItem } from './SkeletonLoader';

const DASHBOARD_MESSAGES = [
  {
    text: "Crunching numbers...",
    icon: "/icons/dashboard1.svg"
  },
  {
    text: "Organizing your stats...",
    icon: "/icons/dashboard2.svg"
  },
  {
    text: "Preparing workspace...",
    icon: "/icons/laptop.svg"
  }
];

export function DashboardSkeleton() {
  return (
    <SkeletonLoader messages={DASHBOARD_MESSAGES}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ShimmerCard className="h-32" />
        <ShimmerCard className="h-32" />
        <ShimmerCard className="h-32" />
        <ShimmerCard className="h-32" />
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-blue-100 p-6">
            <div className="h-6 bg-blue-100 rounded w-48 mb-4" />
            <ShimmerListItem />
            <ShimmerListItem />
            <ShimmerListItem />
            <ShimmerListItem />
            <ShimmerListItem />
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="bg-white rounded-lg border border-blue-100 p-6">
            <div className="h-6 bg-blue-100 rounded w-32 mb-4" />
            <div className="space-y-3">
              <div className="h-12 bg-blue-100 rounded" />
              <div className="h-12 bg-blue-100 rounded" />
              <div className="h-12 bg-blue-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    </SkeletonLoader>
  );
}