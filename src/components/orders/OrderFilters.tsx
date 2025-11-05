import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

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

export function OrderFilters({ activeFilter, onFilterChange, counts }: OrderFiltersProps) {
  const filters = [
    { 
      id: 'all', 
      label: 'All Orders', 
      count: counts.all,
      icon: ClipboardDocumentListIcon,
      countColor: 'bg-slate-100 text-slate-600'
    },
    { 
      id: 'active', 
      label: 'Active', 
      count: counts.active,
      icon: ClockIcon,
      countColor: 'bg-blue-100 text-blue-700'
    },
    { 
      id: 'completed', 
      label: 'Completed', 
      count: counts.completed,
      icon: CheckCircleIcon,
      countColor: 'bg-green-100 text-green-700'
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium 
              whitespace-nowrap transition-all
              min-h-[44px] active:scale-95
              ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }
            `}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            <span>{filter.label}</span>
            <span 
              className={`
                px-1.5 py-0.5 rounded text-xs font-semibold
                ${isActive ? 'bg-blue-500 text-white' : filter.countColor}
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