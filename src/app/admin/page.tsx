import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UsersIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
        <p className="mt-2 text-slate-600">
          Manage users, experts, and chat system settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <PlusIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Create User</h3>
              <p className="text-sm text-slate-600">Add new customer or expert</p>
            </div>
          </div>
          <Link href="/admin/users/create">
            <Button className="w-full mt-4">Create New User</Button>
          </Link>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <UsersIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">View Users</h3>
              <p className="text-sm text-slate-600">Manage all user accounts</p>
            </div>
          </div>
          <Link href="/admin/users">
            <Button variant="outline" className="w-full mt-4">View All Users</Button>
          </Link>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <UsersIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Statistics</h3>
              <p className="text-sm text-slate-600">Coming soon...</p>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-4" disabled>
            View Stats
          </Button>
        </Card>
      </div>
    </div>
  );
}