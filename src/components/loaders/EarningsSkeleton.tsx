import { SkeletonLoader, ShimmerCard, ShimmerListItem } from './SkeletonLoader';

const EARNINGS_MESSAGES = [
  {
    text: "Calculating earnings...",
    icon: "/icons/earnings1.svg"
  },
  {
    text: "Checking your stats...",
    icon: "/icons/earnings2.svg"
  },
  {
    text: "Preparing report...",
    icon: "/icons/dashboard2.svg"
  }
];

export function EarningsSkeleton() {
  return (
    <SkeletonLoader messages={EARNINGS_MESSAGES}>
      {/* Earnings Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <ShimmerCard className="h-32" />
        <ShimmerCard className="h-32" />
        <ShimmerCard className="h-32 lg:col-span-2" />
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg border border-blue-100 p-6">
        <div className="h-6 bg-blue-100 rounded w-48 mb-6" />
        <ShimmerListItem />
        <ShimmerListItem />
        <ShimmerListItem />
        <ShimmerListItem />
        <ShimmerListItem />
      </div>
    </SkeletonLoader>
  );
}