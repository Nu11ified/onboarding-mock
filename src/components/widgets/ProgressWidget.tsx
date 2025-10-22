'use client';

import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressWidgetProps {
  label?: string;
  value: number; // 0-100
  status?: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

export function ProgressWidget({ 
  label, 
  value, 
  status = 'loading', 
  message 
}: ProgressWidgetProps) {
  return (
    <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
      <div className="space-y-3">
        {/* Header with status icon */}
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            status === 'loading' && 'bg-purple-100',
            status === 'success' && 'bg-green-100',
            status === 'error' && 'bg-red-100',
            status === 'idle' && 'bg-slate-100'
          )}>
            {status === 'loading' && (
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            {status === 'idle' && (
              <div className="h-2 w-2 rounded-full bg-slate-400" />
            )}
          </div>

          <div className="flex-1">
            {label && (
              <h3 className="text-sm font-semibold text-slate-900">
                {label}
              </h3>
            )}
            {message && (
              <p className={cn(
                'text-sm',
                label ? 'mt-1' : '',
                status === 'loading' && 'text-purple-600',
                status === 'success' && 'text-green-600',
                status === 'error' && 'text-red-600',
                status === 'idle' && 'text-slate-600'
              )}>
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <Progress value={value} className="h-2" />
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500">Progress</span>
            <span className={cn(
              'font-medium',
              status === 'loading' && 'text-purple-600',
              status === 'success' && 'text-green-600',
              status === 'error' && 'text-red-600',
              status === 'idle' && 'text-slate-600'
            )}>
              {Math.round(value)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
