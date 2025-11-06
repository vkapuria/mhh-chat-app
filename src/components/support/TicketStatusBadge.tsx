import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface TicketStatusBadgeProps {
  status: 'submitted' | 'in_progress' | 'resolved';
  className?: string;
}

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const variants = {
    submitted: {
      label: 'Submitted',
      icon: Clock,
      className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    in_progress: {
      label: 'In Progress',
      icon: AlertCircle,
      className: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    resolved: {
      label: 'Resolved',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-700 border-green-200',
    },
  };

  const variant = variants[status];
  const Icon = variant.icon;

  return (
    <Badge
      variant="outline"
      className={`${variant.className} ${className} flex items-center gap-1 px-2 py-1`}
    >
      <Icon className="w-3 h-3" />
      {variant.label}
    </Badge>
  );
}