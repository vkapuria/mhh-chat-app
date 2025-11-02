'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Define the Order type based on our previous discussions
interface Order {
  id: string;
  title: string;
  amount: number;
  expert_fee?: number;
  updated_at: string;
  completed_at?: string;
}

interface EarningsChartProps {
  orders: Order[];
}

// Custom Tooltip component for styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-1">
          <span className="text-sm font-bold text-foreground">
            {label}
          </span>
          <span className="text-sm text-green-600">
            Earnings: <strong>₹{payload[0].value.toLocaleString()}</strong>
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function EarningsChart({ orders }: EarningsChartProps) {
  // Group by month
  const monthlyData: { [key: string]: number } = {};

  orders.forEach((order) => {
    // Use completed_at or updated_at
    const dateStr = order.completed_at || order.updated_at;
    const date = new Date(dateStr);
    
    // Create a 'YYYY-MM' key for correct chronological sorting
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    // Sum expert_fee (use amount as fallback)
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (order.expert_fee || order.amount);
  });

  // Sort keys, take the last 6, and map to chart data format
  const chartData = Object.keys(monthlyData)
    .sort() // Sorts chronologically (e.g., '2024-12' comes after '2024-11')
    .slice(-6) // Get last 6 months
    .map(monthKey => {
      const [year, month] = monthKey.split('-');
      const date = new Date(Number(year), Number(month) - 1);
      return {
        name: date.toLocaleDateString('en-US', { month: 'short' }), // "Nov"
        earnings: monthlyData[monthKey],
      };
    });

  return (
    // Set h-full to match the height of sibling EarningsCard components
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Monthly Earnings (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[180px] items-center justify-center">
            <p className="text-slate-500">No earnings data yet</p>
          </div>
        ) : (
          // Set a fixed height for the chart container
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: -20, // Adjust to pull Y-axis labels closer
                  bottom: 5,
                }}
              >
                {/* Gradient for the bars */}
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                
                {/* X-Axis (Month Names) */}
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                
                {/* Y-Axis (Earnings) */}
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value / 1000}k`} // Format as ₹1k, ₹2k
                />
                
                {/* Tooltip on Hover */}
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} // Light slate fill on hover
                />
                
                {/* The Bars */}
                <Bar
                  dataKey="earnings"
                  fill="url(#colorEarnings)"
                  radius={[4, 4, 0, 0]} // Rounded tops
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

