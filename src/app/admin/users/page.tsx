import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';
import { UserList } from '@/components/admin/UserList';

export default function UsersPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Users</h2>
          <p className="mt-2 text-slate-600">
            Manage customer and expert accounts
          </p>
        </div>
        <Link href="/admin/users/create">
          <Button>
            <PlusIcon className="w-5 h-5 mr-2" />
            Create User
          </Button>
        </Link>
      </div>

      <UserList />
    </div>
  );
}