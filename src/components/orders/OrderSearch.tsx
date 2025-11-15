import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface OrderSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function OrderSearch({ value, onChange }: OrderSearchProps) {
  const hasValue = value.trim().length > 0;

  return (
    <div className="relative w-full">
      <MagnifyingGlassIcon
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
      />
      {hasValue && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Clear search"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
      <input
        type="text"
        placeholder="Search orders…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full rounded-lg border border-slate-200 bg-white
          pl-10 pr-9 py-2.5 text-sm text-slate-900
          placeholder:text-slate-400
          focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent
          transition-colors
        "
      />
    </div>
  );
}
