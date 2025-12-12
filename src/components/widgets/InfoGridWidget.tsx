'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Maximize2, X } from 'lucide-react';
import type { InfoField } from '@/lib/widgets/types';

interface InfoGridWidgetProps {
  title?: string;
  description?: string;
  fields: InfoField[];
}

// Table-style grid used for compact ticket/connection summaries
export function InfoGridWidget({ title, description, fields }: InfoGridWidgetProps) {
  const [open, setOpen] = useState(false);

  if (!fields || fields.length === 0) return null;

  const renderTable = (dense: boolean) => {
    // Use a grid with fixed column template so header/value columns always align.
    // Give each column a minimum width so narrow chat views scroll horizontally instead
    // of squishing into unreadable vertical stacks.
    const gridTemplateColumns = `repeat(${fields.length}, minmax(160px, 1fr))`;

    return (
      <div
        className={
          dense
            ? 'w-full rounded-2xl border border-purple-200 bg-white text-[11px] text-slate-800 overflow-hidden'
            : 'w-full rounded-2xl border border-purple-200 bg-white text-sm text-slate-800 overflow-hidden'
        }
        style={{ minWidth: `${fields.length * 160}px` }}
      >
        {/* Header */}
        {(title || description) && (
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2">
            <div>
              {title && (
                <h3 className={dense ? 'text-xs font-semibold text-slate-900' : 'text-sm font-semibold text-slate-900'}>
                  {title}
                </h3>
              )}
              {description && (
                <p className={dense ? 'mt-0.5 text-[11px] text-slate-500' : 'mt-0.5 text-xs text-slate-500'}>
                  {description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Header row */}
        <div
          className="grid border-b border-slate-200 bg-slate-50"
          style={{ gridTemplateColumns }}
        >
          {fields.map((field, idx) => (
            <div
              key={`header-${idx}`}
              className="px-3 py-2 text-[11px] font-semibold text-slate-700 border-r border-slate-200 last:border-r-0 min-w-0"
              title={field.label}
            >
              <div className="truncate">{field.label}</div>
            </div>
          ))}
        </div>

        {/* Single data row */}
        <div className="grid bg-white" style={{ gridTemplateColumns }}>
          {fields.map((field, idx) => (
            <div
              key={`value-${idx}`}
              className="px-3 py-2 text-[11px] border-r border-slate-100 last:border-r-0 min-w-0"
              title={field.value}
            >
              <div className="whitespace-pre-wrap break-words">{field.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Inline compact grid with expand icon */}
      <div className="flex w-full items-start gap-2">
        <div className="w-full overflow-x-auto scroll-rounded">
          {renderTable(true)}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-purple-300 shadow-sm"
          title="Expand ticket overview"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Dialog with full-width grid */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-purple-200 bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <Dialog.Title className="text-sm font-semibold text-slate-900">
                {title || 'APM Ticket Overview'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-700"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Dialog.Close>
            </div>
            <div className="overflow-x-auto scroll-rounded">
              {renderTable(false)}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
