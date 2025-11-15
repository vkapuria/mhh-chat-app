import { HugeiconsIcon } from '@hugeicons/react';
import {
  TaskDone01Icon,
  Clock01Icon,
  TickDouble03Icon,
} from '@hugeicons/core-free-icons';

interface OrderFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: {
    all: number;
    pending: number;
    active: number;
    completed: number;
  };
}

export function OrderFilters({
  activeFilter,
  onFilterChange,
  counts,
}: OrderFiltersProps) {
  const filters = [
    {
      id: 'all',
      label: 'All',
      count: counts.all,
      icon: TaskDone01Icon,
    },
    {
      id: 'active',
      label: 'In progress',
      count: counts.active,
      icon: Clock01Icon,
    },
    {
      id: 'completed',
      label: 'Completed',
      count: counts.completed,
      icon: TickDouble03Icon,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;

        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            aria-pressed={isActive}
            className={`
              inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium
              border transition-all duration-150 whitespace-nowrap
              active:scale-95
              ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }
            `}
          >
            {/* Icon (Hugeicons) */}
            <HugeiconsIcon
              icon={filter.icon}
              size={16}
              strokeWidth={1.7}
              color={isActive ? 'white' : '#64748b'}
            />

            {/* Label */}
            <span>{filter.label}</span>

            {/* Count Badge */}
            <span
              className={`
                px-2 py-0.5 rounded-full text-xs font-semibold
                ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600'
                }
              `}
            >
              {filter.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
