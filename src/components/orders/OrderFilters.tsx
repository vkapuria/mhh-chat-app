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
      { id: 'all', label: 'All Orders', count: counts.all },
      { id: 'pending', label: 'Pending', count: counts.pending },
      { id: 'active', label: 'Active', count: counts.active },
      { id: 'completed', label: 'Completed', count: counts.completed },
    ];
  
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
              ${
                activeFilter === filter.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }
            `}
          >
            {filter.label}
            <span className={`ml-2 ${activeFilter === filter.id ? 'text-blue-100' : 'text-slate-400'}`}>
              ({filter.count})
            </span>
          </button>
        ))}
      </div>
    );
  }