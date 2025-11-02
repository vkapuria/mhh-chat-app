import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { UserCreateForm } from '@/components/admin/UserCreateForm';

export default function CreateUserPage() {
  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/users">
          <Button variant="ghost" className="mb-4">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </Link>
        <h2 className="text-3xl font-bold text-slate-900">Create New User</h2>
        <p className="mt-2 text-slate-600">
          Add a new customer or expert account to the system
        </p>
      </div>

      <UserCreateForm />
    </div>
  );
}