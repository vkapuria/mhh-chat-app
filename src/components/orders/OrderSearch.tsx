import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface OrderSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function OrderSearch({ value, onChange }: OrderSearchProps) {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      <input
        type="text"
        placeholder="Search by order ID or title..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
      />
    </div>
  );
}