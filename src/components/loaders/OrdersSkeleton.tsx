import { SkeletonLoader, ShimmerCard } from './SkeletonLoader';

const ORDERS_MESSAGES = [
  {
    text: "Gathering assignments...",
    icon: "/icons/orders1.svg"
  },
  {
    text: "Syncing orders...",
    icon: "/icons/orders3.svg"
  },
  {
    text: "Loading tasks...",
    icon: "/icons/order2.svg"
  }
];

export function OrdersSkeleton() {
  return (
    <SkeletonLoader messages={ORDERS_MESSAGES}>
      {/* Search & Filters */}
      <div className="space-y-4 mb-6">
        <div className="h-12 bg-white rounded-lg border border-blue-100" />
        <div className="flex gap-2">
          <div className="h-10 bg-white rounded-lg border border-blue-100 w-24" />
          <div className="h-10 bg-white rounded-lg border border-blue-100 w-24" />
          <div className="h-10 bg-white rounded-lg border border-blue-100 w-24" />
          <div className="h-10 bg-white rounded-lg border border-blue-100 w-24" />
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ShimmerCard className="h-64" />
        <ShimmerCard className="h-64" />
        <ShimmerCard className="h-64" />
        <ShimmerCard className="h-64" />
        <ShimmerCard className="h-64" />
        <ShimmerCard className="h-64" />
        <ShimmerCard className="h-64" />
        <ShimmerCard className="h-64" />
        <ShimmerCard className="h-64" />
      </div>
    </SkeletonLoader>
  );
}