'use client';

import { Card } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts';

interface LoginTrendChartProps {
  data: { date: string; count: number }[];
}

export function LoginTrendChart({ data }: LoginTrendChartProps) {
  const formatted = data.map(d => ({
    ...d,
    day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
  }));

  return (
    <Card className="p-4 md:p-8 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
      <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">📈 Login Activity (7 Days)</h2>
      <div className="h-64 md:h-72 bg-gradient-to-br from-slate-50 to-white p-3 md:p-4 rounded-lg border border-slate-100">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="day" 
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis 
              allowDecimals={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: 'white' }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}