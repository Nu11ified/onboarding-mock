'use client';

import { Ticket, FileText, Settings } from 'lucide-react';

export function TicketHierarchyPanel() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 pr-10">Ticket Overview</h3>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 shrink-0">
            <Ticket className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-1">Parent Tickets</h4>
            <p className="text-sm text-slate-600">
              Created automatically when the first alert is detected on a machine. This serves as the primary record for the issue.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 shrink-0">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-1">Child Tickets</h4>
            <p className="text-sm text-slate-600">
              Subsequent alerts from the same machine are grouped as child tickets under the original parent, keeping related issues together.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 shrink-0">
            <Settings className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-1">Full Control</h4>
            <p className="text-sm text-slate-600">
              Both parent and child tickets can be independently assigned, updated, or closed as needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
