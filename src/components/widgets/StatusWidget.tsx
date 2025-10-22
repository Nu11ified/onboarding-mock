'use client';

import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusWidgetProps {
  status: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  icon?: string;
}

const STATUS_CONFIG = {
  info: {
    Icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconBgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    messageColor: 'text-blue-700',
  },
  success: {
    Icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconBgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    titleColor: 'text-green-900',
    messageColor: 'text-green-700',
  },
  warning: {
    Icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconBgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-900',
    messageColor: 'text-yellow-700',
  },
  error: {
    Icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconBgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
    messageColor: 'text-red-700',
  },
};

export function StatusWidget({ status, title, message }: StatusWidgetProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.Icon;

  return (
    <div className={cn(
      'rounded-xl border p-4 shadow-sm',
      config.bgColor,
      config.borderColor
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          config.iconBgColor
        )}>
          <Icon className={cn('h-5 w-5', config.iconColor)} />
        </div>
        
        <div className="flex-1">
          {title && (
            <h3 className={cn('text-sm font-semibold', config.titleColor)}>
              {title}
            </h3>
          )}
          <p className={cn(
            'text-sm',
            title ? 'mt-1' : '',
            config.messageColor
          )}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
