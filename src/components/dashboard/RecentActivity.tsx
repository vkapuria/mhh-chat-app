import { formatDistanceToNow } from 'date-fns';

interface Order {
  id: string;
  title: string;
  status: string;
  updated_at: string;
  expert_name?: string;
  customer_name?: string;
}

interface RecentActivityProps {
  orders: Order[];
  userType: 'customer' | 'expert';
}

export function RecentActivity({ orders, userType }: RecentActivityProps) {
  const getActivityText = (order: Order) => {
    const isCustomer = userType === 'customer';
    
    if (order.status === 'Assigned' && isCustomer) {
      return `Order assigned to ${order.expert_name || 'expert'}`;
    }
    if (order.status === 'Completed') {
      return `Order completed`;
    }
    if (order.status === 'In Progress') {
      return `Order in progress`;
    }
    if (order.status === 'Pending' && !isCustomer) {
      return `New order from ${order.customer_name || 'customer'}`;
    }
    return `Order ${order.status.toLowerCase()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'In Progress':
      case 'Assigned':
        return 'bg-blue-100 text-blue-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
        <p className="text-slate-500">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{order.title}</p>
              <p className="text-sm text-slate-600">{getActivityText(order)}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <span className="text-xs text-slate-500">
                  {formatDistanceToNow(new Date(order.updated_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}