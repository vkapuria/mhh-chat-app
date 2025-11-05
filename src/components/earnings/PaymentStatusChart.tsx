'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PaymentStatusChartProps {
  paidAmount: number;
  approvedAmount: number;
  pendingAmount: number;
}

const COLORS = {
  paid: '#10b981', // green-500
  approved: '#1b1b20', // emerald-400
  pending: '#fbbf24', // amber-400
};

export function PaymentStatusChart({ paidAmount, approvedAmount, pendingAmount }: PaymentStatusChartProps) {
  const data = [
    { name: 'Paid', value: paidAmount, color: COLORS.paid },
    { name: 'Approved', value: approvedAmount, color: COLORS.approved },
    { name: 'Pending', value: pendingAmount, color: COLORS.pending },
  ].filter(item => item.value > 0); // Only show non-zero values

  const total = paidAmount + approvedAmount + pendingAmount;

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Payment Status Breakdown</h3>
        <div className="flex items-center justify-center h-64 text-slate-400">
          No payment data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">Payment Status Breakdown</h3>
      
      <div className="flex items-center gap-8">
        {/* Donut Chart */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `₹${value.toLocaleString()}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="space-y-4">
          {paidAmount > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <div>
                <div className="text-sm font-medium text-slate-900">Paid</div>
                <div className="text-lg font-bold text-slate-900">₹{paidAmount.toLocaleString()}</div>
                <div className="text-xs text-slate-500">
                  {total > 0 ? `${Math.round((paidAmount / total) * 100)}%` : '0%'}
                </div>
              </div>
            </div>
          )}
          
          {approvedAmount > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-emerald-400"></div>
              <div>
                <div className="text-sm font-medium text-slate-900">Approved</div>
                <div className="text-lg font-bold text-slate-900">₹{approvedAmount.toLocaleString()}</div>
                <div className="text-xs text-slate-500">
                  {total > 0 ? `${Math.round((approvedAmount / total) * 100)}%` : '0%'}
                </div>
              </div>
            </div>
          )}
          
          {pendingAmount > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-amber-400"></div>
              <div>
                <div className="text-sm font-medium text-slate-900">Pending</div>
                <div className="text-lg font-bold text-slate-900">₹{pendingAmount.toLocaleString()}</div>
                <div className="text-xs text-slate-500">
                  {total > 0 ? `${Math.round((pendingAmount / total) * 100)}%` : '0%'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}