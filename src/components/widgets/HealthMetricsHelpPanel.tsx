'use client';

import { Activity, Calendar, Gauge } from 'lucide-react';

export function HealthMetricsHelpPanel() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <Gauge className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-1">Health Score</h4>
            <p className="text-sm text-slate-600">
              A real-time indicator of your machine&apos;s operational health, calculated from sensor behavior,
              historical patterns, and AI-driven anomaly detection. Use this as a high-level signal for when
              attention is needed, rather than a precise engineering value.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-1">Duty Rate</h4>
            <p className="text-sm text-slate-600">
              Describes how heavily the machine is being used over time (run time versus idle time). It helps you
              contextualize health and maintenance recommendations against real utilization, without needing to
              track percentages manually.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
            <Calendar className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-1">Days to Maintenance</h4>
            <p className="text-sm text-slate-600">
              An AI-derived estimate of how long you have before maintenance is likely required, based on current
              health trends and usage. It is designed to support planning—not to replace your existing
              maintenance policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
