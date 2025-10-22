'use client';

import { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InfoField } from '@/lib/widgets/types';

interface InfoGridWidgetProps {
  title?: string;
  description?: string;
  fields: InfoField[];
}

export function InfoGridWidget({ title, description, fields }: InfoGridWidgetProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [visibleSensitive, setVisibleSensitive] = useState<Set<string>>(new Set());

  const copyToClipboard = async (text: string, fieldLabel: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldLabel);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleSensitiveVisibility = (fieldLabel: string) => {
    setVisibleSensitive(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldLabel)) {
        newSet.delete(fieldLabel);
      } else {
        newSet.add(fieldLabel);
      }
      return newSet;
    });
  };

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
      {/* Header */}
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-xs text-slate-600">{description}</p>
          )}
        </div>
      )}

      {/* Fields */}
      <div className="space-y-3">
        {fields.map((field) => {
          const isCopied = copiedField === field.label;
          const isVisible = !field.sensitive || visibleSensitive.has(field.label);

          return (
            <div
              key={field.label}
              className="group rounded-lg border border-slate-200 bg-slate-50 p-3 hover:border-purple-200 hover:bg-purple-50/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700">
                    {field.label}
                  </p>
                  <p className={cn(
                    'mt-1 text-sm break-all',
                    field.sensitive && !isVisible && 'font-mono text-slate-400'
                  )}>
                    {isVisible ? field.value : '••••••••••••'}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {field.sensitive && (
                    <button
                      onClick={() => toggleSensitiveVisibility(field.label)}
                      className="rounded p-1.5 text-slate-400 hover:bg-white hover:text-slate-600"
                      title={isVisible ? 'Hide' : 'Show'}
                    >
                      {isVisible ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                  
                  {field.copyable !== false && (
                    <button
                      onClick={() => copyToClipboard(field.value, field.label)}
                      className={cn(
                        'rounded p-1.5 transition-colors',
                        isCopied
                          ? 'bg-green-100 text-green-600'
                          : 'text-slate-400 hover:bg-white hover:text-slate-600'
                      )}
                      title="Copy to clipboard"
                    >
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info tip */}
      <div className="mt-4 rounded-lg bg-purple-50 p-3">
        <p className="text-xs text-slate-600">
          💡 <span className="font-semibold">Tip:</span> Click the copy icon to quickly 
          copy values to your clipboard
        </p>
      </div>
    </div>
  );
}
