import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingBagIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface QuickActionsProps {
  userType: 'customer' | 'expert';
}

export function QuickActions({ userType }: QuickActionsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/orders">
          <Button variant="outline" className="w-full justify-start">
            <ShoppingBagIcon className="w-5 h-5 mr-2" />
            {userType === 'customer' ? 'View All Orders' : 'View Assignments'}
          </Button>
        </Link>
        <Link href="/messages">
          <Button variant="outline" className="w-full justify-start">
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
            View Messages
          </Button>
        </Link>
      </div>
    </div>
  );
}