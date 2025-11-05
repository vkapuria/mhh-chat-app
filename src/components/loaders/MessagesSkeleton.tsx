import { SkeletonLoader, ShimmerListItem } from './SkeletonLoader';

const MESSAGES_MESSAGES = [
  {
    text: "Opening chats...",
    icon: "/icons/messages1.svg"
  },
  {
    text: "Checking messages...",
    icon: "/icons/letter.svg"
  },
  {
    text: "Looking for updates...",
    icon: "/icons/messsages2.svg"
  }
];

export function MessagesSkeleton() {
  return (
    <SkeletonLoader messages={MESSAGES_MESSAGES}>
      <div className="flex h-[calc(100vh-200px)]">
        {/* Conversation List */}
        <div className="w-full md:w-80 border-r border-blue-100 bg-white rounded-l-lg p-4">
          <div className="h-8 bg-blue-100 rounded w-48 mb-4" />
          <ShimmerListItem />
          <ShimmerListItem />
          <ShimmerListItem />
          <ShimmerListItem />
          <ShimmerListItem />
          <ShimmerListItem />
        </div>

        {/* Chat Window (Desktop only) */}
        <div className="hidden md:flex flex-1 bg-white rounded-r-lg items-center justify-center">
          <div className="text-center">
            <div className="h-6 bg-blue-100 rounded w-64 mx-auto mb-2" />
            <div className="h-4 bg-blue-100 rounded w-48 mx-auto" />
          </div>
        </div>
      </div>
    </SkeletonLoader>
  );
}