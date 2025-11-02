interface Order {
  id: string;
  title: string;
  amount: number;
  expert_fee?: number;
  updated_at: string;
  completed_at?: string;  // Add this
}
  
  interface EarningsChartProps {
    orders: Order[];
  }
  
  export function EarningsChart({ orders }: EarningsChartProps) {
    // Group by month
    const monthlyData: { [key: string]: number } = {};
  
    orders.forEach((order) => {
  // Use completed_at for consistency
  const dateStr = order.completed_at || order.updated_at;
  const date = new Date(dateStr);
  const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  monthlyData[monthYear] = (monthlyData[monthYear] || 0) + (order.expert_fee || order.amount);
});
  
    // Get last 6 months
    const sortedMonths = Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-6);
  
    const maxAmount = Math.max(...sortedMonths.map(([, amount]) => amount), 1);
  
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Monthly Earnings</h3>
        
        {sortedMonths.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No earnings data yet
          </div>
        ) : (
          <div className="space-y-4">
            {sortedMonths.map(([month, amount]) => (
              <div key={month} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{month}</span>
                  <span className="font-bold text-slate-900">₹{amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(amount / maxAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }