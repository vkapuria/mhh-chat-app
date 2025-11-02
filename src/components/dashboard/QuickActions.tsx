import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface QuickActionsProps {
  userType: 'customer' | 'expert';
}

export function QuickActions({ userType }: QuickActionsProps) {
  const isCustomer = userType === 'customer';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 gap-3">

        {/* Button 1: View History (Role-based) - White Button */}
        <Link href="/orders">
          <Button
            variant="outline"
            className="w-full justify-start text-slate-900 bg-white hover:bg-slate-50"
          >
            {isCustomer ? (
              <ShoppingBagIcon className="w-5 h-5 mr-2" />
            ) : (
              <PencilIcon className="w-5 h-5 mr-2" />
            )}
            {isCustomer ? 'View Order History' : 'View Work History'}
          </Button>
        </Link>

        {/* Button 2: View Messages - Black Button */}
        <Link href="/messages">
          <Button
            variant="default"
            className="w-full justify-start bg-slate-900 text-white hover:bg-slate-800"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
            View Messages
          </Button>
        </Link>

      </div>
    </div>
  );
}